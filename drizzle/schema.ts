import { pgTable, varchar, integer, numeric, text, timestamp, index, foreignKey, pgPolicy } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// 1. 公司主表 (companies)
export const companies = pgTable('companies', {
  id: varchar('id', { length: 255 }).primaryKey(),
  credit_code: varchar('credit_code', { length: 50 }).unique(),
  name: varchar('name', { length: 255 }).notNull(),
  country_code: varchar('country_code', { length: 10 }).default('CN'),
  country_name: varchar('country_name', { length: 100 }).default('中国'),
  province: varchar('province', { length: 100 }),
  city: varchar('city', { length: 100 }),
  created_at: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  review_count: integer('review_count').default(0),
  avg_rating: numeric('avg_rating', { precision: 4, scale: 2 }).default('0.00'),
  avg_career: numeric('avg_career', { precision: 4, scale: 2 }).default('0.00'),
  avg_balance: numeric('avg_balance', { precision: 4, scale: 2 }).default('0.00'),
  avg_management: numeric('avg_management', { precision: 4, scale: 2 }).default('0.00'),
  avg_compensation: numeric('avg_compensation', { precision: 4, scale: 2 }).default('0.00'),
  avg_culture: numeric('avg_culture', { precision: 4, scale: 2 }).default('0.00'),
  avg_salary: integer('avg_salary').default(0),
  avg_bonus: integer('avg_bonus').default(0),
}, (table) => [
  index('idx_companies_credit_code').on(table.credit_code),
  index('idx_companies_name').on(table.name),
  index('idx_companies_location').on(table.country_code, table.province, table.city),
  pgPolicy('Allow select for companies', {
    for: 'select',
    to: 'public',
    using: sql.raw('true'),
  }),
  pgPolicy('Allow insert for companies', {
    for: 'insert',
    to: 'public',
    withCheck: sql.raw('true'),
  }),
  pgPolicy('Allow update for companies', {
    for: 'update',
    to: 'public',
    using: sql.raw('true'),
  }),
  pgPolicy('Allow delete for companies', {
    for: 'delete',
    to: 'public',
    using: sql.raw('true'),
  }),
]).enableRLS();

// 2. 评价主表 (reviews)
export const reviews = pgTable('reviews', {
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
  previous_hash: varchar('previous_hash', { length: 255 }).default('0'),
  hash: varchar('hash', { length: 255 }).notNull(),
}, (table) => [
  index('idx_reviews_company_id').on(table.company_id),
  index('idx_reviews_created_at').on(table.created_at),
  foreignKey({
    name: 'fk_reviews_company',
    columns: [table.company_id],
    foreignColumns: [companies.id],
  }).onDelete('cascade'),
  pgPolicy('Allow select for reviews', {
    for: 'select',
    to: 'public',
    using: sql.raw('true'),
  }),
  pgPolicy('Allow insert for reviews', {
    for: 'insert',
    to: 'public',
    withCheck: sql.raw('true'),
  }),
  pgPolicy('Allow update for reviews', {
    for: 'update',
    to: 'public',
    using: sql.raw('true'),
  }),
  pgPolicy('Allow delete for reviews', {
    for: 'delete',
    to: 'public',
    using: sql.raw('true'),
  }),
]).enableRLS();

// 3. 自动归档备份元数据表 (backups_metadata)
export const backupsMetadata = pgTable('backups_metadata', {
  id: varchar('id', { length: 255 }).primaryKey(),
  date: varchar('date', { length: 50 }).notNull(),
  created_at: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  review_count: integer('review_count').default(0),
  csv_size: integer('csv_size').default(0),
  xlsx_size: integer('xlsx_size').default(0),
  sql_size: integer('sql_size').default(0),
}, (table) => [
  index('idx_backups_metadata_date').on(table.date),
  pgPolicy('Allow select for backups_metadata', {
    for: 'select',
    to: 'public',
    using: sql.raw('true'),
  }),
  pgPolicy('Allow insert for backups_metadata', {
    for: 'insert',
    to: 'public',
    withCheck: sql.raw('true'),
  }),
  pgPolicy('Allow update for backups_metadata', {
    for: 'update',
    to: 'public',
    using: sql.raw('true'),
  }),
  pgPolicy('Allow delete for backups_metadata', {
    for: 'delete',
    to: 'public',
    using: sql.raw('true'),
  }),
]).enableRLS();

// 4. 自动归档备份二进制存储表 (backups_binary)
export const backupsBinary = pgTable('backups_binary', {
  id: varchar('id', { length: 255 }).primaryKey(),
  csv_base64: text('csv_base64'),
  xlsx_base64: text('xlsx_base64'),
  sql_base64: text('sql_base64'),
}, (table) => [
  pgPolicy('Allow select for backups_binary', {
    for: 'select',
    to: 'public',
    using: sql.raw('true'),
  }),
  pgPolicy('Allow insert for backups_binary', {
    for: 'insert',
    to: 'public',
    withCheck: sql.raw('true'),
  }),
  pgPolicy('Allow update for backups_binary', {
    for: 'update',
    to: 'public',
    using: sql.raw('true'),
  }),
  pgPolicy('Allow delete for backups_binary', {
    for: 'delete',
    to: 'public',
    using: sql.raw('true'),
  }),
]).enableRLS();

