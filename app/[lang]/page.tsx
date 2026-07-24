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
    <div className="w-full">
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

                {/* Capsule Search Bar Container (Read-Only trigger to open Global Search Modal) */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="relative w-full cursor-pointer"
                  id="search_box_container"
                  onClick={() => window.dispatchEvent(new CustomEvent('open-search-modal'))}
                >
                  <div className="bg-muted/70 hover:bg-muted backdrop-blur-md p-1.5 rounded-full border border-border hover:border-emerald-500/50 transition-all shadow-lg flex items-center group">
                    <Search className="w-5 h-5 text-muted-foreground group-hover:text-emerald-500 ml-4 mr-2 flex-shrink-0 transition-colors" />
                    <input
                      type="text"
                      readOnly
                      placeholder={t.searchPlaceholder}
                      className="w-full bg-transparent outline-none text-foreground placeholder:text-muted-foreground font-medium text-sm rounded-full pr-2 cursor-pointer"
                      id="main_search_input"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.dispatchEvent(new CustomEvent('open-search-modal'));
                      }}
                      className="px-6 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full text-xs font-bold transition-all shadow-md flex-shrink-0 cursor-pointer"
                      id="search_btn"
                    >
                      {t.searchBtn}
                    </button>
                  </div>
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
    </div>
  );
}
