'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { Languages, Plus, Loader2, AlertCircle, ShieldCheck, X } from 'lucide-react';
import { Language, i18n } from '../lib/i18n';
import { ThemeToggle } from './theme-toggle';

interface LayoutFrameProps {
  children: React.ReactNode;
  rawLang: string;
}

export function LayoutFrame({ children, rawLang }: LayoutFrameProps) {
  const lang: Language = (rawLang === 'zh-cn' || rawLang === 'zh') ? 'zh' : 'en';
  const t = i18n[lang];

  const [showLangDropdown, setShowLangDropdown] = useState(false);

  // Global Modal State
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
          experience_years: Number(formData.experience_years) || 1
        })
      });
      const json = await res.json();

      if (json.success) {
        setFormSuccess(true);
        setTimeout(() => {
          setShowSubmitForm(false);
          setFormSuccess(false);
          window.location.reload();
        }, 1800);
      } else {
        setFormError(json.error || t.formErrorSubmitFailed);
      }
    } catch (err) {
      console.error(err);
      setFormError(t.formErrorNetwork);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openReviewModal = () => {
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
    setFormError('');
    setFormSuccess(false);
    setShowSubmitForm(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200 relative overflow-hidden font-sans selection:bg-emerald-500/20" id="main_root">
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
            {/* Theme Toggle */}
            <ThemeToggle className="w-9 h-9 text-foreground hover:bg-muted transition-colors cursor-pointer flex items-center justify-center rounded-none" />

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
                  className="absolute right-0 top-full mt-2 w-36 bg-popover text-popover-foreground border border-border rounded-none shadow-lg z-50 py-1"
                  onMouseLeave={() => setShowLangDropdown(false)}
                >
                  <button
                    onClick={() => {
                      setShowLangDropdown(false);
                      if (lang !== 'en') window.location.href = '/en';
                    }}
                    className={`w-full text-left px-4 py-2 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                      lang === 'en' ? 'bg-muted text-foreground font-bold' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <span>English</span>
                    {lang === 'en' && <span className="w-1.5 h-1.5 bg-foreground rounded-full" />}
                  </button>
                  <button
                    onClick={() => {
                      setShowLangDropdown(false);
                      if (lang !== 'zh') window.location.href = '/zh-cn';
                    }}
                    className={`w-full text-left px-4 py-2 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                      lang === 'zh' ? 'bg-muted text-foreground font-bold' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <span>简体中文</span>
                    {lang === 'zh' && <span className="w-1.5 h-1.5 bg-foreground rounded-full" />}
                  </button>
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
              onClick={openReviewModal}
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

        {/* Global Review Submission Modal */}
        <AnimatePresence>
          {showSubmitForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end justify-center p-3 sm:p-6 overflow-hidden"
              id="submission_modal"
            >
              {/* Outer Wrapper anchored to bottom with max-h 90dvh */}
              <div className="relative max-w-2xl w-full h-full max-h-[90dvh] mb-0 sm:mb-2 flex flex-col">
                
                {/* Stacked Second Document Background Sheet (Rotated -4deg, matching exact form size) */}
                <div 
                  className="absolute inset-0 bg-card border border-border shadow-md pointer-events-none z-0 opacity-80"
                  style={{
                    transform: 'rotate(-4deg) scale(0.99)',
                    transformOrigin: 'bottom left'
                  }}
                />

                {/* Main Front Form Container with solid bg-card and border border-border */}
                <motion.div
                  initial={{ y: 80, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 80, opacity: 0 }}
                  transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                  className="relative z-10 bg-card border border-border shadow-2xl w-full h-full max-h-[90dvh] flex flex-col text-card-foreground overflow-hidden"
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
                          <div>
                            <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">
                              {t.formLabelCompany} <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={formData.company_name}
                              onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                              placeholder={t.formPlaceholderCompany}
                              className="w-full px-3 py-2 bg-muted/40 border border-border rounded-none text-sm text-foreground focus:bg-background focus:border-emerald-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">
                              {t.formLabelLocation}
                            </label>
                            <input
                              type="text"
                              value={formData.branch_location}
                              onChange={(e) => setFormData(prev => ({ ...prev, branch_location: e.target.value }))}
                              placeholder={t.formPlaceholderLocation}
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

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">
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
                            <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">
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
                          <div>
                            <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">
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
                            disabled={isSubmitting}
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
      </div>
    </div>
  );
}
