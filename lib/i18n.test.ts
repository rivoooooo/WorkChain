import { describe, expect, test } from 'bun:test';
import {
  i18n,
  isRtlLanguage,
  localeOptions,
  resolveLanguage,
} from './i18n';

describe('locale routing', () => {
  test('resolves every configured locale and simplified Chinese aliases', () => {
    for (const locale of localeOptions) {
      expect(i18n[resolveLanguage(locale.path)]).toBeDefined();
    }
    expect(resolveLanguage('zh-cn')).toBe('zh');
    expect(resolveLanguage('unknown')).toBe('en');
  });

  test('uses RTL only for Arabic', () => {
    expect(isRtlLanguage('ar')).toBe(true);
    expect(isRtlLanguage('bo')).toBe(false);
  });
});
