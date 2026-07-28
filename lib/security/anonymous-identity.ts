import crypto from 'crypto';
import type { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'work_chain_anon';
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

function getSecret(): string {
  const secret = process.env.ANONYMOUS_VOTER_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('ANONYMOUS_VOTER_SECRET must contain at least 32 characters.');
  }
  return secret;
}

function sign(token: string): string {
  return crypto.createHmac('sha256', getSecret()).update(token).digest('hex');
}

function parseSignedToken(value: string | undefined): string | null {
  if (!value) return null;
  const [token, signature] = value.split('.');
  if (!token || !signature) return null;

  const expected = sign(token);
  const actualBuffer = Buffer.from(signature, 'hex');
  const expectedBuffer = Buffer.from(expected, 'hex');
  if (
    actualBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    return null;
  }
  return token;
}

export interface AnonymousIdentity {
  token: string;
  voterKey: string;
  issued: boolean;
}

export function getAnonymousIdentity(request: NextRequest): AnonymousIdentity {
  const existing = parseSignedToken(request.cookies.get(COOKIE_NAME)?.value);
  const token = existing || crypto.randomBytes(32).toString('base64url');
  return {
    token,
    voterKey: crypto.createHmac('sha256', getSecret()).update(token).digest('hex'),
    issued: existing === null,
  };
}

export function attachAnonymousIdentity(
  response: NextResponse,
  identity: AnonymousIdentity
): NextResponse {
  if (!identity.issued) return response;

  response.cookies.set(COOKIE_NAME, `${identity.token}.${sign(identity.token)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE_SECONDS,
    path: '/',
  });
  return response;
}
