import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

export interface Review {
  id: string;
  company_id: string; // Linked unique id of the company
  company_name: string;
  branch_location: string;
  position: string;
  employment_status: string; // 'current' | 'former'
  salary: number; // Monthly salary in CNY
  bonus: number; // Annual bonus in CNY
  experience_years: number;
  rating_career: number; // 1-5
  rating_balance: number; // 1-5
  rating_management: number; // 1-5
  rating_compensation: number; // 1-5
  rating_culture: number; // 1-5
  review_text: string;
  created_at: string;
  previous_hash: string;
  hash: string;
}

export interface Company {
  id: string;
  name: string;
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

// Global cached in-memory fallback to avoid frequent disk reads and ensure state consistency
declare global {
  var _localReviews: Review[] | undefined;
  var _localCompanies: Company[] | undefined;
}

const LOCAL_DIR = path.join(process.cwd(), 'data');
const LOCAL_FILE = path.join(LOCAL_DIR, 'reviews.json');
const COMPANIES_FILE = path.join(LOCAL_DIR, 'companies.json');
const BACKUP_FILE = '/tmp/reviews_backup.json';

// Helper: Ensure directories exist
function ensureDirectories() {
  try {
    if (!fs.existsSync(LOCAL_DIR)) {
      fs.mkdirSync(LOCAL_DIR, { recursive: true });
    }
  } catch (err) {
    // Suppress filesystem folder errors on read-only serverless edge containers
  }
}

// Helper: Determine unique company id from company name
export function getCompanyIdFromName(name: string): string {
  const cleanName = name.trim().toLowerCase();
  return 'comp-' + crypto.createHash('md5').update(cleanName).digest('hex').substring(0, 12);
}

// Initialize in-memory caches
if (!global._localReviews) {
  global._localReviews = loadLocalReviews();
}
if (!global._localCompanies) {
  global._localCompanies = loadLocalCompanies();
}

// Note: The backup scheduler daemon is now initialized lazily at runtime (e.g. inside API routes)
// to prevent circular dependency issues and ReferenceError: Cannot access 'z' before initialization during build time.

// Function to calculate cryptographic hash for a review
export function calculateReviewHash(review: Omit<Review, 'hash'>): string {
  const dataString = [
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
    review.previous_hash
  ].join('|');

  return crypto.createHash('sha256').update(dataString).digest('hex');
}

// Load reviews from disk
function loadLocalReviews(): Review[] {
  try {
    if (fs.existsSync(LOCAL_FILE)) {
      const content = fs.readFileSync(LOCAL_FILE, 'utf-8');
      const parsed: Review[] = JSON.parse(content);
      // Migrate reviews that don't have company_id
      let changed = false;
      const migrated = parsed.map(r => {
        if (!r.company_id) {
          r.company_id = getCompanyIdFromName(r.company_name);
          changed = true;
        }
        return r;
      });
      if (changed) {
        saveReviewsToDisk(migrated);
      }
      return migrated;
    }
  } catch (error) {
    console.warn('Error reading reviews from primary storage, trying backup:', error);
  }

  try {
    if (fs.existsSync(BACKUP_FILE)) {
      const content = fs.readFileSync(BACKUP_FILE, 'utf-8');
      const parsed: Review[] = JSON.parse(content);
      return parsed.map(r => {
        if (!r.company_id) {
          r.company_id = getCompanyIdFromName(r.company_name);
        }
        return r;
      });
    }
  } catch (error) {
    console.error('Error reading reviews from backup storage:', error);
  }

  return [];
}

// Load companies from disk fallback
function loadLocalCompanies(): Company[] {
  try {
    if (fs.existsSync(COMPANIES_FILE)) {
      const content = fs.readFileSync(COMPANIES_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.warn('Error reading companies from primary storage:', error);
  }
  return [];
}

// Save reviews to disk
function saveReviewsToDisk(reviews: Review[]) {
  try {
    ensureDirectories();
    fs.writeFileSync(LOCAL_FILE, JSON.stringify(reviews, null, 2), 'utf-8');
  } catch (error) {
    console.warn('Failed to write reviews to primary disk storage, trying backup storage:', error);
  }

  try {
    fs.writeFileSync(BACKUP_FILE, JSON.stringify(reviews, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to write reviews to backup storage:', error);
  }
}

// Save companies to disk fallback
function saveCompaniesToDisk(companies: Company[]) {
  try {
    ensureDirectories();
    fs.writeFileSync(COMPANIES_FILE, JSON.stringify(companies, null, 2), 'utf-8');
  } catch (error) {
    console.warn('Failed to write companies to disk:', error);
  }
}

// Initialize Supabase Client dynamically to prevent crash if env vars are missing
function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (url && key) {
    return createClient(url, key);
  }
  return null;
}

// Public API: Get all reviews
export async function getReviews(): Promise<Review[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      if (data) {
        // Sync local cache with Supabase (even if empty) and return
        const mappedData = data.map((r: any) => {
          if (!r.company_id) {
            r.company_id = getCompanyIdFromName(r.company_name);
          }
          return r as Review;
        });
        global._localReviews = mappedData;
        saveReviewsToDisk(global._localReviews);
        return global._localReviews;
      }
    } catch (e) {
      console.error('Failed to fetch from Supabase, falling back to local storage:', e);
    }
  }

  return global._localReviews || [];
}

// Get reviews of a specific company by its ID
export async function getCompanyReviewsById(companyId: string): Promise<Review[]> {
  const allReviews = await getReviews();
  return allReviews.filter(
    (r) => r.company_id === companyId
  );
}

// Get reviews of a specific company by its name (legacy fallback)
export async function getCompanyReviews(companyName: string): Promise<Review[]> {
  const companyId = getCompanyIdFromName(companyName);
  return getCompanyReviewsById(companyId);
}

// Get all companies list with optional search parameter
export async function getCompanies(search?: string): Promise<Company[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      let query = supabase.from('companies').select('*');
      if (search) {
        query = query.ilike('name', `%${search.trim()}%`);
      }
      const { data, error } = await query.order('name', { ascending: true });

      if (!error && data) {
        const mapped: Company[] = data
          .filter((item: any) => item.id !== 'comp-unknown')
          .map((item: any) => ({
            id: item.id,
            name: item.name,
            created_at: item.created_at || item.createdAt,
            review_count: item.review_count !== undefined ? item.review_count : item.reviewCount,
            avg_rating: Number(item.avg_rating !== undefined ? item.avg_rating : item.avgRating || 0),
            avg_career: Number(item.avg_career !== undefined ? item.avg_career : item.avgCareer || 0),
            avg_balance: Number(item.avg_balance !== undefined ? item.avg_balance : item.avgBalance || 0),
            avg_management: Number(item.avg_management !== undefined ? item.avg_management : item.avgManagement || 0),
            avg_compensation: Number(item.avg_compensation !== undefined ? item.avg_compensation : item.avgCompensation || 0),
            avg_culture: Number(item.avg_culture !== undefined ? item.avg_culture : item.avgCulture || 0),
            avg_salary: Number(item.avg_salary !== undefined ? item.avg_salary : item.avgSalary || 0),
            avg_bonus: Number(item.avg_bonus !== undefined ? item.avg_bonus : item.avgBonus || 0)
          }));
        // Only update local global cache with full list if not searching
        if (!search) {
          global._localCompanies = mapped;
          saveCompaniesToDisk(mapped);
        }
        return mapped;
      }
      console.warn('[DB] Supabase companies select error, calculating on-the-fly:', error);
    } catch (dbError) {
      console.warn('[DB] Failed to load companies from Supabase, falling back to local or calculated:', dbError);
    }
  }

