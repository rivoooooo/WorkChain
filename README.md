<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Work-Chain 职场匿名评价与薪资账本系统

基于 Next.js、Drizzle ORM、PostgreSQL / Supabase 与密码学散列的匿名职场评价、薪资透明度与企业注册数据全景系统。

---

## 🚀 核心架构与数据库设计 (Schema Architecture)

系统采用解耦与可扩充的 PostgreSQL 数据模型架构：

- **公司主表 (`companies`)**：
  - `credit_code`: 统一社会信用代码（可选检索字段）；企业身份由规范化名称与国家/省份/城市共同确定。
  - 地理位置属性: `country_code` ('CN' 等)、`country_name` ('中国' 等)、`province` (省份)、`city` (工作城市)。
  - 评级汇总指标: 综合评分、薪资与年终奖均值、多维度满意度统计。
- **扩展详细信息表 (`company_details`)**：
  - 补充工商扩展字段: 法人代表 (`legal_representative`)、注册资金 (`registered_capital`)、经营范围 (`business_scope`)、注册地址 (`registered_address`)、注册日期 (`establishment_date`)、企业类型 (`company_type`)。
  - *设计优势*：创建评价时仅需填入最少必要基本信息，无需强制录入复杂的扩展工商属性。
- **相关链接与媒体表 (`company_links`)**：
  - 支持 Logo (`logo`)、展示图片 (`image`)、官方网站 (`url`) 与文档 (`document`) 关联存储。结合 Supabase Object Storage (`company-assets` Bucket)。
- **社区位置字符串索引 (`location_countries` & `location_cities`)**：
  - 正式数据库不预置地理数据；用户可用中文或英文填写国家与城市。
  - 国家按规范化名称全局唯一，城市按“国家 + 规范化城市名”唯一。

---

## 🛠️ 数据初始化与 CLI 脚本指南 (Data Ingestion & CLI)

在配置好 `.env` 中的 `DATABASE_URL` 之后，系统提供开箱即用的命令行脚本工具：

### 1. 数据库结构同步
`drizzle/schema.ts` 是唯一结构源。开发环境推送：
```bash
bun run db:push
```
正式环境使用带项目目标和显式确认保护的 `bun run db:push:prod`，详见 [SCRIPTS.md](SCRIPTS.md)。

### 2. 可选的离线地理 SQL
脚本仍可从 `data/cities500.txt` 生成只包含 INSERT 的离线 SQL，但正式环境不需要导入：
```bash
bun run data:export:geo --output data/cities500.sql --force
bun run data:check-sql data/cities500.sql
```

### 3. 载入企业注册 CSV 数据 (Kinginsun 仓库格式)
支持解析并导入中国大陆企业注册数据，感谢开源数据提供：
- 🔗 **数据来源与致谢**：[kinginsun/Enterprise-Registration-Data-of-Chinese-Mainland](https://github.com/kinginsun/Enterprise-Registration-Data-of-Chinese-Mainland)

```bash
# 使用 --dir 参数批量导入目录下（包含子目录）的所有 CSV / TXT 数据
bun run data:export:companies --dir /path/to/enterprise_csv_dir \
  --output data/companies.sql

# 或导入单个 CSV 数据文件
bun run data:export:companies /path/to/enterprise.csv \
  --output data/companies.sql
```

*特质说明*：
- **通用转换适配器**：自动映射统一社会信用代码、企业名称、法人代表、资金、经营范围、企业类型等列名。
- **不可变追加**：以规范化的 **企业名称 + 国家/省份/城市** 作为唯一身份；同名企业在不同地区可以独立存在，已存在记录不会覆写。
- **可选联合分析**：生成企业分析报告时，可由用户主动勾选同名分区企业或名称相似企业，将其评价临时合并到本次分析口径。
- **工作强度样本**：新评价同时收集每天工作时长和每周工作天数，并纳入不可变评价哈希与分析报告。
- **读写分离**：企业、评价、统计和地理数据由浏览器通过 Supabase Data API 直接读取；受控写入继续经过 Next.js、Turnstile 与速率限制。

`bun run db:push` 会先通过 Drizzle 推送结构，再自动为前端读取所需的
表与视图授予 `anon` 角色 `USAGE/SELECT` 权限；不会授予写入、修改或
删除权限。`db:grant-public-read` 仅用于需要单独修复权限的场景。

---

## 🖥️ 前端组件与功能特性 (UI Components)

1. **已建企业模糊检索与自动补全 (`CompanySelect`)**：
   - 评价表单中输入公司名称时打字实时检索已知企业库。
   - 选中已知企业后，**自动补全/填充所在国家与工作城市**。
2. **自由填写国家与城市**：
   - 国家与工作城市都是普通文本输入，可直接填写中文或英文。
   - 首次出现的位置会自动追加到轻量唯一字符串索引，不依赖预置地理数据库。
3. **Web 端公司详情 Tab 页签 (`/[lang]/companies/[id]`)**：
   - 新增 **“公司详情信息”** 专属 Tab 页签，展示统一社会信用代码、法人代表、注册资金、成立日期、经营范围及媒体图集/外部链接。

---

## 💻 本地开发指南

**包管理器要求**：本项目统一使用 **`bun`**。

1. **安装依赖**：
   ```bash
   bun install
   ```
2. **环境配置**：
   复制 `.env.example`，配置 `DATABASE_OWNER_URL`、`APP_DATABASE_URL` 与 Supabase 参数。
3. **启动服务**：
   ```bash
   bun run dev
   ```

---

## 📜 常用 CLI 脚本列表

| 脚本命令 | 说明 |
| :--- | :--- |
| `bun run db:push` | 从 Drizzle schema 同步开发数据库结构 |
| `bun run db:push:prod` | 带环境、确认文本和 Supabase 项目标识保护的生产结构推送 |
| `bun run data:export:geo --output <file>` | 从 `cities500.txt` 生成城市与国家 INSERT-only SQL |
| `bun run data:export:companies --dir <path> --output <file>` | 转换企业 CSV 并生成确定性的 INSERT-only SQL |
| `bun run data:check-sql <file>` | 拒绝含 DDL、更新或删除语句的数据 SQL |

---

## 📚 项目文档

- [运维与 CLI 脚本指南](SCRIPTS.md)
- [设计系统与样式指南](DESIGN.md)
- [AGENTS 指南与规范](AGENTS.md)
