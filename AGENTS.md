# AGENTS 指南与规范

## 项目工具规范

- **包管理器与脚手架**：本项目统一使用 **`bun`** 作为包管理器和任务执行器，请勿使用 `npm`、`yarn` 或 `pnpm`。
- **常用命令**：
  - 安装依赖：`bun install`
  - 启动开发服务：`bun run dev`
  - 构建项目：`bun run build`
  - 代码校验：`bun run lint`
  - 生成 DB 迁移文件：`bun run db:generate`
  - 推送表结构到云端 DB：`bun run db:push`
  - 启动 Drizzle Studio 可视化面板：`bun run db:studio`

## 数据库与迁移规范

- **数据库服务**：基于 Supabase / PostgreSQL。
- **ORM 框架**：使用 **Drizzle ORM** 管理表结构与 Schema 变更（配置文件位于 `drizzle/schema.ts` 与 `drizzle.config.ts`）。
- **表结构推演**：修改 `drizzle/schema.ts` 后运行 `bun run db:push` 即可直接将最新 Schema 推送到线上 PostgreSQL（无需 Docker 依赖）。
- **初始化 SQL**：表结构及 RLS 安全策略同时保留在 `supabase/migrations/20260724000000_init_tables.sql`。
- **种子数据**：移除了内置 seed 种子数据，所有测试与线上环境使用干净的表结构。

## Git Commit 提交规范

本项目统一遵循 **Conventional Commits** 提交规范：

- **格式说明**：`<type>(<scope>): <description>` 或 `<type>: <description>`
- **常用 Type 类型**：
  - `feat`: 新增功能 (Feature)
  - `fix`: 修复 Bug
  - `refactor`: 代码重构（不增加新功能也不修复 Bug）
  - `docs`: 文档变更 (如 README.md, AGENTS.md, DESIGN.md 等)
  - `chore`: 构建过程或辅助工具的变动 (如 package.json, bun.lock 等)
  - `style`: 代码格式调整（不影响代码逻辑）
- **常用 Scope 模块标识（可选）**：
  - `(db)`: 数据库、表结构与 Supabase / Drizzle 迁移
  - `(api)`: 后端 API 路由
  - `(i18n)`: 国际化与语言包
  - `(ui)`: 前端页面与 UI 组件
  - `(core)`: 核心业务逻辑
- **描述要求**：
  - 使用简洁明了的英文动词，首字母小写，结尾不加句号。
  - 示例：`docs: translate repository documentation to Chinese`
