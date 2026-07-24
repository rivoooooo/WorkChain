-- ==========================================================
-- 数据库迁移与初始化 SQL 脚本 (适用于 Supabase / PostgreSQL)
-- 请在 Supabase 的 SQL Editor 中运行此脚本以创建或更新表结构
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

-- 2. 创建评价子表 (reviews)
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

-- 3. 安全兼容更新：若 reviews 表已存在但缺失 company_id 字段或外键关联
DO $$
BEGIN
    -- 确保 reviews 表中包含 company_id 字段
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

    -- 确保外键约束存在
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
            -- 清理任何不合法的空数据（如有）
            UPDATE reviews SET company_id = 'comp-unknown' WHERE company_id IS NULL;
            -- 确保 parent 公司记录存在以防违反外键约束
            INSERT INTO companies (id, name, review_count, avg_rating)
            VALUES ('comp-unknown', '未知公司', 0, 0)
            ON CONFLICT (id) DO NOTHING;

            -- 设为 NOT NULL 并添加外键约束
            ALTER TABLE reviews ALTER COLUMN company_id SET NOT NULL;
            ALTER TABLE reviews 
            ADD CONSTRAINT fk_reviews_company 
            FOREIGN KEY (company_id) 
            REFERENCES companies(id) 
            ON DELETE CASCADE;
        END IF;
    END IF;
END $$;
