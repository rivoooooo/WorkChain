import { readFile } from 'node:fs/promises';
import { validateInsertOnlySql } from '../lib/insert-only-sql';

const filePath = process.argv[2];
if (!filePath) {
  throw new Error('Usage: bun run data:check-sql <data.sql>');
}

const source = await readFile(filePath, 'utf8');

const statementCount = validateInsertOnlySql(source);
console.log(`Validated ${statementCount} INSERT-only SQL statements in ${filePath}.`);