  // File system fallback
  let local = loadLocalCompanies().filter(c => c.id !== 'comp-unknown');
  if (local.length === 0) {
    // Calculate from reviews dynamically if no companies list is saved
    const reviews = await getReviews();
    local = (await recalculateAllCompanies(reviews)).filter(c => c.id !== 'comp-unknown');
    global._localCompanies = local;
    saveCompaniesToDisk(local);
  } else {
    global._localCompanies = local;
  }

  if (search) {
    const term = search.trim().toLowerCase();
    return local.filter(c => c.name.toLowerCase().includes(term));
  }
  return local;
}

// Get single company details by its ID
export async function getCompanyById(companyId: string): Promise<Company | null> {
  const companies = await getCompanies();
  const found = companies.find(c => c.id === companyId);
  if (found) {
    return found;
  }

  // Robust fallback: if not found in the cached/database list, check if reviews exist
  // and construct the company stats dynamically. This prevents "Company Not Found"
  const reviews = await getCompanyReviewsById(companyId);
  if (reviews.length > 0) {
    const name = reviews[0].company_name;
    const stats = calculateStatsForReviews(reviews);
    const calculated: Company = {
      id: companyId,
      name,
      created_at: reviews[0].created_at || new Date().toISOString(),
      ...stats
    };
    return calculated;
  }

  return null;
}

