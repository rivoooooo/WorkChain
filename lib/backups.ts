import crypto from 'crypto';
import * as XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import { sqlClient } from '@/drizzle/db';
import { getReviews, type Review } from './db';
import { canonicalJson } from './company-profile';

export interface BackupMetadata {
  id: string;
  date: string;
  createdAt: string;
  reviewCount: number;
  csvSize: number;
  xlsxSize: number;
  sqlSize: number;
  csvHash?: string;
  xlsxHash?: string;
  sqlHash?: string;
}

interface SnapshotFile {
  path: string;
  size: number;
  sha256: string;
  contentType: string;
}

type SnapshotFiles = Record<'csv' | 'xlsx' | 'sql' | 'manifest', SnapshotFile>;

interface SnapshotRow {
  id: string;
  snapshot_date: string;
  files: SnapshotFiles;
  row_counts: Record<string, number>;
  created_at: string;
  expires_at: string;
}

function getStorageClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for snapshots.'
    );
  }
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function getBucketName(): string {
  return process.env.PUBLIC_DATA_SNAPSHOT_BUCKET || 'public-data-snapshots';
}

function sha256(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return '';
  let text = String(value);
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function escapeSql(value: unknown): string {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return String(value);
  return `'${String(value).replace(/'/g, "''")}'`;
}

function generateReviewCsv(reviews: Review[]): Buffer {
  const fields: (keyof Review)[] = [
    'id',
    'company_id',
    'company_name',
    'branch_location',
    'position',
    'employment_status',
    'salary',
    'bonus',
    'experience_years',
    'rating_career',
    'rating_balance',
    'rating_management',
    'rating_compensation',
    'rating_culture',
    'review_text',
    'created_at',
    'previous_hash',
    'hash',
    'hash_version',
  ];
  const lines = [
    fields.join(','),
    ...reviews.map((review) => fields.map((field) => escapeCsv(review[field])).join(',')),
  ];
  return Buffer.from(lines.join('\n'), 'utf8');
}

function spreadsheetSafe(value: unknown): unknown {
  return typeof value === 'string' && /^[=+\-@]/.test(value) ? `'${value}` : value;
}

function generateReviewWorkbook(reviews: Review[]): Buffer {
  const safeRows = reviews.map((review) =>
    Object.fromEntries(
      Object.entries(review).map(([key, value]) => [key, spreadsheetSafe(value)])
    )
  );
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(safeRows),
    'reviews'
  );
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

async function generateDataOnlySql(reviews: Review[]): Promise<Buffer> {
  const companies = await sqlClient`
    select
      id, credit_code, name, country_code, country_name, province, city,
      created_at, creation_source, creation_hash
    from companies
    order by id
  `;
  const lines = [
    '-- Work-Chain append-only public data snapshot',
    '-- Apply the Drizzle schema before importing this file.',
    'BEGIN;',
  ];

  for (const company of companies) {
    lines.push(
      `INSERT INTO companies (id, credit_code, name, country_code, country_name, province, city, created_at, creation_source, creation_hash) VALUES (` +
        [
          company.id,
          company.credit_code,
          company.name,
          company.country_code,
          company.country_name,
          company.province,
          company.city,
          company.created_at,
          company.creation_source,
          company.creation_hash,
        ]
          .map(escapeSql)
          .join(', ') +
        ') ON CONFLICT DO NOTHING;'
    );
  }

  for (const review of reviews) {
    lines.push(
      `INSERT INTO reviews (id, company_id, company_name, branch_location, position, employment_status, salary, bonus, experience_years, rating_career, rating_balance, rating_management, rating_compensation, rating_culture, review_text, created_at, previous_hash, hash, hash_version) VALUES (` +
        [
          review.id,
          review.company_id,
          review.company_name,
          review.branch_location,
          review.position,
          review.employment_status,
          review.salary,
          review.bonus,
          review.experience_years,
          review.rating_career,
          review.rating_balance,
          review.rating_management,
          review.rating_compensation,
          review.rating_culture,
          review.review_text,
          review.created_at,
          review.previous_hash,
          review.hash,
          review.hash_version,
        ]
          .map(escapeSql)
          .join(', ') +
        ') ON CONFLICT DO NOTHING;'
    );
  }
  lines.push('COMMIT;');
  return Buffer.from(lines.join('\n'), 'utf8');
}

function mapSnapshot(row: SnapshotRow): BackupMetadata {
  return {
    id: row.id,
    date: row.snapshot_date,
    createdAt: row.created_at,
    reviewCount: Number(row.row_counts.reviews || 0),
    csvSize: Number(row.files.csv?.size || 0),
    xlsxSize: Number(row.files.xlsx?.size || 0),
    sqlSize: Number(row.files.sql?.size || 0),
    csvHash: row.files.csv?.sha256,
    xlsxHash: row.files.xlsx?.sha256,
    sqlHash: row.files.sql?.sha256,
  };
}

export async function loadBackupMetadata(): Promise<BackupMetadata[]> {
  const rows = await sqlClient<SnapshotRow[]>`
    select id, snapshot_date, files, row_counts, created_at, expires_at
    from data_snapshots
    where expires_at > now()
    order by snapshot_date desc
  `;
  return rows.map(mapSnapshot);
}

async function uploadImmutable(
  path: string,
  buffer: Buffer,
  contentType: string
): Promise<SnapshotFile> {
  const storage = getStorageClient().storage.from(getBucketName());
  const { error } = await storage.upload(path, buffer, {
    contentType,
    upsert: false,
    cacheControl: '3600',
  });
  if (
    error &&
    !error.message.toLowerCase().includes('already exists') &&
    !error.message.toLowerCase().includes('duplicate')
  ) {
    throw new Error(`Snapshot upload failed for ${path}: ${error.message}`);
  }
  return { path, size: buffer.length, sha256: sha256(buffer), contentType };
}

export async function createBackupForDate(
  date: string
): Promise<BackupMetadata | null> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error('Snapshot date must use YYYY-MM-DD.');
  }

  const existingRows = await sqlClient<SnapshotRow[]>`
    select id, snapshot_date, files, row_counts, created_at, expires_at
    from data_snapshots
    where snapshot_date = ${date}
    limit 1
  `;
  if (existingRows[0]) return mapSnapshot(existingRows[0]);

  const reviews = await getReviews();
  const companyCountRows = await sqlClient<{ count: number }[]>`
    select count(*)::integer as count from companies
  `;
  const csvBuffer = generateReviewCsv(reviews);
  const xlsxBuffer = generateReviewWorkbook(reviews);
  const sqlBuffer = await generateDataOnlySql(reviews);
  const prefix = `daily/${date}`;
  const files = {} as SnapshotFiles;

  files.csv = await uploadImmutable(
    `${prefix}/reviews.csv`,
    csvBuffer,
    'text/csv; charset=utf-8'
  );
  files.xlsx = await uploadImmutable(
    `${prefix}/reviews.xlsx`,
    xlsxBuffer,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  files.sql = await uploadImmutable(
    `${prefix}/data-only.sql`,
    sqlBuffer,
    'application/sql; charset=utf-8'
  );

  const rowCounts = {
    companies: Number(companyCountRows[0]?.count || 0),
    reviews: reviews.length,
  };
  const manifestPayload = {
    schemaVersion: 2,
    snapshotDate: date,
    generatedAt: new Date().toISOString(),
    rowCounts,
    files,
  };
  const manifestBuffer = Buffer.from(canonicalJson(manifestPayload), 'utf8');
  files.manifest = await uploadImmutable(
    `${prefix}/manifest.json`,
    manifestBuffer,
    'application/json; charset=utf-8'
  );

  const retentionDays = Math.max(1, Number(process.env.SNAPSHOT_RETENTION_DAYS || '7'));
  const expiresAt = new Date(
    new Date(`${date}T00:00:00.000Z`).getTime() + retentionDays * 86_400_000
  ).toISOString();
  const snapshotId = `snapshot-${date}`;
  const totalSize = Object.values(files).reduce((sum, file) => sum + file.size, 0);

  await sqlClient`
    insert into data_snapshots (
      id, snapshot_date, object_prefix, manifest_path, manifest_hash,
      files, row_counts, size_bytes, expires_at
    )
    values (
      ${snapshotId},
      ${date},
      ${prefix},
      ${files.manifest.path},
      ${files.manifest.sha256},
      ${canonicalJson(files)}::jsonb,
      ${canonicalJson(rowCounts)}::jsonb,
      ${totalSize},
      ${expiresAt}
    )
    on conflict do nothing
  `;

  const rows = await sqlClient<SnapshotRow[]>`
    select id, snapshot_date, files, row_counts, created_at, expires_at
    from data_snapshots
    where id = ${snapshotId}
    limit 1
  `;
  await cleanExpiredSnapshotFiles();
  return rows[0] ? mapSnapshot(rows[0]) : null;
}

export async function getBackupPublicUrl(
  id: string,
  format: 'csv' | 'xlsx' | 'sql'
): Promise<string | null> {
  const rows = await sqlClient<{ files: SnapshotFiles }[]>`
    select files
    from data_snapshots
    where id = ${id} and expires_at > now()
    limit 1
  `;
  const file = rows[0]?.files?.[format];
  if (!file) return null;
  return getStorageClient().storage.from(getBucketName()).getPublicUrl(file.path).data
    .publicUrl;
}

export async function cleanExpiredSnapshotFiles(): Promise<void> {
  const expired = await sqlClient<{ files: SnapshotFiles }[]>`
    select files from data_snapshots where expires_at <= now()
  `;
  const paths = expired.flatMap((row) =>
    Object.values(row.files || {}).map((file) => file.path)
  );
  if (paths.length === 0) return;

  const { error } = await getStorageClient().storage.from(getBucketName()).remove(paths);
  if (error) {
    throw new Error(`Unable to clean expired snapshot files: ${error.message}`);
  }
}
