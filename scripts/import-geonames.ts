import fs from 'fs';
import readline from 'readline';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL || '';
const GEONAMES_FILE_PATH = '/Users/owocc/Downloads/source/cities500.txt';

// 常用国家 ISO 代码中文映射表 (常见国家)
const COUNTRY_NAME_MAP: Record<string, { en: string; cn: string }> = {
  CN: { en: 'China', cn: '中国' },
  US: { en: 'United States', cn: '美国' },
  JP: { en: 'Japan', cn: '日本' },
  GB: { en: 'United Kingdom', cn: '英国' },
  DE: { en: 'Germany', cn: '德国' },
  FR: { en: 'France', cn: '法国' },
  KR: { en: 'South Korea', cn: '韩国' },
  SG: { en: 'Singapore', cn: '新加坡' },
  CA: { en: 'Canada', cn: '加拿大' },
  AU: { en: 'Australia', cn: '澳大利亚' },
  RU: { en: 'Russia', cn: '俄罗斯' },
  IN: { en: 'India', cn: '印度' },
  BR: { en: 'Brazil', cn: '巴西' },
  HK: { en: 'Hong Kong', cn: '中国香港' },
  MO: { en: 'Macau', cn: '中国澳门' },
  TW: { en: 'Taiwan', cn: '中国台湾' },
};

function extractChineseName(alternatenamesStr: string, name: string): string | null {
  if (!alternatenamesStr) return null;
  const names = alternatenamesStr.split(',');
  for (const n of names) {
    const trimmed = n.trim();
    // 匹配全中文字符
    if (/^[\u4e00-\u9fa5]+$/.test(trimmed)) {
      return trimmed;
    }
  }
  return null;
}

async function importGeonames() {
  console.log(`Starting geonames import from ${GEONAMES_FILE_PATH}...`);

  if (!fs.existsSync(GEONAMES_FILE_PATH)) {
    console.error(`File not found: ${GEONAMES_FILE_PATH}`);
    process.exit(1);
  }

  const sql = postgres(connectionString, { max: 10 });
  const fileStream = fs.createReadStream(GEONAMES_FILE_PATH);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  const countriesFound = new Map<string, { en: string; cn: string }>();
  let batch: any[] = [];
  let totalProcessed = 0;
  let totalInserted = 0;
  const BATCH_SIZE = 2000;

  for await (const line of rl) {
    if (!line.trim()) continue;
    const parts = line.split('\t');
    if (parts.length < 15) continue;

    const geonameid = parseInt(parts[0], 10);
    const name = parts[1];
    const ascii_name = parts[2];
    const alternate_names = parts[3];
    const latitude = parts[4];
    const longitude = parts[5];
    const country_code = parts[8];
    const admin1_code = parts[10];

    if (!country_code || isNaN(geonameid)) continue;

    // 收集国家
    if (!countriesFound.has(country_code)) {
      const known = COUNTRY_NAME_MAP[country_code];
      countriesFound.set(country_code, {
        en: known ? known.en : country_code,
        cn: known ? known.cn : country_code,
      });
    }

    const chinese_name = extractChineseName(alternate_names, name);

    batch.push({
      id: geonameid,
      name: name.substring(0, 200),
      ascii_name: ascii_name ? ascii_name.substring(0, 200) : null,
      alternate_names: alternate_names ? alternate_names.substring(0, 2000) : null,
      chinese_name: chinese_name ? chinese_name.substring(0, 200) : null,
      country_code: country_code.substring(0, 10),
      admin1_code: admin1_code ? admin1_code.substring(0, 50) : null,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
    });

    totalProcessed++;

    if (batch.length >= BATCH_SIZE) {
      await insertBatch(sql, batch);
      totalInserted += batch.length;
      console.log(`Processed ${totalProcessed} cities... (Inserted ${totalInserted})`);
      batch = [];
    }
  }

  if (batch.length > 0) {
    await insertBatch(sql, batch);
    totalInserted += batch.length;
    batch = [];
  }

  // 插入/更新 国家表
  console.log(`Inserting ${countriesFound.size} countries into geo_countries...`);
  for (const [code, val] of countriesFound.entries()) {
    await sql`
      INSERT INTO geo_countries (code, name, chinese_name)
      VALUES (${code}, ${val.en}, ${val.cn})
      ON CONFLICT (code) DO UPDATE
      SET name = EXCLUDED.name, chinese_name = EXCLUDED.chinese_name;
    `;
  }

  console.log(`✅ Geonames import complete! Total cities: ${totalInserted}`);
  await sql.end();
  process.exit(0);
}

async function insertBatch(sql: any, batch: any[]) {
  // 使用 postgres.js 的 helper 批量插入
  await sql`
    INSERT INTO geo_cities ${sql(
      batch,
      'id',
      'name',
      'ascii_name',
      'alternate_names',
      'chinese_name',
      'country_code',
      'admin1_code',
      'latitude',
      'longitude'
    )}
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      chinese_name = COALESCE(EXCLUDED.chinese_name, geo_cities.chinese_name),
      alternate_names = EXCLUDED.alternate_names;
  `;
}

importGeonames().catch((err) => {
  console.error('❌ Geonames import failed:', err);
  process.exit(1);
});
