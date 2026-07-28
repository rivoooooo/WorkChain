import crypto from 'crypto';
import { sqlClient } from '@/drizzle/db';
import { createCompany } from './company-governance';
import { canonicalJson } from './company-profile';

export interface Review {
  id: string;
  company_id: string;
  company_name: string;
  branch_location: string;
  position: string;
  employment_status: string;
  salary: number;
  bonus: number;
  experience_years: number;
  rating_career: number;
  rating_balance: number;
  rating_management: number;
  rating_compensation: number;
  rating_culture: number;
  review_text: string;
  created_at: string;
  previous_hash: string | null;
  hash: string;
  hash_version?: number | null;
}

export interface Company {
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

function toNumber(value: unknown): number {
  const result = Number(value || 0);
  return Number.isFinite(result) ? result : 0;
}

function mapReview(row: Record<string, unknown>): Review {
  return {
    id: String(row.id),
    company_id: String(row.company_id),
    company_name: String(row.company_name),
    branch_location: String(row.branch_location),
    position: String(row.position),
    employment_status: String(row.employment_status || 'current'),
    salary: toNumber(row.salary),
    bonus: toNumber(row.bonus),
    experience_years: toNumber(row.experience_years),
    rating_career: toNumber(row.rating_career),
    rating_balance: toNumber(row.rating_balance),
    rating_management: toNumber(row.rating_management),
    rating_compensation: toNumber(row.rating_compensation),
    rating_culture: toNumber(row.rating_culture),
    review_text: String(row.review_text),
    created_at: String(row.created_at),
    previous_hash: row.previous_hash ? String(row.previous_hash) : null,
    hash: String(row.hash),
    hash_version: row.hash_version === null ? null : toNumber(row.hash_version),
  };
}

function mapCompany(row: Record<string, unknown>): Company {
  return {
    id: String(row.id),
    name: String(row.name),
    credit_code: row.credit_code ? String(row.credit_code) : null,
    country_code: row.country_code ? String(row.country_code) : null,
    country_name: row.country_name ? String(row.country_name) : null,
    province: row.province ? String(row.province) : null,
    city: row.city ? String(row.city) : null,
    created_at: String(row.created_at),
    review_count: toNumber(row.review_count),
    avg_rating: toNumber(row.avg_rating),
    avg_career: toNumber(row.avg_career),
    avg_balance: toNumber(row.avg_balance),
    avg_management: toNumber(row.avg_management),
    avg_compensation: toNumber(row.avg_compensation),
    avg_culture: toNumber(row.avg_culture),
    avg_salary: toNumber(row.avg_salary),
    avg_bonus: toNumber(row.avg_bonus),
  };
}

export function getCompanyIdFromName(name: string): string {
  return `comp-${crypto
    .createHash('sha256')
    .update(name.normalize('NFKC').trim().toLocaleLowerCase())
    .digest('hex')
    .slice(0, 24)}`;
}

function reviewHashPayload(review: Omit<Review, 'hash'>) {
  return {
    companyId: review.company_id,
    companyName: review.company_name,
    branchLocation: review.branch_location,
    position: review.position,
    employmentStatus: review.employment_status,
    salary: review.salary,
    bonus: review.bonus,
    experienceYears: review.experience_years,
    ratingCareer: review.rating_career,
    ratingBalance: review.rating_balance,
    ratingManagement: review.rating_management,
    ratingCompensation: review.rating_compensation,
    ratingCulture: review.rating_culture,
    reviewText: review.review_text,
    createdAt: review.created_at,
    previousHash: review.previous_hash,
    hashVersion: review.hash_version || 2,
  };
}

export function calculateReviewHash(review: Omit<Review, 'hash'>): string {
  if (!review.hash_version || review.hash_version === 1) {
    const legacyData = [
      review.company_id,
      review.company_name,
      review.branch_location,
      review.position,
      review.employment_status,
      review.salary.toString(),
      review.bonus.toString(),
      review.experience_years.toString(),
      review.rating_career.toString(),
      review.rating_balance.toString(),
      review.rating_management.toString(),
      review.rating_compensation.toString(),
      review.rating_culture.toString(),
      review.review_text,
      review.created_at,
      review.previous_hash || '0',
    ].join('|');
    return crypto.createHash('sha256').update(legacyData).digest('hex');
  }

  return crypto
    .createHash('sha256')
    .update(canonicalJson(reviewHashPayload(review)))
    .digest('hex');
}

export async function getReviews(): Promise<Review[]> {
  const rows = await sqlClient`
    select *
    from reviews
    order by company_id, created_at, id
  `;
  return rows.map(mapReview);
}

export async function getCompanyReviewsById(companyId: string): Promise<Review[]> {
  const rows = await sqlClient`
    select *
    from reviews
    where company_id = ${companyId}
    order by created_at, id
  `;
  return rows.map(mapReview);
}

export async function getCompanyReviews(companyName: string): Promise<Review[]> {
  const companyRows = await sqlClient<{ id: string }[]>`
    select c.id
    from companies c
    left join current_company_profiles p on p.company_id = c.id
    where lower(coalesce(p.profile_data ->> 'name', c.name)) = lower(${companyName.trim()})
    order by c.created_at
    limit 1
  `;
  return companyRows[0] ? getCompanyReviewsById(companyRows[0].id) : [];
}

const COMPANY_SELECT = `
  select
    c.id,
    coalesce(p.profile_data ->> 'name', c.name) as name,
    coalesce(p.profile_data ->> 'creditCode', c.credit_code) as credit_code,
    coalesce(p.profile_data ->> 'countryCode', c.country_code) as country_code,
    coalesce(p.profile_data ->> 'countryName', c.country_name) as country_name,
    coalesce(p.profile_data ->> 'province', c.province) as province,
    coalesce(p.profile_data ->> 'city', c.city) as city,
    c.created_at,
    coalesce(s.review_count, 0) as review_count,
    coalesce(s.avg_rating, 0) as avg_rating,
    coalesce(s.avg_career, 0) as avg_career,
    coalesce(s.avg_balance, 0) as avg_balance,
    coalesce(s.avg_management, 0) as avg_management,
    coalesce(s.avg_compensation, 0) as avg_compensation,
    coalesce(s.avg_culture, 0) as avg_culture,
    coalesce(s.avg_salary, 0) as avg_salary,
    coalesce(s.avg_bonus, 0) as avg_bonus
  from companies c
  left join current_company_profiles p on p.company_id = c.id
  left join company_statistics s on s.company_id = c.id
`;

export async function getCompanies(search?: string, limit = 50): Promise<Company[]> {
  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 200);
  const term = search?.trim() || '';
  const rows = term
    ? await sqlClient.unsafe(
        `${COMPANY_SELECT}
         where c.id <> 'comp-unknown'
           and (
             coalesce(p.profile_data ->> 'name', c.name) ilike $1
             or coalesce(p.profile_data ->> 'creditCode', c.credit_code, '') ilike $1
           )
         order by coalesce(s.review_count, 0) desc, name
         limit $2`,
        [`%${term}%`, safeLimit]
      )
    : await sqlClient.unsafe(
        `${COMPANY_SELECT}
         where c.id <> 'comp-unknown'
         order by coalesce(s.review_count, 0) desc, name
         limit $1`,
        [safeLimit]
      );
  return rows.map(mapCompany);
}

