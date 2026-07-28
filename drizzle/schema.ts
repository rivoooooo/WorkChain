import { sql } from 'drizzle-orm';
import {
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  numeric,
  pgPolicy,
  pgTable,
  pgView,
  text,
  timestamp,
  unique,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';
import { anonRole } from 'drizzle-orm/supabase';

const publicReadPolicy = (tableName: string) =>
  pgPolicy(`Allow anonymous read for ${tableName}`, {
    for: 'select',
    to: anonRole,
    using: sql`true`,
  });

// Immutable company identity. Legacy aggregate/profile columns remain for compatibility
// and are no longer authoritative for new code.
export const companies = pgTable(
  'companies',
  {
    id: varchar('id', { length: 255 }).primaryKey(),
    credit_code: varchar('credit_code', { length: 50 }).unique(),
    name: varchar('name', { length: 255 }).notNull(),
    country_code: varchar('country_code', { length: 10 }).default('CN'),
    country_name: varchar('country_name', { length: 100 }).default('中国'),
    province: varchar('province', { length: 100 }),
    city: varchar('city', { length: 100 }),
    created_at: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    creation_source: varchar('creation_source', { length: 50 }).default('legacy'),
    creation_hash: varchar('creation_hash', { length: 64 }),
    review_count: integer('review_count').default(0),
    avg_rating: numeric('avg_rating', { precision: 4, scale: 2 }).default('0.00'),
    avg_career: numeric('avg_career', { precision: 4, scale: 2 }).default('0.00'),
    avg_balance: numeric('avg_balance', { precision: 4, scale: 2 }).default('0.00'),
    avg_management: numeric('avg_management', { precision: 4, scale: 2 }).default('0.00'),
    avg_compensation: numeric('avg_compensation', { precision: 4, scale: 2 }).default('0.00'),
    avg_culture: numeric('avg_culture', { precision: 4, scale: 2 }).default('0.00'),
    avg_salary: integer('avg_salary').default(0),
    avg_bonus: integer('avg_bonus').default(0),
  },
  (table) => [
    index('idx_companies_credit_code').on(table.credit_code),
    index('idx_companies_name').on(table.name),
    index('idx_companies_location').on(table.country_code, table.province, table.city),
    uniqueIndex('idx_companies_creation_hash')
      .on(table.creation_hash)
      .where(sql`${table.creation_hash} is not null`),
    publicReadPolicy('companies'),
  ]
).enableRLS();

// Immutable review ledger. Every company has its own hash chain.
export const reviews = pgTable(
  'reviews',
  {
    id: varchar('id', { length: 255 }).primaryKey(),
    company_id: varchar('company_id', { length: 255 }).notNull(),
    company_name: varchar('company_name', { length: 255 }).notNull(),
    branch_location: varchar('branch_location', { length: 255 }).notNull(),
    position: varchar('position', { length: 255 }).notNull(),
    employment_status: varchar('employment_status', { length: 50 }).default('current'),
    salary: integer('salary').default(0),
    bonus: integer('bonus').default(0),
    experience_years: integer('experience_years').default(1),
    rating_career: integer('rating_career').notNull(),
    rating_balance: integer('rating_balance').notNull(),
    rating_management: integer('rating_management').notNull(),
    rating_compensation: integer('rating_compensation').notNull(),
    rating_culture: integer('rating_culture').notNull(),
    review_text: text('review_text').notNull(),
    created_at: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    previous_hash: varchar('previous_hash', { length: 64 }),
    hash: varchar('hash', { length: 64 }).notNull(),
    hash_version: integer('hash_version'),
  },
  (table) => [
    index('idx_reviews_company_id').on(table.company_id),
    index('idx_reviews_created_at').on(table.created_at),
    unique('reviews_hash_unique').on(table.hash),
    unique('reviews_company_hash_unique').on(table.company_id, table.hash),
    uniqueIndex('reviews_company_previous_hash_unique')
      .on(table.company_id, table.previous_hash)
      .where(sql`${table.previous_hash} is not null`),
    uniqueIndex('reviews_company_genesis_unique')
      .on(table.company_id)
      .where(sql`${table.previous_hash} is null`),
    foreignKey({
      name: 'fk_reviews_company',
      columns: [table.company_id],
      foreignColumns: [companies.id],
    }),
    check('reviews_salary_non_negative', sql`${table.salary} >= 0`),
    check('reviews_bonus_non_negative', sql`${table.bonus} >= 0`),
    check('reviews_experience_non_negative', sql`${table.experience_years} >= 0`),
    check('reviews_rating_career_range', sql`${table.rating_career} between 1 and 5`),
    check('reviews_rating_balance_range', sql`${table.rating_balance} between 1 and 5`),
    check('reviews_rating_management_range', sql`${table.rating_management} between 1 and 5`),
    check('reviews_rating_compensation_range', sql`${table.rating_compensation} between 1 and 5`),
    check('reviews_rating_culture_range', sql`${table.rating_culture} between 1 and 5`),
    check('reviews_hash_format', sql`${table.hash} ~ '^[0-9a-f]{64}$'`),
    publicReadPolicy('reviews'),
  ]
).enableRLS();

// Legacy backup metadata. New snapshots use data_snapshots below.
export const backupsMetadata = pgTable(
  'backups_metadata',
  {
    id: varchar('id', { length: 255 }).primaryKey(),
    date: varchar('date', { length: 50 }).notNull(),
    created_at: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    review_count: integer('review_count').default(0),
    csv_size: integer('csv_size').default(0),
    xlsx_size: integer('xlsx_size').default(0),
    sql_size: integer('sql_size').default(0),
  },
  (table) => [
    index('idx_backups_metadata_date').on(table.date),
    publicReadPolicy('backups_metadata'),
  ]
).enableRLS();

// Deprecated read-only archive. No new code may write base64 files here.
export const backupsBinary = pgTable('backups_binary', {
  id: varchar('id', { length: 255 }).primaryKey(),
  csv_base64: text('csv_base64'),
  xlsx_base64: text('xlsx_base64'),
  sql_base64: text('sql_base64'),
}).enableRLS();

export const companyLinks = pgTable(
  'company_links',
  {
    id: varchar('id', { length: 255 }).primaryKey(),
    company_id: varchar('company_id', { length: 255 }).notNull(),
    type: varchar('type', { length: 50 }).notNull(),
    url: text('url').notNull(),
    storage_path: text('storage_path'),
    title: varchar('title', { length: 255 }),
    content_hash: varchar('content_hash', { length: 64 }),
    created_at: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  },
  (table) => [
    index('idx_company_links_company_id').on(table.company_id),
    uniqueIndex('company_links_content_hash_unique')
      .on(table.company_id, table.content_hash)
      .where(sql`${table.content_hash} is not null`),
    foreignKey({
      name: 'fk_company_links_company',
      columns: [table.company_id],
      foreignColumns: [companies.id],
    }),
    publicReadPolicy('company_links'),
  ]
).enableRLS();

// Deprecated one-row legacy details table. New writes go to company_profile_versions.
export const companyDetails = pgTable(
  'company_details',
  {
    id: varchar('id', { length: 255 }).primaryKey(),
    company_id: varchar('company_id', { length: 255 }).notNull().unique(),
    legal_representative: varchar('legal_representative', { length: 255 }),
    registered_capital: varchar('registered_capital', { length: 100 }),
    business_scope: text('business_scope'),
    registered_address: text('registered_address'),
    establishment_date: varchar('establishment_date', { length: 50 }),
    company_type: varchar('company_type', { length: 100 }),
    updated_at: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  },
  (table) => [
    index('idx_company_details_company_id').on(table.company_id),
    foreignKey({
      name: 'fk_company_details_company',
      columns: [table.company_id],
      foreignColumns: [companies.id],
    }),
    publicReadPolicy('company_details'),
  ]
).enableRLS();

export interface CompanyProfileData {
  name: string;
  creditCode?: string | null;
  countryCode?: string | null;
  countryName?: string | null;
  province?: string | null;
  city?: string | null;
  legalRepresentative?: string | null;
  registeredCapital?: string | null;
  businessScope?: string | null;
  registeredAddress?: string | null;
  establishmentDate?: string | null;
  companyType?: string | null;
  website?: string | null;
}

export const companyProfileVersions = pgTable(
  'company_profile_versions',
  {
    id: varchar('id', { length: 255 }).primaryKey(),
    company_id: varchar('company_id', { length: 255 }).notNull(),
    previous_version_id: varchar('previous_version_id', { length: 255 }),
    source_type: varchar('source_type', { length: 50 }).notNull(),
    source_ref: varchar('source_ref', { length: 255 }),
    profile_data: jsonb('profile_data').$type<CompanyProfileData>().notNull(),
    profile_hash: varchar('profile_hash', { length: 64 }).notNull(),
    created_at: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('idx_company_profile_versions_company_created').on(
      table.company_id,
      table.created_at
    ),
    unique('company_profile_versions_company_hash_unique').on(
      table.company_id,
      table.profile_hash
    ),
    uniqueIndex('company_profile_versions_source_ref_unique')
      .on(table.source_type, table.source_ref)
      .where(sql`${table.source_ref} is not null`),
    foreignKey({
      name: 'fk_company_profile_versions_company',
      columns: [table.company_id],
      foreignColumns: [companies.id],
    }),
    check(
      'company_profile_versions_hash_format',
      sql`${table.profile_hash} ~ '^[0-9a-f]{64}$'`
    ),
    publicReadPolicy('company_profile_versions'),
  ]
).enableRLS();

export interface CompanyProfileChanges extends Partial<CompanyProfileData> {}

export const companyChangeProposals = pgTable(
  'company_change_proposals',
  {
    id: varchar('id', { length: 255 }).primaryKey(),
    company_id: varchar('company_id', { length: 255 }).notNull(),
    base_version_id: varchar('base_version_id', { length: 255 }).notNull(),
    changes: jsonb('changes').$type<CompanyProfileChanges>().notNull(),
    changes_hash: varchar('changes_hash', { length: 64 }).notNull(),
    required_approvals: integer('required_approvals').notNull(),
    proposer_key: varchar('proposer_key', { length: 64 }).notNull(),
    created_at: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('idx_company_change_proposals_company_created').on(
      table.company_id,
      table.created_at
    ),
    unique('company_change_proposals_content_unique').on(
      table.company_id,
      table.base_version_id,
      table.changes_hash
    ),
    foreignKey({
      name: 'fk_company_change_proposals_company',
      columns: [table.company_id],
      foreignColumns: [companies.id],
    }),
    foreignKey({
      name: 'fk_company_change_proposals_base_version',
      columns: [table.base_version_id],
      foreignColumns: [companyProfileVersions.id],
    }),
    check(
      'company_change_proposals_required_approvals_positive',
      sql`${table.required_approvals} > 0`
    ),
    check(
      'company_change_proposals_hash_format',
      sql`${table.changes_hash} ~ '^[0-9a-f]{64}$'`
    ),
    publicReadPolicy('company_change_proposals'),
  ]
).enableRLS();

export const companyChangeApprovals = pgTable(
  'company_change_approvals',
  {
    id: varchar('id', { length: 255 }).primaryKey(),
    proposal_id: varchar('proposal_id', { length: 255 }).notNull(),
    voter_key: varchar('voter_key', { length: 64 }).notNull(),
    created_at: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('idx_company_change_approvals_proposal').on(table.proposal_id),
    unique('company_change_approvals_voter_unique').on(table.proposal_id, table.voter_key),
    foreignKey({
      name: 'fk_company_change_approvals_proposal',
      columns: [table.proposal_id],
      foreignColumns: [companyChangeProposals.id],
    }),
    publicReadPolicy('company_change_approvals'),
  ]
).enableRLS();

export const companyProposalResolutions = pgTable(
  'company_proposal_resolutions',
  {
    id: varchar('id', { length: 255 }).primaryKey(),
    proposal_id: varchar('proposal_id', { length: 255 }).notNull().unique(),
    result: varchar('result', { length: 30 }).notNull(),
    resulting_version_id: varchar('resulting_version_id', { length: 255 }),
    approval_count: integer('approval_count').notNull(),
    created_at: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      name: 'fk_company_proposal_resolutions_proposal',
      columns: [table.proposal_id],
      foreignColumns: [companyChangeProposals.id],
    }),
    check(
      'company_proposal_resolutions_result',
      sql`${table.result} in ('accepted', 'conflicted', 'superseded')`
    ),
    check(
      'company_proposal_resolutions_approval_count_non_negative',
      sql`${table.approval_count} >= 0`
    ),
    publicReadPolicy('company_proposal_resolutions'),
  ]
).enableRLS();

