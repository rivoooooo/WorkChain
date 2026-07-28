function stripNonCode(sql: string): string {
  let output = '';
  let index = 0;

  while (index < sql.length) {
    const character = sql[index];
    const next = sql[index + 1];

    if (character === "'") {
      output += "''";
      index += 1;
      while (index < sql.length) {
        if (sql[index] === "'" && sql[index + 1] === "'") {
          index += 2;
        } else if (sql[index] === "'") {
          index += 1;
          break;
        } else {
          index += 1;
        }
      }
      continue;
    }

    if (character === '"') {
      output += '""';
      index += 1;
      while (index < sql.length) {
        if (sql[index] === '"' && sql[index + 1] === '"') {
          index += 2;
        } else if (sql[index] === '"') {
          index += 1;
          break;
        } else {
          index += 1;
        }
      }
      continue;
    }

    if (character === '-' && next === '-') {
      index += 2;
      while (index < sql.length && sql[index] !== '\n') index += 1;
      output += '\n';
      continue;
    }

    if (character === '/' && next === '*') {
      index += 2;
      let depth = 1;
      while (index < sql.length && depth > 0) {
        if (sql[index] === '/' && sql[index + 1] === '*') {
          depth += 1;
          index += 2;
        } else if (sql[index] === '*' && sql[index + 1] === '/') {
          depth -= 1;
          index += 2;
        } else {
          index += 1;
        }
      }
      output += ' ';
      continue;
    }

    if (character === '$') {
      const tag = sql.slice(index).match(/^\$[A-Za-z_][A-Za-z0-9_]*\$|^\$\$/)?.[0];
      if (tag) {
        const closingIndex = sql.indexOf(tag, index + tag.length);
        index = closingIndex === -1 ? sql.length : closingIndex + tag.length;
        output += ' ';
        continue;
      }
    }

    output += character;
    index += 1;
  }

  return output;
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
