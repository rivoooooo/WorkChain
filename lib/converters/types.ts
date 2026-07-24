export interface StandardCompanyDTO {
  // 核心唯一标识
  creditCode: string;             // 统一社会信用代码 (18位)
  name: string;                   // 企业名称 (必填)

  // 基础地理位置
  countryCode?: string;           // 国家代码 (默认 'CN')
  countryName?: string;           // 国家名称 (默认 '中国')
  province?: string | null;       // 所在省份
  city?: string | null;           // 所在城市/地区

  // 扩展详细字段
  legalRepresentative?: string | null; // 法人代表
  registeredCapital?: string | null;   // 注册资金
  businessScope?: string | null;       // 经营范围
  registeredAddress?: string | null;   // 注册地址
  establishmentDate?: string | null;   // 注册日期 (YYYY-MM-DD 或 原始格式)
  companyType?: string | null;         // 企业类型
}

export interface ConverterResult {
  success: StandardCompanyDTO[];
  skipped: { row: number; raw: Record<string, any>; reason: string }[];
  totalParsed: number;
}

export interface ICompanyConverter {
  readonly name: string;
  readonly description: string;
  parse(rawInput: string | Buffer | Record<string, any>[]): Promise<ConverterResult>;
  parseRow(row: Record<string, any>): StandardCompanyDTO | null;
}
