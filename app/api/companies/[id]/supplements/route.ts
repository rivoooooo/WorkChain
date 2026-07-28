import crypto from 'crypto';
import type { NextRequest } from 'next/server';
import { supplementCompanyProfile } from '@/lib/company-governance';
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
      'company-supplement',
      humanVerificationToken,
      id
    );
    const sourceRef =
      typeof body.idempotencyKey === 'string' && body.idempotencyKey.length <= 200
        ? `community:${body.idempotencyKey}`
        : `community:${crypto.randomUUID()}`;
    const result = await supplementCompanyProfile(id, changes, sourceRef);
    return publicWriteSuccess(identity, result, 201);
  } catch (error) {
    return publicWriteFailure(error);
  }
}
