import postgres from 'postgres';
import { createClient } from '@supabase/supabase-js';

interface DatabaseInspectionConfig {
  name: string;
  supabaseUrl: string;
  supabaseKey: string;
  databaseUrl: string;
}

function loadConfig(prefix: 'DB1' | 'DB2'): DatabaseInspectionConfig | null {
  const supabaseUrl = process.env[`${prefix}_SUPABASE_URL`];
  const supabaseKey = process.env[`${prefix}_SUPABASE_PUBLISHABLE_KEY`];
  const databaseUrl = process.env[`${prefix}_DATABASE_URL`];

  if (!supabaseUrl || !supabaseKey || !databaseUrl) {
    return null;
  }

  return {
    name: process.env[`${prefix}_NAME`] || prefix,
    supabaseUrl,
    supabaseKey,
    databaseUrl,
  };
}

async function inspectDb(config: DatabaseInspectionConfig) {
  console.log(`\n==================================================`);
  console.log(`🔍 正在检查: ${config.name}`);
  console.log(`==================================================`);

  // 1. Direct Postgres Query via postgres.js
  const sql = postgres(config.databaseUrl, { prepare: false, connect_timeout: 10 });
  try {
    // Check columns
    const columns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'companies'
      ORDER BY ordinal_position;
    `;
    console.log(`\n📋 [1. PostgreSQL 表结构] companies 列定义 (${columns.length} 个字段):`);
    console.table(columns);

    // Check row count
    const countResult = await sql`SELECT count(*)::int FROM companies;`;
    const rowCount = countResult[0].count;
    console.log(`\n📊 [2. 直连 PostgreSQL 数据量] companies 表实际行数: ${rowCount}`);

    if (rowCount > 0) {
      const sample = await sql`SELECT id, name, credit_code, country_code, city FROM companies LIMIT 3;`;
      console.log(`   前 3 条样本数据:`, sample);
    }

    // Check RLS policies
    const rlsPolicies = await sql`
      SELECT polname, polpermissive, polroles, polcmd, polqual, polwithcheck
      FROM pg_policy
      JOIN pg_class ON pg_class.oid = pg_policy.polrelid
      WHERE relname = 'companies';
    `;
    console.log(`\n🛡️ [3. RLS 安全策略] companies 表中的 pg_policy策略数: ${rlsPolicies.length}`);
    if (rlsPolicies.length > 0) {
      console.table(rlsPolicies);
    } else {
      console.log(`   ⚠️ 警告: companies 表尚未配置任何 RLS 策略 (或 RLS 未开启/开启但缺少 SELECT 许可)`);
    }

    // Check RLS enabled status
    const rlsStatus = await sql`
      SELECT relname, relrowsecurity, relforcerowsecurity
      FROM pg_class
      WHERE relname = 'companies';
    `;
    console.log(`   RLS 启用状态 (relrowsecurity):`, rlsStatus[0]?.relrowsecurity);

  } catch (err: any) {
    console.error(`❌ 直连 PostgreSQL 错误:`, err.message || err);
  } finally {
    await sql.end();
  }

  // 2. Query via Supabase JS Client (Rest API / RLS validation)
  try {
    const supabase = createClient(config.supabaseUrl, config.supabaseKey);
    const { data, error, count } = await supabase
      .from('companies')
      .select('*', { count: 'exact' });

    console.log(`\n🌐 [4. Supabase Client REST API 查询结果]`);
    if (error) {
      console.error(`   ❌ Supabase API 查询报错:`, error);
    } else {
      console.log(`   ✅ Supabase API 返回数组长度: ${data?.length || 0}`);
      console.log(`   ✅ Supabase API count 统计: ${count}`);
    }
  } catch (err: any) {
    console.error(`❌ Supabase Client 查询出错:`, err.message || err);
  }
}

async function main() {
  const configs = [loadConfig('DB1'), loadConfig('DB2')].filter(
    (config): config is DatabaseInspectionConfig => config !== null
  );

  if (configs.length === 0) {
    throw new Error(
      'No database inspection configuration found. Set DB1_* or DB2_* environment variables.'
    );
  }

  for (const config of configs) {
    await inspectDb(config);
  }
}

main().catch(console.error);
