# 🚀 Supabase CLI 自动生成与迁移指南

本项目已完全切换为基于 **Supabase CLI 自动化工作流**。您可以直接在 Supabase 网页控制台（Dashboard）建表或修改字段，然后通过 CLI **一键自动拉取并生成本地迁移 SQL 脚本**。

---

## 目录
1. [常用快捷命令 (package.json)](#一常用快捷命令-packagejson)
2. [工作流 A：网页改表 ➡️ 自动拉取生成本地 SQL (推荐)](#二工作流-a网页改表--自动拉取生成本地-sql-推荐)
3. [工作流 B：本地 SQL ➡️ 推送到线上数据库](#三工作流-b本地-sql--推送到线上数据库)
4. [首次使用 CLI 绑定步骤](#四首次使用-cli-绑定步骤)

---

## 一、 常用快捷命令 (package.json)

本项目已在 `package.json` 中预设了快捷命令，直接使用 `bun run` 调用：

| 快捷命令 | 完整命令 | 说明 |
| :--- | :--- | :--- |
| **`bun run db:pull`** | `bunx supabase db pull` | **【最常用】** 从云端自动拉取数据库结构并**自动生成本地迁移 SQL 文件** |
| **`bun run db:push`** | `bunx supabase db push` | 将本地 `supabase/migrations/` 下的 SQL 迁移推送到线上数据库 |
| **`bun run db:diff`** | `bunx supabase db diff` | 自动比对本地与云端结构差异，打印或生成 Patch 差量 SQL |

---

## 二、 工作流 A：网页改表 ➡️ 自动拉取生成本地 SQL (推荐)

这是最轻松且不易出错的工作方式：

1. 打开 Supabase 后台 (Dashboard)，在 Table Editor 中可视化新建表或添加/修改字段。
2. 在本地项目根目录下运行：
   ```bash
   bun run db:pull
   ```
3. Supabase CLI 会自动比对云端最新表结构，并在 `supabase/migrations/` 目录下**自动创建最新的 `.sql` 迁移文件**（例如 `20260724185000_remote_schema.sql`）。
4. 提交 Git 仓库即可完成版本保存：
   ```bash
   git add supabase/migrations/
   git commit -m "feat: 自动同步 Supabase 数据库最新 Schema"
   ```

---

## 三、 工作流 B：本地 SQL ➡️ 推送到线上数据库

如果您在团队协同中拉取了别人提交的 `supabase/migrations/` SQL 脚本，或者直接手动修改了迁移脚本：

```bash
bun run db:push
```
CLI 会自动把尚未同步的本地 SQL 迁移文件推送到线上 Supabase 数据库。

---

## 四、 首次使用 CLI 绑定步骤

在首次使用 `bun run db:pull` 或 `bun run db:push` 前，需要进行一次账号登录与项目绑定：

1. **登录**：
   ```bash
   bunx supabase login
   ```
2. **绑定项目**（填入您的 Supabase Project Ref）：
   ```bash
   bunx supabase link --project-ref <您的PROJECT_REF>
   ```

---

> [!NOTE]
> **排查提示**：如果在执行 `db:push` 或 `db:pull` 时遇到 `i/o timeout` 连接超时，通常是因为代理软件拦截了 PostgreSQL 原生 TCP 5432 端口。请暂时关闭代理软件的 TUN 模式，或将 `*.supabase.co` 设置为直连。
