import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL || '';

async function runMigration() {
  console.log('Starting DB migration...');
  const sql = postgres(connectionString);

  try {
    // 1. 给 companies 表追加字段 (如果不存在)
    console.log('1. Migrating companies table columns...');
    await sql`
      ALTER TABLE companies 
      ADD COLUMN IF NOT EXISTS credit_code VARCHAR(50),
      ADD COLUMN IF NOT EXISTS country_code VARCHAR(10) DEFAULT 'CN',
      ADD COLUMN IF NOT EXISTS country_name VARCHAR(100) DEFAULT '中国',
      ADD COLUMN IF NOT EXISTS province VARCHAR(100),
      ADD COLUMN IF NOT EXISTS city VARCHAR(100);
    `;

    // 为 credit_code 添加 UNIQUE 约束与索引
    console.log('Adding UNIQUE constraint and indexes to companies...');
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
    await sql`CREATE INDEX IF NOT EXISTS idx_companies_location ON companies (country_code, province, city);`;

    // Update policies for companies to guarantee public select
    await sql`
      DO $$
      BEGIN
        DROP POLICY IF EXISTS "Allow select for companies" ON companies;
        CREATE POLICY "Allow select for companies" ON companies FOR SELECT TO public USING (true);

        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'companies' AND policyname = 'Allow update for companies'
        ) THEN
          CREATE POLICY "Allow update for companies" ON companies FOR UPDATE TO public USING (true);
        END IF;
      END $$;
    `;

    // 2. 创建 company_links 表
    console.log('2. Creating company_links table...');
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
    await sql`ALTER TABLE company_links ENABLE ROW LEVEL SECURITY;`;
    
    // Policies for company_links
    const linkPolicies = [
      { name: 'Allow select for company_links', action: 'SELECT' },
      { name: 'Allow insert for company_links', action: 'INSERT' },
      { name: 'Allow update for company_links', action: 'UPDATE' },
      { name: 'Allow delete for company_links', action: 'DELETE' },
    ];
    for (const p of linkPolicies) {
      const policyClause = p.action === 'INSERT' ? 'WITH CHECK (true)' : 'USING (true)';
      await sql.unsafe(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = 'company_links' AND policyname = '${p.name}'
          ) THEN
            CREATE POLICY "${p.name}" ON company_links FOR ${p.action} TO public ${policyClause};
          END IF;
        END $$;
      `);
    }

    // 3. 创建 company_details 表
    console.log('3. Creating company_details table...');
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
    await sql`ALTER TABLE company_details ENABLE ROW LEVEL SECURITY;`;

    const detailPolicies = [
      { name: 'Allow select for company_details', action: 'SELECT' },
      { name: 'Allow insert for company_details', action: 'INSERT' },
      { name: 'Allow update for company_details', action: 'UPDATE' },
    ];
    for (const p of detailPolicies) {
      const policyClause = p.action === 'INSERT' ? 'WITH CHECK (true)' : 'USING (true)';
      await sql.unsafe(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = 'company_details' AND policyname = '${p.name}'
          ) THEN
            CREATE POLICY "${p.name}" ON company_details FOR ${p.action} TO public ${policyClause};
          END IF;
        END $$;
      `);
    }

    // 4. 创建 geo_countries 表
    console.log('4. Creating geo_countries table...');
    await sql`
      CREATE TABLE IF NOT EXISTS geo_countries (
        code VARCHAR(10) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        chinese_name VARCHAR(100)
      );
    `;
    await sql`ALTER TABLE geo_countries ENABLE ROW LEVEL SECURITY;`;
    const countryPolicies = [
      { name: 'Allow select for geo_countries', action: 'SELECT' },
      { name: 'Allow insert for geo_countries', action: 'INSERT' },
    ];
    for (const p of countryPolicies) {
      const policyClause = p.action === 'INSERT' ? 'WITH CHECK (true)' : 'USING (true)';
      await sql.unsafe(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = 'geo_countries' AND policyname = '${p.name}'
          ) THEN
            CREATE POLICY "${p.name}" ON geo_countries FOR ${p.action} TO public ${policyClause};
          END IF;
        END $$;
      `);
    }

    // 5. 创建 geo_cities 表
    console.log('5. Creating geo_cities table...');
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
    await sql`ALTER TABLE geo_cities ENABLE ROW LEVEL SECURITY;`;

    const cityPolicies = [
      { name: 'Allow select for geo_cities', action: 'SELECT' },
      { name: 'Allow insert for geo_cities', action: 'INSERT' },
    ];
    for (const p of cityPolicies) {
      const policyClause = p.action === 'INSERT' ? 'WITH CHECK (true)' : 'USING (true)';
      await sql.unsafe(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = 'geo_cities' AND policyname = '${p.name}'
          ) THEN
            CREATE POLICY "${p.name}" ON geo_cities FOR ${p.action} TO public ${policyClause};
          END IF;
        END $$;
      `);
    }

    console.log('✅ DB Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
    process.exit(0);
  }
}

runMigration();
