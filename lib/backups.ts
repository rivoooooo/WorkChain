import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import { getReviews, Review } from './db';

export interface BackupMetadata {
  id: string; // e.g., backup-2026-07-24
  date: string; // YYYY-MM-DD
  createdAt: string; // ISO timestamp
  reviewCount: number;
  csvSize: number; // bytes
  xlsxSize: number; // bytes
  sqlSize: number; // bytes
}

export interface BackupBinaryData {
  csvBase64: string;
  xlsxBase64: string;
  sqlBase64: string;
}

// Global backup storage caches to prevent crashing or losing status in ephemeral serverless edge deployments
declare global {
  var _localBackupMetadata: BackupMetadata[] | undefined;
  var _localBackupBinaries: Record<string, BackupBinaryData> | undefined;
}

if (!global._localBackupMetadata) {
  global._localBackupMetadata = [];
}
if (!global._localBackupBinaries) {
  global._localBackupBinaries = {};
}

const DATA_DIR = path.join(process.cwd(), 'data');
const BACKUPS_DIR = path.join(DATA_DIR, 'backups');
const METADATA_FILE = path.join(DATA_DIR, 'backups.json');
const BINARY_FILE = path.join(DATA_DIR, 'backups_binary.json');

// Helper: Ensure local folder paths exist
function ensureDirectories() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(BACKUPS_DIR)) {
      fs.mkdirSync(BACKUPS_DIR, { recursive: true });
    }
  } catch (err) {
    // Suppress filesystem folder errors on read-only serverless edge containers
  }
}

// Initialize Supabase client dynamically if variables exist
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (url && key) {
    return createClient(url, key);
  }
  return null;
}

// Load backup metadata list
export async function loadBackupMetadata(): Promise<BackupMetadata[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('backups_metadata')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        const mapped: BackupMetadata[] = data.map((item: any) => ({
          id: item.id,
          date: item.date,
          createdAt: item.created_at || item.createdAt,
          reviewCount: item.review_count !== undefined ? item.review_count : item.reviewCount,
          csvSize: item.csv_size !== undefined ? item.csv_size : item.csvSize,
          xlsxSize: item.xlsx_size !== undefined ? item.xlsx_size : item.xlsxSize,
          sqlSize: item.sql_size !== undefined ? item.sql_size : item.sqlSize
        }));
        global._localBackupMetadata = mapped;
        return mapped;
      }
    } catch (dbError) {
      console.warn('[Backup System] Failed to load metadata from Supabase database table, attempting fallback:', dbError);
    }
  }

  // Fallback to local files
  ensureDirectories();
  try {
    if (fs.existsSync(METADATA_FILE)) {
      const content = fs.readFileSync(METADATA_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      global._localBackupMetadata = parsed;
      return parsed;
    }
  } catch (error) {
    console.warn('[Backup System] Error reading local backup metadata file (likely edge runtime):', error);
  }

  return global._localBackupMetadata || [];
}

// Save backup metadata list
async function saveBackupMetadata(metadata: BackupMetadata[]) {
  global._localBackupMetadata = metadata;

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const dbRows = metadata.map(m => ({
        id: m.id,
        date: m.date,
        created_at: m.createdAt,
        review_count: m.reviewCount,
        csv_size: m.csvSize,
        xlsx_size: m.xlsxSize,
        sql_size: m.sqlSize
      }));

      const { error } = await supabase
        .from('backups_metadata')
        .insert(dbRows);

      if (error && !error.message.includes('duplicate key') && !error.message.includes('already exists')) {
        console.error('[Backup System] Error inserting metadata to Supabase:', error);
      } else {
        console.log('[Backup System] Successfully saved metadata to Supabase table');
      }
    } catch (dbError) {
      console.error('[Backup System] Database upsert error:', dbError);
    }
  }

  // Write to local files as a robust local backup fallback
  try {
    ensureDirectories();
    fs.writeFileSync(METADATA_FILE, JSON.stringify(metadata, null, 2), 'utf-8');
  } catch (error) {
    console.warn('[Backup System] Local metadata write skipped (common on edge environments):', error);
  }
}

