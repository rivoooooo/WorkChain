<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Workplace Anonymous Review Ledger System

职场匿名评价与薪资数据库系统。

## 本地开发指南 (Run Locally)

**包管理器要求**: 本项目统一使用 **`bun`**。

1. **安装依赖**:
   ```bash
   bun install
   ```
2. **环境配置**:
   复制并配置 `.env` 文件中的 `SUPABASE_URL` 与 `SUPABASE_ANON_KEY`。
3. **启动服务**:
   ```bash
   bun run dev
   ```

## 数据库与迁移 (Database & Migrations)

使用 **Supabase CLI** 进行数据库版本控制与在线表结构更新：

- 详见数据库 CLI 迁移指南: [SUPABASE_CLI_GUIDE.md](file:///Users/owocc/antigravity/Work-Chain/SUPABASE_CLI_GUIDE.md)
- 快速推送数据表到云端:
  ```bash
  bunx supabase link --project-ref rqaclnjunxrqtogsbkvt
  bunx supabase db push
  ```