# Work-Chain 运维与 CLI 脚本指南 (`scripts/`)

本目录存放 Work-Chain 系统所有的 CLI 数据库迁移、数据初始化与外部数据转换导入脚本。所有脚本均统一基于 **`bun`** 执行。

---

## 🛠️ 脚本概览

| 脚本文件 | 核心用途 | 依赖环境 / 数据源 | 经典使用命令 |
| :--- | :--- | :--- | :--- |
| **`scripts/migrate.ts`** | 数据库 Schema 增量安全迁移与 RLS 策略初始化 | `.env` 中的 `DATABASE_URL` | `bun run scripts/migrate.ts` |
| **`scripts/import-geonames.ts`** | 导入全球 246 个国家与 23.5 万城市地理数据 | 默认数据源: `data/cities500.txt` | `bun run scripts/import-geonames.ts` |
| **`scripts/import-kinginsun.ts`** | 企业注册 CSV 数据通用转换与批量 Upsert 导入 | [Enterprise-Registration-Data-of-Chinese-Mainland](https://github.com/kinginsun/Enterprise-Registration-Data-of-Chinese-Mainland) | `bun run scripts/import-kinginsun.ts --dir <目录>` |

---

## 📖 脚本详细使用说明

### 1. 数据库安全迁移脚本 (`scripts/migrate.ts`)

**功能**：
自动校验并执行数据库版本升级与 SQL DDL 变更。无交互、防误删已有数据，并自动建立表索引与 Supabase RLS 安全策略。

**使用方法**：
```bash
bun run scripts/migrate.ts
```

**涵盖表结构**：
- `companies` 主表（增加 `credit_code` 唯一索引、`country_code`、`province`、`city` 等）。
- `company_details` 扩展工商信息表。
- `company_links` 相关媒体与外部链接表。
- `geo_countries` & `geo_cities` 地理信息表。

---

### 2. 全球/中国城市与国家导入脚本 (`scripts/import-geonames.ts`)

**功能**：
解析 GeoNames 地理数据库，自动提取 CJK 中文别名，并将全球 246 个国家/地区及 23.5 万个城市批量导入至数据库的 `geo_countries` 与 `geo_cities` 表。

**使用方法**：
```bash
# 1. 默认自动加载仓库内 data/cities500.txt 数据源
bun run scripts/import-geonames.ts

# 2. 或指定自定义的 txt/geonames 数据路径
bun run scripts/import-geonames.ts /path/to/custom_cities.txt
```

---

### 3. 企业注册数据 CSV 转换导入脚本 (`scripts/import-kinginsun.ts`)

**功能**：
用于转换并批量导入中国大陆企业注册数据，支持以 **统一社会信用代码 (`credit_code`)** 作为唯一标识进行高效率增量 Upsert 入库。

**致谢与数据来源**：
特别感谢开源数据项目：🔗 [kinginsun/Enterprise-Registration-Data-of-Chinese-Mainland](https://github.com/kinginsun/Enterprise-Registration-Data-of-Chinese-Mainland)

**使用方法**：

```bash
# 方式 A：使用 --dir 参数递归导入目录下（包含所有子目录）的 CSV / TXT 数据
bun run scripts/import-kinginsun.ts --dir /path/to/enterprise_csv_dir

# 方式 B：导入单个指定 CSV 数据文件
bun run scripts/import-kinginsun.ts /path/to/single_enterprise.csv
```

**特性说明**：
- 自动适配解析各类 CSV 列头（信用代码、公司名、法人代表、资金、经营范围、注册地址等）。
- 实时显示文件读取进度、解析成功率及数据库 Batch Upsert 状态。
