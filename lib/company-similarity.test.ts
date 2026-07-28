import { describe, expect, test } from 'bun:test';
import { companyNameSimilarity } from './company-similarity';

describe('company name similarity', () => {
  test('treats common company suffixes as equivalent', () => {
    expect(companyNameSimilarity('沃思科技有限公司', '沃思科技')).toBe(1);
  });

  test('ranks related names above unrelated names', () => {
    expect(companyNameSimilarity('腾讯科技', '腾讯计算机科技')).toBeGreaterThan(
      companyNameSimilarity('腾讯科技', '阿里巴巴')
    );
  });
});
