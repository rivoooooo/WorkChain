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

### 1. 数据库安全迁移与结构同步
运行迁移脚本，自动为数据库补充全新字段、表结构与 RLS 安全策略（不丢失原已有数据）：
```bash
bun run db:migrate
```

### 2. 初始化填充城市与国家数据库
脚本会自动从仓库内部数据源 `data/cities500.txt` 提取并导入 23.5 万全球/中国城市与 246 个国家：
```bash
bun run import:geo
```

### 3. 载入企业注册 CSV 数据 (Kinginsun 仓库格式)
支持解析并导入 [Enterprise-Registration-Data-of-Chinese-Mainland](https://github.com/kinginsun/Enterprise-Registration-Data-of-Chinese-Mainland) 的 CSV / TXT 工商注册数据：

```bash
# 导入单个 CSV 数据文件
bun run import:kinginsun /path/to/enterprise.csv

# 批量导入包含 CSV 的文件夹
bun run import:kinginsun /path/to/csv_folder
```

*特质说明*：
- **通用转换适配器**：自动映射统一社会信用代码、企业名称、法人代表、资金、经营范围、企业类型等列名。
- **增量 Upsert**：以 **统一社会信用代码 (`credit_code`)** 作为唯一 Key。若企业已存在则增量更新属性，不存在则新建。

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
   复制并配置 `.env` 文件中的 `DATABASE_URL`、`NEXT_PUBLIC_SUPABASE_URL` 与 `NEXT_PUBLIC_SUPABASE_ANON_KEY`。
3. **启动服务**：
   ```bash
   bun run dev
   ```

---

## 📜 常用命令列表

| 命令 | 说明 |
| :--- | :--- |
| `bun run dev` | 启动 Next.js 本地开发服务 |
| `bun run build` | 编译打包生产静态/动态页面 |
| `bun run db:migrate` | 运行增量 DDL 脚本，自动初始化/迁移数据库表结构与 RLS |
| `bun run db:push` | 使用 drizzle-kit 直接推送 ORM Schema 到 PostgreSQL |
| `bun run import:geo` | 从仓库数据源 `data/cities500.txt` 批量写入 23.5 万城市与 246 个国家 |
| `bun run import:kinginsun <path>` | 载入并批量转换企业注册数据 CSV，按统一社会信用代码 Upsert 入库 |

---

## 📚 项目文档

- [设计系统与样式指南](DESIGN.md)
- [AGENTS 指南与规范](AGENTS.md)