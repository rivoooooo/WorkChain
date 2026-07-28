export async function verifyHumanToken(
  token: string | undefined,
  ipAddress: string
): Promise<void> {
  const provider = process.env.HUMAN_VERIFICATION_PROVIDER || 'disabled';
  if (provider === 'disabled') {
    if (process.env.APP_ENV === 'production') {
      throw new Error('Human verification must be configured in production.');
    }
    return;
  }

  const verifyUrl = process.env.HUMAN_VERIFICATION_VERIFY_URL;
  const secret = process.env.HUMAN_VERIFICATION_SECRET_KEY;
  if (!verifyUrl || !secret) {
    throw new Error('Human verification is not fully configured.');
  }
  if (!token) {
    throw new Error('Human verification token is required.');
  }

  const response = await fetch(verifyUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      secret,
      response: token,
      remoteip: ipAddress,
    }),
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error('Human verification service is unavailable.');
  }

  const result = (await response.json()) as { success?: boolean };
  if (result.success !== true) {
    throw new Error('Human verification failed.');
  }
}
