-- 扩展 companies 表
ALTER TABLE companies 
  ADD COLUMN IF NOT EXISTS credit_code VARCHAR(50) UNIQUE,
  ADD COLUMN IF NOT EXISTS country_code VARCHAR(10) DEFAULT 'CN',
  ADD COLUMN IF NOT EXISTS country_name VARCHAR(100) DEFAULT '中国',
  ADD COLUMN IF NOT EXISTS province VARCHAR(100),
  ADD COLUMN IF NOT EXISTS city VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_companies_credit_code ON companies (credit_code);
CREATE INDEX IF NOT EXISTS idx_companies_location ON companies (country_code, province, city);

-- 创建 company_links 表
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

-- 创建 company_details 表
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

-- 创建 geo_countries 表
CREATE TABLE IF NOT EXISTS geo_countries (
  code VARCHAR(10) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  chinese_name VARCHAR(100)
);

-- 创建 geo_cities 表
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
