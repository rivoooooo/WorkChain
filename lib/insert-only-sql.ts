function stripNonCode(sql: string): string {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/--[^\n\r]*/g, ' ')
    .replace(/'(?:''|[^'])*'/g, "''")
    .replace(/"(?:\"\"|[^"])*"/g, '""')
    .replace(/\$([A-Za-z_][A-Za-z0-9_]*)?\$[\s\S]*?\$\1\$/g, ' ');
}

export function validateInsertOnlySql(source: string): number {
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
  return statements.length;
}