export async function getCompanyById(companyId: string): Promise<Company | null> {
  const rows = await sqlClient.unsafe(
    `${COMPANY_SELECT}
     where c.id = $1
     limit 1`,
    [companyId]
  );
  return rows[0] ? mapCompany(rows[0]) : null;
}

function isUniqueViolation(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code?: string }).code === '23505'
  );
}

async function resolveCompanyId(
  companyName: string,
  profile: { countryCode?: string; city?: string } = {}
): Promise<string> {
  const rows = await sqlClient<{ id: string }[]>`
    select c.id
    from companies c
    left join current_company_profiles p on p.company_id = c.id
    where lower(coalesce(p.profile_data ->> 'name', c.name)) = lower(${companyName})
    order by c.created_at
    limit 1
  `;
  if (rows[0]) return rows[0].id;
  return (
    await createCompany({
      name: companyName,
      countryCode: profile.countryCode,
      city: profile.city,
    })
  ).companyId;
}

export async function addReview(
  reviewData: Omit<
    Review,
    'id' | 'company_id' | 'created_at' | 'previous_hash' | 'hash' | 'hash_version'
  >,
  companyProfile: { countryCode?: string; city?: string } = {}
): Promise<Review> {
  const companyName = reviewData.company_name.normalize('NFKC').trim();
  const companyId = await resolveCompanyId(companyName, companyProfile);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await sqlClient.begin(async (tx) => {
        await tx`select id from companies where id = ${companyId} for update`;
        const previousRows = await tx<{ hash: string }[]>`
          select hash
          from reviews
          where company_id = ${companyId}
          order by created_at desc, id desc
          limit 1
        `;

        const reviewWithoutHash: Omit<Review, 'hash'> = {
          ...reviewData,
          company_name: companyName,
          company_id: companyId,
          id: `review-${crypto.randomUUID().replace(/-/g, '')}`,
          created_at: new Date().toISOString(),
          previous_hash: previousRows[0]?.hash || null,
          hash_version: 2,
        };
        const review: Review = {
          ...reviewWithoutHash,
          hash: calculateReviewHash(reviewWithoutHash),
        };

        await tx`
          insert into reviews (
            id,
            company_id,
            company_name,
            branch_location,
            position,
            employment_status,
            salary,
            bonus,
            experience_years,
            rating_career,
            rating_balance,
            rating_management,
            rating_compensation,
            rating_culture,
            review_text,
            created_at,
            previous_hash,
            hash,
            hash_version
          )
          values (
            ${review.id},
            ${review.company_id},
            ${review.company_name},
            ${review.branch_location},
            ${review.position},
            ${review.employment_status},
            ${review.salary},
            ${review.bonus},
            ${review.experience_years},
            ${review.rating_career},
            ${review.rating_balance},
            ${review.rating_management},
            ${review.rating_compensation},
            ${review.rating_culture},
            ${review.review_text},
            ${review.created_at},
            ${review.previous_hash},
            ${review.hash},
            ${review.hash_version || 2}
          )
        `;
        return review;
      });
    } catch (error) {
      if (!isUniqueViolation(error) || attempt === 2) throw error;
    }
  }

  throw new Error('Unable to append the review after retrying.');
}

