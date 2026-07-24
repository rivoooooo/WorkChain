-- ==========================================================
-- Supabase CLI 数据库初始化迁移文件
-- 文件名: supabase/migrations/20260724000000_init_tables.sql
-- 说明: 包含 4 张主表 (companies, reviews, backups_metadata, backups_binary)
-- ==========================================================

-- 1. 创建公司主表 (companies)
CREATE TABLE IF NOT EXISTS companies (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    review_count INTEGER DEFAULT 0,
    avg_rating NUMERIC(4,2) DEFAULT 0.00,
    avg_career NUMERIC(4,2) DEFAULT 0.00,
    avg_balance NUMERIC(4,2) DEFAULT 0.00,
    avg_management NUMERIC(4,2) DEFAULT 0.00,
    avg_compensation NUMERIC(4,2) DEFAULT 0.00,
    avg_culture NUMERIC(4,2) DEFAULT 0.00,
    avg_salary INTEGER DEFAULT 0,
    avg_bonus INTEGER DEFAULT 0
);

-- 2. 创建评价表 (reviews)
CREATE TABLE IF NOT EXISTS reviews (
    id VARCHAR(255) PRIMARY KEY,
    company_id VARCHAR(255) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    branch_location VARCHAR(255) NOT NULL,
    position VARCHAR(255) NOT NULL,
    employment_status VARCHAR(50) DEFAULT 'current',
    salary INTEGER DEFAULT 0,
    bonus INTEGER DEFAULT 0,
    experience_years INTEGER DEFAULT 1,
    rating_career INTEGER NOT NULL,
    rating_balance INTEGER NOT NULL,
    rating_management INTEGER NOT NULL,
    rating_compensation INTEGER NOT NULL,
    rating_culture INTEGER NOT NULL,
    review_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    previous_hash VARCHAR(255) DEFAULT '0',
    hash VARCHAR(255) NOT NULL
);

-- 3. 创建自动归档备份元数据表 (backups_metadata)
CREATE TABLE IF NOT EXISTS backups_metadata (
    id VARCHAR(255) PRIMARY KEY,
    date VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    review_count INTEGER DEFAULT 0,
    csv_size INTEGER DEFAULT 0,
    xlsx_size INTEGER DEFAULT 0,
    sql_size INTEGER DEFAULT 0
);

-- 4. 创建自动归档备份二进制存储表 (backups_binary)
CREATE TABLE IF NOT EXISTS backups_binary (
    id VARCHAR(255) PRIMARY KEY,
    csv_base64 TEXT,
    xlsx_base64 TEXT,
    sql_base64 TEXT
);

-- 5. 索引优化 (提高高频查询性能)
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);
CREATE INDEX IF NOT EXISTS idx_reviews_company_id ON reviews(company_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_backups_metadata_date ON backups_metadata(date DESC);

-- 6. 安全兼容升级：若旧表中缺失字段或外键关联，自动修补
DO $$
BEGIN
    -- 确保 reviews 表包含 company_id 字段
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'reviews' AND table_schema = 'public'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'reviews' AND column_name = 'company_id' AND table_schema = 'public'
        ) THEN
            ALTER TABLE reviews ADD COLUMN company_id VARCHAR(255);
        END IF;
    END IF;

    -- 确保外键约束 fk_reviews_company 存在
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'reviews' AND table_schema = 'public'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'companies' AND table_schema = 'public'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'fk_reviews_company' AND table_schema = 'public'
        ) THEN
            ALTER TABLE reviews 
            ADD CONSTRAINT fk_reviews_company 
            FOREIGN KEY (company_id) 
            REFERENCES companies(id) 
            ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- 7. 配置 Row Level Security (RLS) 行级安全权限
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE backups_metadata DISABLE ROW LEVEL SECURITY;
ALTER TABLE backups_binary DISABLE ROW LEVEL SECURITY;
