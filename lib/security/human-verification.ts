import crypto from 'crypto';

export async function verifyHumanToken(
  token: string | undefined,
  ipAddress: string
): Promise<void> {
  const provider = process.env.HUMAN_VERIFICATION_PROVIDER || 'disabled';
  const publicProvider =
    process.env.NEXT_PUBLIC_HUMAN_VERIFICATION_PROVIDER || 'disabled';
  if (process.env.APP_ENV === 'production' && publicProvider !== provider) {
    throw new Error('Client and server human verification providers must match.');
  }
  if (provider === 'disabled') {
    if (process.env.APP_ENV === 'production') {
      throw new Error('Human verification must be configured in production.');
    }
    return;
  }
  if (provider !== 'turnstile') {
    throw new Error(`Unsupported human verification provider: ${provider}.`);
  }

  const secret = process.env.HUMAN_VERIFICATION_SECRET_KEY;
  const verifyUrl =
    process.env.HUMAN_VERIFICATION_VERIFY_URL ||
    (provider === 'turnstile'
      ? 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
      : '');
  if (!verifyUrl || !secret) {
    throw new Error('Human verification is not fully configured.');
  }
  if (!token) {
    throw new Error('Human verification token is required.');
  }
  if (token.length > 2048) {
    throw new Error('Human verification token is invalid.');
  }

  const response = await fetch(verifyUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      secret,
      response: token,
      remoteip: ipAddress,
      idempotency_key: crypto.randomUUID(),
    }),
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error('Human verification service is unavailable.');
  }

  const result = (await response.json()) as {
    success?: boolean;
    hostname?: string;
    ['error-codes']?: string[];
  };
  if (result.success !== true) {
    throw new Error('Human verification failed.');
  }

  const allowedHostnames = (process.env.HUMAN_VERIFICATION_ALLOWED_HOSTNAMES || '')
    .split(',')
    .map((hostname) => hostname.trim().toLowerCase())
    .filter(Boolean);
  if (
    allowedHostnames.length > 0 &&
    (!result.hostname || !allowedHostnames.includes(result.hostname.toLowerCase()))
  ) {
    throw new Error('Human verification hostname is not allowed.');
  }
}
