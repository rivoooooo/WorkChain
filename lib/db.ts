import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

export interface Review {
  id: string;
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

// Global cached in-memory fallback to avoid frequent disk reads and ensure state consistency
declare global {
  var _localReviews: Review[] | undefined;
}

const LOCAL_DIR = path.join(process.cwd(), 'data');
const LOCAL_FILE = path.join(LOCAL_DIR, 'reviews.json');
const BACKUP_FILE = '/tmp/reviews_backup.json';

// Initialize in-memory cache
if (!global._localReviews) {
  global._localReviews = loadLocalReviews();
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
      return JSON.parse(content);
    }
  } catch (error) {
    console.warn('Error reading reviews from primary storage, trying backup:', error);
  }

  try {
    if (fs.existsSync(BACKUP_FILE)) {
      const content = fs.readFileSync(BACKUP_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.error('Error reading reviews from backup storage:', error);
  }

  // Default seed data to make the app interactive on first launch
  const seedReviews: Review[] = [
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
      previous_hash: '0',
      hash: ''
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
      previous_hash: '',
      hash: ''
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
      previous_hash: '0',
      hash: ''
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
      previous_hash: '0',
      hash: ''
    }
  ];

  // Build the block hashes for seed data
  const companies = Array.from(new Set(seedReviews.map(r => r.company_name)));
  companies.forEach(company => {
    const companyReviews = seedReviews.filter(r => r.company_name === company);
    let prevHash = '0';
    companyReviews.forEach((review) => {
      review.previous_hash = prevHash;
      review.hash = calculateReviewHash(review);
      prevHash = review.hash;
    });
  });

  saveReviewsToDisk(seedReviews);
  return seedReviews;
}

// Save reviews to disk
function saveReviewsToDisk(reviews: Review[]) {
  try {
    if (!fs.existsSync(LOCAL_DIR)) {
      fs.mkdirSync(LOCAL_DIR, { recursive: true });
    }
    fs.writeFileSync(LOCAL_FILE, JSON.stringify(reviews, null, 2), 'utf-8');
  } catch (error) {
    console.warn('Failed to write to primary disk storage, trying backup storage:', error);
  }

  try {
    fs.writeFileSync(BACKUP_FILE, JSON.stringify(reviews, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to write to backup storage:', error);
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

// Public API
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
        global._localReviews = data as Review[];
        saveReviewsToDisk(global._localReviews);
        return global._localReviews;
      }
    } catch (e) {
      console.error('Failed to fetch from Supabase, falling back to local storage:', e);
    }
  }

  return global._localReviews || [];
}

export async function getCompanyReviews(companyName: string): Promise<Review[]> {
  const allReviews = await getReviews();
  return allReviews.filter(
    (r) => r.company_name.toLowerCase().trim() === companyName.toLowerCase().trim()
  );
}

export async function addReview(reviewData: Omit<Review, 'id' | 'created_at' | 'previous_hash' | 'hash'>): Promise<Review> {
  const allReviews = await getReviews();
  
  // Find the previous review for this specific company to build the hash chain
  const companyReviews = allReviews.filter(
    (r) => r.company_name.toLowerCase().trim() === reviewData.company_name.toLowerCase().trim()
  );

  const previousReview = companyReviews[companyReviews.length - 1];
  const previousHash = previousReview ? previousReview.hash : '0';

  const newReview: Review = {
    ...reviewData,
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

  // Try saving to Supabase if configured
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { error } = await supabase.from('reviews').insert([newReview]);
      if (error) {
        console.error('Error inserting review into Supabase:', error);
      } else {
        console.log('Successfully saved review to Supabase');
      }
    } catch (e) {
      console.error('Failed to upload review to Supabase:', e);
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
  
  let currentExpectedPrevHash = '0';

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
    if (i === 0) {
      // The first block in the company list can have custom previous_hash, but let's check it matches its stored value
      if (r.previous_hash !== '0') {
        // Find if there is a global block sequence, but within the company ledger, we verify relative chain.
        // If the company has multiple reviews, they must form a chain.
      }
    } else {
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
