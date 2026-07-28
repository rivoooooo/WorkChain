import { describe, expect, test } from 'bun:test';
import { KinginsunEnterpriseConverter } from './kinginsun-converter';

describe('Kinginsun enterprise adapter', () => {
  test('maps quoted CSV fields to the standard DTO', async () => {
    const converter = new KinginsunEnterpriseConverter();
    const result = await converter.parse(
      '企业名称,统一社会信用代码,城市,经营范围\n' +
        '"示例企业","91440101TEST000001","广州","研发,咨询"\n'
    );
    expect(result.success).toEqual([
      expect.objectContaining({
        name: '示例企业',
        creditCode: '91440101TEST000001',
        city: '广州',
        businessScope: '研发,咨询',
      }),
    ]);
    expect(result.skipped).toHaveLength(0);
  });
});
