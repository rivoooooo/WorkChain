'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { Languages, Plus, Loader2, AlertCircle, ShieldCheck, X, Search, Building2, Star, ArrowRight, Github } from 'lucide-react';
import {
  Language,
  i18n,
  isRtlLanguage,
  localeOptions,
  resolveLanguage,
} from '../lib/i18n';
import { ThemeToggle } from './theme-toggle';
import { CompanySelect, CompanyItem as SelectedCompanyItem } from './company-select';
import {
  HumanVerification,
  humanVerificationEnabled,
} from './human-verification';
import { getPublicCompanies } from '@/lib/public-data';

interface CompanyItem {
  id: string;
  name: string;
  review_count: number;
  avg_rating: number;
}

interface LayoutFrameProps {
  children: React.ReactNode;
  rawLang: string;
}

export function LayoutFrame({ children, rawLang }: LayoutFrameProps) {
  const lang: Language = resolveLanguage(rawLang);
  const t = i18n[lang];

  const [showLangDropdown, setShowLangDropdown] = useState(false);

  // Global Search Modal State
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchModalQuery, setSearchModalQuery] = useState('');
  const [companyList, setCompanyList] = useState<CompanyItem[]>([]);
  const [isFetchingCompanies, setIsFetchingCompanies] = useState(false);
  const [searchActiveIndex, setSearchActiveIndex] = useState(-1);

  // Global Review Modal State
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);
  const [humanVerificationToken, setHumanVerificationToken] = useState<string | null>(null);
  const [humanVerificationResetKey, setHumanVerificationResetKey] = useState(0);

  useEffect(() => {
    document.documentElement.lang = rawLang;
    document.documentElement.dir = isRtlLanguage(lang) ? 'rtl' : 'ltr';
    return () => {
      document.documentElement.dir = 'ltr';
    };
  }, [lang, rawLang]);

  // Listen for custom event 'open-search-modal' from any page/hero search button
  useEffect(() => {
    const handleOpenSearch = () => setShowSearchModal(true);
    window.addEventListener('open-search-modal', handleOpenSearch);
    return () => window.removeEventListener('open-search-modal', handleOpenSearch);
  }, []);

  // Fetch companies list on demand when search modal opens
  useEffect(() => {
    if (showSearchModal && companyList.length === 0) {
      setIsFetchingCompanies(true);
      getPublicCompanies('', 200)
        .then(data => setCompanyList(data))
        .catch(err => console.error('Failed to load companies for search modal:', err))
        .finally(() => setIsFetchingCompanies(false));
    }
  }, [showSearchModal, companyList.length]);

  // ESC key listener to close submit modal and search modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showSearchModal) setShowSearchModal(false);
        if (showSubmitForm) setShowSubmitForm(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSubmitForm, showSearchModal]);

  const [formData, setFormData] = useState({
    company_name: '',
    country_name: '中国',
    branch_location: '',
    position: '',
    employment_status: 'current',
    salary: '',
    bonus: '',
    experience_years: '3',
    daily_work_hours: '8',
    weekly_work_days: '5',
    rating_career: 4,
    rating_balance: 3,
    rating_management: 3,
    rating_compensation: 3,
    rating_culture: 4,
    review_text: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.company_name.trim()) {
      setFormError(t.formErrorNameRequired);
      return;
    }
    if (formData.review_text.trim().length < 15) {
      setFormError(t.formErrorTextLength);
      return;
    }
    if (humanVerificationEnabled && !humanVerificationToken) {
      setFormError(
        lang === 'zh' ? '请先完成人机验证。' : 'Please complete human verification.'
      );
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          salary: Number(formData.salary) || 0,
          bonus: Number(formData.bonus) || 0,
          experience_years: Number(formData.experience_years) || 1,
          daily_work_hours: Number(formData.daily_work_hours),
          weekly_work_days: Number(formData.weekly_work_days),
          humanVerificationToken,
        })
      });
      const json = await res.json();

      if (json.success) {
        setFormSuccess(true);
        const targetCompanyId = json.data?.company_id;
        setTimeout(() => {
          if (targetCompanyId) {
            window.location.href = `/${rawLang}/companies/${targetCompanyId}`;
            return;
          }
          setShowSubmitForm(false);
          setFormSuccess(false);
        }, 1800);
      } else {
        setFormError(json.error || t.formErrorSubmitFailed);
      }
    } catch (err) {
      console.error(err);
      setFormError(t.formErrorNetwork);
    } finally {
      setIsSubmitting(false);
      setHumanVerificationToken(null);
      setHumanVerificationResetKey((value) => value + 1);
    }
  };

  const openReviewModal = () => {
    setFormData({
      company_name: '',
      country_name: '中国',
      branch_location: '',
      position: '',
      employment_status: 'current',
      salary: '',
      bonus: '',
      experience_years: '3',
      daily_work_hours: '8',
      weekly_work_days: '5',
      rating_career: 4,
      rating_balance: 3,
      rating_management: 3,
      rating_compensation: 3,
      rating_culture: 4,
      review_text: ''
    });
    setFormError('');
    setFormSuccess(false);
    setHumanVerificationToken(null);
    setHumanVerificationResetKey((value) => value + 1);
    setShowSubmitForm(true);
  };

  return (
    <div
      className="min-h-screen bg-background text-foreground transition-colors duration-200 relative overflow-hidden font-sans selection:bg-emerald-500/20"
      id="main_root"
      lang={rawLang}
      dir={isRtlLanguage(lang) ? 'rtl' : 'ltr'}
    >
      {/* Ambient Atmospheric Mesh Glows */}
      <div className="absolute top-1/3 left-[-10%] w-[500px] h-[500px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-5%] right-[-5%] w-[600px] h-[600px] bg-amber-500/5 blur-[140px] rounded-full pointer-events-none" />

      {/* NEWSPAPER EDITORIAL MAX-W CONTAINER (ENTIRE APPLICATION: HEADER + ROUTE MAIN + FOOTER) */}
      <div className="max-w-6xl mx-auto border-x border-border min-h-screen flex flex-col justify-between relative z-10 px-0" id="app_container">
        
        {/* NEWSPAPER EDITORIAL HEADER MASTHEAD */}
        <header className="w-full border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50 mb-8 px-4 sm:px-6 py-4 flex items-center justify-between" id="newspaper_header">
          {/* Left: App Name */}
          <Link
            href={`/${rawLang}`}
            className="flex items-center group"
          >
            <span className="font-black text-foreground text-xl sm:text-2xl tracking-tighter uppercase font-sans group-hover:opacity-80 transition-opacity">
              workchain
            </span>
          </Link>

          {/* Right: Actions & Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Ghost Search Icon Button */}
            <button
              type="button"
              onClick={() => setShowSearchModal(true)}
              className="w-9 h-9 text-foreground hover:bg-muted transition-colors cursor-pointer flex items-center justify-center rounded-none"
              title={lang === 'zh' ? '搜索公司口碑' : 'Search Company Ledger'}
              aria-label="Search Companies"
            >
              <Search className="w-4 h-4 text-foreground" />
            </button>

            {/* Theme Toggle */}
            <ThemeToggle className="w-9 h-9 text-foreground hover:bg-muted transition-colors cursor-pointer flex items-center justify-center rounded-none" />

            <a
              href="https://github.com/rivoooooo/WorkChain"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 text-foreground hover:bg-muted transition-colors cursor-pointer flex items-center justify-center rounded-none"
              title="GitHub · rivoooooo/WorkChain"
              aria-label="Open WorkChain on GitHub"
            >
              <Github className="w-4 h-4 text-foreground" />
            </a>

            {/* Language Switcher Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowLangDropdown(prev => !prev)}
                className="w-9 h-9 text-foreground hover:bg-muted transition-colors cursor-pointer flex items-center justify-center rounded-none relative"
                title="切换语言 / Switch Language"
                aria-label="Toggle Language Menu"
              >
                <Languages className="w-4 h-4 text-foreground" />
              </button>

              {showLangDropdown && (
                <div
                  className="absolute end-0 top-full mt-2 w-44 max-h-80 overflow-y-auto bg-popover text-popover-foreground border border-border rounded-none shadow-lg z-50 py-1"
                  onMouseLeave={() => setShowLangDropdown(false)}
                >
                  {localeOptions.map((locale) => (
                    <button
                      key={locale.code}
                      onClick={() => {
                        setShowLangDropdown(false);
                        if (lang === locale.code) return;
                        const segments = window.location.pathname.split('/');
                        segments[1] = locale.path;
                        window.location.href = segments.join('/') || `/${locale.path}`;
                      }}
                      dir={locale.dir}
                      className={`w-full text-start px-4 py-2 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                        lang === locale.code
                          ? 'bg-muted text-foreground font-bold'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      <span>{locale.label}</span>
                      {lang === locale.code && (
                        <span className="w-1.5 h-1.5 bg-foreground rounded-full" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Write Review Newspaper Button */}
            <button
              onClick={openReviewModal}
              className="px-4 py-2 bg-foreground text-background hover:opacity-90 text-xs font-bold rounded-none transition-all shadow-none flex items-center gap-1.5 cursor-pointer ml-1"
            >
              <Plus className="w-3.5 h-3.5 text-background" />
              <span>{t.addReview}</span>
            </button>
          </div>
        </header>

        {/* MAIN BODY CONTENT (ROUTE SPECIFIC CONTENT RENDERED HERE) */}
        <main className="flex-1 px-4">
          {children}
        </main>

        {/* Newspaper Editorial Footer inside container */}
        <footer className="mt-20 border-t border-border font-sans px-0 w-full" id="footer">
          {/* Newspaper Horizontal Rule Navigation Stack */}
          <div className="divide-y divide-border border-b border-border">
            {/* Item 1: Companies Ranking */}
            <Link 
              href={`/${rawLang}/companies`}
              className="group py-4 px-4 sm:px-6 flex items-center justify-between text-foreground hover:bg-muted/30 transition-colors"
            >
              <span className="text-xl sm:text-2xl font-bold tracking-tight">
                {t.footerCompanies}
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
                {t.footerDownload}
              </span>
              <span className="text-muted-foreground group-hover:text-foreground text-lg sm:text-xl font-mono transition-colors">
                +
              </span>
            </Link>

            {/* Item 3: Submit Pioneer Review */}
            <button 
              onClick={openReviewModal}
              className="w-full group py-4 px-4 sm:px-6 flex items-center justify-between text-foreground hover:bg-muted/30 transition-colors text-left cursor-pointer"
            >
              <span className="text-xl sm:text-2xl font-bold tracking-tight">
                {t.footerContribute}
              </span>
              <span className="text-muted-foreground group-hover:text-foreground text-lg sm:text-xl font-mono transition-colors">
                +
              </span>
            </button>
          </div>

          {/* Footer Copyright & Privacy Meta */}
          <div className="py-6 px-4 sm:px-6 text-xs text-muted-foreground space-y-2 text-center sm:text-left bg-muted/20">
            <p>{t.footerCopyright}</p>
            <p>{t.footerPrivacySummary}</p>
            <Link
              href={`/${rawLang}/privacy`}
              className="inline-block underline underline-offset-4 hover:text-foreground transition-colors"
            >
              {t.privacyLink}
            </Link>
          </div>
        </footer>

        {/* Global Review Submission Modal */}
        <AnimatePresence>
          {showSubmitForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end justify-center p-3 sm:p-6 pt-12 sm:pt-16 overflow-hidden"
              id="submission_modal"
            >
              {/* Outer Wrapper anchored to bottom with top margin and max-h 82dvh */}
              <div className="relative max-w-2xl w-full h-full max-h-[82dvh] mb-0 sm:mb-2 flex flex-col">
                
                {/* Stacked Second Document Background Sheet (Unfolds outward -4.5deg like a paper fan opening) */}
                <motion.div 
                  initial={{ y: 120, rotate: 0, x: 0, opacity: 0 }}
                  animate={{ y: 0, rotate: -4.5, x: -6, opacity: 0.85 }}
                  exit={{ y: 120, rotate: 0, x: 0, opacity: 0 }}
                  transition={{ type: 'spring', damping: 26, stiffness: 280, delay: 0.04 }}
                  className="absolute inset-0 bg-card border border-border shadow-md pointer-events-none z-0 origin-bottom-left"
                />

                {/* Main Front Form Container (Pops up from bottom & settles into position) */}
                <motion.div
                  initial={{ y: 120, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 120, opacity: 0 }}
                  transition={{ type: 'spring', damping: 26, stiffness: 300 }}
                  className="relative z-10 bg-card border border-border shadow-2xl w-full h-full max-h-[82dvh] flex flex-col text-card-foreground overflow-hidden"
                >
                  {/* Sticky Header */}
                  <div className="p-6 sm:p-8 pb-4 border-b border-border bg-card shrink-0 relative z-20">
                    <button
                      onClick={() => setShowSubmitForm(false)}
                      className="absolute right-6 top-6 text-muted-foreground hover:text-foreground cursor-pointer z-20"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    <h2 className="text-xl font-bold text-foreground mb-1 flex items-center gap-2">
                      <Plus className="w-5 h-5 text-emerald-500" />
                      <span>{t.formTitle}</span>
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {t.formSubtitle}
                    </p>
                  </div>

                  {/* Scrollable Form Body with Solid bg-card Background */}
                  <div className="flex-1 overflow-y-auto p-6 sm:p-8 pt-4 bg-card">
                    {formError && (
                      <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-none text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{formError}</span>
                      </div>
                    )}

                    {formSuccess ? (
                      <div className="py-12 text-center space-y-3">
                        <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
                        <h3 className="text-base font-bold text-foreground">{t.formSuccessTitle}</h3>
                        <p className="text-xs text-muted-foreground">{t.formSuccessDesc}</p>
                      </div>
                    ) : (
                      <form onSubmit={handleSubmit} className="space-y-4 flex-1">
                        {/* Form Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">
                              {t.formLabelCompany} <span className="text-rose-500">*</span>
                            </label>
                            <CompanySelect
                              required
                              value={formData.company_name}
                              onChange={(val) => setFormData(prev => ({ ...prev, company_name: val }))}
                              onCompanySelect={(comp: SelectedCompanyItem) => {
                                setFormData(prev => ({
                                  ...prev,
                                  company_name: comp.name,
                                  country_name:
                                    comp.country_name ||
                                    comp.country_code ||
                                    prev.country_name,
                                  branch_location: comp.city || comp.province || prev.branch_location,
                                }));
                              }}
                              placeholder={t.formPlaceholderCompany}
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">
                              {t.formLabelCountry}
                              <span className="text-rose-500"> *</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={formData.country_name}
                              onChange={(event) =>
                                setFormData((previous) => ({
                                  ...previous,
                                  country_name: event.target.value,
                                }))
                              }
                              placeholder={lang === 'zh' ? '例如：中国、美国' : 'e.g. China, United States'}
                              className="w-full px-3 py-2 bg-muted/40 border border-border rounded-none text-sm text-foreground focus:bg-background focus:border-emerald-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">
                              {t.formLabelLocation}
                              <span className="text-rose-500"> *</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={formData.branch_location}
                              onChange={(event) =>
                                setFormData((previous) => ({
                                  ...previous,
                                  branch_location: event.target.value,
                                }))
                              }
                              placeholder={lang === 'zh' ? '例如：广州、上海' : 'e.g. Guangzhou, Shanghai'}
                              className="w-full px-3 py-2 bg-muted/40 border border-border rounded-none text-sm text-foreground focus:bg-background focus:border-emerald-500 outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">
                              {t.formLabelPosition}
                            </label>
                            <input
                              type="text"
                              value={formData.position}
                              onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                              placeholder={t.formPlaceholderPosition}
                              className="w-full px-3 py-2 bg-muted/40 border border-border rounded-none text-sm text-foreground focus:bg-background focus:border-emerald-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">
                              {t.formLabelStatus}
                            </label>
                            <select
                              value={formData.employment_status}
                              onChange={(e) => setFormData(prev => ({ ...prev, employment_status: e.target.value }))}
                              className="w-full px-3 py-2.5 bg-muted/40 border border-border rounded-none text-sm text-foreground focus:bg-background focus:border-emerald-500 outline-none cursor-pointer"
                            >
                              <option value="current" className="bg-popover text-popover-foreground">{t.currentEmployee}</option>
                              <option value="former" className="bg-popover text-popover-foreground">{t.formerEmployee}</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5 whitespace-nowrap">
                              {t.formLabelDailyHours}
                            </label>
                            <input
                              type="number"
                              min="0.5"
                              max="24"
                              step="0.5"
                              required
                              value={formData.daily_work_hours}
                              onChange={(e) => setFormData(prev => ({ ...prev, daily_work_hours: e.target.value }))}
                              className="w-full px-3 py-2 bg-muted/40 border border-border rounded-none text-sm text-foreground focus:bg-background focus:border-emerald-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5 whitespace-nowrap">
                              {t.formLabelWeeklyDays}
                            </label>
                            <input
                              type="number"
                              min="0.5"
                              max="7"
                              step="0.5"
                              required
                              value={formData.weekly_work_days}
                              onChange={(e) => setFormData(prev => ({ ...prev, weekly_work_days: e.target.value }))}
                              className="w-full px-3 py-2 bg-muted/40 border border-border rounded-none text-sm text-foreground focus:bg-background focus:border-emerald-500 outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5 whitespace-nowrap">
                              {t.formLabelSalary}
                            </label>
                            <input
                              type="number"
                              value={formData.salary}
                              onChange={(e) => setFormData(prev => ({ ...prev, salary: e.target.value }))}
                              placeholder={t.formPlaceholderSalary}
                              className="w-full px-3 py-2 bg-muted/40 border border-border rounded-none text-sm text-foreground focus:bg-background focus:border-emerald-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5 whitespace-nowrap">
                              {t.formLabelBonus}
                            </label>
                            <input
                              type="number"
                              value={formData.bonus}
                              onChange={(e) => setFormData(prev => ({ ...prev, bonus: e.target.value }))}
                              placeholder={t.formPlaceholderBonus}
                              className="w-full px-3 py-2 bg-muted/40 border border-border rounded-none text-sm text-foreground focus:bg-background focus:border-emerald-500 outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5 whitespace-nowrap">
                              {t.formLabelYears}
                            </label>
                            <input
                              type="number"
                              value={formData.experience_years}
                              onChange={(e) => setFormData(prev => ({ ...prev, experience_years: e.target.value }))}
                              placeholder={t.formPlaceholderYears}
                              className="w-full px-3 py-2 bg-muted/40 border border-border rounded-none text-sm text-foreground focus:bg-background focus:border-emerald-500 outline-none"
                            />
                          </div>
                        </div>

              {/* Ratings Sliders */}
                        <div className="bg-muted/40 border border-border rounded-none p-4 space-y-3">
                          <span className="block text-xs font-extrabold text-foreground uppercase border-b border-border pb-2">
                            {t.formRatingTitle}
                          </span>
                          {[
                            { key: 'rating_career', label: t.metricCareer },
                            { key: 'rating_balance', label: t.metricWlb },
                            { key: 'rating_management', label: t.metricManagement },
                            { key: 'rating_compensation', label: t.metricBenefits },
                            { key: 'rating_culture', label: t.metricCulture }
                          ].map((slider) => (
                            <div key={slider.key} className="flex items-center justify-between gap-2 text-xs">
                              <span className="font-semibold text-foreground">{slider.label}</span>
                              <div className="flex items-center gap-3">
                                <input
                                  type="range"
                                  min="1"
                                  max="5"
                                  step="1"
                                  value={formData[slider.key as keyof typeof formData]}
                                  onChange={(e) => setFormData(prev => ({ ...prev, [slider.key]: Number(e.target.value) }))}
                                  className="w-32 h-1.5 bg-muted rounded-none appearance-none cursor-pointer accent-emerald-500"
                                />
                                <span className="w-10 text-right font-bold text-emerald-500 text-xs">
                                  {formData[slider.key as keyof typeof formData]} {t.formStarsUnit}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">
                            {t.formReviewTextLabel} <span className="text-rose-500">*</span>
                          </label>
                          <textarea
                            required
                            rows={3}
                            value={formData.review_text}
                            onChange={(e) => setFormData(prev => ({ ...prev, review_text: e.target.value }))}
                            placeholder={t.formReviewTextPlaceholder}
                            className="w-full px-3 py-2 bg-muted/40 border border-border rounded-none text-sm text-foreground focus:bg-background focus:border-emerald-500 outline-none resize-none"
                          />
                        </div>

                        <HumanVerification
                          onToken={setHumanVerificationToken}
                          resetKey={humanVerificationResetKey}
                        />

                        <div className="flex justify-end gap-3 pt-3 border-t border-border">
                          <button
                            type="button"
                            onClick={() => setShowSubmitForm(false)}
                            className="px-5 py-2 border border-border hover:bg-accent text-muted-foreground hover:text-foreground rounded-none text-xs font-bold transition-colors cursor-pointer"
                          >
                            {t.formCancel}
                          </button>
                          <button
                            type="submit"
                            disabled={
                              isSubmitting ||
                              (humanVerificationEnabled && !humanVerificationToken)
                            }
                            className="inline-flex items-center gap-1.5 px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-black rounded-none text-xs font-bold transition-colors cursor-pointer"
                          >
                            {isSubmitting && <Loader2 className="w-3 h-3 animate-spin text-black" />}
                            <span>{isSubmitting ? t.formSubmitting : t.formSubmit}</span>
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Company Search Modal (Command Palette / Newspaper Style) */}
        <AnimatePresence>
          {showSearchModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-start justify-center p-4 sm:p-6 pt-16 sm:pt-24 overflow-hidden"
              onClick={() => setShowSearchModal(false)}
            >
              <motion.div
                initial={{ y: -30, opacity: 0, scale: 0.97 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: -20, opacity: 0, scale: 0.97 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="max-w-2xl w-full bg-card border border-border shadow-2xl overflow-hidden rounded-none flex flex-col text-card-foreground"
              >
                {/* Search Modal Input Header */}
                <div className="p-4 sm:p-5 border-b border-border flex items-center gap-3 bg-muted/30">
                  <Search className="w-5 h-5 text-emerald-500 shrink-0" />
                  <input
                    type="text"
                    autoFocus
                    value={searchModalQuery}
                    onChange={(e) => {
                      setSearchModalQuery(e.target.value);
                      setSearchActiveIndex(-1);
                    }}
                    onKeyDown={(e) => {
                      const list = companyList.filter(c => {
                        if (!searchModalQuery.trim()) return true;
                        return c.name.toLowerCase().includes(searchModalQuery.toLowerCase().trim());
                      });

                      if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        setSearchActiveIndex(prev => (prev < list.length - 1 ? prev + 1 : 0));
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        setSearchActiveIndex(prev => (prev > 0 ? prev - 1 : list.length - 1));
                      } else if (e.key === 'Enter') {
                        e.preventDefault();
                        if (searchActiveIndex >= 0 && searchActiveIndex < list.length) {
                          const target = list[searchActiveIndex];
                          window.location.href = `/${lang}/companies/${target.id}`;
                        } else if (list.length > 0) {
                          window.location.href = `/${lang}/companies/${list[0].id}`;
                        } else if (searchModalQuery.trim()) {
                          window.location.href = `/${lang}/companies?q=${encodeURIComponent(searchModalQuery.trim())}`;
                        }
                      }
                    }}
                    placeholder={t.searchModalInputPlaceholder}
                    className="w-full bg-transparent text-sm sm:text-base font-bold text-foreground placeholder:text-muted-foreground outline-none"
                  />
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono border border-border bg-muted text-muted-foreground">
                      ESC
                    </span>
                    <button
                      onClick={() => setShowSearchModal(false)}
                      className="p-1 hover:text-foreground text-muted-foreground transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Suggestions / Results List Container */}
                <div className="max-h-[60vh] overflow-y-auto p-3 sm:p-4 space-y-1">
                  {isFetchingCompanies ? (
                    <div className="py-12 flex flex-col items-center justify-center text-xs text-muted-foreground">
                      <Loader2 className="w-6 h-6 text-emerald-500 animate-spin mb-2" />
                      <span>{lang === 'zh' ? '正在查询企业口碑列表...' : 'Querying company database...'}</span>
                    </div>
                  ) : (
                    <>
                      <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                        <span>{searchModalQuery.trim() ? t.searchModalResults : t.searchModalTrending}</span>
                        <span>{companyList.filter(c => !searchModalQuery.trim() || c.name.toLowerCase().includes(searchModalQuery.toLowerCase().trim())).length} COMPANIES</span>
                      </div>

                      {companyList.filter(c => !searchModalQuery.trim() || c.name.toLowerCase().includes(searchModalQuery.toLowerCase().trim())).length === 0 ? (
                        <div className="py-10 text-center space-y-2">
                          <Building2 className="w-8 h-8 text-muted-foreground mx-auto" />
                          <p className="text-xs font-bold text-foreground">{t.searchModalNoResults}</p>
                          <p className="text-xs text-muted-foreground max-w-sm mx-auto">{t.searchModalNoResultsDesc}</p>
                          <button
                            onClick={() => {
                              setShowSearchModal(false);
                              openReviewModal();
                            }}
                            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-colors cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>{t.addReview}</span>
                          </button>
                        </div>
                      ) : (
                        companyList
                          .filter(c => !searchModalQuery.trim() || c.name.toLowerCase().includes(searchModalQuery.toLowerCase().trim()))
                          .map((company, index) => {
                            const isSelected = index === searchActiveIndex;
                            return (
                              <Link
                                key={company.id}
                                href={`/${lang}/companies/${company.id}`}
                                onClick={() => setShowSearchModal(false)}
                                onMouseEnter={() => setSearchActiveIndex(index)}
                                className={`w-full p-3 flex items-center justify-between border transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-muted/80 border-emerald-500/50 text-foreground'
                                    : 'border-border/40 hover:border-border hover:bg-muted/30 text-foreground'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-muted border border-border flex items-center justify-center font-bold text-xs text-foreground uppercase">
                                    {company.name.charAt(0)}
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                                      <span>{company.name}</span>
                                    </h4>
                                    <p className="text-[11px] text-muted-foreground">
                                      {company.review_count} {lang === 'zh' ? '笔真实匿名口碑存证' : 'verified reviews'}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-xs font-bold text-emerald-500">
                                    <Star className="w-3 h-3 fill-emerald-500" />
                                    <span>{company.avg_rating > 0 ? company.avg_rating.toFixed(1) : '4.5'}</span>
                                  </div>
                                  <ArrowRight className={`w-4 h-4 transition-transform ${isSelected ? 'text-emerald-500 translate-x-1' : 'text-muted-foreground'}`} />
                                </div>
                              </Link>
                            );
                          })
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