// Get specific binary backup from binary storage
export async function getBackupBinary(id: string): Promise<BackupBinaryData | null> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('backups_binary')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (data) {
        const mapped: BackupBinaryData = {
          csvBase64: data.csv_base64 || data.csvBase64,
          xlsxBase64: data.xlsx_base64 || data.xlsxBase64,
          sqlBase64: data.sql_base64 || data.sqlBase64
        };
        if (global._localBackupBinaries) {
          global._localBackupBinaries[id] = mapped;
        }
        return mapped;
      }
    } catch (dbError) {
      console.warn(`[Backup System] Failed to load binary backup ${id} from database, attempting fallback:`, dbError);
    }
  }

  // Fallback 1: global memory cache
  if (global._localBackupBinaries && global._localBackupBinaries[id]) {
    return global._localBackupBinaries[id];
  }

  // Fallback 2: file system JSON
  try {
    ensureDirectories();
    if (fs.existsSync(BINARY_FILE)) {
      const content = fs.readFileSync(BINARY_FILE, 'utf-8');
      const allBinaries = JSON.parse(content);
      if (allBinaries[id]) {
        return allBinaries[id];
      }
    }
  } catch (error) {
    console.warn('[Backup System] Error reading local backups binary file:', error);
  }

  // Fallback 3: physical individual files
  const csvPath = path.join(BACKUPS_DIR, `${id}.csv`);
  const xlsxPath = path.join(BACKUPS_DIR, `${id}.xlsx`);
  const sqlPath = path.join(BACKUPS_DIR, `${id}.sql`);

  if (fs.existsSync(csvPath) && fs.existsSync(xlsxPath) && fs.existsSync(sqlPath)) {
    try {
      const csvContent = fs.readFileSync(csvPath);
      const xlsxContent = fs.readFileSync(xlsxPath);
      const sqlContent = fs.readFileSync(sqlPath);
      const data = {
        csvBase64: csvContent.toString('base64'),
        xlsxBase64: xlsxContent.toString('base64'),
        sqlBase64: sqlContent.toString('base64'),
      };
      if (global._localBackupBinaries) {
        global._localBackupBinaries[id] = data;
      }
      return data;
    } catch (e) {
      console.error('[Backup System] Fallback read from physical files failed:', e);
    }
  }

  return null;
}

// Save binary data to separate binary storage table (isolated from metadata to avoid payload size overhead)
async function saveBackupBinary(id: string, binaryData: BackupBinaryData) {
  if (global._localBackupBinaries) {
    global._localBackupBinaries[id] = binaryData;
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const dbRow = {
        id,
        csv_base64: binaryData.csvBase64,
        xlsx_base64: binaryData.xlsxBase64,
        sql_base64: binaryData.sqlBase64
      };

      const { error } = await supabase
        .from('backups_binary')
        .insert([dbRow]);

      if (error && !error.message.includes('duplicate key') && !error.message.includes('already exists')) {
        console.error(`[Backup System] Error inserting binary ${id} to Supabase:`, error);
      } else {
        console.log(`[Backup System] Successfully saved binary ${id} to Supabase table`);
      }
    } catch (dbError) {
      console.error(`[Backup System] Database upsert error for binary ${id}:`, dbError);
    }
  }

  // File system fallback
  try {
    ensureDirectories();
    let allBinaries: Record<string, BackupBinaryData> = {};
    if (fs.existsSync(BINARY_FILE)) {
      try {
        const content = fs.readFileSync(BINARY_FILE, 'utf-8');
        allBinaries = JSON.parse(content);
      } catch (e) {
        console.warn('Binary storage empty or corrupt, initializing brand new:', e);
      }
    }

    allBinaries[id] = binaryData;
    fs.writeFileSync(BINARY_FILE, JSON.stringify(allBinaries, null, 2), 'utf-8');
  } catch (error) {
    console.warn('[Backup System] Local binary save skipped (common on edge environments):', error);
  }
}

