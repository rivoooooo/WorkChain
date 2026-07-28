import { describe, expect, test } from 'bun:test';
import type { CompanyProfileData } from '@/drizzle/schema';
import {
  canonicalJson,
  companyIdentityKey,
  hashCanonical,
  normalizeCompanyProfile,
} from './company-profile';

describe('company profile normalization', () => {
  test('normalizes names and registration codes deterministically', () => {
    expect(
      normalizeCompanyProfile({
        name: '  沃思　科技  ',
        creditCode: ' ab 123456 ',
      })
    ).toMatchObject({
      name: '沃思 科技',
      creditCode: 'AB123456',
    });
  });

  test('rejects unknown fields', () => {
    expect(() =>
      normalizeCompanyProfile({ name: 'Example', untrusted: 'value' })
    ).toThrow('Unsupported company profile fields');
  });

  test('canonical hashes ignore object key order', () => {
    expect(hashCanonical({ b: 2, a: 1 })).toBe(hashCanonical({ a: 1, b: 2 }));
    expect(canonicalJson({ b: 2, a: 1 })).toBe('{"a":1,"b":2}');
  });

  test('identifies companies by normalized name and region', () => {
    const guangzhou = normalizeCompanyProfile({
      name: '沃思科技',
      countryCode: 'CN',
      province: '广东',
      city: '广州',
    }) as CompanyProfileData;
    const shenzhen = { ...guangzhou, city: '深圳' };

    expect(companyIdentityKey(guangzhou)).not.toBe(companyIdentityKey(shenzhen));
    expect(companyIdentityKey(guangzhou)).toBe(
      companyIdentityKey({ ...guangzhou, name: '沃思科技' })
    );
  });
});