// Recalculate company metrics for robust local consistency
export async function recalculateAllCompanies(reviews: Review[]): Promise<Company[]> {
  const companiesMap = new Map<string, Review[]>();
  reviews.forEach(r => {
    const cId = r.company_id || getCompanyIdFromName(r.company_name);
    if (!companiesMap.has(cId)) {
      companiesMap.set(cId, []);
    }
    companiesMap.get(cId)!.push(r);
  });

  const companies: Company[] = [];
  for (const [cId, compReviews] of companiesMap.entries()) {
    const name = compReviews[0].company_name;
    const stats = calculateStatsForReviews(compReviews);
    companies.push({
      id: cId,
      name,
      created_at: compReviews[0].created_at || new Date().toISOString(),
      ...stats
    });
  }
  return companies;
}

// Helper: Calculate average stats from reviews list
function calculateStatsForReviews(reviews: Review[]) {
  const len = reviews.length;
  if (len === 0) {
    return {
      review_count: 0,
      avg_rating: 0,
      avg_career: 0,
      avg_balance: 0,
      avg_management: 0,
      avg_compensation: 0,
      avg_culture: 0,
      avg_salary: 0,
      avg_bonus: 0
    };
  }

  const career = reviews.reduce((sum, r) => sum + r.rating_career, 0) / len;
  const balance = reviews.reduce((sum, r) => sum + r.rating_balance, 0) / len;
  const management = reviews.reduce((sum, r) => sum + r.rating_management, 0) / len;
  const compensation = reviews.reduce((sum, r) => sum + r.rating_compensation, 0) / len;
  const culture = reviews.reduce((sum, r) => sum + r.rating_culture, 0) / len;

  const salaries = reviews.map(r => r.salary).filter(s => s > 0);
  const avgSalary = salaries.length > 0 ? salaries.reduce((sum, s) => sum + s, 0) / salaries.length : 0;

  const bonuses = reviews.map(r => r.bonus).filter(b => b > 0);
  const avgBonus = bonuses.length > 0 ? bonuses.reduce((sum, b) => sum + b, 0) / bonuses.length : 0;

  const avgRating = (career + balance + management + compensation + culture) / 5;

  return {
    review_count: len,
    avg_rating: Number(avgRating.toFixed(2)),
    avg_career: Number(career.toFixed(2)),
    avg_balance: Number(balance.toFixed(2)),
    avg_management: Number(management.toFixed(2)),
    avg_compensation: Number(compensation.toFixed(2)),
    avg_culture: Number(culture.toFixed(2)),
    avg_salary: Math.round(avgSalary),
    avg_bonus: Math.round(avgBonus)
  };
}

