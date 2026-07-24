'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { i18n, Language } from '../../lib/i18n';
import {
  Building,
  ArrowLeft,
  Search,
  ArrowUpDown,
  TrendingUp,
  Star,
  Clock,
  DollarSign,
  ChevronRight,
  Database,
  Lock,
  Loader2,
  SlidersHorizontal,
  ChevronDown,
  Sparkles,
  Award
} from 'lucide-react';

interface Review {
  id: string;
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

interface CompanyStats {
  id: string;
  name: string;
  reviewCount: number;
  avgRating: number;
  avgCareer: number;
  avgBalance: number;
  avgManagement: number;
  avgCompensation: number;
  avgCulture: number;
  avgSalary: number;
  avgBonus: number;
}

type SortField = 'avgRating' | 'reviewCount' | 'avgSalary' | 'avgBalance' | 'avgCareer' | 'avgCompensation' | 'avgCulture';
type SortOrder = 'desc' | 'asc';

export default function CompaniesPage() {
  const [lang, setLang] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('lang') as Language;
      if (savedLang === 'zh' || savedLang === 'en') {
        return savedLang;
      }
    }
    return 'zh';
  });
  const [companiesList, setCompaniesList] = useState<CompanyStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const toggleLang = () => {
    const nextLang = lang === 'zh' ? 'en' : 'zh';
    setLang(nextLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('lang', nextLang);
    }
  };

  const t = i18n[lang];

  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('avgRating');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  useEffect(() => {
    async function fetchCompanies() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/companies');
        const json = await res.json();
        if (json.success) {
          const stats: CompanyStats[] = (json.data || []).map((c: any) => ({
            id: c.id,
            name: c.name,
            reviewCount: c.review_count,
            avgRating: c.avg_rating,
            avgCareer: c.avg_career,
            avgBalance: c.avg_balance,
            avgManagement: c.avg_management,
            avgCompensation: c.avg_compensation,
            avgCulture: c.avg_culture,
            avgSalary: Math.round(c.avg_salary / 1000),
            avgBonus: Math.round(c.avg_bonus / 1000)
          }));
          setCompaniesList(stats);
        }
      } catch (err) {
        console.error('Failed to load companies for companies directory:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchCompanies();
  }, []);

  // Filter & Sort
  const filteredAndSortedCompanies = companiesList
    .filter(comp => comp.name.toLowerCase().includes(searchQuery.toLowerCase().trim()))
    .sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      
      if (sortOrder === 'desc') {
        return valB - valA;
      } else {
        return valA - valB;
      }
    });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const sortOptions: { label: string; field: SortField }[] = [
    { label: lang === 'zh' ? '综合评分' : 'Overall Score', field: 'avgRating' },
    { label: lang === 'zh' ? '评价数量' : 'Reviews Count', field: 'reviewCount' },
    { label: lang === 'zh' ? '平均月薪' : 'Avg Monthly Salary', field: 'avgSalary' },
    { label: lang === 'zh' ? '工作生活平衡(WLB)' : 'Work-Life Balance (WLB)', field: 'avgBalance' },
    { label: lang === 'zh' ? '职业发展' : 'Career Growth', field: 'avgCareer' },
    { label: lang === 'zh' ? '福利待遇' : 'Benefits & Perks', field: 'avgCompensation' },
    { label: lang === 'zh' ? '企业文化' : 'Company Culture', field: 'avgCulture' }
  ];

  return (
    <main className="min-h-screen bg-[#050505] text-[#e0e0e0] selection:bg-emerald-500/20" id="companies_directory_root">
      {/* Top Banner indicating absolute anonymity */}
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

      <div className="max-w-5xl mx-auto px-4 py-8" id="companies_directory_container">
        {/* Navigation back */}
        <div className="flex items-center justify-between mb-8" id="directory_nav">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white font-medium text-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t.backToHome}</span>
            </Link>

            {/* Language Switcher */}
            <button
              onClick={toggleLang}
              className="px-2.5 py-1 bg-[#121212] hover:bg-[#1a1a1a] border border-white/5 text-gray-400 hover:text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
            >
              <span>🌐</span>
              <span>{lang === 'zh' ? 'EN' : 'ZH'}</span>
            </button>

            <Link
              href="/download"
              className="inline-flex items-center gap-1.5 text-gray-400 hover:text-white font-semibold text-xs bg-[#121212] hover:bg-[#1a1a1a] border border-white/5 px-2.5 py-1 rounded-lg transition-colors"
            >
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t.downloadNavLabel}</span>
            </Link>
          </div>

          <div className="inline-flex items-center gap-2 text-xs text-gray-500">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t.allReviewsCount}: {companiesList.length}</span>
          </div>
        </div>

        {/* Title Block */}
        <div className="mb-8" id="directory_heading">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/5 border border-emerald-500/20 rounded-full shadow-xs text-xs text-emerald-400 font-medium mb-3">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t.dirTitle}</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            {t.dirMainHeader}
          </h1>
          <p className="text-sm text-gray-400 mt-2 max-w-xl">
            {t.dirSub}
          </p>
        </div>

        {/* Search and Filters Block */}
        <div className="bg-[#0d0d0d] border border-white/10 rounded-2xl p-4 mb-6" id="directory_filters_panel">
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            {/* Quick Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.dirSearchPlaceholder}
                className="w-full pl-10 pr-4 py-2.5 bg-[#121212] border border-white/5 focus:border-emerald-500/50 outline-none text-sm text-[#e0e0e0] placeholder:text-gray-600 rounded-xl transition-colors"
                autoComplete="off"
              />
            </div>

            {/* Quick Indicator of Sort Mode */}
            <div className="flex items-center gap-2 text-xs text-gray-400 bg-white/5 border border-white/5 px-3 py-2 rounded-xl">
              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {t.dirSortModeLabel}
                <strong className="text-emerald-400 font-bold">
                  {sortOptions.find(opt => opt.field === sortField)?.label}
                </strong>
                （{sortOrder === 'desc' ? (lang === 'zh' ? '降序' : 'Desc') : (lang === 'zh' ? '升序' : 'Asc')}）
              </span>
            </div>
          </div>

          {/* Sort Toggles Grid */}
          <div className="mt-4 border-t border-white/5 pt-4">
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">
              {t.dirSortFieldLabel}
            </div>
            <div className="flex flex-wrap gap-2">
              {sortOptions.map((opt) => {
                const isActive = sortField === opt.field;
                return (
                  <button
                    key={opt.field}
                    onClick={() => handleSort(opt.field)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 font-medium ${
                      isActive
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                        : 'bg-[#121212] border-white/5 text-gray-400 hover:text-white hover:border-white/10'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {isActive && (
                      <ArrowUpDown className={`w-3 h-3 ${sortOrder === 'desc' ? 'rotate-180' : ''} transition-transform duration-200`} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* List Section */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20" id="loading_state">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-4" />
            <p className="text-sm text-gray-500">
              {lang === 'zh' ? '正在链上拉取并汇总企业评价数据...' : 'Syncing and aggregating anonymous ledger reviews...'}
            </p>
          </div>
        ) : filteredAndSortedCompanies.length === 0 ? (
          <div className="text-center py-16 bg-[#0d0d0d] border border-white/10 rounded-2xl" id="empty_state">
            <Building className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <h3 className="text-sm font-semibold text-white mb-1">{t.dirNoResults}</h3>
            <p className="text-xs text-gray-500 max-w-xs mx-auto">
              {t.dirNoResultsDesc}
            </p>
          </div>
        ) : (
          <div className="space-y-3.5" id="companies_list">
            {filteredAndSortedCompanies.map((comp, idx) => (
              <motion.div
                key={comp.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.04, 0.4), duration: 0.3 }}
              >
                <Link
                  href={`/companies/${comp.id}`}
                  className="block bg-[#0d0d0d] hover:bg-[#111111] border border-white/10 hover:border-emerald-500/30 rounded-2xl p-5 transition-all group"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Brand Info & Basic Rating */}
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-[#151515] group-hover:bg-emerald-500/10 border border-white/5 group-hover:border-emerald-500/20 rounded-xl transition-all">
                        <Building className="w-6 h-6 text-emerald-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors flex items-center gap-2">
                          <span>{comp.name}</span>
                          <span className="text-[10px] font-bold bg-[#151515] text-gray-400 px-2 py-0.5 rounded border border-white/5">
                            {comp.reviewCount} {lang === 'zh' ? '笔评价' : 'reviews'}
                          </span>
                        </h3>
                        <div className="flex items-center gap-3 mt-1.5">
                          {/* Aggregate Star Badge */}
                          <div className="flex items-center gap-1 text-sm text-emerald-400 font-bold bg-emerald-500/5 border border-emerald-500/10 px-2 py-0.5 rounded">
                            <Star className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" />
                            <span>{comp.avgRating} {lang === 'zh' ? '综合分' : 'Rating'}</span>
                          </div>
                          
                          {/* Avg Salary info */}
                          {comp.avgSalary > 0 && (
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <DollarSign className="w-3.5 h-3.5 text-gray-500" />
                              <span>{lang === 'zh' ? '平均月薪' : 'Avg Salary'}: <strong className="text-white font-bold">{comp.avgSalary}K</strong></span>
                              {comp.avgBonus > 0 && (
                                <span className="text-gray-500">
                                  （{lang === 'zh' ? '年终奖' : 'Bonus'}: <strong className="text-gray-300 font-semibold">{comp.avgBonus}K</strong>）
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Breakdown Ratings row */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 border-t lg:border-t-0 border-white/5 pt-4 lg:pt-0">
                      {/* WLB */}
                      <div className="flex flex-col bg-[#121212] px-2.5 py-1.5 rounded-lg border border-white/5 text-center min-w-[76px]">
                        <span className="text-[9px] text-gray-500 font-medium">{lang === 'zh' ? '工作生活平衡' : 'WLB'}</span>
                        <span className="text-xs font-extrabold text-indigo-400 mt-0.5">{comp.avgBalance}</span>
                      </div>
                      {/* Career */}
                      <div className="flex flex-col bg-[#121212] px-2.5 py-1.5 rounded-lg border border-white/5 text-center min-w-[76px]">
                        <span className="text-[9px] text-gray-500 font-medium">{lang === 'zh' ? '职业成长' : 'Career'}</span>
                        <span className="text-xs font-extrabold text-emerald-400 mt-0.5">{comp.avgCareer}</span>
                      </div>
                      {/* Management */}
                      <div className="flex flex-col bg-[#121212] px-2.5 py-1.5 rounded-lg border border-white/5 text-center min-w-[76px]">
                        <span className="text-[9px] text-gray-500 font-medium">{lang === 'zh' ? '管理层满意' : 'Management'}</span>
                        <span className="text-xs font-extrabold text-amber-400 mt-0.5">{comp.avgManagement}</span>
                      </div>
                      {/* Compensation */}
                      <div className="flex flex-col bg-[#121212] px-2.5 py-1.5 rounded-lg border border-white/5 text-center min-w-[76px]">
                        <span className="text-[9px] text-gray-500 font-medium">{lang === 'zh' ? '福利待遇' : 'Benefits'}</span>
                        <span className="text-xs font-extrabold text-rose-400 mt-0.5">{comp.avgCompensation}</span>
                      </div>
                      {/* Culture */}
                      <div className="flex flex-col bg-[#121212] px-2.5 py-1.5 rounded-lg border border-white/5 text-center min-w-[76px]">
                        <span className="text-[9px] text-gray-500 font-medium">{lang === 'zh' ? '企业文化' : 'Culture'}</span>
                        <span className="text-xs font-extrabold text-teal-400 mt-0.5">{comp.avgCulture}</span>
                      </div>
                    </div>

                    {/* Action Arrow (desktop and hover visual) */}
                    <div className="hidden lg:flex items-center text-gray-500 group-hover:text-emerald-400 transition-colors pl-2">
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
