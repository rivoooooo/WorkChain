import { spawnSync } from 'node:child_process';

const ownerUrl = process.env.DATABASE_OWNER_URL || process.env.DATABASE_URL;
if (!ownerUrl) {
  throw new Error('DATABASE_OWNER_URL or DATABASE_URL is required.');
}

const push = spawnSync('bunx', ['drizzle-kit', 'push'], {
  env: { ...process.env, DATABASE_URL: ownerUrl },
  stdio: 'inherit',
});
if (push.status !== 0) {
  process.exit(push.status ?? 1);
}

const grants = spawnSync('bun', ['run', 'db:grant-public-read'], {
  env: { ...process.env, DATABASE_OWNER_URL: ownerUrl },
  stdio: 'inherit',
});
process.exit(grants.status ?? 1);