export const dataSnapshots = pgTable(
  'data_snapshots',
  {
    id: varchar('id', { length: 255 }).primaryKey(),
    snapshot_date: varchar('snapshot_date', { length: 10 }).notNull(),
    object_prefix: text('object_prefix').notNull(),
    manifest_path: text('manifest_path').notNull(),
    manifest_hash: varchar('manifest_hash', { length: 64 }).notNull(),
    files: jsonb('files')
      .$type<Record<string, { path: string; size: number; sha256: string; contentType: string }>>()
      .notNull(),
    row_counts: jsonb('row_counts').$type<Record<string, number>>().notNull(),
    size_bytes: numeric('size_bytes', { precision: 20, scale: 0 }).notNull(),
    expires_at: timestamp('expires_at', { withTimezone: true, mode: 'string' }).notNull(),
    created_at: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('idx_data_snapshots_created_at').on(table.created_at),
    unique('data_snapshots_date_unique').on(table.snapshot_date),
    check('data_snapshots_manifest_hash_format', sql`${table.manifest_hash} ~ '^[0-9a-f]{64}$'`),
    publicReadPolicy('data_snapshots'),
  ]
).enableRLS();

export const geoCountries = pgTable(
  'geo_countries',
  {
    code: varchar('code', { length: 10 }).primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    chinese_name: varchar('chinese_name', { length: 100 }),
  },
  () => [publicReadPolicy('geo_countries')]
).enableRLS();

