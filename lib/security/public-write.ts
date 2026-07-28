import type { NextRequest } from 'next/server';
import { getAnonymousIdentity } from './anonymous-identity';
import { verifyHumanToken } from './human-verification';
import { createRateLimitStore, hashIpAddress } from './rate-limit';

export type PublicWriteAction =
  | 'company-create'
  | 'company-supplement'
  | 'proposal-create'
  | 'proposal-approve'
  | 'review-create';

const DEFAULT_LIMITS: Record<PublicWriteAction, { limit: number; windowSeconds: number }> = {
  'company-create': { limit: 3, windowSeconds: 60 * 60 },
  'company-supplement': { limit: 10, windowSeconds: 60 * 60 },
  'proposal-create': { limit: 5, windowSeconds: 60 * 60 },
  'proposal-approve': { limit: 10, windowSeconds: 10 * 60 },
  'review-create': { limit: 5, windowSeconds: 60 * 60 },
};

function getClientIp(request: NextRequest): string {
  const trustedHeader = process.env.TRUSTED_IP_HEADER?.toLowerCase();
  if (trustedHeader) {
    const trusted = request.headers.get(trustedHeader)?.split(',')[0]?.trim();
    if (trusted) return trusted;
  }

  if (process.env.APP_ENV === 'production') {
    throw new Error('TRUSTED_IP_HEADER must identify a platform-controlled client IP header.');
  }
  return '127.0.0.1';
}

function getLimit(action: PublicWriteAction): { limit: number; windowSeconds: number } {
  const prefix = action.replace(/-/g, '_').toUpperCase();
  const fallback = DEFAULT_LIMITS[action];
  return {
    limit: Number(process.env[`${prefix}_RATE_LIMIT_MAX`] || fallback.limit),
    windowSeconds: Number(
      process.env[`${prefix}_RATE_LIMIT_WINDOW_SECONDS`] || fallback.windowSeconds
    ),
  };
}

export class PublicWriteRejectedError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly retryAfterSeconds?: number
  ) {
    super(message);
  }
}

export async function guardPublicWrite(
  request: NextRequest,
  action: PublicWriteAction,
  humanVerificationToken: string | undefined,
  scope?: string
) {
  const identity = getAnonymousIdentity(request);
  const ipAddress = getClientIp(request);
  const ipHash = hashIpAddress(ipAddress);
  const limiter = createRateLimitStore();
  const config = getLimit(action);

  const [ipResult, voterResult] = await Promise.all([
    limiter.consume(
      `ip:${ipHash}:${action}${scope ? `:${scope}` : ''}`,
      config.limit,
      config.windowSeconds
    ),
    limiter.consume(
      `voter:${identity.voterKey}:${action}${scope ? `:${scope}` : ''}`,
      config.limit,
      config.windowSeconds
    ),
  ]);

  const rejected = !ipResult.allowed ? ipResult : !voterResult.allowed ? voterResult : null;
  if (rejected) {
    throw new PublicWriteRejectedError(
      'Too many requests. Please try again later.',
      429,
      rejected.retryAfterSeconds
    );
  }

  await verifyHumanToken(humanVerificationToken, ipAddress);
  return identity;
}