// 5. 公司相关链接/媒体扩展表 (company_links)
export const companyLinks = pgTable('company_links', {
  id: varchar('id', { length: 255 }).primaryKey(),
  company_id: varchar('company_id', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // 'logo' | 'image' | 'url' | 'document'
  url: text('url').notNull(),
  storage_path: text('storage_path'),
  title: varchar('title', { length: 255 }),
  created_at: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_company_links_company_id').on(table.company_id),
  foreignKey({
    name: 'fk_company_links_company',
    columns: [table.company_id],
    foreignColumns: [companies.id],
  }).onDelete('cascade'),
  pgPolicy('Allow select for company_links', {
    for: 'select',
    to: 'public',
    using: sql.raw('true'),
  }),
  pgPolicy('Allow insert for company_links', {
    for: 'insert',
    to: 'public',
    withCheck: sql.raw('true'),
  }),
  pgPolicy('Allow update for company_links', {
    for: 'update',
    to: 'public',
    using: sql.raw('true'),
  }),
  pgPolicy('Allow delete for company_links', {
    for: 'delete',
    to: 'public',
    using: sql.raw('true'),
  }),
]).enableRLS();

// 6. 公司扩展详细信息表 (company_details)
export const companyDetails = pgTable('company_details', {
  id: varchar('id', { length: 255 }).primaryKey(),
  company_id: varchar('company_id', { length: 255 }).notNull().unique(),
  legal_representative: varchar('legal_representative', { length: 255 }),
  registered_capital: varchar('registered_capital', { length: 100 }),
  business_scope: text('business_scope'),
  registered_address: text('registered_address'),
  establishment_date: varchar('establishment_date', { length: 50 }),
  company_type: varchar('company_type', { length: 100 }),
  updated_at: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_company_details_company_id').on(table.company_id),
  foreignKey({
    name: 'fk_company_details_company',
    columns: [table.company_id],
    foreignColumns: [companies.id],
  }).onDelete('cascade'),
  pgPolicy('Allow select for company_details', {
    for: 'select',
    to: 'public',
    using: sql.raw('true'),
  }),
  pgPolicy('Allow insert for company_details', {
    for: 'insert',
    to: 'public',
    withCheck: sql.raw('true'),
  }),
  pgPolicy('Allow update for company_details', {
    for: 'update',
    to: 'public',
    using: sql.raw('true'),
  }),
  pgPolicy('Allow delete for company_details', {
    for: 'delete',
    to: 'public',
    using: sql.raw('true'),
  }),
]).enableRLS();

// 7. 国家地理位置表 (geo_countries)
export const geoCountries = pgTable('geo_countries', {
  code: varchar('code', { length: 10 }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  chinese_name: varchar('chinese_name', { length: 100 }),
}, (table) => [
  pgPolicy('Allow select for geo_countries', {
    for: 'select',
    to: 'public',
    using: sql.raw('true'),
  }),
  pgPolicy('Allow insert for geo_countries', {
    for: 'insert',
    to: 'public',
    withCheck: sql.raw('true'),
  }),
  pgPolicy('Allow update for geo_countries', {
    for: 'update',
    to: 'public',
    using: sql.raw('true'),
  }),
  pgPolicy('Allow delete for geo_countries', {
    for: 'delete',
    to: 'public',
    using: sql.raw('true'),
  }),
]).enableRLS();

// 8. 城市地理位置表 (geo_cities)
export const geoCities = pgTable('geo_cities', {
  id: integer('id').primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  ascii_name: varchar('ascii_name', { length: 200 }),
  alternate_names: text('alternate_names'),
  chinese_name: varchar('chinese_name', { length: 200 }),
  country_code: varchar('country_code', { length: 10 }).notNull(),
  admin1_code: varchar('admin1_code', { length: 50 }),
  latitude: numeric('latitude', { precision: 10, scale: 5 }),
  longitude: numeric('longitude', { precision: 10, scale: 5 }),
}, (table) => [
  index('idx_geo_cities_country').on(table.country_code),
  index('idx_geo_cities_name').on(table.name),
  index('idx_geo_cities_chinese_name').on(table.chinese_name),
  pgPolicy('Allow select for geo_cities', {
    for: 'select',
    to: 'public',
    using: sql.raw('true'),
  }),
  pgPolicy('Allow insert for geo_cities', {
    for: 'insert',
    to: 'public',
    withCheck: sql.raw('true'),
  }),
  pgPolicy('Allow update for geo_cities', {
    for: 'update',
    to: 'public',
    using: sql.raw('true'),
  }),
  pgPolicy('Allow delete for geo_cities', {
    for: 'delete',
    to: 'public',
    using: sql.raw('true'),
  }),
]).enableRLS();


