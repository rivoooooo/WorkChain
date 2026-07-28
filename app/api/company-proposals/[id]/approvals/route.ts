import type { NextRequest } from 'next/server';
import { approveCompanyChangeProposal } from '@/lib/company-governance';
import { guardPublicWrite } from '@/lib/security/public-write';
import {
  publicWriteFailure,
  publicWriteSuccess,
} from '@/lib/api/public-write-response';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const humanVerificationToken =
      typeof body.humanVerificationToken === 'string'
        ? body.humanVerificationToken
        : undefined;

    const identity = await guardPublicWrite(
      request,
      'proposal-approve',
      humanVerificationToken,
      id
    );
    const result = await approveCompanyChangeProposal(id, identity.voterKey);
    return publicWriteSuccess(identity, result, 201);
  } catch (error) {
    return publicWriteFailure(error);
  }
}
