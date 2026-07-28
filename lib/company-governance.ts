import crypto from 'crypto';
import type postgres from 'postgres';
import { sqlClient } from '@/drizzle/db';
import type {
  CompanyProfileChanges,
  CompanyProfileData,
} from '@/drizzle/schema';
import {
  canonicalJson,
  hashCanonical,
  isMissingProfileValue,
  mergeProfile,
  normalizeCompanyProfile,
} from './company-profile';

type TransactionSql = postgres.TransactionSql<Record<string, never>>;

interface ProfileVersionRow {
  id: string;
  company_id: string;
  profile_data: CompanyProfileData;
  profile_hash: string;
  created_at: string;
}

interface ProposalRow {
  id: string;
  company_id: string;
  base_version_id: string;
  changes: CompanyProfileChanges;
  required_approvals: number;
}

function createId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().replace(/-/g, '')}`;
}

function getApprovalThreshold(): number {
  const value = Number(process.env.COMPANY_CHANGE_APPROVAL_THRESHOLD || '50');
  if (!Number.isInteger(value) || value < 1 || value > 1_000_000) {
    throw new Error('COMPANY_CHANGE_APPROVAL_THRESHOLD must be a positive integer.');
  }
  return value;
}

function profileFromLegacyRow(row: Record<string, unknown>): CompanyProfileData {
  return normalizeCompanyProfile(
    {
      name: row.name,
      creditCode: row.credit_code,
      countryCode: row.country_code,
      countryName: row.country_name,
      province: row.province,
      city: row.city,
      legalRepresentative: row.legal_representative,
      registeredCapital: row.registered_capital,
      businessScope: row.business_scope,
      registeredAddress: row.registered_address,
      establishmentDate: row.establishment_date,
      companyType: row.company_type,
    },
    { requireName: true }
  ) as CompanyProfileData;
}

async function getCurrentProfile(
  tx: TransactionSql,
  companyId: string
): Promise<ProfileVersionRow | null> {
  const rows = await tx<ProfileVersionRow[]>`
    select id, company_id, profile_data, profile_hash, created_at
    from company_profile_versions
    where company_id = ${companyId}
    order by created_at desc, id desc
    limit 1
  `;
  return rows[0] || null;
}

async function ensureCurrentProfile(
  tx: TransactionSql,
  companyId: string
): Promise<ProfileVersionRow> {
  const current = await getCurrentProfile(tx, companyId);
  if (current) return current;

  const legacyRows = await tx<Record<string, unknown>[]>`
    select
      c.id,
      c.name,
      c.credit_code,
      c.country_code,
      c.country_name,
      c.province,
      c.city,
      d.legal_representative,
      d.registered_capital,
      d.business_scope,
      d.registered_address,
      d.establishment_date,
      d.company_type
    from companies c
    left join company_details d on d.company_id = c.id
    where c.id = ${companyId}
    limit 1
  `;
  const legacy = legacyRows[0];
  if (!legacy) throw new Error('Company not found.');

  const profile = profileFromLegacyRow(legacy);
  const profileHash = hashCanonical(profile);
  const id = `profile-${hashCanonical({ companyId, profileHash }).slice(0, 32)}`;

  await tx`
    insert into company_profile_versions (
      id, company_id, source_type, source_ref, profile_data, profile_hash
    )
    values (
      ${id},
      ${companyId},
      'legacy_projection',
      ${companyId},
      ${canonicalJson(profile)}::jsonb,
      ${profileHash}
    )
    on conflict do nothing
  `;

  const inserted = await getCurrentProfile(tx, companyId);
  if (!inserted) throw new Error('Unable to initialize the company profile.');
  return inserted;
}

export async function createCompany(
  input: Record<string, unknown>
): Promise<{ companyId: string; profileVersionId: string; created: boolean }> {
  const profile = normalizeCompanyProfile(input, {
    requireName: true,
  }) as CompanyProfileData;
  const identityKey = profile.creditCode
    ? `registry:${profile.countryCode || ''}:${profile.creditCode}`
    : `name:${profile.countryCode || ''}:${profile.name.toLocaleLowerCase()}:${profile.province || ''}:${profile.city || ''}`;
  const companyId = `comp-${hashCanonical(identityKey).slice(0, 24)}`;
  const creationHash = hashCanonical({ identityKey, profile });
  const profileHash = hashCanonical(profile);
  const profileVersionId = `profile-${hashCanonical({ companyId, profileHash }).slice(0, 32)}`;

  return sqlClient.begin(async (tx) => {
    const inserted = await tx<{ id: string }[]>`
      insert into companies (
        id,
        credit_code,
        name,
        country_code,
        country_name,
        province,
        city,
        creation_source,
        creation_hash
      )
      values (
        ${companyId},
        ${profile.creditCode || null},
        ${profile.name},
        ${profile.countryCode || null},
        ${profile.countryName || null},
        ${profile.province || null},
        ${profile.city || null},
        'community',
        ${creationHash}
      )
      on conflict do nothing
      returning id
    `;

    const existingRows = profile.creditCode
      ? await tx<{ id: string }[]>`
          select id
          from companies
          where id = ${companyId} or credit_code = ${profile.creditCode}
          order by case when id = ${companyId} then 0 else 1 end
          limit 1
        `
      : await tx<{ id: string }[]>`
          select id
          from companies
          where id = ${companyId}
          limit 1
        `;
    const resolvedCompanyId = existingRows[0]?.id;
    if (!resolvedCompanyId) throw new Error('Unable to create or resolve the company.');

    if (inserted.length === 0) {
      const existingProfile = await ensureCurrentProfile(tx, resolvedCompanyId);
      return {
        companyId: resolvedCompanyId,
        profileVersionId: existingProfile.id,
        created: false,
      };
    }

    const resolvedProfileId = `profile-${hashCanonical({
      companyId: resolvedCompanyId,
      profileHash,
    }).slice(0, 32)}`;
    await tx`
      insert into company_profile_versions (
        id, company_id, source_type, source_ref, profile_data, profile_hash
      )
      values (
        ${resolvedProfileId},
        ${resolvedCompanyId},
        'creation',
        ${creationHash},
        ${canonicalJson(profile)}::jsonb,
        ${profileHash}
      )
      on conflict do nothing
    `;

    return {
      companyId: resolvedCompanyId,
      profileVersionId: resolvedProfileId,
      created: inserted.length > 0,
    };
  });
}

export async function supplementCompanyProfile(
  companyId: string,
  input: Record<string, unknown>,
  sourceRef: string
): Promise<{ versionId: string; profile: CompanyProfileData }> {
  const changes = normalizeCompanyProfile(input, {
    partial: true,
  }) as CompanyProfileChanges;

  return sqlClient.begin(async (tx) => {
    const locked = await tx<{ id: string }[]>`
      select id from companies where id = ${companyId} for update
    `;
    if (!locked[0]) throw new Error('Company not found.');

    const current = await ensureCurrentProfile(tx, companyId);
    for (const [field, value] of Object.entries(changes)) {
      if (value === null) {
        throw new Error(`A supplement cannot clear the ${field} field.`);
      }
      if (!isMissingProfileValue(current.profile_data[field as keyof CompanyProfileData])) {
        throw new Error(
          `The ${field} field already has a value. Create a change proposal instead.`
        );
      }
    }

    const profile = mergeProfile(current.profile_data, changes);
    const profileHash = hashCanonical(profile);
    const versionId = `profile-${hashCanonical({ companyId, profileHash }).slice(0, 32)}`;
    await tx`
      insert into company_profile_versions (
        id,
        company_id,
        previous_version_id,
        source_type,
        source_ref,
        profile_data,
        profile_hash
      )
      values (
        ${versionId},
        ${companyId},
        ${current.id},
        'supplement',
        ${sourceRef},
        ${canonicalJson(profile)}::jsonb,
        ${profileHash}
      )
      on conflict do nothing
    `;
    return { versionId, profile };
  });
}

export async function createCompanyChangeProposal(
  companyId: string,
  input: Record<string, unknown>,
  proposerKey: string
): Promise<{ proposalId: string; requiredApprovals: number }> {
  const normalizedChanges = normalizeCompanyProfile(input, {
    partial: true,
  }) as CompanyProfileChanges;

  return sqlClient.begin(async (tx) => {
    const current = await ensureCurrentProfile(tx, companyId);
    const changes = Object.fromEntries(
      Object.entries(normalizedChanges).filter(
        ([field, value]) =>
          canonicalJson(current.profile_data[field as keyof CompanyProfileData]) !==
          canonicalJson(value)
      )
    ) as CompanyProfileChanges;
    if (Object.keys(changes).length === 0) {
      throw new Error('The proposal does not change the current company profile.');
    }

    const changesHash = hashCanonical(changes);
    const requiredApprovals = getApprovalThreshold();
    const proposalId = `proposal-${hashCanonical({
      companyId,
      baseVersionId: current.id,
      changesHash,
    }).slice(0, 32)}`;

    await tx`
      insert into company_change_proposals (
        id,
        company_id,
        base_version_id,
        changes,
        changes_hash,
        required_approvals,
        proposer_key
      )
      values (
        ${proposalId},
        ${companyId},
        ${current.id},
        ${canonicalJson(changes)}::jsonb,
        ${changesHash},
        ${requiredApprovals},
        ${proposerKey}
      )
      on conflict do nothing
    `;
    return { proposalId, requiredApprovals };
  });
}

export interface ApprovalResult {
  proposalId: string;
  approvalCount: number;
  requiredApprovals: number;
  resolution: 'pending' | 'accepted' | 'conflicted' | 'superseded';
  resultingVersionId?: string;
  duplicateVote: boolean;
}

export async function approveCompanyChangeProposal(
  proposalId: string,
  voterKey: string
): Promise<ApprovalResult> {
  return sqlClient.begin(async (tx) => {
    const proposalRows = await tx<ProposalRow[]>`
      select id, company_id, base_version_id, changes, required_approvals
      from company_change_proposals
      where id = ${proposalId}
      limit 1
    `;
    const proposal = proposalRows[0];
    if (!proposal) throw new Error('Proposal not found.');

    const approvalId = createId('approval');
    const insertedVotes = await tx<{ id: string }[]>`
      insert into company_change_approvals (id, proposal_id, voter_key)
      values (${approvalId}, ${proposalId}, ${voterKey})
      on conflict do nothing
      returning id
    `;

    const countRows = await tx<{ count: number }[]>`
      select count(*)::integer as count
      from company_change_approvals
      where proposal_id = ${proposalId}
    `;
    const approvalCount = Number(countRows[0]?.count || 0);

    const existingResolution = await tx<
      { result: ApprovalResult['resolution']; resulting_version_id: string | null }[]
    >`
      select result, resulting_version_id
      from company_proposal_resolutions
      where proposal_id = ${proposalId}
      limit 1
    `;
    if (existingResolution[0]) {
      return {
        proposalId,
        approvalCount,
        requiredApprovals: proposal.required_approvals,
        resolution: existingResolution[0].result,
        resultingVersionId: existingResolution[0].resulting_version_id || undefined,
        duplicateVote: insertedVotes.length === 0,
      };
    }

    if (approvalCount < proposal.required_approvals) {
      return {
        proposalId,
        approvalCount,
        requiredApprovals: proposal.required_approvals,
        resolution: 'pending',
        duplicateVote: insertedVotes.length === 0,
      };
    }

    await tx`select id from companies where id = ${proposal.company_id} for update`;

    const resolutionAfterLock = await tx<
      { result: ApprovalResult['resolution']; resulting_version_id: string | null }[]
    >`
      select result, resulting_version_id
      from company_proposal_resolutions
      where proposal_id = ${proposalId}
      limit 1
    `;
    if (resolutionAfterLock[0]) {
      return {
        proposalId,
        approvalCount,
        requiredApprovals: proposal.required_approvals,
        resolution: resolutionAfterLock[0].result,
        resultingVersionId: resolutionAfterLock[0].resulting_version_id || undefined,
        duplicateVote: insertedVotes.length === 0,
      };
    }

    const [current, baseRows] = await Promise.all([
      getCurrentProfile(tx, proposal.company_id),
      tx<ProfileVersionRow[]>`
        select id, company_id, profile_data, profile_hash, created_at
        from company_profile_versions
        where id = ${proposal.base_version_id}
        limit 1
      `,
    ]);
    const base = baseRows[0];
    if (!current || !base) throw new Error('Proposal profile versions are unavailable.');

    const hasConflict = Object.keys(proposal.changes).some(
      (field) =>
        canonicalJson(current.profile_data[field as keyof CompanyProfileData]) !==
        canonicalJson(base.profile_data[field as keyof CompanyProfileData])
    );

    if (hasConflict) {
      await tx`
        insert into company_proposal_resolutions (
          id, proposal_id, result, approval_count
        )
        values (
          ${createId('resolution')},
          ${proposalId},
          'conflicted',
          ${approvalCount}
        )
        on conflict do nothing
      `;
      return {
        proposalId,
        approvalCount,
        requiredApprovals: proposal.required_approvals,
        resolution: 'conflicted',
        duplicateVote: insertedVotes.length === 0,
      };
    }

    const nextProfile = mergeProfile(current.profile_data, proposal.changes);
    const profileHash = hashCanonical(nextProfile);
    const resultingVersionId = `profile-${hashCanonical({
      companyId: proposal.company_id,
      profileHash,
    }).slice(0, 32)}`;

    await tx`
      insert into company_profile_versions (
        id,
        company_id,
        previous_version_id,
        source_type,
        source_ref,
        profile_data,
        profile_hash
      )
      values (
        ${resultingVersionId},
        ${proposal.company_id},
        ${current.id},
        'proposal',
        ${proposalId},
        ${canonicalJson(nextProfile)}::jsonb,
        ${profileHash}
      )
      on conflict do nothing
    `;
    await tx`
      insert into company_proposal_resolutions (
        id,
        proposal_id,
        result,
        resulting_version_id,
        approval_count
      )
      values (
        ${createId('resolution')},
        ${proposalId},
        'accepted',
        ${resultingVersionId},
        ${approvalCount}
      )
      on conflict do nothing
    `;

    return {
      proposalId,
      approvalCount,
      requiredApprovals: proposal.required_approvals,
      resolution: 'accepted',
      resultingVersionId,
      duplicateVote: insertedVotes.length === 0,
    };
  });
}
