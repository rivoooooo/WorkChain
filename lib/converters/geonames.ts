export interface GeoCityRow {
  id: number;
  name: string;
  asciiName: string | null;
  alternateNames: string | null;
  chineseName: string | null;
  countryCode: string;
  admin1Code: string | null;
  latitude: string | null;
  longitude: string | null;
}

const COUNTRY_NAMES: Record<string, { en: string; zh: string }> = {
  AU: { en: 'Australia', zh: '澳大利亚' },
  BR: { en: 'Brazil', zh: '巴西' },
  CA: { en: 'Canada', zh: '加拿大' },
  CN: { en: 'China', zh: '中国' },
  DE: { en: 'Germany', zh: '德国' },
  FR: { en: 'France', zh: '法国' },
  GB: { en: 'United Kingdom', zh: '英国' },
  HK: { en: 'Hong Kong', zh: '中国香港' },
  IN: { en: 'India', zh: '印度' },
  JP: { en: 'Japan', zh: '日本' },
  KR: { en: 'South Korea', zh: '韩国' },
  MO: { en: 'Macau', zh: '中国澳门' },
  RU: { en: 'Russia', zh: '俄罗斯' },
  SG: { en: 'Singapore', zh: '新加坡' },
  TW: { en: 'Taiwan', zh: '中国台湾' },
  US: { en: 'United States', zh: '美国' },
};

function truncate(value: string, length: number): string {
  return value.length > length ? value.slice(0, length) : value;
}

function nullableText(value: string, length: number): string | null {
  const normalized = value.normalize('NFKC').trim();
  return normalized ? truncate(normalized, length) : null;
}

function coordinate(value: string, min: number, max: number): string | null {
  if (!value.trim()) return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) return null;
  return number.toFixed(5);
}

function extractChineseName(alternateNames: string): string | null {
  for (const candidate of alternateNames.split(',')) {
    const normalized = candidate.normalize('NFKC').trim();
    if (/^[\p{Script=Han}\s·]+$/u.test(normalized)) {
      return truncate(normalized, 200);
    }
  }
  return null;
}

export function parseGeoNamesCityLine(line: string): GeoCityRow | null {
  const columns = line.split('\t');
  if (columns.length < 19) return null;

  const id = Number(columns[0]);
  const name = nullableText(columns[1], 200);
  const countryCode = columns[8].normalize('NFKC').trim().toUpperCase();
  if (!Number.isInteger(id) || id <= 0 || !name || !/^[A-Z]{2}$/.test(countryCode)) {
    return null;
  }

  return {
    id,
    name,
    asciiName: nullableText(columns[2], 200),
    alternateNames: nullableText(columns[3], 2_000),
    chineseName: extractChineseName(columns[3]),
    countryCode,
    admin1Code: nullableText(columns[10], 50),
    latitude: coordinate(columns[4], -90, 90),
    longitude: coordinate(columns[5], -180, 180),
  };
}

export function countryNamesForCode(code: string): { en: string; zh: string } {
  return COUNTRY_NAMES[code] || { en: code, zh: code };
}

export function sqlLiteral(value: string | null): string {
  if (value === null) return 'NULL';
  return `'${value.replaceAll("'", "''").replaceAll('\u0000', '')}'`;
}
