<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Work-Chain 职场匿名评价与薪资账本系统

基于 Next.js、Drizzle ORM、PostgreSQL / Supabase 与密码学散列的匿名职场评价、薪资透明度与企业注册数据全景系统。

---

## 🚀 核心架构与数据库设计 (Schema Architecture)

系统采用解耦与可扩充的 PostgreSQL 数据模型架构：

- **公司主表 (`companies`)**：
  - `credit_code`: 统一社会信用代码（18 位 UNIQUE 约束与索引 `idx_companies_credit_code`），作为企业唯一标识。
  - 地理位置属性: `country_code` ('CN' 等)、`country_name` ('中国' 等)、`province` (省份)、`city` (工作城市)。
  - 评级汇总指标: 综合评分、薪资与年终奖均值、多维度满意度统计。
- **扩展详细信息表 (`company_details`)**：
  - 补充工商扩展字段: 法人代表 (`legal_representative`)、注册资金 (`registered_capital`)、经营范围 (`business_scope`)、注册地址 (`registered_address`)、注册日期 (`establishment_date`)、企业类型 (`company_type`)。
  - *设计优势*：创建评价时仅需填入最少必要基本信息，无需强制录入复杂的扩展工商属性。
- **相关链接与媒体表 (`company_links`)**：
  - 支持 Logo (`logo`)、展示图片 (`image`)、官方网站 (`url`) 与文档 (`document`) 关联存储。结合 Supabase Object Storage (`company-assets` Bucket)。
- **地理信息数据库 (`geo_countries` & `geo_cities`)**：
  - 存储全球 246 个国家元数据及 23.5 万全球/中国城市信息，支持经纬度、行政区划与 CJK 中文别名索引。

---

## 🛠️ 数据初始化与 CLI 脚本指南 (Data Ingestion & CLI)

在配置好 `.env` 中的 `DATABASE_URL` 之后，系统提供开箱即用的命令行脚本工具：

### 1. 数据库结构同步
`drizzle/schema.ts` 是唯一结构源。开发环境推送：
```bash
bun run db:push
```
正式环境使用带项目目标和显式确认保护的 `bun run db:push:prod`，详见 [SCRIPTS.md](SCRIPTS.md)。

### 2. 生成城市与国家初始化 SQL
脚本从 `data/cities500.txt` 清洗并生成只包含 INSERT 的数据 SQL，不直接连接数据库：
```bash
bun run data:export:geo --output data/cities500.sql --force
bun run data:check-sql data/cities500.sql
```

### 3. 载入企业注册 CSV 数据 (Kinginsun 仓库格式)
支持解析并导入中国大陆企业注册数据，感谢开源数据提供：
- 🔗 **数据来源与致谢**：[kinginsun/Enterprise-Registration-Data-of-Chinese-Mainland](https://github.com/kinginsun/Enterprise-Registration-Data-of-Chinese-Mainland)

```bash
# 使用 --dir 参数批量导入目录下（包含子目录）的所有 CSV / TXT 数据
bun run import:kinginsun --dir /path/to/enterprise_csv_dir

# 或导入单个 CSV 数据文件
bun run import:kinginsun /path/to/enterprise.csv
```

*特质说明*：
- **通用转换适配器**：自动映射统一社会信用代码、企业名称、法人代表、资金、经营范围、企业类型等列名。
- **不可变追加**：以 **统一社会信用代码 (`credit_code`)** 作为唯一 Key；已存在记录跳过，不覆写历史数据。

---

## 🖥️ 前端组件与功能特性 (UI Components)

1. **已建企业模糊检索与自动补全 (`CompanySelect`)**：
   - 评价表单中输入公司名称时打字实时检索已知企业库。
   - 选中已知企业后，**自动补全/填充所在国家与工作城市**。
2. **多级国家与城市可搜索组件 (`CitySelect`)**：
   - 所在国家与工作城市均升级为可打字搜索的 Dropdown Combobox。
   - 支持无默认国家约束，打字检索中英文国名或城市别名。
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
| `bun run scripts/import-kinginsun.ts --dir <path>` | 转换 CSV 并只插入尚不存在的统一社会信用代码 |
| `bun run data:check-sql <file>` | 拒绝含 DDL、更新或删除语句的数据 SQL |

---

## 📚 项目文档

- [运维与 CLI 脚本指南](SCRIPTS.md)
- [设计系统与样式指南](DESIGN.md)
- [AGENTS 指南与规范](AGENTS.md)
