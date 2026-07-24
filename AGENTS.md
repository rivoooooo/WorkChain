# AGENTS 指南与规范

## 项目工具规范

- **包管理器与脚手架**：本项目统一使用 **`bun`** 作为包管理器和任务执行器，请勿使用 `npm`、`yarn` 或 `pnpm`。
- **常用命令**：
  - 安装依赖：`bun install`
  - 启动开发服务：`bun run dev`
  - 构建项目：`bun run build`
  - 代码校验：`bun run lint`
  - 推送/同步数据库迁移：`bun run db:migrate` (或 `bun run db:push`)
  - 导出 ORM 迁移脚本：`bun run db:generate`
  - 填充城市国家地理数据：`bun run import:geo`
  - 转换导入企业注册 CSV：`bun run import:kinginsun <CSV文件路径>` 或 `bun run import:kinginsun --dir <文件夹路径>`
  - 启动 Drizzle Studio 可视化面板：`bun run db:studio`

## 数据库与迁移规范

- **数据库服务**：基于 Supabase / PostgreSQL。
- **ORM 框架与表结构**：使用 **Drizzle ORM** 管理表结构（`drizzle/schema.ts`）。
  - `companies` 主表以 **统一社会信用代码 (`credit_code`)** 作为唯一索引与匹配 Key。
  - 扩展详细工商属性置于 `company_details`，相关媒体链接置于 `company_links`，地理信息置于 `geo_cities` / `geo_countries`。
- **通用转换层架构**：数据导入必须遵循 `lib/converters/` 架构，使用转换适配器统一转为 `StandardCompanyDTO` 后再进行以 `credit_code` 为 Key 的 Upsert 增量更新。
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
