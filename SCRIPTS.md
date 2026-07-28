# Work-Chain 数据库与数据导入

项目统一使用 `bun`。`drizzle/schema.ts` 是表、索引、视图、约束和 RLS 的唯一结构源；`drizzle/migrations/` 只能由 Drizzle Kit 生成，禁止手写 DDL。

## 环境与权限

- `DATABASE_OWNER_URL`：仅部署时用于 Drizzle 推送结构，不提供给运行中的应用。
- `APP_DATABASE_URL`：Next.js 服务端使用，只授予 `SELECT`、`INSERT` 和必要的序列权限。
- 浏览器使用 Supabase publishable key，但 RLS 只开放读取；所有公开写入必须经过 Next.js API。
- 正式环境必须配置匿名凭证密钥、人机验证、由托管平台覆盖的 `TRUSTED_IP_HEADER` 和分布式限流 KV；不要信任客户端可自行伪造的转发头。

## 结构发布

```bash
bun run db:generate
bun run db:check
bun run db:preflight
bun run db:push
```

正式库额外要求目标项目校验和人工确认：

```bash
APP_ENV=production \
CONFIRM_PRODUCTION_PUSH=push-production-schema \
bun run db:push:prod
```

执行前必须阅读 Drizzle diff，并先通过只读 preflight（孤儿外键与区块链唯一性检查）。应用不会在启动时修改结构。

## 数据导入

导入器只追加新数据，唯一键冲突时跳过，不更新或删除已有数据：

```bash
bun run data:export:geo \
  --input data/cities500.txt \
  --output data/cities500.sql \
  --force

bun run data:check-sql data/cities500.sql
bun run import:kinginsun /path/to/file.csv
bun run import:kinginsun --dir /path/to/directory
```

后续数据源应在 `lib/converters/` 新增适配器，先转换为 `StandardCompanyDTO`，再进入统一清洗和导出流程。

GeoNames 导出器不会连接数据库，只生成 `BEGIN`、批量 `INSERT ... ON CONFLICT DO NOTHING` 和 `COMMIT`。输出包含源文件 SHA-256；相同输入与批大小会生成完全相同的 SQL。目标文件已存在时默认拒绝覆盖，需要明确使用 `--force`。

生产数据 SQL 只能包含 `INSERT`（可含 `BEGIN`/`COMMIT` 和 `ON CONFLICT DO NOTHING`）：

```bash
bun run data:check-sql /path/to/data-only.sql
```

结构先由 Drizzle 推送，确认成功后再执行通过校验的数据 SQL。测试企业和测试评价不得进入生产 SQL。

## 公开快照

定时任务以 `Authorization: Bearer $CRON_SECRET` 调用 `POST /api/backups`。CSV、XLSX、仅数据 SQL 和 manifest 直接写入 Supabase Storage，不落本地磁盘或仓库。公开页面只列出最近 7 天未过期快照；清理任务只删除过期的派生对象，不删除数据库业务数据。

KV 适配器当前使用一个简单 HTTP 合约：`POST $SUPABASE_KV_URL/consume`，Bearer token 鉴权，请求体为 `{ namespace, key, limit, windowSeconds }`，响应为 `{ allowed, remaining, retryAfterSeconds? }`。正式环境没有 KV 时公开写入会失败关闭。

## Cloudflare Turnstile

公开写入支持 Cloudflare Turnstile。开发和生产应创建不同 Widget，并限制允许的 hostname：

```dotenv
HUMAN_VERIFICATION_PROVIDER="turnstile"
NEXT_PUBLIC_HUMAN_VERIFICATION_PROVIDER="turnstile"
NEXT_PUBLIC_HUMAN_VERIFICATION_SITE_KEY="公开 site key"
HUMAN_VERIFICATION_SECRET_KEY="仅服务端 secret key"
HUMAN_VERIFICATION_ALLOWED_HOSTNAMES="localhost,work-chain.example.com"
```

前端完成挑战后将一次性 token 随写入请求提交，服务端通过 Siteverify 验证 token、来源 IP 和 hostname。token 在每次提交后都会重置。正式环境中客户端和服务端 provider 不一致、缺失 secret 或关闭验证时，写入会失败关闭。
