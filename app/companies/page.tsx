'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
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
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('avgRating');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  useEffect(() => {
    async function fetchReviews() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/reviews');
        const json = await res.json();
        if (json.success) {
          setAllReviews(json.data || []);
        }
      } catch (err) {
        console.error('Failed to load reviews for companies directory:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchReviews();
  }, []);

  // Compute stats for each company
  const calculateCompaniesStats = (): CompanyStats[] => {
    const companiesMap = new Map<string, Review[]>();
    
    allReviews.forEach(r => {
      const name = r.company_name.trim();
      if (!companiesMap.has(name)) {
        companiesMap.set(name, []);
      }
      companiesMap.get(name)!.push(r);
    });

    return Array.from(companiesMap.entries()).map(([name, reviews]) => {
      const len = reviews.length;
      const career = reviews.reduce((sum, r) => sum + r.rating_career, 0) / len;
      const balance = reviews.reduce((sum, r) => sum + r.rating_balance, 0) / len;
      const management = reviews.reduce((sum, r) => sum + r.rating_management, 0) / len;
      const compensation = reviews.reduce((sum, r) => sum + r.rating_compensation, 0) / len;
      const culture = reviews.reduce((sum, r) => sum + r.rating_culture, 0) / len;

      const salaries = reviews.map(r => r.salary).filter(s => s > 0);
      const avgSalary = salaries.length > 0 ? salaries.reduce((sum, s) => sum + s, 0) / salaries.length : 0;

      const bonuses = reviews.map(r => r.bonus).filter(b => b > 0);
      const avgBonus = bonuses.length > 0 ? bonuses.reduce((sum, b) => sum + b, 0) / bonuses.length : 0;

      const avgRating = (career + balance + management + compensation + culture) / 5;

      return {
        name,
        reviewCount: len,
        avgRating: Number(avgRating.toFixed(1)),
        avgCareer: Number(career.toFixed(1)),
        avgBalance: Number(balance.toFixed(1)),
        avgManagement: Number(management.toFixed(1)),
        avgCompensation: Number(compensation.toFixed(1)),
        avgCulture: Number(culture.toFixed(1)),
        avgSalary: Math.round(avgSalary),
        avgBonus: Math.round(avgBonus)
      };
    });
  };

  const companiesList = calculateCompaniesStats();

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
    { label: '综合评分', field: 'avgRating' },
    { label: '评价数量', field: 'reviewCount' },
    { label: '平均月薪', field: 'avgSalary' },
    { label: '工作生活平衡(WLB)', field: 'avgBalance' },
    { label: '职业发展', field: 'avgCareer' },
    { label: '福利待遇', field: 'avgCompensation' },
    { label: '企业文化', field: 'avgCulture' }
  ];

  return (
    <main className="min-h-screen bg-[#050505] text-[#e0e0e0] selection:bg-emerald-500/20" id="companies_directory_root">
      {/* Top Banner indicating absolute anonymity */}
      <div className="bg-[#0a0a0a] text-gray-400 py-2.5 px-4 text-xs font-medium border-b border-white/10" id="top_announcement">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>完全匿名评价系统：采用密码学哈希区块链链式存证，永不收集与存储个人隐私信息。</span>
          </span>
          <span className="hidden md:inline text-emerald-500 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-widest">
            Blockchain Secured
          </span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8" id="companies_directory_container">
        {/* Navigation back */}
        <div className="flex items-center justify-between mb-8" id="directory_nav">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white font-medium text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>返回主页</span>
          </Link>

          <div className="inline-flex items-center gap-2 text-xs text-gray-500">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>已入网口碑公司数: {companiesList.length}</span>
          </div>
        </div>

        {/* Title Block */}
        <div className="mb-8" id="directory_heading">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/5 border border-emerald-500/20 rounded-full shadow-xs text-xs text-emerald-400 font-medium mb-3">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>大厂口碑龙虎榜 (支持多维度自主排序)</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            公司口碑一览表
          </h1>
          <p className="text-sm text-gray-400 mt-2 max-w-xl">
            多维度、全方位的匿名企业评价对比，帮助每一位职场人选择最适合自己的下一站。
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
                placeholder="搜索已入网的公司名称..."
                className="w-full pl-10 pr-4 py-2.5 bg-[#121212] border border-white/5 focus:border-emerald-500/50 outline-none text-sm text-[#e0e0e0] placeholder:text-gray-600 rounded-xl transition-colors"
                autoComplete="off"
              />
            </div>

            {/* Quick Indicator of Sort Mode */}
            <div className="flex items-center gap-2 text-xs text-gray-400 bg-white/5 border border-white/5 px-3 py-2 rounded-xl">
              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                当前排序：
                <strong className="text-emerald-400 font-bold">
                  {sortOptions.find(opt => opt.field === sortField)?.label}
                </strong>
                （{sortOrder === 'desc' ? '降序' : '升序'}）
              </span>
            </div>
          </div>

          {/* Sort Toggles Grid */}
          <div className="mt-4 border-t border-white/5 pt-4">
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">
              选择排序维度:
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
            <p className="text-sm text-gray-500">正在链上拉取并汇总企业评价数据...</p>
          </div>
        ) : filteredAndSortedCompanies.length === 0 ? (
          <div className="text-center py-16 bg-[#0d0d0d] border border-white/10 rounded-2xl" id="empty_state">
            <Building className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <h3 className="text-sm font-semibold text-white mb-1">未找到匹配的公司</h3>
            <p className="text-xs text-gray-500 max-w-xs mx-auto">
              目前还没有该公司下的评价，或者搜索拼写不准确。您可以返回主页提交该公司下的第一笔匿名评价！
            </p>
          </div>
        ) : (
          <div className="space-y-3.5" id="companies_list">
            {filteredAndSortedCompanies.map((comp, idx) => (
              <motion.div
                key={comp.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.04, 0.4), duration: 0.3 }}
              >
                <Link
                  href={`/?company=${encodeURIComponent(comp.name)}`}
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
                            {comp.reviewCount} 笔评价
                          </span>
                        </h3>
                        <div className="flex items-center gap-3 mt-1.5">
                          {/* Aggregate Star Badge */}
                          <div className="flex items-center gap-1 text-sm text-emerald-400 font-bold bg-emerald-500/5 border border-emerald-500/10 px-2 py-0.5 rounded">
                            <Star className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" />
                            <span>{comp.avgRating} 综合分</span>
                          </div>
                          
                          {/* Avg Salary info */}
                          {comp.avgSalary > 0 && (
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <DollarSign className="w-3.5 h-3.5 text-gray-500" />
                              <span>平均月薪: <strong className="text-white font-bold">{comp.avgSalary}K</strong></span>
                              {comp.avgBonus > 0 && (
                                <span className="text-gray-500">
                                  （年终奖: <strong className="text-gray-300 font-semibold">{comp.avgBonus}K</strong>）
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
                        <span className="text-[9px] text-gray-500 font-medium">工作生活平衡</span>
                        <span className="text-xs font-extrabold text-indigo-400 mt-0.5">{comp.avgBalance}</span>
                      </div>
                      {/* Career */}
                      <div className="flex flex-col bg-[#121212] px-2.5 py-1.5 rounded-lg border border-white/5 text-center min-w-[76px]">
                        <span className="text-[9px] text-gray-500 font-medium">职业成长</span>
                        <span className="text-xs font-extrabold text-emerald-400 mt-0.5">{comp.avgCareer}</span>
                      </div>
                      {/* Management */}
                      <div className="flex flex-col bg-[#121212] px-2.5 py-1.5 rounded-lg border border-white/5 text-center min-w-[76px]">
                        <span className="text-[9px] text-gray-500 font-medium">管理层满意度</span>
                        <span className="text-xs font-extrabold text-amber-400 mt-0.5">{comp.avgManagement}</span>
                      </div>
                      {/* Compensation */}
                      <div className="flex flex-col bg-[#121212] px-2.5 py-1.5 rounded-lg border border-white/5 text-center min-w-[76px]">
                        <span className="text-[9px] text-gray-500 font-medium">福利待遇</span>
                        <span className="text-xs font-extrabold text-rose-400 mt-0.5">{comp.avgCompensation}</span>
                      </div>
                      {/* Culture */}
                      <div className="flex flex-col bg-[#121212] px-2.5 py-1.5 rounded-lg border border-white/5 text-center min-w-[76px]">
                        <span className="text-[9px] text-gray-500 font-medium">企业文化</span>
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