// Public API: Add a review and automatically associate with / create / update company
export async function addReview(reviewData: Omit<Review, 'id' | 'company_id' | 'created_at' | 'previous_hash' | 'hash'>): Promise<Review> {
  const allReviews = await getReviews();
  
  // Find company_id
  const companyName = reviewData.company_name.trim();
  const companyId = getCompanyIdFromName(companyName);

  // Find previous review of this company to build blockchain ledger
  const companyReviews = allReviews.filter(
    (r) => r.company_id === companyId
  );

  const previousReview = companyReviews[companyReviews.length - 1];
  const previousHash = previousReview ? previousReview.hash : '0';

  const newReview: Review = {
    ...reviewData,
    company_id: companyId,
    id: `rev-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    created_at: new Date().toISOString(),
    previous_hash: previousHash,
    hash: ''
  };

  // Generate cryptographic hash
  newReview.hash = calculateReviewHash(newReview);

  // Add to cached reviews
  const updatedReviews = [...allReviews, newReview];
  global._localReviews = updatedReviews;
  saveReviewsToDisk(updatedReviews);

  // Recalculate company stats
  const companyReviewsUpdated = [...companyReviews, newReview];
  const stats = calculateStatsForReviews(companyReviewsUpdated);
  const company: Company = {
    id: companyId,
    name: companyName,
    created_at: companyReviews[0]?.created_at || newReview.created_at,
    ...stats
  };

  // Update company list cache
  const allCompanies = await getCompanies();
  const existingIdx = allCompanies.findIndex(c => c.id === companyId);
  if (existingIdx >= 0) {
    allCompanies[existingIdx] = company;
  } else {
    allCompanies.push(company);
  }
  global._localCompanies = allCompanies;
  saveCompaniesToDisk(allCompanies);

  // Try saving both review and company to Supabase if configured
  const supabase = getSupabaseClient();
  if (supabase) {
    // 1. Upsert company to companies table
    const { error: compError } = await supabase
      .from('companies')
      .upsert({
        id: company.id,
        name: company.name,
        created_at: company.created_at,
        review_count: company.review_count,
        avg_rating: company.avg_rating,
        avg_career: company.avg_career,
        avg_balance: company.avg_balance,
        avg_management: company.avg_management,
        avg_compensation: company.avg_compensation,
        avg_culture: company.avg_culture,
        avg_salary: company.avg_salary,
        avg_bonus: company.avg_bonus
      });

    if (compError) {
      console.error('Error inserting company into Supabase:', compError);
      throw new Error(`创建或更新公司失败: ${compError.message}。由于数据库中可能缺少 companies 表，请在 Supabase 中运行 /migration.sql 执行数据库迁移！`);
    } else {
      console.log('Successfully saved company info to Supabase');
    }

    // 2. Insert review to reviews table
    const { error: revError } = await supabase.from('reviews').insert([newReview]);
    if (revError) {
      console.error('Error inserting review into Supabase:', revError);
      throw new Error(`创建评价失败: ${revError.message}。由于 reviews 表中可能没有 company_id 字段，请在 Supabase 中运行 /migration.sql 执行数据库迁移！`);
    } else {
      console.log('Successfully saved review to Supabase');
    }
  }

  return newReview;
}

// Ledger integrity verification function
export function verifyLedgerIntegrity(reviews: Review[]): {
  isValid: boolean;
  tamperedIndex: number | null;
  details: { index: number; reviewId: string; status: 'ok' | 'hash_mismatch' | 'chain_broken'; computedHash: string; storedHash: string }[];
} {
  const details: { index: number; reviewId: string; status: 'ok' | 'hash_mismatch' | 'chain_broken'; computedHash: string; storedHash: string }[] = [];
  
  for (let i = 0; i < reviews.length; i++) {
    const r = reviews[i];
    const computedHash = calculateReviewHash(r);

    // 1. Verify block self-integrity (is the current stored hash correct based on content?)
    if (computedHash !== r.hash) {
      details.push({
        index: i,
        reviewId: r.id,
        status: 'hash_mismatch',
        computedHash,
        storedHash: r.hash
      });
      return { isValid: false, tamperedIndex: i, details };
    }

    // 2. Verify blockchain link integrity (does the block's prev_hash match the previous block's hash?)
    if (i > 0) {
      const expectedPrev = reviews[i - 1].hash;
      if (r.previous_hash !== expectedPrev) {
        details.push({
          index: i,
          reviewId: r.id,
          status: 'chain_broken',
          computedHash,
          storedHash: r.hash
        });
        return { isValid: false, tamperedIndex: i, details };
      }
    }
    
    details.push({
      index: i,
      reviewId: r.id,
      status: 'ok',
      computedHash,
      storedHash: r.hash
    });
  }

  return { isValid: true, tamperedIndex: null, details };
}
