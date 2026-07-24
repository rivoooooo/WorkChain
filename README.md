<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Work-Chain 职场匿名评价与薪资账本系统

职场匿名评价与薪资数据库系统。

## 本地开发指南

**包管理器要求**：本项目统一使用 **`bun`**。

1. **安装依赖**：
   ```bash
   bun install
   ```
2. **环境配置**：
   复制并配置 `.env` 文件中的 `SUPABASE_URL` 与 `SUPABASE_ANON_KEY`。
3. **启动服务**：
   ```bash
   bun run dev
   ```

## 数据库与迁移

使用 **Drizzle ORM** 进行数据库版本控制与在线表结构更新：

- **生成 DB 迁移文件**：
  ```bash
  bun run db:generate
  ```
- **推送表结构到云端 DB**：
  ```bash
  bun run db:push
  ```
- **启动 Drizzle Studio 可视化面板**：
  ```bash
  bun run db:studio
  ```

## 项目文档

- [设计系统与样式指南](DESIGN.md)
- [AGENTS 指南与规范](AGENTS.md)