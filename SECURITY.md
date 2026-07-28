# Security policy

## Repository secrets

- Never commit `.env*` files other than the placeholder-only `.env.example`.
- Never commit `.antigravity/`, local database dumps, generated backups, service-role keys, database passwords, CAPTCHA secrets, KV tokens, or cron secrets.
- Run `bun run security:scan` before committing.
- Public Supabase publishable keys still belong in deployment environment configuration rather than source files.
- `DATABASE_OWNER_URL` is deployment-only. The running application uses the restricted `APP_DATABASE_URL`.

## Credential incident response

If a credential is committed:

1. Revoke or rotate it at the provider immediately.
2. Update deployment secrets without placing the replacement in Git.
3. Remove it from the current tree.
4. Assess whether repository history must be rewritten and coordinate the forced update with every collaborator.
5. Review provider access logs and application logs for unexpected use.

History cleanup does not revoke a credential. Rotation is always required.
