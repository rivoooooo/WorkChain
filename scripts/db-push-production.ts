const ownerUrl = process.env.DATABASE_OWNER_URL;
const expectedProjectRef = process.env.PRODUCTION_SUPABASE_PROJECT_REF;

if (process.env.APP_ENV !== 'production') {
  throw new Error('APP_ENV must equal "production".');
}
if (process.env.CONFIRM_PRODUCTION_PUSH !== 'push-production-schema') {
  throw new Error(
    'Set CONFIRM_PRODUCTION_PUSH=push-production-schema after reviewing the Drizzle diff.'
  );
}
if (!ownerUrl || !expectedProjectRef) {
  throw new Error('DATABASE_OWNER_URL and PRODUCTION_SUPABASE_PROJECT_REF are required.');
}

const parsed = new URL(ownerUrl);
if (!parsed.hostname.includes(expectedProjectRef)) {
  throw new Error('DATABASE_OWNER_URL does not match PRODUCTION_SUPABASE_PROJECT_REF.');
}

const preflight = spawnSync('bun', ['run', 'db:preflight'], {
  env: { ...process.env, DATABASE_URL: ownerUrl },
  stdio: 'inherit',
});
if (preflight.status !== 0) {
  throw new Error('Production schema push stopped because database preflight failed.');
}

const child = spawnSync('bunx', ['drizzle-kit', 'push'], {
  env: { ...process.env, DATABASE_URL: ownerUrl },
  stdio: 'inherit',
});

if (child.status !== 0) {
  process.exit(child.status ?? 1);
}

const grants = spawnSync('bun', ['run', 'db:grant-public-read'], {
  env: process.env,
  stdio: 'inherit',
});

process.exit(grants.status ?? 1);
import { spawnSync } from 'node:child_process';
