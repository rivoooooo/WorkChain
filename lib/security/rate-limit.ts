import crypto from 'crypto';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export interface RateLimitStore {
  consume(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult>;
}

interface MemoryBucket {
  count: number;
  expiresAt: number;
}

const memoryBuckets = new Map<string, MemoryBucket>();

class MemoryRateLimitStore implements RateLimitStore {
  async consume(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
    const now = Date.now();
    const existing = memoryBuckets.get(key);
    const bucket =
      !existing || existing.expiresAt <= now
        ? { count: 0, expiresAt: now + windowSeconds * 1000 }
        : existing;

    bucket.count += 1;
    memoryBuckets.set(key, bucket);

    return {
      allowed: bucket.count <= limit,
      remaining: Math.max(0, limit - bucket.count),
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.expiresAt - now) / 1000)),
    };
  }
}

class RemoteKvRateLimitStore implements RateLimitStore {
  constructor(
    private readonly url: string,
    private readonly token: string,
    private readonly namespace: string
  ) {}

  async consume(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
    const response = await fetch(`${this.url.replace(/\/$/, '')}/consume`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${this.token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        namespace: this.namespace,
        key,
        limit,
        windowSeconds,
      }),
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`KV rate limit request failed with status ${response.status}.`);
    }

    const result = (await response.json()) as Partial<RateLimitResult>;
    if (
      typeof result.allowed !== 'boolean' ||
      typeof result.remaining !== 'number' ||
      typeof result.retryAfterSeconds !== 'number'
    ) {
      throw new Error('KV rate limit response has an invalid shape.');
    }
    return result as RateLimitResult;
  }
}

export function createRateLimitStore(): RateLimitStore {
  const url = process.env.SUPABASE_KV_URL;
  const token = process.env.SUPABASE_KV_TOKEN;
  if (url && token) {
    return new RemoteKvRateLimitStore(
      url,
      token,
      process.env.KV_NAMESPACE || 'work-chain:development'
    );
  }

  if (process.env.APP_ENV === 'production') {
    throw new Error('Distributed KV rate limiting is required in production.');
  }

  return new MemoryRateLimitStore();
}

export function hashIpAddress(ip: string): string {
  const secret = process.env.IP_RATE_LIMIT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('IP_RATE_LIMIT_SECRET must contain at least 32 characters.');
  }
  return crypto.createHmac('sha256', secret).update(ip).digest('hex');
}
