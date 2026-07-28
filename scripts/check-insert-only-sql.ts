import { readFile } from 'node:fs/promises';

const filePath = process.argv[2];
if (!filePath) {
  throw new Error('Usage: bun run data:check-sql <data.sql>');
}

const source = await readFile(filePath, 'utf8');

function stripNonCode(sql: string): string {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/--[^\n\r]*/g, ' ')
    .replace(/'(?:''|[^'])*'/g, "''")
    .replace(/"(?:\"\"|[^"])*"/g, '""')
    .replace(/\$([A-Za-z_][A-Za-z0-9_]*)?\$[\s\S]*?\$\1\$/g, ' ');
}

const code = stripNonCode(source).toUpperCase();
const forbidden = [
  /\bUPDATE\b/,
  /\bDELETE\b/,
  /\bTRUNCATE\b/,
  /\bMERGE\b/,
  /\bCREATE\b/,
  /\bALTER\b/,
  /\bDROP\b/,
  /\bGRANT\b/,
  /\bREVOKE\b/,
  /\bDO\b/,
  /\bCOPY\b/,
];

for (const pattern of forbidden) {
  if (pattern.test(code)) {
    throw new Error(`Rejected non-insert SQL token: ${pattern.source}`);
  }
}

const statements = code
  .split(';')
  .map((statement) => statement.trim())
  .filter(Boolean);

for (const statement of statements) {
  if (!/^(BEGIN|COMMIT|INSERT\b)/.test(statement)) {
    throw new Error(`Rejected SQL statement: ${statement.slice(0, 80)}`);
  }
}

console.log(`Validated ${statements.length} INSERT-only SQL statements in ${filePath}.`);
