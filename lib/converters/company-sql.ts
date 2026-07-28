import type { StandardCompanyDTO } from './types';
import type { CompanyProfileData } from '@/drizzle/schema';
import {
  canonicalJson,
  companyIdentityKey,
  hashCanonical,
} from '@/lib/company-profile';
import { sqlLiteral } from './geonames';

export interface CompanySqlRecord {
  companyId: string;
  profileVersionId: string;
  creationHash: string;
  profileHash: string;
  profile: CompanyProfileData;
}

export function companySqlRecord(dto: StandardCompanyDTO): CompanySqlRecord {
  const profile: CompanyProfileData = {
    name: dto.name.normalize('NFKC').trim(),
    creditCode: dto.creditCode.normalize('NFKC').replace(/\s+/g, '').toUpperCase(),
    countryCode: dto.countryCode || 'CN',
    countryName: dto.countryName || '中国',
    province: dto.province || null,
    city: dto.city || null,
    legalRepresentative: dto.legalRepresentative || null,
    registeredCapital: dto.registeredCapital || null,
    businessScope: dto.businessScope || null,
    registeredAddress: dto.registeredAddress || null,
    establishmentDate: dto.establishmentDate || null,
    companyType: dto.companyType || null,
    website: null,
  };
  const identityKey = companyIdentityKey(profile);
  const companyId = `comp-${hashCanonical(identityKey).slice(0, 24)}`;
  const profileHash = hashCanonical(profile);
  return {
    companyId,
    profileVersionId: `profile-${hashCanonical({ companyId, profileHash }).slice(0, 32)}`,
    creationHash: hashCanonical({ identityKey, profile }),
    profileHash,
    profile,
  };
}

export function companyInsertSql(records: CompanySqlRecord[]): string {
  const companyValues = records
    .map(
      ({ companyId, creationHash, profile }) =>
        `(${sqlLiteral(companyId)},${sqlLiteral(profile.creditCode ?? null)},` +
        `${sqlLiteral(profile.name ?? null)},${sqlLiteral(profile.countryCode ?? null)},` +
        `${sqlLiteral(profile.countryName ?? null)},${sqlLiteral(profile.province ?? null)},` +
        `${sqlLiteral(profile.city ?? null)},'import',${sqlLiteral(creationHash)})`
    )
    .join(',\n');
  const profileValues = records
    .map(
      ({ companyId, profileVersionId, creationHash, profileHash, profile }) =>
        `(${sqlLiteral(profileVersionId)},${sqlLiteral(companyId)},'import',` +
        `${sqlLiteral(`kinginsun:${profile.creditCode}`)},` +
        `${sqlLiteral(canonicalJson(profile))}::jsonb,${sqlLiteral(profileHash)})`
    )
    .join(',\n');

  return (
    'INSERT INTO companies ' +
    '(id,credit_code,name,country_code,country_name,province,city,creation_source,creation_hash)\n' +
    `VALUES\n${companyValues}\nON CONFLICT DO NOTHING;\n\n` +
    'INSERT INTO company_profile_versions ' +
    '(id,company_id,source_type,source_ref,profile_data,profile_hash)\n' +
    `VALUES\n${profileValues}\nON CONFLICT DO NOTHING;\n\n`
  );
}
