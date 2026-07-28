import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { sqlClient } from '@/drizzle/db';
import { createCompanyChangeProposal } from '@/lib/company-governance';
import { guardPublicWrite } from '@/lib/security/public-write';
import {
  publicWriteFailure,
  publicWriteSuccess,
} from '@/lib/api/public-write-response';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const rows = await sqlClient`
      select
        p.id,
        p.company_id,
        p.base_version_id,
        p.changes,
        p.required_approvals,
        p.created_at,
        s.approval_count,
        coalesce(s.resolution, 'pending') as resolution,
        s.resulting_version_id
      from company_change_proposals p
      join company_proposal_status s on s.proposal_id = p.id
      where p.company_id = ${id}
      order by p.created_at desc
    `;
    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unable to load proposals.',
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    const humanVerificationToken =
      typeof body.humanVerificationToken === 'string'
        ? body.humanVerificationToken
        : undefined;
    const changes =
      body.changes && typeof body.changes === 'object' && !Array.isArray(body.changes)
        ? (body.changes as Record<string, unknown>)
        : {};

    const identity = await guardPublicWrite(
      request,
      'proposal-create',
      humanVerificationToken,
      id
    );
    const result = await createCompanyChangeProposal(id, changes, identity.voterKey);
    return publicWriteSuccess(identity, result, 201);
  } catch (error) {
    return publicWriteFailure(error);
  }
}
