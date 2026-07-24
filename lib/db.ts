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

// Start automatic backup task check-and-run daemon asynchronously
try {
  const { initBackupScheduler } = require('./backups');
  initBackupScheduler();
} catch (e) {
  console.error('Failed to initialize backup scheduler daemon:', e);
}

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

  // Default seed data to make the app interactive on first launch
  const seedReviews: Omit<Review, 'company_id' | 'hash'>[] = [
    {
      id: 'seed-1',
      company_name: '阿里巴巴',
      branch_location: '杭州总部',
      position: '高级前端工程师',
      employment_status: 'former',
      salary: 32000,
      bonus: 100000,
      experience_years: 5,
      rating_career: 4,
      rating_balance: 2,
      rating_management: 3,
      rating_compensation: 4,
      rating_culture: 3,
      review_text: '杭州西溪园区办公环境很好，配套设施齐全。技术氛围浓厚，能接触到很多优秀的中间件和前沿方案。但是加班确实比较多，361考评压力大，OKR汇报频繁。薪资福利在业内属于第一梯队，但性价比正在降低。',
      created_at: '2026-01-15T10:30:00.000Z',
      previous_hash: '0'
    },
    {
      id: 'seed-2',
      company_name: '阿里巴巴',
      branch_location: '北京分部',
      position: '算法专家',
      employment_status: 'current',
      salary: 45000,
      bonus: 180000,
      experience_years: 8,
      rating_career: 5,
      rating_balance: 3,
      rating_management: 4,
      rating_compensation: 5,
      rating_culture: 4,
      review_text: '北京这边的算法团队实力很强，做的业务很有挑战性。薪资天花板高，配股大方。工作强度看团队，有的组比较卷，有的组九点多就下班了。管理层比较务实，没有太多形式主义。',
      created_at: '2026-03-20T14:45:00.000Z',
      previous_hash: ''
    },
    {
      id: 'seed-3',
      company_name: '腾讯',
      branch_location: '深圳总部',
      position: '产品经理',
      employment_status: 'current',
      salary: 28000,
      bonus: 150000,
      experience_years: 3,
      rating_career: 4,
      rating_balance: 4,
      rating_management: 4,
      rating_compensation: 4,
      rating_culture: 5,
      review_text: '瑞府和腾讯大厦条件都没得说，食堂简直是行业标杆，还有免费班车和晚班打车报销。产品文化根深蒂固，流程规范，能学到很多系统性的方法论。WLB在互联网大厂里算不错的，大部分部门能保证周末休息。',
      created_at: '2026-02-10T11:15:00.000Z',
      previous_hash: '0'
    },
    {
      id: 'seed-4',
      company_name: '字节跳动',
      branch_location: '北京总部',
      position: '后端开发工程师',
      employment_status: 'current',
      salary: 38000,
      bonus: 120000,
      experience_years: 4,
      rating_career: 4,
      rating_balance: 2,
      rating_management: 3,
      rating_compensation: 5,
      rating_culture: 4,
      review_text: '扁平化管理，不称呼总、总监，一律叫名字，技术大牛很多。免费三餐和零食下午茶质量极高，房补政策非常贴心。但是节奏极快，飞书文档铺天盖地，数据导向和双月OKR让人喘不过气，晚上基本10点以后下班。',
      created_at: '2026-04-05T09:00:00.000Z',
      previous_hash: '0'
    }
  ];

  const processedReviews: Review[] = seedReviews.map(r => ({
    ...r,
    company_id: getCompanyIdFromName(r.company_name),
    hash: ''
  }));

  // Build the block hashes for seed data
  const companyIds = Array.from(new Set(processedReviews.map(r => r.company_id)));
  companyIds.forEach(cId => {
    const companyReviews = processedReviews.filter(r => r.company_id === cId);
    let prevHash = '0';
    companyReviews.forEach((review) => {
      review.previous_hash = prevHash;
      review.hash = calculateReviewHash(review);
      prevHash = review.hash;
    });
  });

  saveReviewsToDisk(processedReviews);
  return processedReviews;
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

// Get all companies list
export async function getCompanies(): Promise<Company[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('name', { ascending: true });

      if (!error && data) {
        const mapped: Company[] = data.map((item: any) => ({
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
        global._localCompanies = mapped;
        saveCompaniesToDisk(mapped);
        return mapped;
      }
      console.warn('[DB] Supabase companies select error, calculating on-the-fly:', error);
    } catch (dbError) {
      console.warn('[DB] Failed to load companies from Supabase, falling back to local or calculated:', dbError);
    }
  }

  // File system fallback
  const local = loadLocalCompanies();
  if (local.length > 0) {
    global._localCompanies = local;
    return local;
  }

  // Calculate from reviews dynamically if no companies list is saved
  const reviews = await getReviews();
  const calculated = await recalculateAllCompanies(reviews);
  global._localCompanies = calculated;
  saveCompaniesToDisk(calculated);
  return calculated;
}

// Get single company details by its ID
export async function getCompanyById(companyId: string): Promise<Company | null> {
  const companies = await getCompanies();
  return companies.find(c => c.id === companyId) || null;
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
    try {
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
      } else {
        console.log('Successfully saved company info to Supabase');
      }

      // 2. Insert review to reviews table
      const { error: revError } = await supabase.from('reviews').insert([newReview]);
      if (revError) {
        console.error('Error inserting review into Supabase:', revError);
      } else {
        console.log('Successfully saved review to Supabase');
      }
    } catch (e) {
      console.error('Failed to upload review or company to Supabase:', e);
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
