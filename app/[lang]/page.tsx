'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { i18n, Language } from '../../lib/i18n';
import {
  Search,
  Plus,
  ArrowLeft,
  Briefcase,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  DollarSign,
  AlertCircle,
  Clock,
  Building,
  Building2,
  Database,
  Lock,
  Loader2,
  ChevronRight,
  PlusCircle
} from 'lucide-react';

interface Company {
  id: string;
  name: string;
  review_count: number;
  avg_rating: number;
}

const ROTATING_HEADLINES_ZH = [
  "匿名查询公司口碑，职场环境更透明",
  "不限大厂，让大小厂真实薪资重见天日",
  "打破信息不对称，寻找有温度的企业",
  "全行业覆盖，还原最真实的工作体验"
];

const ROTATING_HEADLINES_EN = [
  "Anonymous reviews for all companies, creating workplace transparency",
  "Beyond big tech, bringing true compensation to light",
  "Break information asymmetry, discover warm workplaces",
  "Industry-wide coverage, revealing the authentic working experience"
];

interface PageProps {
  params: Promise<{ lang: string }>;
}

export default function Home({ params }: PageProps) {
  const { lang: rawLang } = use(params);
  const lang: Language = (rawLang === 'zh-cn' || rawLang === 'zh') ? 'zh' : 'en';

  const [headlineIndex, setHeadlineIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setHeadlineIndex((prev) => (prev + 1) % 4);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const toggleLang = () => {
    const nextLangPath = lang === 'zh' ? '/en' : '/zh-cn';
    window.location.href = nextLangPath;
  };

  const t = i18n[lang];

  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchedName, setSearchedName] = useState('');

  // Autocomplete suggestions
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [searchActiveSuggestionIndex, setSearchActiveSuggestionIndex] = useState(-1);

  // Modals & Form
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  const [formData, setFormData] = useState({
    company_name: '',
    branch_location: '',
    position: '',
    employment_status: 'current',
    salary: '',
    bonus: '',
    experience_years: '3',
    rating_career: 4,
    rating_balance: 3,
    rating_management: 3,
    rating_compensation: 3,
    rating_culture: 4,
    review_text: ''
  });

  // Load Companies list from API on load
  useEffect(() => {
    async function fetchCompanies() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/companies');
        const json = await res.json();
        if (json.success) {
          setCompanies(json.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch companies:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchCompanies();
  }, []);

  const distinctCompanyNames = companies.map(c => c.name);

  // Handle Search Submission
  const handleSearch = (nameToSearch?: string) => {
    const query = (nameToSearch || searchQuery).trim();
    if (!query) return;

    setSearchedName(query);
    setHasSearched(true);

    // Look up company
    const found = companies.find(c => c.name.toLowerCase().trim() === query.toLowerCase().trim());
    if (found) {
      // If company already exists, redirect immediately to company detail page
      window.location.href = `/${rawLang}/companies/${found.id}`;
    } else {
      // Prompt user that company is new and offer creation
      setFormData(prev => ({ ...prev, company_name: query }));
    }
  };

  // Handle Review Submission Form (Create new company + review)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess(false);

    if (!formData.company_name.trim()) {
      setFormError(lang === 'zh' ? '请输入公司名称' : 'Please enter company name');
      return;
    }
    if (!formData.branch_location.trim()) {
      setFormError(lang === 'zh' ? '请输入分公司地点' : 'Please enter branch location');
      return;
    }
    if (!formData.position.trim()) {
      setFormError(lang === 'zh' ? '请输入岗位职位' : 'Please enter position');
      return;
    }
    if (!formData.review_text.trim() || formData.review_text.trim().length < 15) {
      setFormError(lang === 'zh' ? '评价详情内容必须满15个字以上' : 'Review must be at least 15 characters long');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          salary: Number(formData.salary) || 0,
          bonus: Number(formData.bonus) || 0,
          experience_years: Number(formData.experience_years) || 1
        }),
      });

      const json = await res.json();
      if (json.success) {
        setFormSuccess(true);
        // Get the newly created or updated review
        const createdReview = json.data;
        const targetCompanyId = createdReview.company_id;

        // Redirect to the newly created company's details page after 1.5s
        setTimeout(() => {
          window.location.href = `/${rawLang}/companies/${targetCompanyId}`;
        }, 1500);
      } else {
        setFormError(json.error || (lang === 'zh' ? '提交评价失败，请重试。' : 'Failed to submit review.'));
      }
    } catch (err) {
      console.error('Error submitting review:', err);
      setFormError(lang === 'zh' ? '网络连接异常，无法提交。' : 'Network error, failed to submit.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter Search Suggestions
  const filteredSearchSuggestions = searchQuery.trim()
    ? distinctCompanyNames.filter(name =>
        name.toLowerCase().includes(searchQuery.toLowerCase().trim())
      )
    : [];

  return (
    <main className="min-h-screen bg-[#050505] text-[#e0e0e0] selection:bg-emerald-500/20" id="main_root">
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

      <div className="max-w-5xl mx-auto px-4 py-8 md:py-16" id="app_container">
        {/* Navigation Header */}
        <header className="flex items-center justify-between border-b border-white/5 pb-5 mb-8 md:mb-12" id="main_header">
          <Link
            href={`/${rawLang}`}
            onClick={() => {
              setHasSearched(false);
              setSearchQuery('');
            }}
            className="flex items-center gap-2 group"
          >
            <Building className="w-5.5 h-5.5 text-emerald-400 group-hover:scale-105 transition-transform" />
            <span className="font-extrabold text-white text-base md:text-lg tracking-tight group-hover:text-emerald-400 transition-colors">
              {t.brandName}
            </span>
          </Link>
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Language Switcher */}
            <button
              onClick={toggleLang}
              className="px-3 py-1.5 bg-[#0d0d0d] hover:bg-[#151515] border border-white/10 text-gray-400 hover:text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1"
              title={lang === 'zh' ? 'Switch to English' : '切换为中文'}
            >
              <span>🌐</span>
              <span>{lang === 'zh' ? 'EN' : 'ZH'}</span>
            </button>

            <Link 
              href={`/${rawLang}/companies`}
              className="text-xs md:text-sm font-semibold text-gray-400 hover:text-emerald-400 transition-colors flex items-center gap-1.5"
            >
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>{t.viewRankings}</span>
            </Link>

            <Link 
              href={`/${rawLang}/download`}
              className="text-xs md:text-sm font-semibold text-gray-400 hover:text-emerald-400 transition-colors flex items-center gap-1.5"
            >
              <Database className="w-4 h-4 text-emerald-400" />
              <span>{t.downloadNavLabel}</span>
            </Link>
            
            <button
              onClick={() => {
                setFormData({
                  company_name: '',
                  branch_location: '',
                  position: '',
                  employment_status: 'current',
                  salary: '',
                  bonus: '',
                  experience_years: '3',
                  rating_career: 4,
                  rating_balance: 3,
                  rating_management: 3,
                  rating_compensation: 3,
                  rating_culture: 4,
                  review_text: ''
                });
                setShowSubmitForm(true);
              }}
              className="px-3.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-xl transition-colors"
            >
              {t.addReview}
            </button>
          </div>
        </header>

        {/* SEARCH AND INTERACTION CONTAINER */}
        {!hasSearched ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] max-w-2xl mx-auto text-center" id="search_home">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8 w-full"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/5 border border-emerald-500/20 rounded-full shadow-xs text-xs text-emerald-400 font-medium mb-4">
                <Database className="w-3 h-3 text-emerald-500" />
                <span>{t.heroBadge}</span>
              </div>
              <div className="h-[96px] sm:h-[80px] flex items-center justify-center overflow-hidden mb-4">
                <AnimatePresence mode="wait">
                  <motion.h1
                    key={`${lang}-${headlineIndex}`}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3 }}
                    className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white px-2"
                  >
                    {lang === 'zh' ? ROTATING_HEADLINES_ZH[headlineIndex] : ROTATING_HEADLINES_EN[headlineIndex]}
                  </motion.h1>
                </AnimatePresence>
              </div>
              <p className="text-sm md:text-base text-gray-400 leading-relaxed max-w-lg mx-auto">
                {t.heroSub}
              </p>
            </motion.div>

            {/* Main Search Input Form */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="w-full bg-[#0d0d0d] p-2 rounded-2xl shadow-2xl border border-white/10 mb-6 relative"
              id="search_box_container"
            >
              <div className="relative flex items-center">
                <Search className="absolute left-4 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearchSuggestions(true);
                    setSearchActiveSuggestionIndex(-1);
                  }}
                  onFocus={() => setShowSearchSuggestions(true)}
                  onBlur={() => {
                    setTimeout(() => setShowSearchSuggestions(false), 200);
                  }}
                  onKeyDown={(e) => {
                    if (showSearchSuggestions && filteredSearchSuggestions.length > 0) {
                      if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        setSearchActiveSuggestionIndex(prev => 
                          prev < filteredSearchSuggestions.length - 1 ? prev + 1 : 0
                        );
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        setSearchActiveSuggestionIndex(prev => 
                          prev > 0 ? prev - 1 : filteredSearchSuggestions.length - 1
                        );
                      } else if (e.key === 'Enter') {
                        if (searchActiveSuggestionIndex >= 0 && searchActiveSuggestionIndex < filteredSearchSuggestions.length) {
                          e.preventDefault();
                          const selected = filteredSearchSuggestions[searchActiveSuggestionIndex];
                          setSearchQuery(selected);
                          handleSearch(selected);
                          setShowSearchSuggestions(false);
                        } else {
                          handleSearch();
                          setShowSearchSuggestions(false);
                        }
                      } else if (e.key === 'Escape') {
                        setShowSearchSuggestions(false);
                      }
                    } else if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                  placeholder={t.searchPlaceholder}
                  className="w-full pl-12 pr-32 py-4 bg-transparent outline-none text-[#e0e0e0] placeholder:text-gray-500 font-medium text-base rounded-xl"
                  id="main_search_input"
                  autoComplete="off"
                />
                <button
                  onClick={() => {
                    handleSearch();
                    setShowSearchSuggestions(false);
                  }}
                  className="absolute right-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl text-sm font-bold transition-colors duration-200 shadow-sm"
                  id="search_btn"
                >
                  {t.searchBtn}
                </button>
              </div>

              {/* Suggestions Dropdown */}
              {showSearchSuggestions && filteredSearchSuggestions.length > 0 && (
                <div 
                  className="absolute left-0 right-0 top-full mt-2 bg-[#0a0a0a] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50 py-1 max-h-60 overflow-y-auto"
                  id="search_suggestions_dropdown"
                >
                  <div className="px-3 py-1.5 text-[10px] text-gray-500 font-bold uppercase tracking-wider border-b border-white/5">
                    {t.dropdownTitle}
                  </div>
                  {filteredSearchSuggestions.map((comp, idx) => (
                    <button
                      key={comp}
                      onClick={() => {
                        setSearchQuery(comp);
                        handleSearch(comp);
                        setShowSearchSuggestions(false);
                      }}
                      onMouseEnter={() => setSearchActiveSuggestionIndex(idx)}
                      className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between transition-colors ${
                        idx === searchActiveSuggestionIndex 
                          ? 'bg-emerald-500/10 text-emerald-400 font-medium' 
                          : 'text-gray-300 hover:bg-white/5'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-gray-500" />
                        <span>{comp}</span>
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 opacity-50 text-gray-500" />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Quick Suggestions / Top Companies */}
            {companies.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex flex-wrap items-center justify-center gap-2"
                id="search_suggestions"
              >
                <span className="text-xs text-gray-500 font-medium mr-1">{t.trendingSearch}</span>
                {companies.slice(0, 5).map((comp) => (
                  <button
                    key={comp.id}
                    onClick={() => {
                      setSearchQuery(comp.name);
                      handleSearch(comp.name);
                    }}
                    className="text-xs px-3 py-1.5 bg-[#0d0d0d] border border-white/10 hover:border-emerald-500/30 hover:text-emerald-400 rounded-lg text-gray-400 font-medium shadow-xs transition-colors"
                  >
                    {comp.name}
                  </button>
                ))}
              </motion.div>
            )}

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-6 mt-16 w-full pt-8 border-t border-white/10" id="trust_badges">
              <div className="flex flex-col items-center">
                <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-full mb-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-sm font-semibold text-white mb-1">
                  {lang === 'zh' ? '完全匿名' : '100% Anonymous'}
                </h3>
                <p className="text-xs text-gray-500 text-center">
                  {lang === 'zh' ? '不留IP、不留账号，极速提交' : 'No logs, no trackers, submit instantly'}
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-full mb-3">
                  <Lock className="w-5 h-5 text-indigo-400" />
                </div>
                <h3 className="text-sm font-semibold text-white mb-1">
                  {lang === 'zh' ? '链上存证' : 'Ledger Verified'}
                </h3>
                <p className="text-xs text-gray-500 text-center">
                  {lang === 'zh' ? '哈希链接防篡改，公开透明' : 'Chained cryptographically to ensure integrity'}
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-full mb-3">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="text-sm font-semibold text-white mb-1">
                  {lang === 'zh' ? 'AI 语义分析' : 'AI Culture Auditor'}
                </h3>
                <p className="text-xs text-gray-500 text-center">
                  {lang === 'zh' ? '自动解析职场真实满意度与文化' : 'Aggregates employee sentiment & vibe checks'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* NO COMPANY DETECTED WITH THAT NAME STATE */
          <div className="max-w-xl mx-auto" id="no_company_view">
            <button
              onClick={() => setHasSearched(false)}
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white font-medium text-sm mb-8 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{lang === 'zh' ? '返回主页检索' : 'Back to Search'}</span>
            </button>

            <div className="bg-[#0c0c0c] border border-white/10 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-2xl rounded-full" />
              
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Building2 className="w-8 h-8 text-emerald-400" />
              </div>

              <h2 className="text-2xl font-black text-white tracking-tight mb-3">
                {lang === 'zh' ? `尚未收录 “${searchedName}”` : `“${searchedName}” is not yet listed`}
              </h2>
              
              <p className="text-sm text-gray-400 leading-relaxed mb-8 max-w-sm mx-auto">
                {lang === 'zh' 
                  ? '目前去中心化区块链存证账本中还没有该公司的评价记录。您可以作为第一位提交人，创建该公司并同步链上第一条匿名评价！'
                  : 'No evaluations have been submitted for this company yet. Be the pioneer and launch this company listing on the blockchain!'}
              </p>

              <button
                onClick={() => setShowSubmitForm(true)}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm rounded-2xl transition-all shadow-lg shadow-emerald-500/10 inline-flex items-center justify-center gap-2"
              >
                <PlusCircle className="w-5 h-5 text-black" />
                <span>{lang === 'zh' ? '创建该公司并提供第一条匿名口碑' : 'Create & Submit Pioneer Review'}</span>
              </button>
            </div>
          </div>
        )}

        {/* DIALOG/FORM: WRITE REVIEW SUBMISSION */}
        <AnimatePresence>
          {showSubmitForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
              id="submission_modal"
            >
              <motion.div
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 15 }}
                className="bg-[#0d0d0d] w-full max-w-2xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden my-8"
              >
                {/* Modal Header */}
                <div className="bg-[#151515] border-b border-white/5 text-white p-6 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold">
                      {lang === 'zh' ? '提交匿名评价 & 薪资数据' : 'Submit Anonymous Review & Salary Data'}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                      {lang === 'zh' 
                        ? '您的所有薪资与打分在区块链中仅基于公司关联，不含个人信息。' 
                        : 'Your ratings are secured cryptographically without exposing identifiers.'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowSubmitForm(false);
                      setFormError('');
                    }}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleFormSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto" id="new_review_form">
                  {formSuccess ? (
                    <div className="py-8 text-center space-y-3" id="form_success_message">
                      <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto animate-bounce">
                        <ShieldCheck className="w-6 h-6 text-emerald-400" />
                      </div>
                      <h4 className="text-lg font-bold text-white">
                        {lang === 'zh' ? '匿名口碑提交成功！' : 'Pioneer Review Chained Successfully!'}
                      </h4>
                      <p className="text-sm text-gray-400">
                        {lang === 'zh' 
                          ? '正在使用 SHA-256 计算该区块哈希，并自动在账本上创建企业口碑链条，正在跳转...' 
                          : 'Hashing blocks and registering company directory. Redirecting...'}
                      </p>
                    </div>
                  ) : (
                    <>
                      {formError && (
                        <div className="p-3.5 bg-rose-500/5 border border-rose-500/20 rounded-xl text-rose-300 text-xs font-semibold flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                          <span>{formError}</span>
                        </div>
                      )}

                      {/* Top identity notification */}
                      <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-400">
                        <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                        <span>
                          <strong>{lang === 'zh' ? '隐私安全承诺:' : 'Privacy Commitment:'}</strong> {lang === 'zh' ? '平台采用完全匿名机制，服务器不记录任何用户的Cookie、IP地址或登录标识，不记录任何人像、手机或姓名信息。' : 'Absolutely zero tracking, cookies, IP addresses, or usernames logged.'}
                        </span>
                      </div>

                      {/* Brand Info Inputs */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">
                            {lang === 'zh' ? '公司名称' : 'Company Name'} <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.company_name}
                            onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                            placeholder="如: 阿里巴巴"
                            className="w-full px-3 py-2 bg-[#151515] border border-white/5 rounded-xl text-sm text-[#e0e0e0] placeholder-gray-600 focus:bg-[#1a1a1a] focus:border-emerald-500 outline-none"
                            autoComplete="off"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">
                            {lang === 'zh' ? '分公司地点' : 'Branch Location'} <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.branch_location}
                            onChange={(e) => setFormData(prev => ({ ...prev, branch_location: e.target.value }))}
                            placeholder="如: 上海徐汇分部、深圳总部"
                            className="w-full px-3 py-2 bg-[#151515] border border-white/5 rounded-xl text-sm text-[#e0e0e0] placeholder-gray-600 focus:bg-[#1a1a1a] focus:border-emerald-500 outline-none"
                          />
                        </div>
                      </div>

                      {/* Position Info Inputs */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">
                            {lang === 'zh' ? '岗位/职位名称' : 'Position Title'} <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.position}
                            onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                            placeholder="如: 后端研发工程师"
                            className="w-full px-3 py-2 bg-[#151515] border border-white/5 rounded-xl text-sm text-[#e0e0e0] placeholder-gray-600 focus:bg-[#1a1a1a] focus:border-emerald-500 outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">
                            {lang === 'zh' ? '在职状态' : 'Employment Status'}
                          </label>
                          <select
                            value={formData.employment_status}
                            onChange={(e) => setFormData(prev => ({ ...prev, employment_status: e.target.value }))}
                            className="w-full px-3 py-2.5 bg-[#151515] border border-white/5 rounded-xl text-sm text-[#e0e0e0] focus:bg-[#1a1a1a] focus:border-emerald-500 outline-none"
                          >
                            <option value="current" className="bg-[#151515]">{lang === 'zh' ? '目前在职' : 'Current'}</option>
                            <option value="former" className="bg-[#151515]">{lang === 'zh' ? '已经离职' : 'Former'}</option>
                          </select>
                        </div>
                      </div>

                      {/* Salary and details */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">
                            {lang === 'zh' ? '基本月薪 (元/CNY)' : 'Base Monthly Salary (CNY)'}
                          </label>
                          <input
                            type="number"
                            value={formData.salary}
                            onChange={(e) => setFormData(prev => ({ ...prev, salary: e.target.value }))}
                            placeholder="如: 25000"
                            className="w-full px-3 py-2 bg-[#151515] border border-white/5 rounded-xl text-sm text-[#e0e0e0] placeholder-gray-600 focus:bg-[#1a1a1a] focus:border-emerald-500 outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">
                            {lang === 'zh' ? '大约年终奖 (元)' : 'Expected Annual Bonus (CNY)'}
                          </label>
                          <input
                            type="number"
                            value={formData.bonus}
                            onChange={(e) => setFormData(prev => ({ ...prev, bonus: e.target.value }))}
                            placeholder="如: 80000"
                            className="w-full px-3 py-2 bg-[#151515] border border-white/5 rounded-xl text-sm text-[#e0e0e0] placeholder-gray-600 focus:bg-[#1a1a1a] focus:border-emerald-500 outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">
                            {lang === 'zh' ? '相关经验年限' : 'Experience Years'}
                          </label>
                          <input
                            type="number"
                            value={formData.experience_years}
                            onChange={(e) => setFormData(prev => ({ ...prev, experience_years: e.target.value }))}
                            placeholder="如: 3"
                            className="w-full px-3 py-2 bg-[#151515] border border-white/5 rounded-xl text-sm text-[#e0e0e0] placeholder-gray-600 focus:bg-[#1a1a1a] focus:border-emerald-500 outline-none"
                          />
                        </div>
                      </div>

                      {/* Multi-dimensional Sliders */}
                      <div className="bg-[#151515] border border-white/5 rounded-xl p-4 space-y-4">
                        <span className="block text-xs font-extrabold text-gray-300 uppercase border-b border-white/5 pb-2">
                          {lang === 'zh' ? '多维度满意度评分 (1 - 5 星)' : 'Satisfaction Metrics (1 - 5 Stars)'}
                        </span>

                        {[
                          { key: 'rating_career', label: lang === 'zh' ? '职业发展空间' : 'Career Space', desc: lang === 'zh' ? '看重业务增长与技术天花板' : 'Growth & technical progression' },
                          { key: 'rating_balance', label: lang === 'zh' ? '工作平衡 (WLB)' : 'Work Balance (WLB)', desc: lang === 'zh' ? '看重加班强度的负荷与休假' : 'Hours & overload frequency' },
                          { key: 'rating_management', label: lang === 'zh' ? '管理层信任度' : 'Management Trust', desc: lang === 'zh' ? '看重扁平程度与流程合理性' : 'Process complexity & friction' },
                          { key: 'rating_compensation', label: lang === 'zh' ? '薪资福利性价比' : 'Compensation Value', desc: lang === 'zh' ? '看重底薪、年终与各项补贴' : 'Packs, benefits & subsidies' },
                          { key: 'rating_culture', label: lang === 'zh' ? '团队文化氛围' : 'Team Vibe', desc: lang === 'zh' ? '看重同事相处与技术学习氛围' : 'Culture, atmosphere & mentorship' }
                        ].map((slider) => (
                          <div key={slider.key} className="flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs">
                            <div className="md:w-1/2">
                              <span className="font-semibold text-gray-300 block">{slider.label}</span>
                              <span className="text-[10px] text-gray-500">{slider.desc}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <input
                                type="range"
                                min="1"
                                max="5"
                                step="1"
                                value={formData[slider.key as keyof typeof formData]}
                                onChange={(e) => setFormData(prev => ({ ...prev, [slider.key]: Number(e.target.value) }))}
                                className="w-40 h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-emerald-500"
                              />
                              <span className="w-10 text-right font-bold text-emerald-400 text-sm">
                                {formData[slider.key as keyof typeof formData]} {lang === 'zh' ? '星' : 'Stars'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Detailed Text Area */}
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">
                          {lang === 'zh' ? '匿名评论详情描述' : 'Review Details'} <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                          required
                          rows={4}
                          value={formData.review_text}
                          onChange={(e) => setFormData(prev => ({ ...prev, review_text: e.target.value }))}
                          placeholder={lang === 'zh' 
                            ? '请写下您在该公司的真实就职体验，例如：日常工作流程、团队加班状态、考核机制、办公室环境及食堂福利等细节。字数需多于15个字。'
                            : 'Provide authentic detail concerning work pace, pressure, corporate management styles, and workplace benefits (min. 15 chars).'}
                          className="w-full px-3 py-2.5 bg-[#151515] border border-white/5 rounded-xl text-sm text-[#e0e0e0] placeholder-gray-600 focus:bg-[#1a1a1a] focus:border-emerald-500 outline-none resize-none"
                        />
                      </div>

                      {/* Buttons */}
                      <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                        <button
                          type="button"
                          onClick={() => setShowSubmitForm(false)}
                          className="px-5 py-2 border border-white/10 hover:bg-white/5 text-gray-400 hover:text-white rounded-xl text-xs font-bold transition-colors"
                        >
                          {lang === 'zh' ? '取消' : 'Cancel'}
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="inline-flex items-center gap-1.5 px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl text-xs font-bold transition-colors shadow-xs"
                        >
                          {isSubmitting && <Loader2 className="w-3 h-3 animate-spin text-black" />}
                          <span>{lang === 'zh' ? '确认匿名提交' : 'Submit Review'}</span>
                        </button>
                      </div>
                    </>
                  )}
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <footer className="bg-[#0a0a0a] border-t border-white/5 mt-20 py-8 text-xs text-gray-500" id="footer">
        <div className="max-w-5xl mx-auto px-4 text-center space-y-2">
          <p>
            {lang === 'zh'
              ? '© 2026 WorkChain · 基于密码学 SHA-256 区块链链式防篡改存证的公司匿名评价与薪资分析系统'
              : '© 2026 WorkChain · Cryptographic SHA-256 Chain Ledger Secure Corporate Review System'}
          </p>
          <p>
            {lang === 'zh'
              ? '不存储任何账号、姓名、手机、IP、设备标识等可能推断真实身份的任何用户隐私。数据实时存证并同步。'
              : 'Does not store any user accounts, names, phone numbers, IPs, device fingerprints, or tracking telemetry. Data is cryptographically hashed and validated in real-time.'}
          </p>
        </div>
      </footer>
    </main>
  );
}
