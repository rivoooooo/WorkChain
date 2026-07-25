import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL || '';

async function runMigration() {
  console.log('Starting DB migration...');
  if (!connectionString) {
    console.warn('⚠️ DATABASE_URL environment variable is not set. Skipping live DB migration.');
    process.exit(0);
  }

  const sql = postgres(connectionString);

  try {
    // 1. 迁移 companies 表字段与索引
    console.log('1. Migrating companies table columns and indexes...');
    await sql`
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
    `;

    await sql`
      ALTER TABLE companies 
      ADD COLUMN IF NOT EXISTS credit_code VARCHAR(50),
      ADD COLUMN IF NOT EXISTS country_code VARCHAR(10) DEFAULT 'CN',
      ADD COLUMN IF NOT EXISTS country_name VARCHAR(100) DEFAULT '中国',
      ADD COLUMN IF NOT EXISTS province VARCHAR(100),
      ADD COLUMN IF NOT EXISTS city VARCHAR(100);
    `;

    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'companies_credit_code_unique'
        ) THEN
          ALTER TABLE companies ADD CONSTRAINT companies_credit_code_unique UNIQUE (credit_code);
        END IF;
      END $$;
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_companies_credit_code ON companies (credit_code);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_companies_name ON companies (name);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_companies_location ON companies (country_code, province, city);`;

    // 2. 迁移 reviews 表
    console.log('2. Migrating reviews table columns and foreign keys...');
    await sql`
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
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        previous_hash VARCHAR(255) DEFAULT '0',
        hash VARCHAR(255) NOT NULL
      );
    `;

    // 确保 reviews 表包含 company_id 字段
    await sql`
      ALTER TABLE reviews 
      ADD COLUMN IF NOT EXISTS company_id VARCHAR(255);
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_reviews_company_id ON reviews (company_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews (created_at);`;

    // 3. 迁移 company_links 表
    console.log('3. Creating company_links table...');
    await sql`
      CREATE TABLE IF NOT EXISTS company_links (
        id VARCHAR(255) PRIMARY KEY,
        company_id VARCHAR(255) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        url TEXT NOT NULL,
        storage_path TEXT,
        title VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_company_links_company_id ON company_links (company_id);`;

    // 4. 迁移 company_details 表
    console.log('4. Creating company_details table...');
    await sql`
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
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_company_details_company_id ON company_details (company_id);`;

    // 5. 迁移 backups_metadata & backups_binary 表
    console.log('5. Creating backups tables...');
    await sql`
      CREATE TABLE IF NOT EXISTS backups_metadata (
        id VARCHAR(255) PRIMARY KEY,
        date VARCHAR(50) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        review_count INTEGER DEFAULT 0,
        csv_size INTEGER DEFAULT 0,
        xlsx_size INTEGER DEFAULT 0,
        sql_size INTEGER DEFAULT 0
      );
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_backups_metadata_date ON backups_metadata (date);`;

    await sql`
      CREATE TABLE IF NOT EXISTS backups_binary (
        id VARCHAR(255) PRIMARY KEY,
        csv_base64 TEXT,
        xlsx_base64 TEXT,
        sql_base64 TEXT
      );
    `;

    // 6. 迁移 geo_countries & geo_cities 表
    console.log('6. Creating geo tables...');
    await sql`
      CREATE TABLE IF NOT EXISTS geo_countries (
        code VARCHAR(10) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        chinese_name VARCHAR(100)
      );
    `;

    await sql`
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
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_geo_cities_country ON geo_cities (country_code);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_geo_cities_name ON geo_cities (name);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_geo_cities_chinese_name ON geo_cities (chinese_name);`;

    // 7. 通用为所有表开启 RLS 并刷全 SELECT, INSERT, UPDATE, DELETE 策略
    console.log('7. Setting up RLS policies for all tables...');
    const allTables = [
      'companies',
      'reviews',
      'backups_metadata',
      'backups_binary',
      'company_links',
      'company_details',
      'geo_countries',
      'geo_cities',
    ];

    const actions = ['SELECT', 'INSERT', 'UPDATE', 'DELETE'];

    for (const tableName of allTables) {
      await sql.unsafe(`ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY;`);
      for (const action of actions) {
        const policyName = `Allow ${action.toLowerCase()} for ${tableName}`;
        const policyClause = action === 'INSERT' ? 'WITH CHECK (true)' : action === 'UPDATE' ? 'USING (true) WITH CHECK (true)' : 'USING (true)';
        await sql.unsafe(`
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_policies WHERE tablename = '${tableName}' AND policyname = '${policyName}'
            ) THEN
              CREATE POLICY "${policyName}" ON ${tableName} FOR ${action} TO public ${policyClause};
            END IF;
          END $$;
        `);
      }
    }

    console.log('✅ DB Migration completed successfully with full RLS policies enabled!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
    process.exit(0);
  }
}

runMigration();
