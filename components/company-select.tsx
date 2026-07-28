'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Building2, Check, Loader2, MapPin } from 'lucide-react';
import { getPublicCompanies } from '@/lib/public-data';

export interface CompanyItem {
  id: string;
  name: string;
  credit_code?: string | null;
  country_code?: string | null;
  country_name?: string | null;
  province?: string | null;
  city?: string | null;
}

interface CompanySelectProps {
  value: string;
  onChange: (value: string) => void;
  onCompanySelect?: (company: CompanyItem) => void;
  placeholder?: string;
  required?: boolean;
}

export function CompanySelect({
  value,
  onChange,
  onCompanySelect,
  placeholder = '例如: 腾讯 / 阿里巴巴',
  required = false,
}: CompanySelectProps) {
  const [query, setQuery] = useState<string>(value);
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  // 搜索数据库已知公司
  useEffect(() => {
    let active = true;
    setIsLoading(true);

    const timer = setTimeout(() => {
      getPublicCompanies(query.trim(), 50)
        .then((data) => {
          if (active) setCompanies(data);
        })
        .catch((err) => console.error('Failed to fetch companies:', err))
        .finally(() => {
          if (active) setIsLoading(false);
        });
    }, 200);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query]);

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (company: CompanyItem) => {
    setQuery(company.name);
    setIsOpen(false);
    onChange(company.name);
    if (onCompanySelect) {
      onCompanySelect(company);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setIsOpen(true);
    onChange(val);
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="relative">
        <input
          type="text"
          required={required}
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full px-3 py-2 bg-muted/40 border border-border rounded-none text-sm text-foreground focus:bg-background focus:border-emerald-500 outline-none pr-8 font-medium"
        />
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-muted-foreground pointer-events-none">
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
          ) : (
            <Building2 className="w-3.5 h-3.5" />
          )}
        </div>
      </div>

      {/* 公司检索下拉弹窗 */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-card border border-border shadow-xl z-50 max-h-60 overflow-y-auto rounded-none text-card-foreground">
          {companies.length === 0 ? (
            <div className="p-3 text-center text-xs text-muted-foreground">
              {isLoading ? (
                <span>正在检索企业库...</span>
              ) : (
                <span>
                  {query ? `未匹配到已知公司，将作为新公司 "${query}" 创建` : '输入公司名称搜索数据库已知企业'}
                </span>
              )}
            </div>
          ) : (
            <div className="py-1">
              <div className="px-3 py-1 text-[10px] font-extrabold uppercase text-muted-foreground bg-muted/30 border-b border-border flex items-center justify-between">
                <span>数据库已有公司 ({companies.length})</span>
                <span>选择可自动补全信息</span>
              </div>

              {companies.map((company) => {
                const isSelected = query.trim() === company.name;
                const locationText = [company.country_name || company.country_code, company.province, company.city]
                  .filter(Boolean)
                  .join(' · ');

                return (
                  <button
                    key={company.id}
                    type="button"
                    onClick={() => handleSelect(company)}
                    className={`w-full px-3 py-2 text-left text-xs font-semibold hover:bg-emerald-500/10 hover:text-emerald-500 flex items-center justify-between transition-colors ${
                      isSelected ? 'bg-emerald-500/15 text-emerald-500' : 'text-foreground'
                    }`}
                  >
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="font-bold">{company.name}</span>
                        {company.credit_code && (
                          <span className="text-[10px] text-muted-foreground font-mono">
                            [{company.credit_code}]
                          </span>
                        )}
                      </div>
                      {locationText && (
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-normal pl-5">
                          <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                          <span>{locationText}</span>
                        </div>
                      )}
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
