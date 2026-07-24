import postgres from 'postgres';
import { StandardCompanyDTO } from './types';
import { crypto } from 'crypto';

const connectionString = process.env.DATABASE_URL || '';

export interface ImportOptions {
  batchSize?: number;
  onProgress?: (processed: number, total: number) => void;
}

export interface ImportSummary {
  total: number;
  insertedOrUpdated: number;
  failedCount: number;
  errors: Array<{ creditCode: string; error: string }>;
}

function generateCompanyId(): string {
  if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.randomUUID) {
    return 'comp-' + globalThis.crypto.randomUUID().replace(/-/g, '').substring(0, 12);
  }
  return 'comp-' + Math.random().toString(36).substring(2, 14);
}

/**
 * 通用企业数据批量导入器 (以 统一社会信用代码 credit_code 作为唯一标识进行 Upsert)
 */
export async function importCompanyData(
  dtos: StandardCompanyDTO[],
  options: ImportOptions = {}
): Promise<ImportSummary> {
  const batchSize = options.batchSize || 500;
  const sql = postgres(connectionString, { max: 10 });

  let insertedOrUpdated = 0;
  const errors: Array<{ creditCode: string; error: string }> = [];

  for (let i = 0; i < dtos.length; i += batchSize) {
    const chunk = dtos.slice(i, i + batchSize);

    // 过滤重复的 credit_code (Chunk 内部去重，保留最后一项)
    const uniqueChunkMap = new Map<string, StandardCompanyDTO>();
    for (const item of chunk) {
      if (item.creditCode) {
        uniqueChunkMap.set(item.creditCode, item);
      }
    }
    const uniqueChunk = Array.from(uniqueChunkMap.values());

    try {
      await sql.begin(async (tx) => {
        // 1. 查询当前 chunk 中在 companies 表已存在的 (credit_code -> id)
        const creditCodes = uniqueChunk.map((c) => c.creditCode);
        const existingRows = await tx`
          SELECT id, credit_code FROM companies WHERE credit_code = ANY(${creditCodes})
        `;
        const existingMap = new Map<string, string>();
        for (const row of existingRows) {
          existingMap.set(row.credit_code, row.id);
        }

        // 构造 companies 表待插入/更新记录
        const companyBatch = uniqueChunk.map((dto) => {
          const existingId = existingMap.get(dto.creditCode);
          const companyId = existingId || generateCompanyId();
          // 更新 existingMap 方便给 company_details 使用
          existingMap.set(dto.creditCode, companyId);

          return {
            id: companyId,
            credit_code: dto.creditCode,
            name: dto.name,
            country_code: dto.countryCode || 'CN',
            country_name: dto.countryName || '中国',
            province: dto.province || null,
            city: dto.city || null,
          };
        });

        // 批量 Upsert 到 companies 表
        await tx`
          INSERT INTO companies ${tx(
            companyBatch,
            'id',
            'credit_code',
            'name',
            'country_code',
            'country_name',
            'province',
            'city'
          )}
          ON CONFLICT (credit_code) DO UPDATE SET
            name = EXCLUDED.name,
            country_code = EXCLUDED.country_code,
            country_name = EXCLUDED.country_name,
            province = COALESCE(EXCLUDED.province, companies.province),
            city = COALESCE(EXCLUDED.city, companies.city);
        `;

        // 构造 company_details 表待插入/更新记录 (仅包含有扩展属性的数据)
        const detailBatch = uniqueChunk
          .map((dto) => {
            const companyId = existingMap.get(dto.creditCode);
            if (!companyId) return null;

            // 如果没有填任何扩展属性，跳过写入 details
            if (
              !dto.legalRepresentative &&
              !dto.registeredCapital &&
              !dto.businessScope &&
              !dto.registeredAddress &&
              !dto.establishmentDate &&
              !dto.companyType
            ) {
              return null;
            }

            return {
              id: 'det-' + companyId.replace('comp-', ''),
              company_id: companyId,
              legal_representative: dto.legalRepresentative || null,
              registered_capital: dto.registeredCapital || null,
              business_scope: dto.businessScope || null,
              registered_address: dto.registeredAddress || null,
              establishment_date: dto.establishmentDate || null,
              company_type: dto.companyType || null,
            };
          })
          .filter(Boolean) as any[];

        if (detailBatch.length > 0) {
          await tx`
            INSERT INTO company_details ${tx(
              detailBatch,
              'id',
              'company_id',
              'legal_representative',
              'registered_capital',
              'business_scope',
              'registered_address',
              'establishment_date',
              'company_type'
            )}
            ON CONFLICT (company_id) DO UPDATE SET
              legal_representative = COALESCE(EXCLUDED.legal_representative, company_details.legal_representative),
              registered_capital = COALESCE(EXCLUDED.registered_capital, company_details.registered_capital),
              business_scope = COALESCE(EXCLUDED.business_scope, company_details.business_scope),
              registered_address = COALESCE(EXCLUDED.registered_address, company_details.registered_address),
              establishment_date = COALESCE(EXCLUDED.establishment_date, company_details.establishment_date),
              company_type = COALESCE(EXCLUDED.company_type, company_details.company_type),
              updated_at = NOW();
          `;
        }
      });

      insertedOrUpdated += uniqueChunk.length;
    } catch (err: any) {
      console.error(`Error importing batch starting at index ${i}:`, err);
      for (const item of uniqueChunk) {
        errors.push({
          creditCode: item.creditCode,
          error: err.message || String(err),
        });
      }
    }

    if (options.onProgress) {
      options.onProgress(Math.min(i + batchSize, dtos.length), dtos.length);
    }
  }

  await sql.end();

  return {
    total: dtos.length,
    insertedOrUpdated,
    failedCount: errors.length,
    errors,
  };
}
