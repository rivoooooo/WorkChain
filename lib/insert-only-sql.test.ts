import { describe, expect, test } from 'bun:test';
import { validateInsertOnlySql } from './insert-only-sql';

describe('INSERT-only SQL validation', () => {
  test('accepts transactions and conflict skipping', () => {
    expect(
      validateInsertOnlySql(`
        -- work-chain data export
        BEGIN;
        INSERT INTO companies (id, name)
        VALUES ('one', 'contains DELETE and UPDATE as text')
        ON CONFLICT DO NOTHING;
        COMMIT;
      `)
    ).toBe(3);
  });

  test.each(["UPDATE companies SET name = 'x';", 'DELETE FROM companies;', 'CREATE TABLE x(id int);'])(
    'rejects mutating or structural SQL: %s',
    (source: string) => expect(() => validateInsertOnlySql(source)).toThrow()
  );
});