export const geoCities = pgTable(
  'geo_cities',
  {
    id: integer('id').primaryKey(),
    name: varchar('name', { length: 200 }).notNull(),
    ascii_name: varchar('ascii_name', { length: 200 }),
    alternate_names: text('alternate_names'),
    chinese_name: varchar('chinese_name', { length: 200 }),
    country_code: varchar('country_code', { length: 10 }).notNull(),
    admin1_code: varchar('admin1_code', { length: 50 }),
    latitude: numeric('latitude', { precision: 10, scale: 5 }),
    longitude: numeric('longitude', { precision: 10, scale: 5 }),
  },
  (table) => [
    index('idx_geo_cities_country').on(table.country_code),
    index('idx_geo_cities_name').on(table.name),
    index('idx_geo_cities_chinese_name').on(table.chinese_name),
    publicReadPolicy('geo_cities'),
  ]
).enableRLS();

export const currentCompanyProfiles = pgView('current_company_profiles', {
  company_id: varchar('company_id', { length: 255 }),
  version_id: varchar('version_id', { length: 255 }),
  profile_data: jsonb('profile_data').$type<CompanyProfileData>(),
  profile_hash: varchar('profile_hash', { length: 64 }),
  created_at: timestamp('created_at', { withTimezone: true, mode: 'string' }),
}).as(sql`
  select distinct on (company_id)
    company_id,
    id as version_id,
    profile_data,
    profile_hash,
    created_at
  from company_profile_versions
  order by company_id, created_at desc, id desc
`);

