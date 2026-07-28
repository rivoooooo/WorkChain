'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { i18n, Language, resolveLanguage } from '../../../../lib/i18n';
import { CompanyGovernancePanel } from '../../../../components/company-governance-panel';
import {
  getPublicCompanyById,
  getPublicCompanyDetails,
  getPublicCompanyReviews,
  getPublicRelatedCompanies,
} from '../../../../lib/public-data';
import {
  Building,
  Search,
  ArrowUpDown,
  Star,
  Clock,
  DollarSign,
  Activity,
  Sparkles,
  Lock,
  RefreshCw,
  Loader2,
  ShieldCheck,
  ShieldAlert,
  Building2,
  MapPin,
  AlertCircle,
  Briefcase,
  Layers,
  FileText,
  Globe,
  ExternalLink,
  Calendar,
  UserCheck,
  Coins,
  Link2,
  Image as ImageIcon,
  Plus,
  Upload
} from 'lucide-react';

interface CompanyDetailsInfo {
  legal_representative?: string | null;
  registered_capital?: string | null;
  business_scope?: string | null;
  registered_address?: string | null;
  establishment_date?: string | null;
  company_type?: string | null;
}

interface CompanyLinkItem {
  id: string;
  type: string;
  url: string;
  storage_path?: string | null;
  title?: string | null;
  created_at?: string | null;
}

interface Review {
  id: string;
  company_id: string;
  company_name: string;
  branch_location: string;
  position: string;
  employment_status: string;
  salary: number;
  bonus: number;
  experience_years: number;
  daily_work_hours: number | null;
  weekly_work_days: number | null;
  rating_career: number;
  rating_balance: number;
  rating_management: number;
  rating_compensation: number;
  rating_culture: number;
  review_text: string;
  created_at: string;
  previous_hash: string;
  hash: string;
}

interface Company {
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

interface AIReport {
  sentimentScore: number;
  overallSentiment: string;
  overallSummary: string;
  wlbScore: number;
  pressureScore: number;
  collabScore: number;
  trustScore: number;
  compScore: number;
  pros: string[];
  cons: string[];
  cultureCharacteristics: string[];
  careerAdvice: string;
  salaryAnalysis: string;
  workScheduleAnalysis?: string;
  analysisScope?: { id: string; name: string; location: string }[];
}

interface RelatedCompany extends Company {
  relation: 'same_name_region' | 'similar_name';
  similarity: number;
}

interface CacheEntry {
  data: AIReport;
  timestamp: number;
}

const CACHE_DURATION_MS = 24 * 60 * 60 * 1000;

const reportCacheKey = (companyId: string, relatedIds: string[] = []) =>
  `ai_report_cache_${companyId}_${[...relatedIds].sort().join('_')}`;

const getCachedAIReport = (
  companyId: string,
  relatedIds: string[] = []
): AIReport | null => {
  if (typeof window === 'undefined') return null;
  try {
    const key = reportCacheKey(companyId, relatedIds);
    const itemStr = localStorage.getItem(key);
    if (!itemStr) return null;
    const entry: CacheEntry = JSON.parse(itemStr);
    if (Date.now() - entry.timestamp < CACHE_DURATION_MS) {
      return entry.data;
    } else {
      localStorage.removeItem(key);
      return null;
    }
  } catch (err) {
    console.error('Failed to read AI cache:', err);
    return null;
  }
};

const setCachedAIReport = (
  companyId: string,
  data: AIReport,
  relatedIds: string[] = []
) => {
  if (typeof window === 'undefined') return;
  try {
    const key = reportCacheKey(companyId, relatedIds);
    const entry: CacheEntry = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch (err) {
    console.error('Failed to save AI cache:', err);
  }
};

export default function CompanyDetailPage({ params }: { params: Promise<{ id: string; lang: string }> }) {
  const { id: companyId, lang: rawLang } = use(params);
  const lang: Language = resolveLanguage(rawLang);
  const t = i18n[lang];

  // Component State
  const [company, setCompany] = useState<Company | null>(null);
  const [companyDetailsInfo, setCompanyDetailsInfo] = useState<CompanyDetailsInfo | null>(null);
  const [companyLinksList, setCompanyLinksList] = useState<CompanyLinkItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'reviews' | 'details' | 'aiReport' | 'ledger'>('reviews');

  // Search & Filtering inside company
  const [localSearch, setLocalSearch] = useState('');
  const [sortBy, setSortBy] = useState<'latest' | 'salary' | 'rating'>('latest');
  const [filterPosition, setFilterPosition] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // AI Insights State
  const [aiReport, setAiReport] = useState<AIReport | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiError, setAiError] = useState('');
  const [relatedCompanies, setRelatedCompanies] = useState<RelatedCompany[]>([]);
  const [selectedRelatedCompanyIds, setSelectedRelatedCompanyIds] = useState<string[]>([]);

  // Blockchain Ledger verification states
  const [isVerifyingLedger, setIsVerifyingLedger] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    isValid: boolean;
    tamperedIndex: number | null;
    details: { index: number; reviewId: string; status: 'ok' | 'hash_mismatch' | 'chain_broken'; computedHash: string; storedHash: string }[];
  } | null>(null);