export function verifyLedgerIntegrity(reviews: Review[]): {
  isValid: boolean;
  tamperedIndex: number | null;
  details: {
    index: number;
    reviewId: string;
    status: 'ok' | 'hash_mismatch' | 'chain_broken';
    computedHash: string;
    storedHash: string;
  }[];
} {
  const ordered = [...reviews].sort((left, right) =>
    `${left.company_id}:${left.created_at}:${left.id}`.localeCompare(
      `${right.company_id}:${right.created_at}:${right.id}`
    )
  );
  const previousByCompany = new Map<string, string>();
  const details: {
    index: number;
    reviewId: string;
    status: 'ok' | 'hash_mismatch' | 'chain_broken';
    computedHash: string;
    storedHash: string;
  }[] = [];

  for (let index = 0; index < ordered.length; index += 1) {
    const review = ordered[index];
    const computedHash = calculateReviewHash(review);
    if (computedHash !== review.hash) {
      details.push({
        index,
        reviewId: review.id,
        status: 'hash_mismatch',
        computedHash,
        storedHash: review.hash,
      });
      return { isValid: false, tamperedIndex: index, details };
    }

    const expectedPrevious = previousByCompany.get(review.company_id) || null;
    const normalizedPrevious = review.previous_hash === '0' ? null : review.previous_hash;
    if (normalizedPrevious !== expectedPrevious) {
      details.push({
        index,
        reviewId: review.id,
        status: 'chain_broken',
        computedHash,
        storedHash: review.hash,
      });
      return { isValid: false, tamperedIndex: index, details };
    }

    previousByCompany.set(review.company_id, review.hash);
    details.push({
      index,
      reviewId: review.id,
      status: 'ok',
      computedHash,
      storedHash: review.hash,
    });
  }

  return { isValid: true, tamperedIndex: null, details };
}
