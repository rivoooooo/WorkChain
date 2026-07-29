'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'motion/react';
import { i18n, Language, resolveLanguage } from '../../../lib/i18n';
import { getPublicCompanies } from '../../../lib/public-data';
import {
  Building,
  Search,
  ArrowUpDown,
  TrendingUp,
  Star,
  DollarSign,
  SlidersHorizontal,
  Lock,
  ChevronRight,
  Database
} from 'lucide-react';

interface CompanyStats {
  id: string;
  name: string;
  logoUrl?: string;
  reviewCount: number;
  avgRating: number;
  avgCareer: number;
  avgBalance: number;
  avgManagement: number;
  avgCompensation: number;
  avgCulture: number;
  avgSalary: number;
  avgBonus: number;
  latestReviewSnippet?: string;
  location?: string;
}

type SortField = 'avgRating' | 'reviewCount' | 'avgSalary' | 'avgBalance' | 'avgCareer' | 'avgCompensation' | 'avgCulture';
type SortOrder = 'desc' | 'asc';

interface PageProps {
  params: Promise<{ lang: string }>;
}

function CompaniesListSkeleton() {
  return (
    <div
      className="divide-y divide-border border-y border-border"
      id="loading_state"
      aria-busy="true"
      aria-label="Loading companies"
    >
      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={index}
          className="flex animate-pulse flex-col items-start gap-4 px-2 py-5 sm:px-4 md:flex-row md:items-center md:gap-6"
        >
          <div className="h-16 w-16 shrink-0 bg-muted sm:h-20 sm:w-20" />

          <div className="flex h-16 w-24 shrink-0 flex-col justify-between border-r border-border pr-4 sm:h-20 sm:w-28 sm:pr-6">
            <div className="h-6 w-10 bg-muted" />
            <div className="h-3 w-14 bg-muted" />
          </div>

          <div className="min-w-[180px] flex-1 space-y-3">
            <div className="h-5 w-2/3 max-w-56 bg-muted" />
            <div className="h-3 w-1/2 max-w-40 bg-muted" />
            <div className="flex gap-2">
              <div className="h-5 w-16 bg-muted" />
              <div className="h-5 w-20 bg-muted" />
              <div className="h-5 w-14 bg-muted" />
            </div>
          </div>

          <div className="min-w-[220px] flex-1 space-y-3 border-t border-border pt-3 md:border-t-0 md:pt-0">
            <div className="h-3 w-full bg-muted" />
            <div className="h-3 w-5/6 bg-muted" />
            <div className="h-3 w-2/5 bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CompaniesPage({ params }: PageProps) {
  const { lang: rawLang } = use(params);
  const lang: Language = resolveLanguage(rawLang);

  const [companiesList, setCompaniesList] = useState<CompanyStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const t = i18n[lang];

  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('avgRating');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  useEffect(() => {
    async function fetchCompanies() {
      setIsLoading(true);
      try {
        const companies = await getPublicCompanies('', 500);
        {
          const stats: CompanyStats[] = companies.map((c) => ({
            id: c.id,
            name: c.name,
            logoUrl: undefined,
            reviewCount: c.review_count,
            avgRating: c.avg_rating,
            avgCareer: c.avg_career,
            avgBalance: c.avg_balance,
            avgManagement: c.avg_management,
            avgCompensation: c.avg_compensation,
            avgCulture: c.avg_culture,
            avgSalary: Math.round(c.avg_salary / 1000),
            avgBonus: Math.round(c.avg_bonus / 1000),
            latestReviewSnippet: t.dirReviewSnippet,
            location: [c.province, c.city].filter(Boolean).join(' / ') || t.dirLocationUnavailable
          }));
          setCompaniesList(stats);
        }
      } catch (err) {
        console.error('Failed to load companies:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchCompanies();
  }, [lang]);

  // Filter & Sort
  const filteredAndSortedCompanies = companiesList
    .filter(comp => comp.name.toLowerCase().includes(searchQuery.toLowerCase().trim()))
    .sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      
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
    { label: t.dirSortOverall, field: 'avgRating' },
    { label: t.dirSortReviews, field: 'reviewCount' },
    { label: t.dirSortSalary, field: 'avgSalary' },
    { label: t.dirSortBalance, field: 'avgBalance' },
    { label: t.dirSortCareer, field: 'avgCareer' },
    { label: t.dirSortCompensation, field: 'avgCompensation' },
    { label: t.dirSortCulture, field: 'avgCulture' }
  ];

  return (
    <div className="w-full font-sans" id="companies_directory_root">
      
      {/* NEWSPAPER MASTHEAD TITLE SECTION (REFERENCE IMAGE MATCH) */}
      <div className="border-b border-border pb-6 mb-8 flex items-end justify-between" id="directory_heading">
        <div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight uppercase">
            {t.dirTitle}
          </h1>
        </div>

        {/* Big Newspaper Year / Header Label on Right */}
        <div className="text-right">
          <span className="text-3xl sm:text-6xl font-black text-foreground font-sans tracking-tighter block leading-none">
            2026
          </span>
        </div>
      </div>

      {/* SEARCH AND FILTERS BAR */}
      <div className="border border-border bg-card p-4 mb-8 text-card-foreground rounded-none" id="directory_filters_panel">
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          {/* Quick Search */}
          <div className="relative flex-1">
            <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.dirSearchPlaceholder}
              className="w-full ps-10 pe-4 py-2 bg-muted/40 border border-border focus:border-foreground outline-none text-xs text-foreground placeholder:text-muted-foreground rounded-none transition-colors"
              autoComplete="off"
            />
          </div>

          {/* Quick Indicator of Sort Mode */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 border border-border px-3 py-2 rounded-none font-mono">
            <SlidersHorizontal className="w-3.5 h-3.5 text-foreground" />
            <span>
              {t.dirSortModeLabel}
              <strong className="text-foreground font-bold ms-1">
                {sortOptions.find(opt => opt.field === sortField)?.label}
              </strong>
              {' '}({sortOrder === 'desc' ? t.dirSortDescending : t.dirSortAscending})
            </span>
          </div>
        </div>

        {/* Sort Toggles Grid */}
        <div className="mt-4 border-t border-border pt-3">
          <div className="flex flex-wrap gap-2">
            {sortOptions.map((opt) => {
              const isActive = sortField === opt.field;
              return (
                <button
                  key={opt.field}
                  onClick={() => handleSort(opt.field)}
                  className={`text-xs px-3 py-1 border rounded-none transition-all flex items-center gap-1.5 font-medium cursor-pointer ${
                    isActive
                      ? 'bg-foreground text-background border-foreground font-bold'
                      : 'bg-muted/30 border-border text-muted-foreground hover:text-foreground hover:bg-muted'
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

      {/* NEWSPAPER ROW TABLE LIST (MATCHING REFERENCE IMAGE STRUCTURE) */}
      {isLoading ? (
        <CompaniesListSkeleton />
      ) : filteredAndSortedCompanies.length === 0 ? (
        <div className="text-center py-16 border border-border bg-card text-card-foreground rounded-none" id="empty_state">
          <Building className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-sm font-bold text-foreground mb-1">{t.dirNoResults}</h3>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            {t.dirNoResultsDesc}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border border-y border-border" id="companies_list">
          {filteredAndSortedCompanies.map((comp, idx) => {
            const rankFormatted = String(idx + 1).padStart(2, '0');
            return (
              <motion.div
                key={comp.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: Math.min(idx * 0.03, 0.3), duration: 0.2 }}
              >
                <Link
                  href={`/${rawLang}/companies/${comp.id}`}
                  className="group py-5 px-2 sm:px-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6 hover:bg-muted/30 transition-colors block"
                >
                  {/* COL 1: THUMBNAIL IMAGE OR PLACEHOLDER (RECTANGLE SQUARE) */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 border border-border rounded-none bg-muted/60 overflow-hidden relative flex items-center justify-center">
                    {comp.logoUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={comp.logoUrl}
                        alt={comp.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      /* Elegant Sharp Geometric Monogram Placeholder */
                      <div className="w-full h-full bg-muted/80 flex flex-col items-center justify-center p-2 text-center">
                        <Building className="w-6 h-6 text-muted-foreground mb-0.5 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-black font-mono text-muted-foreground uppercase tracking-widest truncate max-w-full">
                          {comp.name.substring(0, 3)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* COL 2: RANK & RATING INDEX (WITH 1PX VERTICAL RIGHT BORDER) */}
                  <div className="w-24 sm:w-28 shrink-0 border-r border-border pr-4 sm:pr-6 flex flex-col justify-between h-16 sm:h-20 py-0.5">
                    <div>
                      <span className="text-xl sm:text-2xl font-black font-mono text-foreground tracking-tight block leading-none">
                        {rankFormatted}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block mt-1">
                        RANK
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-xs font-extrabold font-mono text-foreground">
                      <Star className="w-3 h-3 fill-foreground text-foreground" />
                      <span>{comp.avgRating}</span>
                      <span className="text-muted-foreground text-[10px]">/ 5</span>
                    </div>
                  </div>

                  {/* COL 3: COMPANY TITLE & TAGS */}
                  <div className="flex-1 min-w-[180px] flex flex-col justify-between h-auto sm:h-20 py-0.5 space-y-2">
                    <div>
                      <h3 className="text-base sm:text-lg font-extrabold text-foreground group-hover:underline tracking-tight flex items-center gap-2">
                        <span>{comp.name}</span>
                      </h3>
                      <span className="text-[11px] text-muted-foreground font-mono block mt-0.5">
                        {comp.location} · {comp.reviewCount} {t.dirLedgerEntries}
                      </span>
                    </div>

                    {/* SHARP RECTANGLE TAGS */}
                    <div className="flex flex-wrap gap-1.5">
                      <span className="border border-border text-[10px] font-mono px-2 py-0.5 uppercase tracking-wider text-foreground bg-background">
                        WLB: {comp.avgBalance}
                      </span>
                      <span className="border border-border text-[10px] font-mono px-2 py-0.5 uppercase tracking-wider text-foreground bg-background">
                        {t.dirGrowth}: {comp.avgCareer}
                      </span>
                      {comp.avgSalary > 0 && (
                        <span className="border border-border text-[10px] font-mono px-2 py-0.5 uppercase tracking-wider text-foreground bg-background">
                          {comp.avgSalary}K/M
                        </span>
                      )}
                    </div>
                  </div>

                  {/* COL 4: REVIEW SUMMARY & TELEMETRY TEXT */}
                  <div className="flex-1 min-w-[220px] flex flex-col justify-between h-auto sm:h-20 py-0.5 space-y-2 border-t sm:border-t-0 border-border pt-2 sm:pt-0">
                    <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed font-sans">
                      {comp.latestReviewSnippet}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                      <span>SHA-256 VERIFIED</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
