import { StandardCompanyDTO, ICompanyConverter, ConverterResult } from './types';

export class KinginsunEnterpriseConverter implements ICompanyConverter {
  readonly name = 'Kinginsun Enterprise Registration Converter';
  readonly description = 'Adapter for Kinginsun Chinese Mainland Enterprise Registration CSV data';

  /**
   * 鲁棒的 CSV 解析逻辑 (支持双引号包含、多行文本与换行)
   */
  private parseCSV(csvText: string): Record<string, string>[] {
    const lines: string[] = [];
    let currentLine = '';
    let inQuotes = false;

    for (let i = 0; i < csvText.length; i++) {
      const char = csvText[i];
      if (char === '"') {
        inQuotes = !inQuotes;
        currentLine += char;
      } else if ((char === '\n' || char === '\r') && !inQuotes) {
        if (char === '\r' && csvText[i + 1] === '\n') {
          i++; // skip \n
        }
        if (currentLine.trim()) {
          lines.push(currentLine);
        }
        currentLine = '';
      } else {
        currentLine += char;
      }
    }
    if (currentLine.trim()) {
      lines.push(currentLine);
    }

    if (lines.length === 0) return [];

    const headers = this.parseCSVLine(lines[0]);
    const records: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      if (values.length === 0) continue;
      const rowObj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        rowObj[h.trim()] = values[idx] ? values[idx].trim() : '';
      });
      records.push(rowObj);
    }

    return records;
  }

  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  }

  public parseRow(row: Record<string, any>): StandardCompanyDTO | null {
    // 灵活别名查找函数
    const findValue = (...keys: string[]): string | null => {
      for (const key of keys) {
        for (const rowKey of Object.keys(row)) {
          if (rowKey.toLowerCase() === key.toLowerCase() || rowKey.includes(key)) {
            const val = row[rowKey];
            if (val !== undefined && val !== null && String(val).trim() !== '') {
              return String(val).trim();
            }
          }
        }
      }
      return null;
    };

    // 1. 提取统一社会信用代码
    const creditCode = findValue('统一社会信用代码', '信用代码', '注册号', 'credit_code', 'uscc');
    // 2. 提取公司名称
    const name = findValue('企业名称', '公司名称', '机构名称', 'name');

    if (!name) {
      return null; // 没有公司名称，判定无效
    }

    if (!creditCode || creditCode.length < 8) {
      return null; // 没有有效统一社会信用代码，判定无效
    }

    // 3. 提取省份与城市
    const province = findValue('省份', '所在省份', 'province');
    const city = findValue('城市', '市', '所属城市', 'city', '地区');

    // 4. 提取扩展属性
    const legalRepresentative = findValue('法定代表人', '法人', '法人代表', 'legal_representative');
    const registeredCapital = findValue('注册资本', '注册资金', 'registered_capital');
    const establishmentDate = findValue('成立日期', '注册日期', 'establishment_date');
    const registeredAddress = findValue('住所', '注册地址', '企业地址', '详细地址', 'address');
    const businessScope = findValue('经营范围', '业务范围', 'business_scope');
    const companyType = findValue('公司类型', '企业类型', '机构类型', 'company_type');

    return {
      creditCode: creditCode.toUpperCase(),
      name,
      countryCode: 'CN',
      countryName: '中国',
      province: province || null,
      city: city || null,
      legalRepresentative: legalRepresentative || null,
      registeredCapital: registeredCapital || null,
      establishmentDate: establishmentDate || null,
      registeredAddress: registeredAddress || null,
      businessScope: businessScope || null,
      companyType: companyType || null,
    };
  }

  public async parse(rawInput: string | Buffer | Record<string, any>[]): Promise<ConverterResult> {
    let rows: Record<string, any>[] = [];

    if (typeof rawInput === 'string') {
      rows = this.parseCSV(rawInput);
    } else if (Buffer.isBuffer(rawInput)) {
      rows = this.parseCSV(rawInput.toString('utf-8'));
    } else if (Array.isArray(rawInput)) {
      rows = rawInput;
    }

    const success: StandardCompanyDTO[] = [];
    const skipped: { row: number; raw: Record<string, any>; reason: string }[] = [];

    rows.forEach((row, idx) => {
      const dto = this.parseRow(row);
      if (dto) {
        success.push(dto);
      } else {
        skipped.push({
          row: idx + 1,
          raw: row,
          reason: 'Missing or invalid credit_code / name',
        });
      }
    });

    return {
      success,
      skipped,
      totalParsed: rows.length,
    };
  }
}
