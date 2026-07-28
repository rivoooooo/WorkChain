# AGENTS 指南与规范

## 项目工具规范

- **包管理器与脚手架**：本项目统一使用 **`bun`** 作为包管理器和任务执行器，请勿使用 `npm`、`yarn` 或 `pnpm`。
- **常用命令**：
  - 安装依赖：`bun install`
  - 启动开发服务：`bun run dev`
  - 构建项目：`bun run build`
  - 代码校验：`bun run lint`
  - 推送/同步数据库结构：`bun run db:push`（正式环境使用 `bun run db:push:prod`）
  - 导出 ORM 迁移脚本：`bun run db:generate`
  - 生成城市国家数据 SQL：`bun run data:export:geo --output <SQL文件路径>`
  - 转换企业注册 CSV 为 SQL：`bun run data:export:companies <CSV路径> --output <SQL路径>` 或使用 `--dir`
  - 启动 Drizzle Studio 可视化面板：`bun run db:studio`

## 数据库与迁移规范

- **数据库服务**：基于 Supabase / PostgreSQL。
- **ORM 框架与表结构**：使用 **Drizzle ORM** 管理表结构（`drizzle/schema.ts`）。
  - `companies` 主表以 **统一社会信用代码 (`credit_code`)** 作为唯一索引与匹配 Key。
  - 扩展详细工商属性置于 `company_details`，相关媒体链接置于 `company_links`，地理信息置于 `geo_cities` / `geo_countries`。
- **通用转换层架构**：数据导入必须遵循 `lib/converters/` 架构，使用转换适配器统一转为 `StandardCompanyDTO` 后再进行以 `credit_code` 为 Key 的 Upsert 增量更新。
- **结构唯一来源**：表、约束、视图与 RLS 只在 `drizzle/schema.ts` 维护；迁移文件只能由 Drizzle Kit 生成。
- **数据不可变**：导入与业务写入只允许追加；冲突跳过，禁止更新和删除。
- **环境隔离**：测试企业与测试评价只允许进入测试数据库，生产只执行 Drizzle 结构推送和通过校验的 INSERT-only 数据 SQL。

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
