import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  comparableCompanyName,
  companyNameSimilarity,
} from './company-similarity';

let client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL and a Supabase publishable/anon key are required.'
    );
  }
  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

function assertResult<T>(
  result: { data: T | null; error: { message: string } | null },
  operation: string
): T {
  if (result.error) throw new Error(`${operation}: ${result.error.message}`);
  return result.data as T;
}

export interface PublicCompany {
  id: string;
  name: string;
  credit_code?: string | null;
  country_code?: string | null;
  country_name?: string | null;
  province?: string | null;
  city?: string | null;
  created_at: string;
  review_count: number;
  avg_rating: number;
  avg_career: number;
  avg_balance: number;
  avg_management: number;
  avg_compensation: number;
  avg_culture: number;
  avg_salary: number;
  avg_bonus: number;
}

export interface PublicRelatedCompany extends PublicCompany {
  relation: 'same_name_region' | 'similar_name';
  similarity: number;
}

const numberValue = (value: unknown) => {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
};

async function enrichCompanies(
  baseRows: Record<string, unknown>[]
): Promise<PublicCompany[]> {
  if (baseRows.length === 0) return [];
  const ids = baseRows.map((row) => String(row.id));
  const supabase = getClient();
  const [profilesResult, statisticsResult] = await Promise.all([
    supabase
      .from('current_company_profiles')
      .select('company_id,profile_data')
      .in('company_id', ids),
    supabase
      .from('company_statistics')
      .select('*')
      .in('company_id', ids),
  ]);
  const profiles = assertResult<Record<string, unknown>[]>(
    profilesResult,
    'Unable to load company profiles'
  );
  const statistics = assertResult<Record<string, unknown>[]>(
    statisticsResult,
    'Unable to load company statistics'
  );
  const profileByCompany = new Map(
    profiles.map((row) => [String(row.company_id), row.profile_data as Record<string, unknown>])
  );
  const statisticsByCompany = new Map(
    statistics.map((row) => [String(row.company_id), row])
  );

  return baseRows.map((row) => {
    const id = String(row.id);
    const profile = profileByCompany.get(id) || {};
    const stats = statisticsByCompany.get(id) || {};
    return {
      id,
      name: String(profile.name || row.name),
      credit_code: String(profile.creditCode || row.credit_code || '') || null,
      country_code: String(profile.countryCode || row.country_code || '') || null,
      country_name: String(profile.countryName || row.country_name || '') || null,
      province: String(profile.province || row.province || '') || null,
      city: String(profile.city || row.city || '') || null,
      created_at: String(row.created_at),
      review_count: numberValue(stats.review_count),
      avg_rating: numberValue(stats.avg_rating),
      avg_career: numberValue(stats.avg_career),
      avg_balance: numberValue(stats.avg_balance),
      avg_management: numberValue(stats.avg_management),
      avg_compensation: numberValue(stats.avg_compensation),
      avg_culture: numberValue(stats.avg_culture),
      avg_salary: numberValue(stats.avg_salary),
      avg_bonus: numberValue(stats.avg_bonus),
    };
  });
}

export async function getPublicCompanies(
  search = '',
  limit = 50
): Promise<PublicCompany[]> {
  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 500);
  let query = getClient()
    .from('companies')
    .select(
      'id,name,credit_code,country_code,country_name,province,city,created_at'
    )
    .neq('id', 'comp-unknown')
    .limit(safeLimit);
  if (search.trim()) query = query.ilike('name', `%${search.trim()}%`);
  const rows = assertResult<Record<string, unknown>[]>(
    await query,
    'Unable to load companies'
  );
  return (await enrichCompanies(rows))
    .sort(
      (left, right) =>
        right.review_count - left.review_count ||
        left.name.localeCompare(right.name)
    )
    .slice(0, safeLimit);
}

export async function getPublicLatestCompanies(
  limit = 10
): Promise<PublicCompany[]> {
  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 50);
  const rows = assertResult<Record<string, unknown>[]>(
    await getClient()
      .from('companies')
      .select(
        'id,name,credit_code,country_code,country_name,province,city,created_at'
      )
      .neq('id', 'comp-unknown')
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(safeLimit),
    'Unable to load latest companies'
  );
  return enrichCompanies(rows);
}

export async function getPublicCompanyById(
  companyId: string
): Promise<PublicCompany | null> {
  const result = await getClient()
    .from('companies')
    .select(
      'id,name,credit_code,country_code,country_name,province,city,created_at'
    )
    .eq('id', companyId)
    .maybeSingle();
  const row = assertResult<Record<string, unknown> | null>(
    result,
    'Unable to load company'
  );
  return row ? (await enrichCompanies([row]))[0] : null;
}

export async function getPublicCompanyReviews(companyId: string) {
  return assertResult<Record<string, unknown>[]>(
    await getClient()
      .from('reviews')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: true })
      .order('id', { ascending: true }),
    'Unable to load reviews'
  );
}

export async function getPublicCompanyDetails(companyId: string) {
  const supabase = getClient();
  const [profileResult, detailsResult, linksResult] = await Promise.all([
    supabase
      .from('current_company_profiles')
      .select('profile_data')
      .eq('company_id', companyId)
      .maybeSingle(),
    supabase
      .from('company_details')
      .select('*')
      .eq('company_id', companyId)
      .maybeSingle(),
    supabase
      .from('company_links')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false }),
  ]);
  const profileRow = assertResult<{ profile_data?: Record<string, unknown> } | null>(
    profileResult,
    'Unable to load company profile'
  );
  const legacy = assertResult<Record<string, unknown> | null>(
    detailsResult,
    'Unable to load company details'
  );
  const profile = profileRow?.profile_data || {};
  return {
    details: {
      legal_representative:
        profile.legalRepresentative || legacy?.legal_representative || null,
      registered_capital:
        profile.registeredCapital || legacy?.registered_capital || null,
      business_scope: profile.businessScope || legacy?.business_scope || null,
      registered_address:
        profile.registeredAddress || legacy?.registered_address || null,
      establishment_date:
        profile.establishmentDate || legacy?.establishment_date || null,
      company_type: profile.companyType || legacy?.company_type || null,
      website: profile.website || null,
    },
    links: assertResult<Record<string, unknown>[]>(
      linksResult,
      'Unable to load company links'
    ),
  };
}

export async function getPublicRelatedCompanies(
  company: PublicCompany,
  limit = 12
): Promise<PublicRelatedCompany[]> {
  const candidates = await getPublicCompanies('', 500);
  return candidates
    .filter((candidate) => candidate.id !== company.id && candidate.review_count > 0)
    .map((candidate) => {
      const exact =
        comparableCompanyName(candidate.name) === comparableCompanyName(company.name);
      return {
        ...candidate,
        relation: exact ? ('same_name_region' as const) : ('similar_name' as const),
        similarity: companyNameSimilarity(company.name, candidate.name),
      };
    })
    .filter((candidate) => candidate.similarity >= 0.35)
    .sort(
      (left, right) =>
        Number(right.relation === 'same_name_region') -
          Number(left.relation === 'same_name_region') ||
        right.similarity - left.similarity ||
        right.review_count - left.review_count
    )
    .slice(0, limit);
}
