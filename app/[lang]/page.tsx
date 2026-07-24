'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { i18n, Language } from '../../lib/i18n';
import { ThemeToggle } from '../../components/theme-toggle';
import { BeforeAfterCanvas } from '../../components/before-after-canvas';
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
  PlusCircle,
  Languages
} from 'lucide-react';

interface Company {
  id: string;
  name: string;
  review_count: number;
  avg_rating: number;
}

interface PageProps {
  params: Promise<{ lang: string }>;
}

export default function Home({ params }: PageProps) {
  const { lang: rawLang } = use(params);
  const lang: Language = (rawLang === 'zh-cn' || rawLang === 'zh') ? 'zh' : 'en';

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
  const [showLangDropdown, setShowLangDropdown] = useState(false);

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
        const createdReview = json.data;
        const targetCompanyId = createdReview.company_id;

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
    <main className="min-h-screen bg-background text-foreground transition-colors duration-200 relative overflow-hidden font-sans selection:bg-emerald-500/20" id="main_root">
      
      {/* Ambient Atmospheric Mesh Glows */}
      <div className="absolute top-1/3 left-[-10%] w-[500px] h-[500px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-5%] right-[-5%] w-[600px] h-[600px] bg-amber-500/5 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[20%] w-[500px] h-[500px] bg-rose-500/5 blur-[140px] rounded-full pointer-events-none" />

      {/* NEWSPAPER EDITORIAL MAX-W CONTAINER (ENTIRE PAGE: HEADER + CONTENT + FOOTER) */}
      <div className="max-w-6xl mx-auto border-x border-border min-h-screen flex flex-col justify-between relative z-10 px-0" id="app_container">
        
        {/* FLOATING CAPSULE NAVBAR INSIDE CONTAINER */}
        <div className="sticky top-6 z-50 px-2 mb-8 sm:mb-12">
          <header className="max-w-4xl mx-auto bg-zinc-950 text-white rounded-full p-2 pl-6 pr-3 shadow-2xl border border-white/10 backdrop-blur-md flex items-center justify-between" id="floating_navbar">
            {/* Pure Text Logo */}
            <Link
              href={`/${rawLang}`}
              onClick={() => {
                setHasSearched(false);
                setSearchQuery('');
              }}
              className="flex items-center group"
            >
              <span className="font-extrabold text-white text-base sm:text-lg tracking-tight transition-colors">
                workchain
              </span>
            </Link>

            {/* Action CTAs & Controls */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Theme Toggle (Circular Ghost) */}
              <ThemeToggle className="w-9 h-9 rounded-full hover:bg-white/10 text-white transition-colors cursor-pointer flex items-center justify-center" />

              {/* Language Switcher Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowLangDropdown(prev => !prev)}
                  className="w-9 h-9 rounded-full hover:bg-white/10 text-white transition-colors cursor-pointer flex items-center justify-center relative"
                  title="切换语言 / Switch Language"
                  aria-label="Toggle Language Menu"
                >
                  <Languages className="w-4 h-4 text-white" />
                </button>

                {showLangDropdown && (
                  <div 
                    className="absolute right-0 top-full mt-2 w-36 bg-zinc-950 text-white border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50 py-1"
                    onMouseLeave={() => setShowLangDropdown(false)}
                  >
                    <button
                      onClick={() => {
                        setShowLangDropdown(false);
                        if (lang !== 'en') window.location.href = '/en';
                      }}
                      className={`w-full text-left px-4 py-2 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                        lang === 'en' ? 'bg-white/15 text-white font-bold' : 'text-zinc-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <span>English</span>
                      {lang === 'en' && <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />}
                    </button>
                    <button
                      onClick={() => {
                        setShowLangDropdown(false);
                        if (lang !== 'zh') window.location.href = '/zh-cn';
                      }}
                      className={`w-full text-left px-4 py-2 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                        lang === 'zh' ? 'bg-white/15 text-white font-bold' : 'text-zinc-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <span>简体中文</span>
                      {lang === 'zh' && <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />}
                    </button>
                  </div>
                )}
              </div>

              {/* Write Review Capsule Button */}
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
                className="px-4 py-2 bg-white text-black hover:bg-zinc-200 text-xs font-bold rounded-full transition-all shadow-md flex items-center gap-1.5 cursor-pointer ml-1"
              >
                <Plus className="w-3.5 h-3.5 text-black" />
                <span>{t.addReview}</span>
              </button>
            </div>
          </header>
        </div>

        {/* MAIN BODY CONTENT */}
        <div className="flex-1 px-2">

        {!hasSearched ? (
          <div className="space-y-12 sm:space-y-16">
            
            {/* HERO INTERACTIVE CANVAS BEFORE/AFTER REVEAL BANNER */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="w-full rounded-none border border-border bg-card relative overflow-hidden"
              id="hero_banner_container"
            >
              <BeforeAfterCanvas
                beforeSrc="/before.png"
                afterSrc="/after.png"
                className="w-full aspect-[16/9]"
              />
            </motion.div>

            {/* TYPOGRAPHY AS ART + HERO SPLIT SEARCH LAYOUT */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-end pt-4" id="hero_split_layout">
              
              {/* Left Column: Bold Neo-Grotesque Headline with Italic Serif Accent */}
              <div className="lg:col-span-7 space-y-6">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-foreground tracking-tight leading-[1.15]">
                    {lang === 'zh' ? (
                      <>
                        去中心化匿名点评，<br className="hidden sm:inline" />让真相 <span className="font-serif-italic text-emerald-500 font-normal underline decoration-emerald-500/30 underline-offset-8">永不褪色</span>
                      </>
                    ) : (
                      <>
                        Say it once, watch truth stay <span className="font-serif-italic text-emerald-500 font-normal underline decoration-emerald-500/30 underline-offset-8">forever</span>
                      </>
                    )}
                  </h1>
                </motion.div>

                {/* Corporate Endorsement Logos Strip */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="pt-4 space-y-3"
                >
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                    {lang === 'zh' ? '涵盖知名大厂与高成长科技企业' : 'Used by employees from top companies'}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-muted-foreground/80 font-bold text-sm">
                    <span className="flex items-center gap-1 hover:text-foreground transition-colors font-mono">
                      <span className="text-emerald-500 text-lg">M</span> monzo
                    </span>
                    <span className="hover:text-foreground transition-colors font-serif font-bold">
                      Guild
                    </span>
                    <span className="hover:text-foreground transition-colors tracking-widest text-xs border border-border px-1.5 py-0.5 rounded font-black">
                      CLEO
                    </span>
                    <span className="hover:text-foreground transition-colors font-sans lowercase font-extrabold">
                      trade<span className="text-emerald-500">me</span>
                    </span>
                    <span className="hover:text-foreground transition-colors font-mono text-xs flex items-center gap-1">
                      <span className="w-2 h-2 bg-emerald-500 rounded-sm" /> Paradigm
                    </span>
                  </div>
                </motion.div>
              </div>

              {/* Right Column: Capsule Search Form */}
              <div className="lg:col-span-5 space-y-6">

                {/* Capsule Search Bar Container */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="relative w-full"
                  id="search_box_container"
                >
                  <div className="bg-muted/70 backdrop-blur-md p-1.5 rounded-full border border-border shadow-lg flex items-center">
                    <Search className="w-5 h-5 text-muted-foreground ml-4 mr-2 flex-shrink-0" />
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
                      className="w-full bg-transparent outline-none text-foreground placeholder:text-muted-foreground font-medium text-sm rounded-full pr-2"
                      id="main_search_input"
                      autoComplete="off"
                    />
                    <button
                      onClick={() => {
                        handleSearch();
                        setShowSearchSuggestions(false);
                      }}
                      className="px-6 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full text-xs font-bold transition-all shadow-md flex-shrink-0 cursor-pointer"
                      id="search_btn"
                    >
                      {t.searchBtn}
                    </button>
                  </div>

                  {/* Suggestions Dropdown */}
                  {showSearchSuggestions && filteredSearchSuggestions.length > 0 && (
                    <div 
                      className="absolute left-0 right-0 top-full mt-2 bg-popover text-popover-foreground border border-border rounded-none overflow-hidden shadow-md z-50 py-1 max-h-60 overflow-y-auto"
                      id="search_suggestions_dropdown"
                    >
                      <div className="px-3 py-1.5 text-[10px] text-muted-foreground font-bold uppercase tracking-wider border-b border-border">
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
                          className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between transition-colors cursor-pointer ${
                            idx === searchActiveSuggestionIndex 
                              ? 'bg-emerald-500/10 text-emerald-500 font-medium' 
                              : 'text-foreground hover:bg-accent'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <Building className="w-4 h-4 text-muted-foreground" />
                            <span>{comp}</span>
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 opacity-50 text-muted-foreground" />
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              </div>
            </div>

            {/* Quick Trending Companies List */}
            {companies.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex flex-wrap items-center gap-2 pt-2"
                id="search_suggestions"
              >
                <span className="text-xs text-muted-foreground font-semibold mr-1">{t.trendingSearch}</span>
                {companies.slice(0, 6).map((comp) => (
                  <button
                    key={comp.id}
                    onClick={() => {
                      setSearchQuery(comp.name);
                      handleSearch(comp.name);
                    }}
                    className="text-xs px-3.5 py-1.5 bg-muted/50 border border-border hover:border-emerald-500/40 hover:text-emerald-500 rounded-none text-muted-foreground font-medium transition-all cursor-pointer"
                  >
                    {comp.name}
                  </button>
                ))}
              </motion.div>
            )}

            {/* Core Trust & Security Pillars */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 border-t border-border" id="trust_badges">
              <div className="bg-card border border-border p-6 rounded-none transition-colors hover:bg-muted/30">
                <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-none flex items-center justify-center mb-4">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                </div>
                <h3 className="text-base font-extrabold text-foreground mb-1.5">
                  {lang === 'zh' ? '100% 密码学匿名' : '100% Anonymous'}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {lang === 'zh' ? '无追踪代码，无需注册登录账号，不记录 IP 地址与设备指纹。' : 'No account needed, zero trackers, IP logging disabled.'}
                </p>
              </div>

              <div className="bg-card border border-border p-6 rounded-none transition-colors hover:bg-muted/30">
                <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 rounded-none flex items-center justify-center mb-4">
                  <Lock className="w-5 h-5 text-indigo-500" />
                </div>
                <h3 className="text-base font-extrabold text-foreground mb-1.5">
                  {lang === 'zh' ? '区块链 Hash 存证' : 'Ledger Verified'}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {lang === 'zh' ? '基于 SHA-256 算法生成区块哈希与链式前导指针，防篡改防撤回。' : 'Linked via SHA-256 block hashes ensuring immutable audit trail.'}
                </p>
              </div>

              <div className="bg-card border border-border p-6 rounded-none transition-colors hover:bg-muted/30">
                <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-none flex items-center justify-center mb-4">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                </div>
                <h3 className="text-base font-extrabold text-foreground mb-1.5">
                  {lang === 'zh' ? 'Gemini 智能文化透视' : 'AI Culture Auditor'}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {lang === 'zh' ? '自动分析生成宏观口碑画像、WLB打分、薪资合理度与求职锦囊。' : 'Aggregates employee sentiment, WLB scores and salary fairness.'}
                </p>
              </div>
            </div>

          </div>
        ) : (
          /* NO COMPANY DETECTED WITH THAT NAME STATE */
          <div className="max-w-xl mx-auto py-12" id="no_company_view">
            <button
              onClick={() => setHasSearched(false)}
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground font-medium text-sm mb-8 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{lang === 'zh' ? '返回主页检索' : 'Back to Search'}</span>
            </button>

            <div className="bg-card border border-border rounded-none p-8 text-center relative text-card-foreground">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-2xl" />
              
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-none flex items-center justify-center mx-auto mb-6">
                <Building2 className="w-8 h-8 text-emerald-500" />
              </div>

              <h2 className="text-2xl font-black text-foreground tracking-tight mb-3">
                {lang === 'zh' ? `尚未收录 “${searchedName}”` : `“${searchedName}” is not yet listed`}
              </h2>
              
              <p className="text-sm text-muted-foreground leading-relaxed mb-8 max-w-sm mx-auto">
                {lang === 'zh' 
                  ? '目前去中心化区块链存证账本中还没有该公司的评价记录。您可以作为第一位提交人，创建该公司并同步链上第一条匿名评价！'
                  : 'No evaluations have been submitted for this company yet. Be the pioneer and launch this company listing on the blockchain!'}
              </p>

              <button
                onClick={() => setShowSubmitForm(true)}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm rounded-none transition-all inline-flex items-center justify-center gap-2 cursor-pointer"
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
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
              id="submission_modal"
            >
              <motion.div
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 15 }}
                className="bg-card text-card-foreground w-full max-w-2xl rounded-none border border-border shadow-lg overflow-hidden my-8"
              >
                {/* Modal Header */}
                <div className="bg-muted/60 border-b border-border text-foreground p-6 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold">
                      {lang === 'zh' ? '提交匿名评价 & 薪资数据' : 'Submit Anonymous Review & Salary Data'}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
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
                    className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleFormSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto" id="new_review_form">
                  {formSuccess ? (
                    <div className="py-8 text-center space-y-3" id="form_success_message">
                      <div className="w-12 h-12 bg-emerald-500/10 rounded-none border border-emerald-500/20 flex items-center justify-center mx-auto animate-bounce">
                        <ShieldCheck className="w-6 h-6 text-emerald-500" />
                      </div>
                      <h4 className="text-lg font-bold text-foreground">
                        {lang === 'zh' ? '匿名口碑提交成功！' : 'Pioneer Review Chained Successfully!'}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {lang === 'zh' 
                          ? '正在使用 SHA-256 计算该区块哈希，并自动在账本上创建企业口碑链条，正在跳转...' 
                          : 'Hashing blocks and registering company directory. Redirecting...'}
                      </p>
                    </div>
                  ) : (
                    <>
                      {formError && (
                        <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-none text-rose-500 text-xs font-semibold flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                          <span>{formError}</span>
                        </div>
                      )}

                      {/* Top identity notification */}
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-none p-3 flex items-start gap-2.5 text-xs text-amber-600 dark:text-amber-400">
                        <ShieldAlert className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span>
                          <strong>{lang === 'zh' ? '隐私安全承诺:' : 'Privacy Commitment:'}</strong> {lang === 'zh' ? '平台采用完全匿名机制，服务器不记录任何用户的Cookie、IP地址或登录标识，不记录任何人像、手机或姓名信息。' : 'Absolutely zero tracking, cookies, IP addresses, or usernames logged.'}
                        </span>
                      </div>

                      {/* Brand Info Inputs */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                          <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">
                            {lang === 'zh' ? '公司名称' : 'Company Name'} <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.company_name}
                            onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                            placeholder="如: 阿里巴巴"
                            className="w-full px-3 py-2 bg-muted/40 border border-border rounded-none text-sm text-foreground placeholder:text-muted-foreground focus:bg-background focus:border-emerald-500 outline-none"
                            autoComplete="off"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">
                            {lang === 'zh' ? '分公司地点' : 'Branch Location'} <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.branch_location}
                            onChange={(e) => setFormData(prev => ({ ...prev, branch_location: e.target.value }))}
                            placeholder="如: 上海徐汇分部、深圳总部"
                            className="w-full px-3 py-2 bg-muted/40 border border-border rounded-none text-sm text-foreground placeholder:text-muted-foreground focus:bg-background focus:border-emerald-500 outline-none"
                          />
                        </div>
                      </div>

                      {/* Position Info Inputs */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">
                            {lang === 'zh' ? '岗位/职位名称' : 'Position Title'} <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.position}
                            onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                            placeholder="如: 后端研发工程师"
                            className="w-full px-3 py-2 bg-muted/40 border border-border rounded-none text-sm text-foreground placeholder:text-muted-foreground focus:bg-background focus:border-emerald-500 outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">
                            {lang === 'zh' ? '在职状态' : 'Employment Status'}
                          </label>
                          <select
                            value={formData.employment_status}
                            onChange={(e) => setFormData(prev => ({ ...prev, employment_status: e.target.value }))}
                            className="w-full px-3 py-2.5 bg-muted/40 border border-border rounded-none text-sm text-foreground focus:bg-background focus:border-emerald-500 outline-none cursor-pointer"
                          >
                            <option value="current" className="bg-popover text-popover-foreground">{lang === 'zh' ? '目前在职' : 'Current'}</option>
                            <option value="former" className="bg-popover text-popover-foreground">{lang === 'zh' ? '已经离职' : 'Former'}</option>
                          </select>
                        </div>
                      </div>

                      {/* Salary and details */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">
                            {lang === 'zh' ? '基本月薪 (元/CNY)' : 'Base Monthly Salary (CNY)'}
                          </label>
                          <input
                            type="number"
                            value={formData.salary}
                            onChange={(e) => setFormData(prev => ({ ...prev, salary: e.target.value }))}
                            placeholder="如: 25000"
                            className="w-full px-3 py-2 bg-muted/40 border border-border rounded-none text-sm text-foreground placeholder:text-muted-foreground focus:bg-background focus:border-emerald-500 outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">
                            {lang === 'zh' ? '大约年终奖 (元)' : 'Expected Annual Bonus (CNY)'}
                          </label>
                          <input
                            type="number"
                            value={formData.bonus}
                            onChange={(e) => setFormData(prev => ({ ...prev, bonus: e.target.value }))}
                            placeholder="如: 80000"
                            className="w-full px-3 py-2 bg-muted/40 border border-border rounded-none text-sm text-foreground placeholder:text-muted-foreground focus:bg-background focus:border-emerald-500 outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">
                            {lang === 'zh' ? '相关经验年限' : 'Experience Years'}
                          </label>
                          <input
                            type="number"
                            value={formData.experience_years}
                            onChange={(e) => setFormData(prev => ({ ...prev, experience_years: e.target.value }))}
                            placeholder="如: 3"
                            className="w-full px-3 py-2 bg-muted/40 border border-border rounded-none text-sm text-foreground placeholder:text-muted-foreground focus:bg-background focus:border-emerald-500 outline-none"
                          />
                        </div>
                      </div>

                      {/* Multi-dimensional Sliders */}
                      <div className="bg-muted/40 border border-border rounded-none p-4 space-y-4">
                        <span className="block text-xs font-extrabold text-foreground uppercase border-b border-border pb-2">
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
                              <span className="font-semibold text-foreground block">{slider.label}</span>
                              <span className="text-[10px] text-muted-foreground">{slider.desc}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <input
                                type="range"
                                min="1"
                                max="5"
                                step="1"
                                value={formData[slider.key as keyof typeof formData]}
                                onChange={(e) => setFormData(prev => ({ ...prev, [slider.key]: Number(e.target.value) }))}
                                className="w-40 h-1.5 bg-muted rounded-none appearance-none cursor-pointer accent-emerald-500"
                              />
                              <span className="w-10 text-right font-bold text-emerald-500 text-sm">
                                {formData[slider.key as keyof typeof formData]} {lang === 'zh' ? '星' : 'Stars'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Detailed Text Area */}
                      <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">
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
                          className="w-full px-3 py-2.5 bg-muted/40 border border-border rounded-none text-sm text-foreground placeholder:text-muted-foreground focus:bg-background focus:border-emerald-500 outline-none resize-none"
                        />
                      </div>

                      {/* Buttons */}
                      <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <button
                          type="button"
                          onClick={() => setShowSubmitForm(false)}
                          className="px-5 py-2 border border-border hover:bg-accent text-muted-foreground hover:text-foreground rounded-none text-xs font-bold transition-colors cursor-pointer"
                        >
                          {lang === 'zh' ? '取消' : 'Cancel'}
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="inline-flex items-center gap-1.5 px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-black rounded-none text-xs font-bold transition-colors cursor-pointer"
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

        {/* Newspaper Editorial Footer inside container - Flush Lines with Container Borders */}
        <footer className="mt-20 border-t border-border font-sans px-0 w-full" id="footer">
          {/* Newspaper Horizontal Rule Navigation Stack */}
          <div className="divide-y divide-border border-b border-border">
            {/* Item 1: Companies Ranking */}
            <Link 
              href={`/${rawLang}/companies`}
              className="group py-4 px-4 sm:px-6 flex items-center justify-between text-foreground hover:bg-muted/30 transition-colors"
            >
              <span className="text-xl sm:text-2xl font-bold tracking-tight">
                {lang === 'zh' ? '全行业公司口碑龙虎榜' : 'Corporate Ratings & Rankings'}
              </span>
              <span className="text-muted-foreground group-hover:text-foreground text-lg sm:text-xl font-mono transition-colors">
                +
              </span>
            </Link>

            {/* Item 2: Data Ledger Download */}
            <Link 
              href={`/${rawLang}/download`}
              className="group py-4 px-4 sm:px-6 flex items-center justify-between text-foreground hover:bg-muted/30 transition-colors"
            >
              <span className="text-xl sm:text-2xl font-bold tracking-tight">
                {lang === 'zh' ? '密码学数据链式归档下载' : 'Ledger Data Archives'}
              </span>
              <span className="text-muted-foreground group-hover:text-foreground text-lg sm:text-xl font-mono transition-colors">
                +
              </span>
            </Link>

            {/* Item 3: Submit Pioneer Review */}
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
              className="w-full group py-4 px-4 sm:px-6 flex items-center justify-between text-foreground hover:bg-muted/30 transition-colors text-left cursor-pointer"
            >
              <span className="text-xl sm:text-2xl font-bold tracking-tight">
                {lang === 'zh' ? '添加企业匿名评价 & 薪资数据' : 'Submit Anonymous Review & Salary'}
              </span>
              <span className="text-muted-foreground group-hover:text-foreground text-lg sm:text-xl font-mono transition-colors">
                +
              </span>
            </button>
          </div>

          {/* Footer Copyright & Privacy Meta */}
          <div className="py-6 px-4 sm:px-6 text-xs text-muted-foreground space-y-2 text-center sm:text-left bg-muted/20">
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
      </div>
    </main>
  );
}
