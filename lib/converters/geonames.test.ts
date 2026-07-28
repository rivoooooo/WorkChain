import { describe, expect, test } from 'bun:test';
import {
  parseGeoNamesCityLine,
  sqlLiteral,
} from './geonames';

describe('GeoNames SQL adapter', () => {
  test('parses the documented tab-separated city format', () => {
    const row = parseGeoNamesCityLine(
      '1816670\tBeijing\tBeijing\tBeijing,北京市\t39.90750\t116.39723\tP\tPPLC\tCN\t\t22\t\t\t\t11716620\t43\t44\tAsia/Shanghai\t2025-01-01'
    );
    expect(row).toMatchObject({
      id: 1816670,
      name: 'Beijing',
      chineseName: '北京市',
      countryCode: 'CN',
      admin1Code: '22',
      latitude: '39.90750',
      longitude: '116.39723',
    });
  });

  test('rejects malformed identity fields', () => {
    expect(parseGeoNamesCityLine('invalid')).toBeNull();
  });

  test('escapes SQL strings and removes null bytes', () => {
    expect(sqlLiteral("O'Reilly\u0000")).toBe("'O''Reilly'");
    expect(sqlLiteral(null)).toBe('NULL');
  });
});
