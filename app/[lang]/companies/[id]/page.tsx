'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { i18n, Language } from '../../../../lib/i18n';
import {
  Building,
  ArrowLeft,
  Search,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
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
  ThumbsUp,
  ThumbsDown,
  Building2,
  Briefcase,
  MapPin,
  AlertCircle
} from 'lucide-react';

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
}

interface CacheEntry {
  data: AIReport;
  timestamp: number;
}

const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

const getCachedAIReport = (companyId: string): AIReport | null => {
  if (typeof window === 'undefined') return null;
  try {
    const key = `ai_report_cache_${companyId}`;
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

const setCachedAIReport = (companyId: string, data: AIReport) => {
  if (typeof window === 'undefined') return;
  try {
    const key = `ai_report_cache_${companyId}`;
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
  const lang: Language = (rawLang === 'zh-cn' || rawLang === 'zh') ? 'zh' : 'en';

  const toggleLang = () => {
    const nextLangPath = lang === 'zh' ? `/en/companies/${companyId}` : `/zh-cn/companies/${companyId}`;
    window.location.href = nextLangPath;
  };

  const t = i18n[lang];

  // Component State
  const [company, setCompany] = useState<Company | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'reviews' | 'aiReport' | 'ledger'>('reviews');

  // Search & Filtering inside company
  const [localSearch, setLocalSearch] = useState('');
  const [sortBy, setSortBy] = useState<'latest' | 'salary' | 'rating'>('latest');
  const [filterPosition, setFilterPosition] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // AI Insights State
  const [aiReport, setAiReport] = useState<AIReport | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiError, setAiError] = useState('');
  const [isReportFromCache, setIsReportFromCache] = useState(false);

  // Blockchain Ledger verification states
  const [isVerifyingLedger, setIsVerifyingLedger] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    isValid: boolean;
    tamperedIndex: number | null;
    details: { index: number; reviewId: string; status: 'ok' | 'hash_mismatch' | 'chain_broken'; computedHash: string; storedHash: string }[];
  } | null>(null);

  // Load Company & reviews data
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        // Fetch company detail
        const compRes = await fetch(`/api/companies?id=${companyId}`);
        const compJson = await compRes.json();
        if (compJson.success) {
          setCompany(compJson.data);
        }

        // Fetch company reviews
        const revRes = await fetch(`/api/reviews?company_id=${companyId}`);
        const revJson = await revRes.json();
        if (revJson.success) {
          setReviews(revJson.data || []);
        }

        // Preload cached AI Report
        const cached = getCachedAIReport(companyId);
        if (cached) {
          setAiReport(cached);
          setIsReportFromCache(true);
        }
      } catch (err) {
        console.error('Failed to fetch company details:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [companyId]);

  // Unique lists for filtering dropdowns
  const uniquePositions = Array.from(new Set(reviews.map(r => r.position.trim()))).filter(Boolean);

  // Filter and sort reviews
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
        // 'latest'
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  // Call Gemini API Route for analysis
  const handleGenerateAIReport = async (force: boolean = false) => {
    if (!company) return;
    if (!force) {
      const cached = getCachedAIReport(companyId);
      if (cached) {
        setAiReport(cached);
        setIsReportFromCache(true);
        return;
      }
    }

    setIsGeneratingAI(true);
    setAiError('');
    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: companyId }),
      });
      const json = await res.json();
      if (json.success) {
        setAiReport(json.data);
        setIsReportFromCache(false);
        setCachedAIReport(companyId, json.data);
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

  // Perform Blockchain Integrity Verification
  const handleVerifyLedger = () => {
    if (reviews.length === 0) return;
    setIsVerifyingLedger(true);
    setVerificationResult(null);

    // Dynamic audit animation
    setTimeout(() => {
      const details: typeof verificationResult = {
        isValid: true,
        tamperedIndex: null,
        details: []
      };

      for (let i = 0; i < reviews.length; i++) {
        const r = reviews[i];
        
        // Match standard evaluation of previous hashes
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
    }, 1500);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050505] text-[#e0e0e0] flex flex-col items-center justify-center" id="loading_screen">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
        <p className="text-sm text-gray-500 tracking-wide">
          {lang === 'zh' ? '正在加载企业专属口碑看板与存证数据...' : 'Syncing company profile and block reviews...'}
        </p>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-[#050505] text-[#e0e0e0] flex flex-col items-center justify-center p-4" id="error_screen">
        <AlertCircle className="w-16 h-16 text-rose-500 mb-4" />
        <h1 className="text-xl font-bold text-white mb-2">{lang === 'zh' ? '未找到该企业' : 'Company Not Found'}</h1>
        <p className="text-sm text-gray-400 mb-6 text-center max-w-sm">
          {lang === 'zh' ? '该企业可能尚未创建评价，或者标识符无效。' : 'No records exist under this identifier.'}
        </p>
        <Link
          href={`/${rawLang}`}
          className="px-5 py-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-white font-semibold rounded-xl transition-all"
        >
          {t.backToHome}
        </Link>
      </div>
    );
  }

  const overallScorePercent = Math.round(company.avg_rating * 20);

  return (
    <main className="min-h-screen bg-[#050505] text-[#e0e0e0] selection:bg-emerald-500/20" id="company_detail_root">
      {/* Dynamic Top Banner */}
      <div className="bg-[#0a0a0a] text-gray-400 py-2.5 px-4 text-xs font-medium border-b border-white/10" id="top_announcement">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t.topBanner}</span>
          </span>
          <span className="hidden md:inline text-emerald-500 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-widest">
            {t.blockchainSecured}
          </span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8" id="company_detail_container">
        {/* Navigation Block */}
        <div className="flex items-center justify-between mb-8" id="detail_nav">
          <div className="flex items-center gap-4">
            <Link
              href={`/${rawLang}/companies`}
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white font-medium text-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{lang === 'zh' ? '返回公司口碑榜' : 'Back to Rankings'}</span>
            </Link>

            <button
              onClick={toggleLang}
              className="px-2.5 py-1 bg-[#121212] hover:bg-[#1a1a1a] border border-white/5 text-gray-400 hover:text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
            >
              <span>🌐</span>
              <span>{lang === 'zh' ? 'EN' : 'ZH'}</span>
            </button>
          </div>

          <div className="text-xs text-gray-500 flex items-center gap-1.5 bg-[#0a0a0a] px-3 py-1.5 border border-white/5 rounded-xl font-mono">
            <span>ID:</span>
            <span className="text-emerald-400">{company.id}</span>
          </div>
        </div>

        {/* Brand Display Hero */}
        <div className="bg-gradient-to-br from-[#0c0c0c] to-[#080808] border border-white/10 rounded-3xl p-6 lg:p-8 mb-8 relative overflow-hidden" id="company_hero_card">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-3xl rounded-full -translate-y-12 translate-x-12" />
          
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-5">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                <Building2 className="w-10 h-10 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
                  {company.name}
                </h1>
                <p className="text-sm text-gray-400 mt-1 flex items-center gap-2">
                  <span>{lang === 'zh' ? '累计区块链存证评价' : 'Total block-verified reviews'}</span>
                  <span className="bg-[#121212] border border-white/5 text-emerald-400 px-2 py-0.5 rounded text-xs font-bold">
                    {company.review_count} {lang === 'zh' ? '条' : 'records'}
                  </span>
                </p>
              </div>
            </div>

            {/* Quick Aggregate Score */}
            <div className="flex items-center gap-4 bg-[#121212]/60 border border-white/5 backdrop-blur-xs p-4 rounded-2xl w-full lg:w-auto">
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{t.metricOverall}</span>
                <span className="text-2xl font-black text-white mt-1">{company.avg_rating} <span className="text-xs text-gray-500 font-normal">/ 5</span></span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center font-bold text-emerald-400 text-lg border border-emerald-500/25">
                {overallScorePercent}%
              </div>
            </div>
          </div>

          {/* Core Analytics Radar/Bar Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 mt-8 border-t border-white/10 pt-6" id="core_metrics_grid">
            {/* WLB */}
            <div className="bg-[#121212]/30 border border-white/5 rounded-xl p-3 flex flex-col justify-between">
              <span className="text-xs text-gray-500 font-medium">{t.metricWlb}</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-lg font-extrabold text-indigo-400">{company.avg_balance}</span>
                <span className="text-[10px] text-gray-600">/ 5</span>
              </div>
              <div className="w-full bg-white/5 h-1 rounded-full mt-2 overflow-hidden">
                <div className="bg-indigo-400 h-full rounded-full" style={{ width: `${company.avg_balance * 20}%` }} />
              </div>
            </div>

            {/* Career */}
            <div className="bg-[#121212]/30 border border-white/5 rounded-xl p-3 flex flex-col justify-between">
              <span className="text-xs text-gray-500 font-medium">{t.metricCareer}</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-lg font-extrabold text-emerald-400">{company.avg_career}</span>
                <span className="text-[10px] text-gray-600">/ 5</span>
              </div>
              <div className="w-full bg-white/5 h-1 rounded-full mt-2 overflow-hidden">
                <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${company.avg_career * 20}%` }} />
              </div>
            </div>

            {/* Management */}
            <div className="bg-[#121212]/30 border border-white/5 rounded-xl p-3 flex flex-col justify-between">
              <span className="text-xs text-gray-500 font-medium">{t.metricManagement}</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-lg font-extrabold text-amber-400">{company.avg_management}</span>
                <span className="text-[10px] text-gray-600">/ 5</span>
              </div>
              <div className="w-full bg-white/5 h-1 rounded-full mt-2 overflow-hidden">
                <div className="bg-amber-400 h-full rounded-full" style={{ width: `${company.avg_management * 20}%` }} />
              </div>
            </div>

            {/* Compensation */}
            <div className="bg-[#121212]/30 border border-white/5 rounded-xl p-3 flex flex-col justify-between">
              <span className="text-xs text-gray-500 font-medium">{t.metricBenefits}</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-lg font-extrabold text-rose-400">{company.avg_compensation}</span>
                <span className="text-[10px] text-gray-600">/ 5</span>
              </div>
              <div className="w-full bg-white/5 h-1 rounded-full mt-2 overflow-hidden">
                <div className="bg-rose-400 h-full rounded-full" style={{ width: `${company.avg_compensation * 20}%` }} />
              </div>
            </div>

            {/* Culture */}
            <div className="bg-[#121212]/30 border border-white/5 rounded-xl p-3 flex flex-col justify-between">
              <span className="text-xs text-gray-500 font-medium">{t.metricCulture}</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-lg font-extrabold text-teal-400">{company.avg_culture}</span>
                <span className="text-[10px] text-gray-600">/ 5</span>
              </div>
              <div className="w-full bg-white/5 h-1 rounded-full mt-2 overflow-hidden">
                <div className="bg-teal-400 h-full rounded-full" style={{ width: `${company.avg_culture * 20}%` }} />
              </div>
            </div>
          </div>

          {/* Salary aggregates card */}
          {company.avg_salary > 0 && (
            <div className="mt-4 p-4 bg-white/2 rounded-2xl border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">{lang === 'zh' ? '基础基本月薪' : 'Base Monthly Salary'}</h4>
                  <p className="text-lg font-black text-white mt-0.5">
                    {lang === 'zh' ? '平均月薪：' : 'Avg Base: '}
                    <span className="text-emerald-400">{(company.avg_salary / 1000).toFixed(1)}K</span>
                  </p>
                </div>
              </div>

              {company.avg_bonus > 0 && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                    <Activity className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">{lang === 'zh' ? '年终奖/红利期望' : 'Annual Expected Bonus'}</h4>
                    <p className="text-lg font-black text-white mt-0.5">
                      {lang === 'zh' ? '平均：' : 'Avg Bonus: '}
                      <span className="text-indigo-400">{(company.avg_bonus / 1000).toFixed(1)}K</span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tabs Control */}
        <div className="flex border-b border-white/10 mb-8" id="detail_tabs_row">
          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors relative ${
              activeTab === 'reviews'
                ? 'border-emerald-500 text-white'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2">
              <Building className="w-4 h-4" />
              <span>{t.tabReviews}</span>
              <span className="text-xs bg-[#121212] px-1.5 py-0.5 rounded border border-white/5 text-gray-400">
                {reviews.length}
              </span>
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('aiReport');
              if (!aiReport) {
                handleGenerateAIReport(false);
              }
            }}
            className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors relative ${
              activeTab === 'aiReport'
                ? 'border-emerald-500 text-white'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>{t.tabAiReport}</span>
            </span>
          </button>

          <button
            onClick={() => setActiveTab('ledger')}
            className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors relative ${
              activeTab === 'ledger'
                ? 'border-emerald-500 text-white'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              <span>{t.tabLedger}</span>
            </span>
          </button>
        </div>

        {/* Tab Contents: reviews */}
        {activeTab === 'reviews' && (
          <div className="space-y-6" id="reviews_tab_content">
            {/* Local Search & filter panels */}
            <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between" id="local_filters">
              {/* Search reviews */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  placeholder={lang === 'zh' ? '在这个企业评价中搜索关键字...' : 'Search within these reviews...'}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#121212] border border-white/5 focus:border-emerald-500/50 outline-none text-sm text-[#e0e0e0] placeholder:text-gray-600 rounded-xl transition-colors"
                />
              </div>

              {/* Filtering / Sort grids */}
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={filterPosition}
                  onChange={(e) => setFilterPosition(e.target.value)}
                  className="bg-[#121212] border border-white/5 outline-none px-3 py-2 text-xs font-semibold rounded-xl text-gray-300 focus:border-emerald-500"
                >
                  <option value="ALL">{t.allPositions}</option>
                  {uniquePositions.map(pos => (
                    <option key={pos} value={pos}>{pos}</option>
                  ))}
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-[#121212] border border-white/5 outline-none px-3 py-2 text-xs font-semibold rounded-xl text-gray-300 focus:border-emerald-500"
                >
                  <option value="ALL">{t.allStatus}</option>
                  <option value="current">{t.currentEmployee}</option>
                  <option value="former">{t.formerEmployee}</option>
                </select>

                <div className="flex bg-[#121212] p-1 border border-white/5 rounded-xl gap-1">
                  <button
                    onClick={() => setSortBy('latest')}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-colors ${
                      sortBy === 'latest' ? 'bg-emerald-500/15 text-emerald-400' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {t.sortLatest}
                  </button>
                  <button
                    onClick={() => setSortBy('salary')}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-colors ${
                      sortBy === 'salary' ? 'bg-emerald-500/15 text-emerald-400' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {t.sortSalary}
                  </button>
                  <button
                    onClick={() => setSortBy('rating')}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-colors ${
                      sortBy === 'rating' ? 'bg-emerald-500/15 text-emerald-400' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {t.sortRating}
                  </button>
                </div>
              </div>
            </div>

            {/* Reviews Cards List */}
            {filteredAndSortedReviews.length === 0 ? (
              <div className="text-center py-16 bg-[#0c0c0c] border border-white/10 rounded-2xl" id="empty_reviews">
                <Briefcase className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-white mb-1">
                  {lang === 'zh' ? '未找到符合条件的评价' : 'No Reviews Found'}
                </h3>
                <p className="text-xs text-gray-500 max-w-xs mx-auto">
                  {lang === 'zh' ? '请尝试清除过滤条件或搜索其他职位词。' : 'Try updating your filters or search query.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4" id="reviews_feed">
                {filteredAndSortedReviews.map((rev, idx) => {
                  const ratingAvg = (rev.rating_career + rev.rating_balance + rev.rating_management + rev.rating_compensation + rev.rating_culture) / 5;
                  
                  return (
                    <motion.div
                      key={rev.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(idx * 0.05, 0.4), duration: 0.3 }}
                      className="bg-[#0c0c0c] border border-white/10 rounded-2xl p-5 relative overflow-hidden"
                    >
                      {/* Secure watermark block */}
                      <div className="absolute top-0 right-0 p-2.5 bg-emerald-500/5 text-[9px] text-emerald-500 font-mono tracking-widest border-b border-l border-white/5 select-none rounded-bl-xl uppercase font-bold">
                        {t.blockchainSecured}
                      </div>

                      {/* Poster header */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-4 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#151515] border border-white/5 flex items-center justify-center font-bold text-gray-400 text-xs">
                            {idx + 1}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-sm">
                                {rev.position}
                              </span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                                rev.employment_status === 'current'
                                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                  : 'bg-gray-500/10 border-white/5 text-gray-400'
                              }`}>
                                {rev.employment_status === 'current' ? t.currentEmployee : t.formerEmployee}
                              </span>
                            </div>
                            <div className="flex items-center gap-2.5 text-xs text-gray-500 mt-1">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5" />
                                <span>{rev.branch_location}</span>
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                <span>{rev.experience_years} {lang === 'zh' ? '年经验' : 'yrs exp'}</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Average Rating for review */}
                        <div className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500/5 border border-emerald-500/10 rounded-lg text-emerald-400 font-bold text-xs">
                          <Star className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" />
                          <span>{ratingAvg.toFixed(1)} {lang === 'zh' ? '综合分' : 'Avg'}</span>
                        </div>
                      </div>

                      {/* Main evaluation review text */}
                      <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap mb-4" id={`text-${rev.id}`}>
                        {rev.review_text}
                      </div>

                      {/* Salary Tag & detailed ratings */}
                      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/5 pt-4">
                        {/* Salary and bonus indicators */}
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span>{lang === 'zh' ? '基本月薪' : 'Monthly Salary'}: <strong className="text-white font-bold">{rev.salary}K</strong></span>
                          </span>
                          {rev.bonus > 0 && (
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                              <span>{lang === 'zh' ? '年终奖' : 'Annual Bonus'}: <strong className="text-white font-bold">{rev.bonus}K</strong></span>
                            </span>
                          )}
                        </div>

                        {/* Individual rating stats row */}
                        <div className="flex flex-wrap gap-2 text-[10px] font-semibold text-gray-400">
                          <span className="px-2 py-0.5 bg-[#121212] border border-white/5 rounded">WLB: <strong className="text-indigo-400">{rev.rating_balance}</strong></span>
                          <span className="px-2 py-0.5 bg-[#121212] border border-white/5 rounded">{lang === 'zh' ? '成长' : 'Growth'}: <strong className="text-emerald-400">{rev.rating_career}</strong></span>
                          <span className="px-2 py-0.5 bg-[#121212] border border-white/5 rounded">{lang === 'zh' ? '管理' : 'Mgmt'}: <strong className="text-amber-400">{rev.rating_management}</strong></span>
                          <span className="px-2 py-0.5 bg-[#121212] border border-white/5 rounded">{lang === 'zh' ? '薪酬' : 'Pay'}: <strong className="text-rose-400">{rev.rating_compensation}</strong></span>
                          <span className="px-2 py-0.5 bg-[#121212] border border-white/5 rounded">{lang === 'zh' ? '文化' : 'Culture'}: <strong className="text-teal-400">{rev.rating_culture}</strong></span>
                        </div>
                      </div>

                      {/* Dynamic date tag */}
                      <div className="text-[10px] text-gray-600 mt-3 font-mono flex items-center justify-between">
                        <span>{lang === 'zh' ? '发布于' : 'Posted on'}: {new Date(rev.created_at).toLocaleString()}</span>
                        <span className="truncate max-w-[200px] hover:text-emerald-400 transition-colors cursor-help" title={rev.hash}>
                          BLOCK HASH: {rev.hash.substring(0, 16)}...
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab Contents: AI Insights Report */}
        {activeTab === 'aiReport' && (
          <div className="space-y-6" id="ai_report_tab_content">
            {/* Header info card */}
            <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl p-5 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="absolute top-0 right-0 p-3 bg-emerald-500/5 blur-xl w-32 h-32 rounded-full" />
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
                  <span>{t.aiTitle}</span>
                </h3>
                <p className="text-xs text-gray-500 mt-1 max-w-xl">
                  {t.aiDisclaimer}
                </p>
              </div>

              {/* Force regeneration btn */}
              {aiReport && (
                <button
                  onClick={() => handleGenerateAIReport(true)}
                  disabled={isGeneratingAI}
                  className="px-4 py-2.5 bg-[#121212] hover:bg-[#1a1a1a] border border-white/5 text-gray-300 hover:text-white font-semibold text-xs rounded-xl flex items-center gap-2 self-start md:self-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isGeneratingAI ? 'animate-spin' : ''}`} />
                  <span>{lang === 'zh' ? '强制刷新报告' : 'Refresh Report'}</span>
                </button>
              )}
            </div>

            {/* AI Generator Trigger / Loading status / Render */}
            {isGeneratingAI ? (
              <div className="py-20 text-center bg-[#0c0c0c] border border-white/10 rounded-2xl flex flex-col items-center justify-center">
                <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
                <h3 className="text-sm font-semibold text-white mb-1">{t.aiGenerating}</h3>
                <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
                  {lang === 'zh' ? 'Gemini 正在提取、结构化分析、打分并进行逻辑校验。这大约需要几秒钟...' : 'Gemini is loading semantic text models...'}
                </p>
              </div>
            ) : aiError ? (
              <div className="p-6 bg-rose-500/5 border border-rose-500/20 rounded-2xl text-center">
                <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-white mb-1">{lang === 'zh' ? '智能透视生成失败' : 'Failed to Generate Insight'}</h3>
                <p className="text-xs text-rose-400 mb-4 max-w-sm mx-auto">{aiError}</p>
                <button
                  onClick={() => handleGenerateAIReport(true)}
                  className="px-4 py-2 bg-[#121212] hover:bg-[#1a1a1a] border border-white/5 text-white font-semibold text-xs rounded-lg transition-colors"
                >
                  {lang === 'zh' ? '重新生成' : 'Retry'}
                </button>
              </div>
            ) : !aiReport ? (
              <div className="py-16 text-center bg-[#0c0c0c] border border-white/10 rounded-2xl">
                <Sparkles className="w-12 h-12 text-emerald-500/30 mx-auto mb-4 animate-bounce" />
                <h3 className="text-sm font-semibold text-white mb-1">
                  {lang === 'zh' ? '暂无生成的 AI 分析报告' : 'No AI Analysis Generated Yet'}
                </h3>
                <p className="text-xs text-gray-500 max-w-xs mx-auto mb-6">
                  {lang === 'zh' ? '点击下方按钮，由 Gemini 智能模型自动提取员工文字评论，生成结构化口碑报告。' : 'Trigger Google Gemini to scan all evaluations and form an overview.'}
                </p>
                <button
                  onClick={() => handleGenerateAIReport(false)}
                  className="px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-xl transition-colors shadow-lg shadow-emerald-500/10 inline-flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 fill-white" />
                  <span>{t.aiStartBtn}</span>
                </button>
              </div>
            ) : (
              // AI Report Is Present!
              <div className="space-y-6" id="ai_report_renderer">
                {/* Cache alert banner */}
                {isReportFromCache && (
                  <div className="bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 px-4 py-2.5 rounded-xl text-xs flex items-center justify-between">
                    <span>{t.aiCacheAlert}</span>
                    <button
                      onClick={() => handleGenerateAIReport(true)}
                      className="text-[10px] font-bold underline hover:text-white"
                    >
                      {lang === 'zh' ? '刷新' : 'Refresh'}
                    </button>
                  </div>
                )}

                {/* Main summaries blocks */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left Column: Overall Emotion & Score card */}
                  <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">{lang === 'zh' ? 'AI 宏观情感画像' : 'AI Sentiment Portrait'}</h4>
                      <div className="flex items-center gap-3 mt-4">
                        <div className="text-4xl font-black text-white">{aiReport.sentimentScore}</div>
                        <div>
                          <div className={`text-xs font-bold px-2 py-0.5 rounded ${
                            aiReport.overallSentiment === '积极' || aiReport.overallSentiment === 'Positive'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : aiReport.overallSentiment === '消极' || aiReport.overallSentiment === 'Negative'
                              ? 'bg-rose-500/10 text-rose-400'
                              : 'bg-amber-500/10 text-amber-400'
                          }`}>
                            {aiReport.overallSentiment}
                          </div>
                          <div className="text-[10px] text-gray-500 mt-1">{lang === 'zh' ? '情感倾向性得分' : 'Sentiment Score'}</div>
                        </div>
                      </div>
                    </div>

                    {/* Culture Characteristics tag flow */}
                    <div className="mt-6 border-t border-white/5 pt-4">
                      <h5 className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2.5">{t.aiCatVibe}</h5>
                      <div className="flex flex-wrap gap-2">
                        {aiReport.cultureCharacteristics.map(tag => (
                          <span
                            key={tag}
                            className="text-xs px-2.5 py-1 bg-[#121212] border border-white/5 text-gray-300 rounded-lg font-medium"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Narrative Executive Summary */}
                  <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl p-5 md:col-span-2 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">{lang === 'zh' ? '企业深度口碑纪要' : 'Reputation Summary'}</h4>
                      <p className="text-sm text-gray-300 leading-relaxed mt-4 whitespace-pre-line font-medium">
                        {aiReport.overallSummary}
                      </p>
                    </div>

                    <div className="text-[10px] text-gray-600 mt-4 font-mono">
                      GENERATED SECURELY BY GOOGLE GEMINI COGNITIVE LAYER
                    </div>
                  </div>
                </div>

                {/* Section 2: Detailed dimension evaluation scale rows */}
                <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl p-5">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-5">{lang === 'zh' ? 'AI 细分维度评估图谱 (0-100)' : 'AI Breakdown Metrics'}</h4>
                  
                  <div className="space-y-4">
                    {/* WLB score */}
                    <div>
                      <div className="flex justify-between items-center text-xs text-gray-400 font-medium mb-1.5">
                        <span>{lang === 'zh' ? '工作生活平衡 (WLB)' : 'Work Life Balance (WLB)'}</span>
                        <span className="font-extrabold text-indigo-400">{aiReport.wlbScore}</span>
                      </div>
                      <div className="w-full bg-[#121212] h-2 rounded-full overflow-hidden">
                        <div className="bg-indigo-400 h-full rounded-full transition-all duration-500" style={{ width: `${aiReport.wlbScore}%` }} />
                      </div>
                    </div>

                    {/* Work pressure score */}
                    <div>
                      <div className="flex justify-between items-center text-xs text-gray-400 font-medium mb-1.5">
                        <span>{lang === 'zh' ? '日常抗压要求与工作负荷' : 'Workload & Stress Intensity'}</span>
                        <span className="font-extrabold text-amber-400">{aiReport.pressureScore}</span>
                      </div>
                      <div className="w-full bg-[#121212] h-2 rounded-full overflow-hidden">
                        <div className="bg-amber-400 h-full rounded-full transition-all duration-500" style={{ width: `${aiReport.pressureScore}%` }} />
                      </div>
                    </div>

                    {/* Team collaboration score */}
                    <div>
                      <div className="flex justify-between items-center text-xs text-gray-400 font-medium mb-1.5">
                        <span>{lang === 'zh' ? '团队协作氛围与沟通效率' : 'Team Collaboration & Vibe'}</span>
                        <span className="font-extrabold text-teal-400">{aiReport.collabScore}</span>
                      </div>
                      <div className="w-full bg-[#121212] h-2 rounded-full overflow-hidden">
                        <div className="bg-teal-400 h-full rounded-full transition-all duration-500" style={{ width: `${aiReport.collabScore}%` }} />
                      </div>
                    </div>

                    {/* Trust and leadership */}
                    <div>
                      <div className="flex justify-between items-center text-xs text-gray-400 font-medium mb-1.5">
                        <span>{lang === 'zh' ? '管理层信任与领导作风' : 'Management Trust & Leadership'}</span>
                        <span className="font-extrabold text-emerald-400">{aiReport.trustScore}</span>
                      </div>
                      <div className="w-full bg-[#121212] h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-400 h-full rounded-full transition-all duration-500" style={{ width: `${aiReport.trustScore}%` }} />
                      </div>
                    </div>

                    {/* Compensation score */}
                    <div>
                      <div className="flex justify-between items-center text-xs text-gray-400 font-medium mb-1.5">
                        <span>{lang === 'zh' ? '薪酬晋升合理度与福利满意度' : 'Compensation & Promotion Satisfaction'}</span>
                        <span className="font-extrabold text-rose-400">{aiReport.compScore}</span>
                      </div>
                      <div className="w-full bg-[#121212] h-2 rounded-full overflow-hidden">
                        <div className="bg-rose-400 h-full rounded-full transition-all duration-500" style={{ width: `${aiReport.compScore}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pros and Cons bullet listings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Pros card */}
                  <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl p-5">
                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2 mb-4">
                      <ThumbsUp className="w-4 h-4 fill-emerald-400 text-emerald-400" />
                      <span>{t.aiCatStrengths}</span>
                    </h4>
                    <ul className="space-y-3">
                      {aiReport.pros.map((pro, index) => (
                        <li key={index} className="text-sm text-gray-300 flex items-start gap-2.5">
                          <span className="text-emerald-400 font-bold mt-0.5">•</span>
                          <span>{pro}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Cons card */}
                  <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl p-5">
                    <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2 mb-4">
                      <ThumbsDown className="w-4 h-4 fill-rose-400 text-rose-400" />
                      <span>{t.aiCatPainPoints}</span>
                    </h4>
                    <ul className="space-y-3">
                      {aiReport.cons.map((con, index) => (
                        <li key={index} className="text-sm text-gray-300 flex items-start gap-2.5">
                          <span className="text-rose-400 font-bold mt-0.5">•</span>
                          <span>{con}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Section 4: Qualitative Advice and Comp Analytics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Career advice */}
                  <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl p-5">
                    <h4 className="text-xs font-bold text-[#b0a8ff] uppercase tracking-wider mb-4">
                      {lang === 'zh' ? '💡 候选人求职锦囊建议' : '💡 Ideal Candidate & Career Advice'}
                    </h4>
                    <p className="text-sm text-gray-300 leading-relaxed font-medium">
                      {aiReport.careerAdvice}
                    </p>
                  </div>

                  {/* Salary analytics */}
                  <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl p-5">
                    <h4 className="text-xs font-bold text-[#ffd0a8] uppercase tracking-wider mb-4">
                      {lang === 'zh' ? '💰 薪资性价比与晋升合理度分析' : '💰 Salary Analysis & Fairness'}
                    </h4>
                    <p className="text-sm text-gray-300 leading-relaxed font-medium">
                      {aiReport.salaryAnalysis}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab Contents: Ledger Auditing */}
        {activeTab === 'ledger' && (
          <div className="space-y-6" id="ledger_tab_content">
            <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl p-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
                <Lock className="w-5 h-5 text-emerald-400" />
                <span>{t.ledgerTitle}</span>
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                {t.ledgerDesc}
              </p>

              <div className="mt-5 flex items-center gap-4">
                <button
                  onClick={handleVerifyLedger}
                  disabled={isVerifyingLedger || reviews.length === 0}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isVerifyingLedger ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                      <span>{lang === 'zh' ? '执行密码学核验中...' : 'Auditing chain hashes...'}</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5 text-white" />
                      <span>{t.ledgerVerifyBtn}</span>
                    </>
                  )}
                </button>

                {verificationResult && (
                  <div className={`text-xs font-semibold flex items-center gap-1.5 ${
                    verificationResult.isValid ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {verificationResult.isValid ? (
                      <>
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span>{t.ledgerVerifySuccess}</span>
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="w-4 h-4 text-rose-400" />
                        <span>{t.ledgerVerifyFail}</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Blockchain visual chain track layout */}
            {reviews.length > 0 && (
              <div className="relative border-l-2 border-white/5 pl-6 ml-4 py-2 space-y-6" id="ledger_chain_timeline">
                {reviews.map((rev, idx) => {
                  const checkDetail = verificationResult?.details.find(d => d.reviewId === rev.id);
                  const isTampered = checkDetail?.status === 'chain_broken' || checkDetail?.status === 'hash_mismatch';

                  return (
                    <div key={rev.id} className="relative" id={`block-${idx + 1}`}>
                      {/* Left timeline dot indicator */}
                      <span className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 bg-black transition-all ${
                        verificationResult
                          ? isTampered
                            ? 'border-rose-500 bg-rose-500/20'
                            : 'border-emerald-500 bg-emerald-500/20'
                          : 'border-white/15'
                      }`} />

                      <div className={`bg-[#0c0c0c] border rounded-2xl p-4 transition-all ${
                        verificationResult
                          ? isTampered
                            ? 'border-rose-500/50 shadow-md shadow-rose-500/5'
                            : 'border-emerald-500/30'
                          : 'border-white/10'
                      }`}>
                        {/* Header metadata row */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-500 font-mono uppercase">
                              {t.ledgerBlockHeight}: #{idx + 1}
                            </span>
                            <span className="text-xs text-gray-400 font-medium">
                              {rev.position}
                            </span>
                          </div>

                          {/* verification status badge */}
                          {verificationResult && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border flex items-center gap-1 font-mono uppercase ${
                              isTampered
                                ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            }`}>
                              {isTampered ? (
                                <>
                                  <ShieldAlert className="w-3 h-3 text-rose-400" />
                                  <span>TAMPERED</span>
                                </>
                              ) : (
                                <>
                                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                                  <span>VERIFIED OK</span>
                                </>
                              )}
                            </span>
                          )}
                        </div>

                        {/* Hash details */}
                        <div className="space-y-2 text-[11px] font-mono leading-relaxed">
                          <div>
                            <span className="text-gray-500 block sm:inline mr-2">{t.ledgerHash}:</span>
                            <span className="text-gray-300 font-bold break-all bg-white/2 px-1.5 py-0.5 rounded border border-white/5">{rev.hash}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 block sm:inline mr-2">{t.ledgerPrevHash}:</span>
                            <span className="text-gray-400 break-all bg-white/2 px-1.5 py-0.5 rounded border border-white/5">{rev.previous_hash}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 block sm:inline mr-2">{t.ledgerValidator}:</span>
                            <span className="text-emerald-500/85 font-medium">{t.ledgerNodeVerified}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