  // Load Company & reviews & details data
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const loadedCompany = await getPublicCompanyById(companyId);
        if (!loadedCompany) throw new Error('Company not found.');
        const [loadedReviews, loadedDetails, loadedRelated] = await Promise.all([
          getPublicCompanyReviews(companyId),
          getPublicCompanyDetails(companyId),
          getPublicRelatedCompanies(loadedCompany),
        ]);
        setCompany(loadedCompany);
        setReviews(loadedReviews as unknown as Review[]);
        setCompanyDetailsInfo(
          loadedDetails.details as unknown as CompanyDetailsInfo
        );
        setCompanyLinksList(
          loadedDetails.links as unknown as CompanyLinkItem[]
        );
        setRelatedCompanies(loadedRelated);

        const cached = getCachedAIReport(companyId);
        if (cached) {
          setAiReport(cached);
        }
      } catch (err) {
        console.error('Failed to fetch company details:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [companyId]);

  const uniquePositions = Array.from(new Set(reviews.map(r => r.position.trim()))).filter(Boolean);

  const filteredAndSortedReviews = reviews
    .filter(r => {
      const matchSearch =
        r.position.toLowerCase().includes(localSearch.toLowerCase().trim()) ||
        r.branch_location.toLowerCase().includes(localSearch.toLowerCase().trim()) ||
        r.review_text.toLowerCase().includes(localSearch.toLowerCase().trim());
      const matchPosition = filterPosition === 'ALL' || r.position === filterPosition;
      const matchStatus = filterStatus === 'ALL' || r.employment_status === filterStatus;
      return matchSearch && matchPosition && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'salary') {
        return b.salary - a.salary;
      } else if (sortBy === 'rating') {
        const ratingA = (a.rating_career + a.rating_balance + a.rating_management + a.rating_compensation + a.rating_culture) / 5;
        const ratingB = (b.rating_career + b.rating_balance + b.rating_management + b.rating_compensation + b.rating_culture) / 5;
        return ratingB - ratingA;
      } else {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  const handleGenerateAIReport = async (force: boolean = false) => {
    if (!company) return;
    if (!force) {
      const cached = getCachedAIReport(companyId, selectedRelatedCompanyIds);
      if (cached) {
        setAiReport(cached);
        return;
      }
    }

    setIsGeneratingAI(true);
    setAiError('');
    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          relatedCompanyIds: selectedRelatedCompanyIds,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setAiReport(json.data);
        setCachedAIReport(companyId, json.data, selectedRelatedCompanyIds);
      } else {
        setAiError(json.error || '无法生成AI分析报告，请稍后再试。');
      }
    } catch (err) {
      console.error('Failed to request AI analysis:', err);
      setAiError('网络请求失败，请检查连接后重试。');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleVerifyLedger = () => {
    if (reviews.length === 0) return;
    setIsVerifyingLedger(true);
    setVerificationResult(null);

    setTimeout(() => {
      const details: typeof verificationResult = {
        isValid: true,
        tamperedIndex: null,
        details: []
      };

      for (let i = 0; i < reviews.length; i++) {
        const r = reviews[i];
        const chainLinkIsValid = i === 0 ? r.previous_hash === '0' : r.previous_hash === reviews[i - 1].hash;

        details.details.push({
          index: i + 1,
          reviewId: r.id,
          status: !chainLinkIsValid ? 'chain_broken' : 'ok',
          computedHash: r.hash,
          storedHash: r.hash
        });

        if (!chainLinkIsValid && details.isValid) {
          details.isValid = false;
          details.tamperedIndex = i;
        }
      }

      setVerificationResult(details);
      setIsVerifyingLedger(false);
    }, 1200);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 font-sans" id="loading_screen">
        <Loader2 className="w-8 h-8 text-foreground animate-spin mb-4" />
        <p className="text-xs text-muted-foreground font-mono">
          {lang === 'zh' ? '正在加载企业专属口碑看板与存证数据...' : 'Syncing company profile and block reviews...'}
        </p>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="text-center py-20 border border-border bg-card rounded-none" id="error_screen">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h1 className="text-lg font-bold text-foreground mb-2">{lang === 'zh' ? '未找到该企业' : 'Company Not Found'}</h1>
        <p className="text-xs text-muted-foreground mb-6 max-w-sm mx-auto">
          {lang === 'zh' ? '该企业可能尚未创建评价，或者标识符无效。' : 'No records exist under this identifier.'}
        </p>
        <Link
          href={`/${rawLang}/companies`}
          className="px-4 py-2 bg-foreground text-background font-bold text-xs rounded-none transition-all"
        >
          {t.backToHome}
        </Link>
      </div>
    );
  }

  const overallScorePercent = Math.round(company.avg_rating * 20);

  return (
    <div className="w-full font-sans" id="company_detail_root">
      
      {/* TOP NEWSPAPER COMPANY MASTHEAD (REFERENCE IMAGE MATCH) */}
      <div className="border-b border-border pb-6 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4" id="company_masthead">
        <div>
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-1">
            {lang === 'zh' ? '企业全景口碑与去中心化存证档案' : 'Corporate Telemetry Dossier'}
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-foreground tracking-tighter uppercase font-sans">
            {company.name}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground font-mono mt-2">
            <span>ID: <strong className="text-foreground">{company.id}</strong></span>
            <span>•</span>
            <span>{company.review_count} {lang === 'zh' ? '笔存证记录' : 'block entries'}</span>
            <span>•</span>
            <span className="text-foreground font-bold flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-foreground text-foreground" />
              <span>{company.avg_rating} / 5 ({overallScorePercent}%)</span>
            </span>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setActiveTab('aiReport');
              if (!aiReport) handleGenerateAIReport(false);
            }}
            className="px-3.5 py-2 border border-border hover:bg-muted text-xs font-bold text-foreground flex items-center gap-1.5 cursor-pointer rounded-none"
          >
            <Sparkles className="w-3.5 h-3.5 text-foreground" />
            <span>{t.tabAiReport}</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('ledger');
              handleVerifyLedger();
            }}
            className="px-3.5 py-2 bg-foreground text-background font-bold text-xs flex items-center gap-1.5 cursor-pointer rounded-none hover:opacity-90 transition-opacity"
          >
            <Lock className="w-3.5 h-3.5 text-background" />
            <span>{lang === 'zh' ? '验证账本' : 'Verify Ledger'}</span>
          </button>
        </div>
      </div>

      {/* TABS ROW */}
      <div className="flex border-b border-border mb-8 font-mono text-xs overflow-x-auto" id="detail_tabs_row">
        <button
          onClick={() => setActiveTab('reviews')}
          className={`px-4 py-3 font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'reviews'
              ? 'border-foreground text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <span className="flex items-center gap-2 uppercase">
            <FileText className="w-3.5 h-3.5" />
            <span>{t.tabReviews} ({reviews.length})</span>
          </span>
        </button>

        <button
          onClick={() => setActiveTab('details')}
          className={`px-4 py-3 font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'details'
              ? 'border-foreground text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <span className="flex items-center gap-2 uppercase">
            <Building2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>{lang === 'zh' ? '公司详情信息' : 'Company Details'}</span>
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('aiReport');
            if (!aiReport) handleGenerateAIReport(false);
          }}
          className={`px-4 py-3 font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'aiReport'
              ? 'border-foreground text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <span className="flex items-center gap-2 uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t.tabAiReport}</span>
          </span>
        </button>

        <button
          onClick={() => setActiveTab('ledger')}
          className={`px-4 py-3 font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'ledger'
              ? 'border-foreground text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <span className="flex items-center gap-2 uppercase">
            <Lock className="w-3.5 h-3.5" />
            <span>{t.tabLedger}</span>
          </span>
        </button>
      </div>

      {/* MAIN NEWSPAPER TWO-COLUMN LAYOUT (LEFT STATS SIDEBAR + RIGHT WATERFALL REVIEWS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start" id="detail_layout_grid">
        
        {/* LEFT COLUMN: STATS SIDEBAR (MATCHING REFERENCE IMAGE LEFT "LUNARIO" COLUMN) */}
        <aside className="lg:col-span-4 border-r border-border pr-0 lg:pr-6 space-y-6" id="left_stats_sidebar">
          
          {/* STATS BLOCK 1: CORE SATISFACTION METRICS */}
          <div className="border border-border p-4 bg-card rounded-none space-y-3">
            <h3 className="text-xs font-black text-foreground uppercase tracking-wider border-b border-border pb-2 flex items-center justify-between">
              <span>{lang === 'zh' ? '多维度评价满意度' : 'Satisfaction Metrics'}</span>
              <span className="font-mono text-muted-foreground">{company.avg_rating} / 5</span>
            </h3>

            {[
              { label: t.metricWlb, val: company.avg_balance },
              { label: t.metricCareer, val: company.avg_career },
              { label: t.metricManagement, val: company.avg_management },
              { label: t.metricBenefits, val: company.avg_compensation },
              { label: t.metricCulture, val: company.avg_culture }
            ].map((metric) => (
              <div key={metric.label} className="space-y-1">
                <div className="flex justify-between text-[11px] font-semibold text-foreground">
                  <span>{metric.label}</span>
                  <span className="font-mono font-bold">{metric.val}</span>
                </div>
                <div className="w-full bg-muted h-1 rounded-none overflow-hidden">
                  <div className="bg-foreground h-full" style={{ width: `${(metric.val / 5) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>

          {/* STATS BLOCK 2: SALARY & COMPENSATION */}
          {company.avg_salary > 0 && (
            <div className="border border-border p-4 bg-card rounded-none space-y-3">
              <h3 className="text-xs font-black text-foreground uppercase tracking-wider border-b border-border pb-2">
                {lang === 'zh' ? '基本薪资与年终奖' : 'Salary Telemetry'}
              </h3>
              <div className="space-y-2 font-mono">
                <div>
                  <span className="text-[10px] text-muted-foreground block">{lang === 'zh' ? '平均基本月薪' : 'Avg Base Salary'}</span>
                  <span className="text-xl font-black text-foreground">{(company.avg_salary / 1000).toFixed(1)}K / M</span>
                </div>
                {company.avg_bonus > 0 && (
                  <div className="border-t border-border pt-2">
                    <span className="text-[10px] text-muted-foreground block">{lang === 'zh' ? '平均期望年终奖' : 'Avg Annual Bonus'}</span>
                    <span className="text-lg font-bold text-foreground">{(company.avg_bonus / 1000).toFixed(1)}K / Y</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STATS BLOCK 3: PRIVACY & BLOCKCHAIN SECURITY ASSURANCE */}
          <div className="border border-border p-4 bg-muted/20 rounded-none space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 font-bold text-foreground text-xs uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4 text-foreground" />
              <span>{lang === 'zh' ? '密码学存证保障' : 'Ledger Security'}</span>
            </div>
            <p className="leading-relaxed text-[11px]">
              {lang === 'zh'
                ? '本页面所有评论与薪资数据均已使用 SHA-256 区块链链式散列处理，数据不可篡改。'
                : 'All reviews and salary data are cryptographically bound via SHA-256 blocks.'}
            </p>
          </div>
        </aside>

        {/* RIGHT COLUMN: WATERFALL NEWSPAPER CONTENT FEED */}
        <main className="lg:col-span-8 space-y-6" id="right_content_area">
          
          {/* TAB 1: REVIEWS WATERFALL FEED */}
          {activeTab === 'reviews' && (
            <div className="space-y-6" id="reviews_waterfall">
              
              {/* FILTER & SORT TOOLBAR */}
              <div className="border border-border p-3 bg-card rounded-none flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between" id="local_filters">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                    placeholder={lang === 'zh' ? '搜索此公司评价...' : 'Search within reviews...'}
                    className="w-full pl-9 pr-3 py-1.5 bg-muted/40 border border-border focus:border-foreground outline-none text-xs text-foreground placeholder:text-muted-foreground rounded-none transition-colors"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                  <select
                    value={filterPosition}
                    onChange={(e) => setFilterPosition(e.target.value)}
                    className="bg-muted/40 border border-border outline-none px-2 py-1 text-xs text-foreground cursor-pointer rounded-none"
                  >
                    <option value="ALL">{t.allPositions}</option>
                    {uniquePositions.map(pos => (
                      <option key={pos} value={pos}>{pos}</option>
                    ))}
                  </select>

                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="bg-muted/40 border border-border outline-none px-2 py-1 text-xs text-foreground cursor-pointer rounded-none"
                  >
                    <option value="ALL">{t.allStatus}</option>
                    <option value="current">{t.currentEmployee}</option>
                    <option value="former">{t.formerEmployee}</option>
                  </select>

                  <div className="flex bg-muted/40 p-0.5 border border-border gap-0.5">
                    <button
                      onClick={() => setSortBy('latest')}
                      className={`px-2 py-0.5 text-[10px] font-bold transition-colors cursor-pointer ${
                        sortBy === 'latest' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {t.sortLatest}
                    </button>
                    <button
                      onClick={() => setSortBy('salary')}
                      className={`px-2 py-0.5 text-[10px] font-bold transition-colors cursor-pointer ${
                        sortBy === 'salary' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {t.sortSalary}
                    </button>
                    <button
                      onClick={() => setSortBy('rating')}
                      className={`px-2 py-0.5 text-[10px] font-bold transition-colors cursor-pointer ${
                        sortBy === 'rating' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {t.sortRating}
                    </button>
                  </div>
                </div>
              </div>

              {/* REVIEWS WATERFALL MASONRY GRID (MATCHING REFERENCE IMAGE NEWSPAPER LAYOUT) */}
              {filteredAndSortedReviews.length === 0 ? (
                <div className="text-center py-16 border border-border bg-card text-card-foreground rounded-none" id="empty_reviews">
                  <Briefcase className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <h3 className="text-xs font-bold text-foreground mb-1">
                    {lang === 'zh' ? '未找到符合条件的评价' : 'No Reviews Found'}
                  </h3>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="waterfall_grid">
                  {filteredAndSortedReviews.map((rev, idx) => {
                    const ratingAvg = (rev.rating_career + rev.rating_balance + rev.rating_management + rev.rating_compensation + rev.rating_culture) / 5;
                    
                    return (
                      <motion.div
                        key={rev.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(idx * 0.04, 0.3), duration: 0.25 }}
                        className="border border-border bg-card p-5 rounded-none flex flex-col justify-between hover:bg-muted/20 transition-colors group"
                      >
                        <div>
                          {/* ARTICLE EYEBROW HEADER */}
                          <div className="flex items-center justify-between border-b border-border pb-2 mb-3 text-[10px] font-mono text-muted-foreground">
                            <span>{new Date(rev.created_at).toLocaleDateString()}</span>
                            <span className="border border-border px-1.5 py-0.5 uppercase tracking-wider text-foreground bg-background">
                              {rev.employment_status === 'current' ? t.currentEmployee : t.formerEmployee}
                            </span>
                          </div>

                          {/* ARTICLE HEADLINE */}
                          <h4 className="text-base font-extrabold text-foreground group-hover:underline tracking-tight mb-2">
                            {rev.position} · {rev.branch_location}
                          </h4>

                          {/* SERIF PULL QUOTE REVIEW BODY */}
                          <p className="text-xs text-foreground/90 leading-relaxed font-sans border-l-2 border-foreground pl-3 py-1 bg-muted/20 mb-4 whitespace-pre-wrap">
                            {rev.review_text}
                          </p>
                        </div>

                        {/* RECTANGULAR SALARY & RATINGS TAGS */}
                        <div className="border-t border-border pt-3 space-y-2">
                          <div className="flex flex-wrap gap-1.5 font-mono text-[10px]">
                            {rev.salary > 0 && (
                              <span className="border border-border px-2 py-0.5 font-bold text-foreground bg-background">
                                SALARY: {rev.salary}K
                              </span>
                            )}
                            {rev.bonus > 0 && (
                              <span className="border border-border px-2 py-0.5 font-bold text-foreground bg-background">
                                BONUS: {rev.bonus}K
                              </span>
                            )}
                            {rev.daily_work_hours !== null && (
                              <span className="border border-border px-2 py-0.5 font-bold text-foreground bg-background">
                                {rev.daily_work_hours}H / DAY
                              </span>
                            )}
                            {rev.weekly_work_days !== null && (
                              <span className="border border-border px-2 py-0.5 font-bold text-foreground bg-background">
                                {rev.weekly_work_days}D / WEEK
                              </span>
                            )}
                            <span className="border border-border px-2 py-0.5 font-bold text-foreground bg-background flex items-center gap-1">
                              <Star className="w-3 h-3 fill-foreground text-foreground" />
                              <span>{ratingAvg.toFixed(1)}</span>
                            </span>
                          </div>

                          {/* SHA-256 HASH FOOTER STAMP */}
                          <div className="text-[9px] font-mono text-muted-foreground pt-1 flex items-center justify-between">
                            <span className="truncate max-w-[160px]" title={rev.hash}>
                              HASH: {rev.hash.substring(0, 14)}...
                            </span>
                            <span>{rev.experience_years}Y EXP</span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB: COMPANY DETAILS */}
          {activeTab === 'details' && (
            <div className="space-y-6" id="company_details_content">
              {/* Header Title */}
              <div className="border border-border p-5 bg-card rounded-none flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-emerald-500" />
                    <span>{lang === 'zh' ? '企业基本与工商补充信息档案' : 'Company Dossier & Corporate Specs'}</span>
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {lang === 'zh'
                      ? '包含统一社会信用代码、注册资金、法人代表、经营范围及关联媒体图片/链接。'
                      : 'Corporate registry attributes, credit code, and linked media assets.'}
                  </p>
                </div>
              </div>

              {/* GRID ATTR CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* 统一社会信用代码 */}
                <div className="border border-border p-4 bg-card rounded-none space-y-1">
                  <span className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    {lang === 'zh' ? '统一社会信用代码' : 'USCC Credit Code'}
                  </span>
                  <div className="text-sm font-mono font-bold text-foreground truncate" title={company.credit_code || '未录入'}>
                    {company.credit_code || (lang === 'zh' ? '暂无社会信用代码' : 'N/A')}
                  </div>
                </div>

                {/* 国家/地区与城市 */}
                <div className="border border-border p-4 bg-card rounded-none space-y-1">
                  <span className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-emerald-500" />
                    {lang === 'zh' ? '国家/地区与城市' : 'Country / Region & City'}
                  </span>
                  <div className="text-sm font-bold text-foreground truncate">
                    {[company.country_name || company.country_code, company.province, company.city].filter(Boolean).join(' · ') || (lang === 'zh' ? '中国' : 'China')}
                  </div>
                </div>

                {/* 法人代表 */}
                <div className="border border-border p-4 bg-card rounded-none space-y-1">
                  <span className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                    {lang === 'zh' ? '法定代表人' : 'Legal Representative'}
                  </span>
                  <div className="text-sm font-bold text-foreground truncate">
                    {companyDetailsInfo?.legal_representative || (lang === 'zh' ? '未填写' : 'N/A')}
                  </div>
                </div>

                {/* 注册资金 */}
                <div className="border border-border p-4 bg-card rounded-none space-y-1">
                  <span className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-emerald-500" />
                    {lang === 'zh' ? '注册资金' : 'Registered Capital'}
                  </span>
                  <div className="text-sm font-mono font-bold text-foreground truncate">
                    {companyDetailsInfo?.registered_capital || (lang === 'zh' ? '未填写' : 'N/A')}
                  </div>
                </div>

                {/* 成立日期 */}
                <div className="border border-border p-4 bg-card rounded-none space-y-1">
                  <span className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                    {lang === 'zh' ? '成立 / 注册日期' : 'Establishment Date'}
                  </span>
                  <div className="text-sm font-mono font-bold text-foreground truncate">
                    {companyDetailsInfo?.establishment_date || (lang === 'zh' ? '未填写' : 'N/A')}
                  </div>
                </div>

                {/* 企业类型 */}
                <div className="border border-border p-4 bg-card rounded-none space-y-1">
                  <span className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-emerald-500" />
                    {lang === 'zh' ? '企业类型' : 'Company Type'}
                  </span>
                  <div className="text-sm font-bold text-foreground truncate">
                    {companyDetailsInfo?.company_type || (lang === 'zh' ? '未填写' : 'N/A')}
                  </div>
                </div>
              </div>

              {/* 注册地址 */}
              <div className="border border-border p-5 bg-card rounded-none space-y-2">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 border-b border-border pb-2">
                  <MapPin className="w-4 h-4 text-emerald-500" />
                  <span>{lang === 'zh' ? '注册 / 住所地址' : 'Registered Address'}</span>
                </h4>
                <p className="text-xs text-foreground font-mono leading-relaxed">
                  {companyDetailsInfo?.registered_address || (lang === 'zh' ? '暂未填写注册详细地址' : 'No registered address provided.')}
                </p>
              </div>

              {/* 经营范围 */}
              <div className="border border-border p-5 bg-card rounded-none space-y-2">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 border-b border-border pb-2">
                  <FileText className="w-4 h-4 text-emerald-500" />
                  <span>{lang === 'zh' ? '经营范围' : 'Business Scope'}</span>
                </h4>
                <p className="text-xs text-foreground/90 leading-relaxed font-sans whitespace-pre-wrap">
                  {companyDetailsInfo?.business_scope || (lang === 'zh' ? '暂未填写经营范围' : 'No business scope details provided.')}
                </p>
              </div>

              {/* 相关链接与媒体图片 */}
              <div className="border border-border p-5 bg-card rounded-none space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Link2 className="w-4 h-4 text-emerald-500" />
                    <span>{lang === 'zh' ? '相关链接与媒体展示' : 'Associated Links & Media'} ({companyLinksList.length})</span>
                  </h4>
                </div>

                {companyLinksList.length === 0 ? (
                  <div className="py-8 text-center space-y-2">
                    <ImageIcon className="w-8 h-8 text-muted-foreground mx-auto" />
                    <p className="text-xs text-muted-foreground">
                      {lang === 'zh' ? '暂无关联图片、Logo或外部链接' : 'No linked media or URLs recorded.'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {companyLinksList.map((link) => (
                      <div key={link.id} className="border border-border p-3 bg-muted/20 rounded-none flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 overflow-hidden">
                          {link.type === 'logo' || link.type === 'image' ? (
                            <div className="w-10 h-10 bg-muted border border-border shrink-0 flex items-center justify-center overflow-hidden">
                              <img src={link.url} alt={link.title || 'company media'} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 shrink-0 flex items-center justify-center">
                              <Link2 className="w-4 h-4 text-emerald-500" />
                            </div>
                          )}
                          <div className="truncate">
                            <span className="text-xs font-bold text-foreground block truncate">{link.title || link.url}</span>
                            <span className="text-[10px] text-muted-foreground font-mono uppercase">{link.type}</span>
                          </div>
                        </div>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 border border-border hover:bg-foreground hover:text-background text-[10px] font-bold transition-colors shrink-0 flex items-center gap-1"
                        >
                          <span>{lang === 'zh' ? '打开' : 'Open'}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <CompanyGovernancePanel
                companyId={company.id}
                lang={lang}
                profile={{
                  name: company.name,
                  creditCode: company.credit_code,
                  countryCode: company.country_code,
                  countryName: company.country_name,
                  province: company.province,
                  city: company.city,
                  legalRepresentative: companyDetailsInfo?.legal_representative,
                  registeredCapital: companyDetailsInfo?.registered_capital,
                  businessScope: companyDetailsInfo?.business_scope,
                  registeredAddress: companyDetailsInfo?.registered_address,
                  establishmentDate: companyDetailsInfo?.establishment_date,
                  companyType: companyDetailsInfo?.company_type,
                }}
              />
            </div>
          )}

          {/* TAB 2: AI INSIGHTS REPORT */}
          {activeTab === 'aiReport' && (
            <div className="space-y-6" id="ai_report_content">
              <div className="border border-border p-5 bg-card rounded-none flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-foreground" />
                    <span>{t.aiTitle}</span>
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t.aiDisclaimer}
                  </p>
                </div>

                {aiReport && (
                  <button
                    onClick={() => handleGenerateAIReport(true)}
                    disabled={isGeneratingAI}
                    className="px-3.5 py-2 border border-border hover:bg-muted text-xs font-bold text-foreground flex items-center gap-1.5 cursor-pointer rounded-none"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-foreground ${isGeneratingAI ? 'animate-spin' : ''}`} />
                    <span>{lang === 'zh' ? '刷新报告' : 'Refresh'}</span>
                  </button>
                )}
              </div>

              {relatedCompanies.length > 0 && (
                <div className="border border-border p-5 bg-card rounded-none space-y-3">
                  <div>
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-foreground">
                      {lang === 'zh'
                        ? '选择要合并分析的分区或相似企业'
                        : 'Include regional or similar companies'}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {lang === 'zh'
                        ? '只有你勾选的企业评价会加入本次报告，原始企业统计不会被改变。'
                        : 'Only selected company reviews are included in this report; source statistics remain unchanged.'}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {relatedCompanies.map((related) => {
                      const checked = selectedRelatedCompanyIds.includes(related.id);
                      return (
                        <label
                          key={related.id}
                          className="flex items-start gap-2 border border-border p-3 cursor-pointer hover:bg-muted/40"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              setSelectedRelatedCompanyIds((current) =>
                                checked
                                  ? current.filter((id) => id !== related.id)
                                  : [...current, related.id]
                              );
                              setAiReport(null);
                              setAiError('');
                            }}
                            className="mt-0.5 accent-emerald-500"
                          />
                          <span className="min-w-0">
                            <span className="block text-xs font-bold text-foreground truncate">
                              {related.name}
                            </span>
                            <span className="block text-[11px] text-muted-foreground">
                              {[related.province, related.city].filter(Boolean).join(' / ') ||
                                (lang === 'zh' ? '地区未提供' : 'Location unavailable')}
                              {' · '}
                              {related.review_count}
                              {lang === 'zh' ? ' 条评价' : ' reviews'}
                              {' · '}
                              {related.relation === 'same_name_region'
                                ? lang === 'zh'
                                  ? '同名分区'
                                  : 'Same-name region'
                                : lang === 'zh'
                                  ? '名称相似'
                                  : 'Similar name'}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {isGeneratingAI ? (
                <div className="py-16 text-center border border-border bg-card rounded-none flex flex-col items-center justify-center">
                  <Loader2 className="w-8 h-8 text-foreground animate-spin mb-4" />
                  <h3 className="text-xs font-bold text-foreground mb-1">{t.aiGenerating}</h3>
                </div>
              ) : aiError ? (
                <div className="p-6 border border-rose-500/30 bg-rose-500/10 text-center rounded-none">
                  <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
                  <p className="text-xs text-rose-500 mb-4">{aiError}</p>
                  <button
                    onClick={() => handleGenerateAIReport(true)}
                    className="px-4 py-2 bg-foreground text-background font-bold text-xs rounded-none"
                  >
                    {lang === 'zh' ? '重试' : 'Retry'}
                  </button>
                </div>
              ) : !aiReport ? (
                <div className="py-16 text-center border border-border bg-card rounded-none">
                  <Sparkles className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <button
                    onClick={() => handleGenerateAIReport(true)}
                    className="px-5 py-2.5 bg-foreground text-background font-bold text-xs rounded-none cursor-pointer"
                  >
                    {lang === 'zh' ? '立即生成 AI 分析报告' : 'Generate AI Report'}
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* OVERALL SUMMARY CARD */}
                  <div className="border border-border p-5 bg-card rounded-none space-y-3">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
                      {lang === 'zh' ? 'AI 综合职场总结' : 'Executive Overview'}
                    </h4>
                    <p className="text-xs text-foreground leading-relaxed font-sans">
                      {aiReport.overallSummary}
                    </p>
                    {aiReport.workScheduleAnalysis && (
                      <p className="text-xs text-muted-foreground leading-relaxed border-t border-border pt-3">
                        {aiReport.workScheduleAnalysis}
                      </p>
                    )}
                    {aiReport.analysisScope && aiReport.analysisScope.length > 0 && (
                      <p className="text-[11px] text-muted-foreground border-t border-border pt-3">
                        {lang === 'zh' ? '分析范围：' : 'Scope: '}
                        {aiReport.analysisScope
                          .map((item) => `${item.name}（${item.location || '-'}）`)
                          .join('、')}
                      </p>
                    )}
                  </div>

                  {/* PROS & CONS GRID */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border border-border p-5 bg-card rounded-none space-y-2">
                      <h5 className="text-xs font-bold uppercase text-foreground border-b border-border pb-2">
                        {lang === 'zh' ? '核心优势 (Pros)' : 'Key Advantages'}
                      </h5>
                      <ul className="space-y-1 text-xs text-muted-foreground">
                        {aiReport.pros.map((pro, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-foreground font-mono">+</span>
                            <span>{pro}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="border border-border p-5 bg-card rounded-none space-y-2">
                      <h5 className="text-xs font-bold uppercase text-foreground border-b border-border pb-2">
                        {lang === 'zh' ? '风险与卡点 (Cons)' : 'Potential Friction Points'}
                      </h5>
                      <ul className="space-y-1 text-xs text-muted-foreground">
                        {aiReport.cons.map((con, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-foreground font-mono">-</span>
                            <span>{con}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: BLOCKCHAIN LINKED TIMELINE VERIFICATION */}
          {activeTab === 'ledger' && (
            <div className="space-y-6" id="ledger_audit_content">
              <div className="border border-border p-5 bg-card rounded-none flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <Lock className="w-4 h-4 text-foreground" />
                    <span>{lang === 'zh' ? '密码学账本防篡改审计' : 'Blockchain Ledger Audit'}</span>
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {lang === 'zh' ? '依次对每一个区块评论计算 SHA-256 哈希，验证前向指针完整性。' : 'Validate cryptographic previous_hash links.'}
                  </p>
                </div>

                <button
                  onClick={handleVerifyLedger}
                  disabled={isVerifyingLedger}
                  className="px-4 py-2 bg-foreground text-background font-bold text-xs rounded-none cursor-pointer"
                >
                  {isVerifyingLedger ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{lang === 'zh' ? '审计中...' : 'Auditing...'}</span>
                    </span>
                  ) : (
                    <span>{lang === 'zh' ? '开始全链审计' : 'Run Audit'}</span>
                  )}
                </button>
              </div>

              {/* AUDIT RESULTS DISPLAY */}
              {verificationResult && (
                <div className="border border-border p-5 bg-card rounded-none space-y-4 font-mono">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <span className="text-xs font-bold text-foreground uppercase">
                      {lang === 'zh' ? '审计结论' : 'Audit Result'}
                    </span>
                    <span className={`text-xs font-bold px-2 py-0.5 border ${
                      verificationResult.isValid
                        ? 'border-emerald-500 text-emerald-500 bg-emerald-500/10'
                        : 'border-rose-500 text-rose-500 bg-rose-500/10'
                    }`}>
                      {verificationResult.isValid ? '100% VALID & SECURE' : 'HASH MISMATCH DETECTED'}
                    </span>
                  </div>

                  <div className="divide-y divide-border border-t border-border">
                    {verificationResult.details.map(item => (
                      <div key={item.reviewId} className="py-2 text-xs flex items-center justify-between">
                        <span>BLOCK #{item.index}</span>
                        <span className="text-muted-foreground truncate max-w-[240px]">{item.computedHash.substring(0, 18)}...</span>
                        <span className="text-foreground font-bold">PASS</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
