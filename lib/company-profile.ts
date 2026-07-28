import crypto from 'crypto';
import type {
  CompanyProfileChanges,
  CompanyProfileData,
} from '@/drizzle/schema';

export const COMPANY_PROFILE_FIELDS = [
  'name',
  'creditCode',
  'countryCode',
  'countryName',
  'province',
  'city',
  'legalRepresentative',
  'registeredCapital',
  'businessScope',
  'registeredAddress',
  'establishmentDate',
  'companyType',
  'website',
] as const satisfies readonly (keyof CompanyProfileData)[];

const PROFILE_FIELD_SET = new Set<string>(COMPANY_PROFILE_FIELDS);

function normalizeValue(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') {
    throw new Error('Company profile values must be strings or null.');
  }

  const normalized = value.normalize('NFKC').trim().replace(/\s+/g, ' ');
  return normalized === '' ? null : normalized;
}

export function normalizeCompanyProfile(
  input: Record<string, unknown>,
  options: { requireName?: boolean; partial?: boolean } = {}
): CompanyProfileData | CompanyProfileChanges {
  const unknownKeys = Object.keys(input).filter((key) => !PROFILE_FIELD_SET.has(key));
  if (unknownKeys.length > 0) {
    throw new Error(`Unsupported company profile fields: ${unknownKeys.join(', ')}`);
  }

  const normalizedResult: Record<string, string | null> = {};
  for (const field of COMPANY_PROFILE_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(input, field)) {
      const value = normalizeValue(input[field]);
      if (field === 'name' && value === null) {
        throw new Error('Company name cannot be empty.');
      }
      normalizedResult[field] = value;
    }
  }
  const result = normalizedResult as CompanyProfileChanges;

  if (typeof result.creditCode === 'string') {
    result.creditCode = result.creditCode.replace(/\s+/g, '').toUpperCase();
    if (!/^[0-9A-Z]{8,50}$/.test(result.creditCode)) {
      throw new Error('The company registration code has an invalid format.');
    }
  }

  if (options.requireName && !result.name) {
    throw new Error('Company name is required.');
  }

  if (!options.partial) {
    return {
      name: result.name || '',
      creditCode: result.creditCode ?? null,
      countryCode: result.countryCode ?? 'CN',
      countryName: result.countryName ?? '中国',
      province: result.province ?? null,
      city: result.city ?? null,
      legalRepresentative: result.legalRepresentative ?? null,
      registeredCapital: result.registeredCapital ?? null,
      businessScope: result.businessScope ?? null,
      registeredAddress: result.registeredAddress ?? null,
      establishmentDate: result.establishmentDate ?? null,
      companyType: result.companyType ?? null,
      website: result.website ?? null,
    };
  }

  if (Object.keys(result).length === 0) {
    throw new Error('At least one company profile field is required.');
  }

  return result;
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, sortValue(child)])
    );
  }
  return value;
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortValue(value));
}

export function hashCanonical(value: unknown): string {
  return crypto.createHash('sha256').update(canonicalJson(value)).digest('hex');
}

export function mergeProfile(
  current: CompanyProfileData,
  changes: CompanyProfileChanges
): CompanyProfileData {
  return { ...current, ...changes };
}

export function isMissingProfileValue(value: unknown): boolean {
  return value === null || value === undefined || value === '';
}
