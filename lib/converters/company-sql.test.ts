import { describe, expect, test } from 'bun:test';
import { companyInsertSql, companySqlRecord } from './company-sql';

const company = {
  creditCode: '91440101TEST000001',
  name: '测试企业',
  countryCode: 'CN',
  countryName: '中国',
  city: '广州',
};

describe('company SQL records', () => {
  test('creates deterministic company and profile identifiers', () => {
    expect(companySqlRecord(company)).toEqual(companySqlRecord({ ...company }));
    expect(companySqlRecord(company).companyId).toMatch(/^comp-[0-9a-f]{24}$/);
    expect(companySqlRecord(company).profileVersionId).toMatch(/^profile-[0-9a-f]{32}$/);
  });

  test('emits append-only company and profile inserts', () => {
    const sql = companyInsertSql([companySqlRecord(company)]);
    expect(sql).toContain('INSERT INTO companies');
    expect(sql).toContain('INSERT INTO company_profile_versions');
    expect(sql).toContain('ON CONFLICT DO NOTHING');
    expect(sql).not.toContain('UPDATE');
    expect(sql).not.toContain('DELETE');
  });
});