export const companyStatistics = pgView('company_statistics', {
  company_id: varchar('company_id', { length: 255 }),
  review_count: integer('review_count'),
  avg_rating: numeric('avg_rating', { precision: 4, scale: 2 }),
  avg_career: numeric('avg_career', { precision: 4, scale: 2 }),
  avg_balance: numeric('avg_balance', { precision: 4, scale: 2 }),
  avg_management: numeric('avg_management', { precision: 4, scale: 2 }),
  avg_compensation: numeric('avg_compensation', { precision: 4, scale: 2 }),
  avg_culture: numeric('avg_culture', { precision: 4, scale: 2 }),
  avg_salary: integer('avg_salary'),
  avg_bonus: integer('avg_bonus'),
}).as(sql`
  select
    company_id,
    count(*)::integer as review_count,
    round(avg((rating_career + rating_balance + rating_management + rating_compensation + rating_culture)::numeric / 5), 2) as avg_rating,
    round(avg(rating_career)::numeric, 2) as avg_career,
    round(avg(rating_balance)::numeric, 2) as avg_balance,
    round(avg(rating_management)::numeric, 2) as avg_management,
    round(avg(rating_compensation)::numeric, 2) as avg_compensation,
    round(avg(rating_culture)::numeric, 2) as avg_culture,
    coalesce(round(avg(salary) filter (where salary > 0)), 0)::integer as avg_salary,
    coalesce(round(avg(bonus) filter (where bonus > 0)), 0)::integer as avg_bonus
  from reviews
  group by company_id
`);

export const companyProposalStatus = pgView('company_proposal_status', {
  proposal_id: varchar('proposal_id', { length: 255 }),
  company_id: varchar('company_id', { length: 255 }),
  required_approvals: integer('required_approvals'),
  approval_count: integer('approval_count'),
  resolution: varchar('resolution', { length: 30 }),
  resulting_version_id: varchar('resulting_version_id', { length: 255 }),
}).as(sql`
  select
    p.id as proposal_id,
    p.company_id,
    p.required_approvals,
    count(a.id)::integer as approval_count,
    r.result as resolution,
    r.resulting_version_id
  from company_change_proposals p
  left join company_change_approvals a on a.proposal_id = p.id
  left join company_proposal_resolutions r on r.proposal_id = p.id
  group by p.id, p.company_id, p.required_approvals, r.result, r.resulting_version_id
`);