// Helper: Escape CSV string
function escapeCSV(val: any): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// Helper: Escape SQL string
function escapeSQL(val: any): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return String(val);
  const str = String(val);
  return `'${str.replace(/'/g, "''")}'`;
}

// Generate CSV string
function generateCSV(reviews: Review[]): string {
  const headers = [
    'id', 'company_id', 'company_name', 'branch_location', 'position', 'employment_status',
    'salary', 'bonus', 'experience_years', 'rating_career', 'rating_balance',
    'rating_management', 'rating_compensation', 'rating_culture', 'review_text',
    'created_at', 'previous_hash', 'hash'
  ];

  const rows = reviews.map(r => [
    r.id, r.company_id, r.company_name, r.branch_location, r.position, r.employment_status,
    r.salary, r.bonus, r.experience_years, r.rating_career, r.rating_balance,
    r.rating_management, r.rating_compensation, r.rating_culture, r.review_text,
    r.created_at, r.previous_hash, r.hash
  ].map(escapeCSV).join(','));

  return [headers.join(','), ...rows].join('\n');
}

// Generate SQL string
function generateSQL(reviews: Review[], dateStr: string): string {
  let sql = `-- Workplace Anonymous Review Ledger System SQL Dump\n`;
  sql += `-- Generated on: ${dateStr}\n`;
  sql += `-- Total Records: ${reviews.length}\n\n`;

  sql += `CREATE TABLE IF NOT EXISTS reviews (\n`;
  sql += `  id VARCHAR(255) PRIMARY KEY,\n`;
  sql += `  company_id VARCHAR(255),\n`;
  sql += `  company_name VARCHAR(255) NOT NULL,\n`;
  sql += `  branch_location VARCHAR(255) NOT NULL,\n`;
  sql += `  position VARCHAR(255) NOT NULL,\n`;
  sql += `  employment_status VARCHAR(50) DEFAULT 'current',\n`;
  sql += `  salary INT DEFAULT 0,\n`;
  sql += `  bonus INT DEFAULT 0,\n`;
  sql += `  experience_years INT DEFAULT 1,\n`;
  sql += `  rating_career INT DEFAULT 5,\n`;
  sql += `  rating_balance INT DEFAULT 5,\n`;
  sql += `  rating_management INT DEFAULT 5,\n`;
  sql += `  rating_compensation INT DEFAULT 5,\n`;
  sql += `  rating_culture INT DEFAULT 5,\n`;
  sql += `  review_text TEXT NOT NULL,\n`;
  sql += `  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n`;
  sql += `  previous_hash VARCHAR(255),\n`;
  sql += `  hash VARCHAR(255)\n`;
  sql += `);\n\n`;

  if (reviews.length === 0) {
    sql += `-- No reviews data to insert.\n`;
    return sql;
  }

  sql += `INSERT INTO reviews (id, company_id, company_name, branch_location, position, employment_status, salary, bonus, experience_years, rating_career, rating_balance, rating_management, rating_compensation, rating_culture, review_text, created_at, previous_hash, hash) VALUES\n`;

  const valuesList = reviews.map(r => {
    return `  (${escapeSQL(r.id)}, ${escapeSQL(r.company_id)}, ${escapeSQL(r.company_name)}, ${escapeSQL(r.branch_location)}, ${escapeSQL(r.position)}, ${escapeSQL(r.employment_status)}, ${r.salary}, ${r.bonus}, ${r.experience_years}, ${r.rating_career}, ${r.rating_balance}, ${r.rating_management}, ${r.rating_compensation}, ${r.rating_culture}, ${escapeSQL(r.review_text)}, ${escapeSQL(r.created_at)}, ${escapeSQL(r.previous_hash)}, ${escapeSQL(r.hash)})`;
  });

  sql += valuesList.join(',\n') + ';\n';
  return sql;
}

