# AGENTS Guidelines

## 项目工具规范 (Tooling Guidelines)

- **包管理器与脚手架**：本项目统一使用 **`bun`** 作为包管理器和任务执行器，请勿使用 `npm`、`yarn` 或 `pnpm`。
- **常用命令**：
  - 安装依赖：`bun install`
  - 启动开发服务：`bun run dev`
  - 构建项目：`bun run build`
  - 代码校验：`bun run lint`
  - 自动拉取云端 DB 迁移：`bun run db:pull`
  - 推送本地 DB 迁移：`bun run db:push`

## 数据库与迁移规范 (Database Guidelines)

- **数据库服务**：基于 Supabase / PostgreSQL。
- **CLI 迁移指南**：详细步骤见 [SUPABASE_CLI_GUIDE.md](file:///Users/owocc/antigravity/Work-Chain/SUPABASE_CLI_GUIDE.md)。
- **迁移文件**：所有表结构初始化 SQL 保存在 `supabase/migrations/20260724000000_init_tables.sql`。
- **种子数据**：移除了内置 seed 种子数据，所有测试与线上环境使用干净的表结构。

## Git Commit 提交规范 (Commit Guidelines)

本项目统一遵循 **Conventional Commits** 提交规范：

- **格式说明**：`<type>(<scope>): <description>` 或 `<type>: <description>`
- **常用 Type 类型**：
  - `feat`: 新增功能 (Feature)
  - `fix`: 修复 Bug
  - `refactor`: 代码重构（不增加新功能也不修复 Bug）
  - `docs`: 文档变更 (如 README, AGENTS.md, SUPABASE_CLI_GUIDE.md 等)
  - `chore`: 构建过程或辅助工具的变动 (如 package.json, bun.lock 等)
  - `style`: 代码格式调整（不影响代码逻辑）
- **常用 Scope 模块标识（可选）**：
  - `(db)`: 数据库、表结构与 Supabase CLI 迁移
  - `(api)`: 后端 API 路由
  - `(i18n)`: 国际化与语言包
  - `(ui)`: 前端页面与 UI 组件
  - `(core)`: 核心业务逻辑
- **描述要求**：
  - 使用简洁明了的英文动词，首字母小写，结尾不加句号。
  - 示例：`feat(db): remove built-in seed data and setup supabase cli migrations`
