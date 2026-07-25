-- 初始化 Work-Chain 数据库架构与全套行级安全 (RLS) 策略

-- 1. 公司主表 (companies)
CREATE TABLE IF NOT EXISTS companies (
  id VARCHAR(255) PRIMARY KEY,
  credit_code VARCHAR(50) UNIQUE,
  name VARCHAR(255) NOT NULL,
  country_code VARCHAR(10) DEFAULT 'CN',
  country_name VARCHAR(100) DEFAULT '中国',
  province VARCHAR(100),
  city VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  review_count INTEGER DEFAULT 0,
  avg_rating NUMERIC(4, 2) DEFAULT '0.00',
  avg_career NUMERIC(4, 2) DEFAULT '0.00',
  avg_balance NUMERIC(4, 2) DEFAULT '0.00',
  avg_management NUMERIC(4, 2) DEFAULT '0.00',
  avg_compensation NUMERIC(4, 2) DEFAULT '0.00',
  avg_culture NUMERIC(4, 2) DEFAULT '0.00',
  avg_salary INTEGER DEFAULT 0,
  avg_bonus INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_companies_credit_code ON companies (credit_code);
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies (name);
CREATE INDEX IF NOT EXISTS idx_companies_location ON companies (country_code, province, city);

-- 2. 评价主表 (reviews)
CREATE TABLE IF NOT EXISTS reviews (
  id VARCHAR(255) PRIMARY KEY,
  company_id VARCHAR(255) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  previous_hash VARCHAR(255) DEFAULT '0',
  hash VARCHAR(255) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reviews_company_id ON reviews (company_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews (created_at);

-- 3. 自动归档备份元数据表 (backups_metadata)
CREATE TABLE IF NOT EXISTS backups_metadata (
  id VARCHAR(255) PRIMARY KEY,
  date VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  review_count INTEGER DEFAULT 0,
  csv_size INTEGER DEFAULT 0,
  xlsx_size INTEGER DEFAULT 0,
  sql_size INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_backups_metadata_date ON backups_metadata (date);

-- 4. 自动归档备份二进制存储表 (backups_binary)
CREATE TABLE IF NOT EXISTS backups_binary (
  id VARCHAR(255) PRIMARY KEY,
  csv_base64 TEXT,
  xlsx_base64 TEXT,
  sql_base64 TEXT
);

-- 5. 公司相关链接/媒体扩展表 (company_links)
CREATE TABLE IF NOT EXISTS company_links (
  id VARCHAR(255) PRIMARY KEY,
  company_id VARCHAR(255) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  url TEXT NOT NULL,
  storage_path TEXT,
  title VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_company_links_company_id ON company_links (company_id);

-- 6. 公司扩展详细信息表 (company_details)
CREATE TABLE IF NOT EXISTS company_details (
  id VARCHAR(255) PRIMARY KEY,
  company_id VARCHAR(255) NOT NULL UNIQUE REFERENCES companies(id) ON DELETE CASCADE,
  legal_representative VARCHAR(255),
  registered_capital VARCHAR(100),
  business_scope TEXT,
  registered_address TEXT,
  establishment_date VARCHAR(50),
  company_type VARCHAR(100),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_company_details_company_id ON company_details (company_id);

-- 7. 国家地理位置表 (geo_countries)
CREATE TABLE IF NOT EXISTS geo_countries (
  code VARCHAR(10) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  chinese_name VARCHAR(100)
);

-- 8. 城市地理位置表 (geo_cities)
CREATE TABLE IF NOT EXISTS geo_cities (
  id INTEGER PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  ascii_name VARCHAR(200),
  alternate_names TEXT,
  chinese_name VARCHAR(200),
  country_code VARCHAR(10) NOT NULL,
  admin1_code VARCHAR(50),
  latitude NUMERIC(10, 5),
  longitude NUMERIC(10, 5)
);

CREATE INDEX IF NOT EXISTS idx_geo_cities_country ON geo_cities (country_code);
CREATE INDEX IF NOT EXISTS idx_geo_cities_name ON geo_cities (name);
CREATE INDEX IF NOT EXISTS idx_geo_cities_chinese_name ON geo_cities (chinese_name);

-- 9. 配置全局行级安全 (RLS) 策略
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE backups_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE backups_binary ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE geo_countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE geo_cities ENABLE ROW LEVEL SECURITY;

-- 为公用写入与查询配置基础全通 Policies (SELECT, INSERT, UPDATE, DELETE)
DO $$
DECLARE
  t text;
  tbls text[] := ARRAY['companies', 'reviews', 'backups_metadata', 'backups_binary', 'company_links', 'company_details', 'geo_countries', 'geo_cities'];
BEGIN
  FOREACH t IN ARRAY tbls LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Allow select for %I" ON %I;', t, t);
    EXECUTE format('CREATE POLICY "Allow select for %I" ON %I FOR SELECT TO public USING (true);', t, t);
    
    EXECUTE format('DROP POLICY IF EXISTS "Allow insert for %I" ON %I;', t, t);
    EXECUTE format('CREATE POLICY "Allow insert for %I" ON %I FOR INSERT TO public WITH CHECK (true);', t, t);

    EXECUTE format('DROP POLICY IF EXISTS "Allow update for %I" ON %I;', t, t);
    EXECUTE format('CREATE POLICY "Allow update for %I" ON %I FOR UPDATE TO public USING (true) WITH CHECK (true);', t, t);

    EXECUTE format('DROP POLICY IF EXISTS "Allow delete for %I" ON %I;', t, t);
    EXECUTE format('CREATE POLICY "Allow delete for %I" ON %I FOR DELETE TO public USING (true);', t, t);
  END LOOP;
END $$;