// Generate XLSX buffer
function generateXLSXBuffer(reviews: Review[]): Buffer {
  const formattedData = reviews.map(r => ({
    'ID': r.id,
    '公司唯一ID': r.company_id,
    '公司名称': r.company_name,
    '分部/地点': r.branch_location,
    '职位名称': r.position,
    '在职状态': r.employment_status === 'current' ? '在职' : '离职',
    '月薪(元)': r.salary,
    '年终奖(元)': r.bonus,
    '工作年限(年)': r.experience_years,
    '职业发展评分': r.rating_career,
    '生活平衡评分': r.rating_balance,
    '管理层评分': r.rating_management,
    '福利待遇评分': r.rating_compensation,
    '企业文化评分': r.rating_culture,
    '评价内容': r.review_text,
    '发布时间': r.created_at,
    '前序区块哈希': r.previous_hash,
    '区块哈希': r.hash
  }));

  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  
  const colWidths = [
    { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 20 }, { wch: 10 },
    { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
    { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 45 }, { wch: 25 },
    { wch: 30 }, { wch: 30 }
  ];
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '职场匿名评价');
  
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

// Core execution function to trigger backup
export async function createBackupForDate(dateStr: string): Promise<BackupMetadata | null> {
  console.log(`[Backup System] Generating daily backup archive for: ${dateStr}`);

  try {
    const reviews = await getReviews();
    const id = `backup-${dateStr}`;

    // 1. Generate CSV
    const csvContent = generateCSV(reviews);
    const csvBuffer = Buffer.from(csvContent, 'utf-8');

    // 2. Generate SQL
    const sqlContent = generateSQL(reviews, dateStr);
    const sqlBuffer = Buffer.from(sqlContent, 'utf-8');

    // 3. Generate XLSX
    const xlsxBuffer = generateXLSXBuffer(reviews);

    // Save physical file copy if file system allows
    try {
      ensureDirectories();
      const csvPath = path.join(BACKUPS_DIR, `${id}.csv`);
      fs.writeFileSync(csvPath, csvBuffer);

      const sqlPath = path.join(BACKUPS_DIR, `${id}.sql`);
      fs.writeFileSync(sqlPath, sqlBuffer);

      const xlsxPath = path.join(BACKUPS_DIR, `${id}.xlsx`);
      fs.writeFileSync(xlsxPath, xlsxBuffer);
    } catch (fsWriteError) {
      console.log('[Backup System] Local individual files write skipped (safe to ignore in write-restricted environments)');
    }

    // 4. Save metadata
    const metadataList = await loadBackupMetadata();
    const existingIndex = metadataList.findIndex(m => m.id === id);

    const newMetadata: BackupMetadata = {
      id,
      date: dateStr,
      createdAt: new Date().toISOString(),
      reviewCount: reviews.length,
      csvSize: csvBuffer.length,
      xlsxSize: xlsxBuffer.length,
      sqlSize: sqlBuffer.length
    };

    if (existingIndex >= 0) {
      metadataList[existingIndex] = newMetadata;
    } else {
      metadataList.unshift(newMetadata);
    }
    await saveBackupMetadata(metadataList);

    // 5. Save binary base64 contents
    const binaryData: BackupBinaryData = {
      csvBase64: csvBuffer.toString('base64'),
      xlsxBase64: xlsxBuffer.toString('base64'),
      sqlBase64: sqlBuffer.toString('base64'),
    };
    await saveBackupBinary(id, binaryData);

    // 6. Clean up backups older than 7 days
    try {
      await cleanOldBackups();
    } catch (cleanupError) {
      console.error('[Backup System] Error during old backups cleanup:', cleanupError);
    }

    console.log(`[Backup System] Daily backup completed successfully for: ${dateStr}`);
    return newMetadata;
  } catch (error) {
    console.error(`[Backup System] FAILED to create backup for ${dateStr}:`, error);
    return null;
  }
}

// Helper: Clean up backups older than 7 days
export async function cleanOldBackups(): Promise<void> {
  const metadataList = await loadBackupMetadata();
  if (metadataList.length === 0) return;

  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const remainingMetadata: BackupMetadata[] = [];
  const removedIds: string[] = [];

  for (const backup of metadataList) {
    const dateParts = backup.date.split('-');
    if (dateParts.length !== 3) {
      remainingMetadata.push(backup);
      continue;
    }
    const year = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10);
    const day = parseInt(dateParts[2], 10);
    const backupDate = new Date(year, month - 1, day);

    const diffTime = todayMidnight.getTime() - backupDate.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    if (diffDays >= 7) {
      removedIds.push(backup.id);
    } else {
      remainingMetadata.push(backup);
    }
  }

  if (removedIds.length === 0) return;

  console.log(`[Backup Cleanup] Cleaning up ${removedIds.length} expired backups older than 7 days:`, removedIds);

  await saveBackupMetadata(remainingMetadata);

  // Delete from Supabase tables
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { error: metadataErr } = await supabase
        .from('backups_metadata')
        .delete()
        .in('id', removedIds);

      if (metadataErr) {
        console.error('[Backup Cleanup] Error deleting metadata rows:', metadataErr);
      }

      const { error: binaryErr } = await supabase
        .from('backups_binary')
        .delete()
        .in('id', removedIds);

      if (binaryErr) {
        console.error('[Backup Cleanup] Error deleting binary rows:', binaryErr);
      }
    } catch (dbError) {
      console.error('[Backup Cleanup] Failed to delete rows from Supabase:', dbError);
    }
  }

  // Delete local physical copies if they exist
  for (const id of removedIds) {
    const csvPath = path.join(BACKUPS_DIR, `${id}.csv`);
    const xlsxPath = path.join(BACKUPS_DIR, `${id}.xlsx`);
    const sqlPath = path.join(BACKUPS_DIR, `${id}.sql`);

    try {
      if (fs.existsSync(csvPath)) fs.unlinkSync(csvPath);
      if (fs.existsSync(xlsxPath)) fs.unlinkSync(xlsxPath);
      if (fs.existsSync(sqlPath)) fs.unlinkSync(sqlPath);
    } catch (err) {
      // safe to ignore on write-restricted systems
    }
  }

  // Delete from local binary JSON
  try {
    if (fs.existsSync(BINARY_FILE)) {
      const content = fs.readFileSync(BINARY_FILE, 'utf-8');
      const allBinaries = JSON.parse(content);
      let changed = false;
      for (const id of removedIds) {
        if (allBinaries[id]) {
          delete allBinaries[id];
          changed = true;
        }
        if (global._localBackupBinaries && global._localBackupBinaries[id]) {
          delete global._localBackupBinaries[id];
        }
      }
      if (changed) {
        fs.writeFileSync(BINARY_FILE, JSON.stringify(allBinaries, null, 2), 'utf-8');
      }
    }
  } catch (error) {
    // safe to ignore on edge
  }
}

// Automatic hourly scheduler check
export async function checkAndRunScheduledBackup(): Promise<void> {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    const metadataList = await loadBackupMetadata();
    const hasTodayBackup = metadataList.some(m => m.date === todayStr);

    if (!hasTodayBackup) {
      console.log(`[Backup System Scheduler] No backup found for today (${todayStr}). Starting generation...`);
      await createBackupForDate(todayStr);
    }

    try {
      await cleanOldBackups();
    } catch (cleanupError) {
      console.error('[Backup System Scheduler] Error during cleanup check:', cleanupError);
    }
  } catch (error) {
    console.error('[Backup System Scheduler] Error during scheduled backup check:', error);
  }
}

// Background scheduler daemon
let schedulerActive = false;
export function initBackupScheduler() {
  if (schedulerActive) return;
  schedulerActive = true;

  console.log('[Backup System] Initializing database-driven backup daemon...');
  
  checkAndRunScheduledBackup().catch(err => {
    console.error('[Backup System] Initial scheduler execution failed:', err);
  });

  // Run a check every 30 minutes
  setInterval(() => {
    checkAndRunScheduledBackup().catch(err => {
      console.error('[Backup System] Scheduled backup run failed:', err);
    });
  }, 30 * 60 * 1000);
}
