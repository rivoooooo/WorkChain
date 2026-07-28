import { NextResponse } from 'next/server';
import type { AnonymousIdentity } from '@/lib/security/anonymous-identity';
import { attachAnonymousIdentity } from '@/lib/security/anonymous-identity';
import { PublicWriteRejectedError } from '@/lib/security/public-write';

export function publicWriteSuccess(
  identity: AnonymousIdentity,
  data: unknown,
  status = 200
): NextResponse {
  return attachAnonymousIdentity(
    NextResponse.json({ success: true, data }, { status }),
    identity
  );
}

export function publicWriteFailure(error: unknown): NextResponse {
  if (error instanceof PublicWriteRejectedError) {
    const response = NextResponse.json(
      { success: false, error: error.message },
      { status: error.status }
    );
    if (error.retryAfterSeconds) {
      response.headers.set('retry-after', String(error.retryAfterSeconds));
    }
    return response;
  }

  const message = error instanceof Error ? error.message : 'The request failed.';
  const configurationFailure =
    message.includes('must be configured') ||
    message.includes('is required in production') ||
    message.includes('must contain at least');
  return NextResponse.json(
    { success: false, error: message },
    { status: configurationFailure ? 503 : 400 }
  );
}
