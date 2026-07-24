'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, Check, Loader2, MapPin, Globe } from 'lucide-react';

interface CountryItem {
  code: string;
  name: string;
  chinese_name: string | null;
}

interface CityItem {
  id: number;
  displayName: string;
  englishName: string;
  adminCode: string | null;
}

interface CitySelectProps {
  countryValue?: string;
  cityValue?: string;
  onCountryChange?: (countryCode: string) => void;
  onCityChange?: (cityName: string) => void;
  lang?: 'zh' | 'en';
}

export function CitySelect({
  countryValue = 'CN',
  cityValue = '',
  onCountryChange,
  onCityChange,
  lang = 'zh',
}: CitySelectProps) {
  const [countries, setCountries] = useState<CountryItem[]>([]);
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>(countryValue);
  const [countrySearchQuery, setCountrySearchQuery] = useState<string>('');
  const [isCountryOpen, setIsCountryOpen] = useState<boolean>(false);

  const [citySearchQuery, setCitySearchQuery] = useState<string>(cityValue);
  const [cities, setCities] = useState<CityItem[]>([]);
  const [isFetchingCities, setIsFetchingCities] = useState<boolean>(false);
  const [isCityOpen, setIsCityOpen] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // 同步外部属性
  useEffect(() => {
    setSelectedCountryCode(countryValue);
  }, [countryValue]);

  useEffect(() => {
    setCitySearchQuery(cityValue);
  }, [cityValue]);

  // 加载国家列表
  useEffect(() => {
    fetch('/api/geo/countries')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setCountries(data.data);
        }
      })
      .catch((err) => console.error('Failed to load countries:', err));
  }, []);

  // 获取当前选中的国家对象
  const currentCountry = countries.find((c) => c.code.toUpperCase() === selectedCountryCode.toUpperCase());
  const currentCountryDisplay = currentCountry
    ? (currentCountry.chinese_name ? `${currentCountry.chinese_name} (${currentCountry.code})` : `${currentCountry.name} (${currentCountry.code})`)
    : (selectedCountryCode === 'CN' ? '中国 (CN)' : selectedCountryCode);

  // 过滤国家搜索结果
  const filteredCountries = countries.filter((c) => {
    if (!countrySearchQuery.trim()) return true;
    const q = countrySearchQuery.toLowerCase().trim();
    const cn = (c.chinese_name || '').toLowerCase();
    const en = (c.name || '').toLowerCase();
    const code = (c.code || '').toLowerCase();
    return cn.includes(q) || en.includes(q) || code.includes(q);
  });

  // 加载与搜索城市列表
  useEffect(() => {
    let active = true;
    setIsFetchingCities(true);

    const timer = setTimeout(() => {
      fetch(`/api/geo/cities?country=${encodeURIComponent(selectedCountryCode)}&q=${encodeURIComponent(citySearchQuery)}`)
        .then((res) => res.json())
        .then((data) => {
          if (active && data.success) {
            setCities(data.data || []);
          }
        })
        .catch((err) => console.error('Failed to load cities:', err))
        .finally(() => {
          if (active) setIsFetchingCities(false);
        });
    }, 200);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [selectedCountryCode, citySearchQuery]);

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsCountryOpen(false);
        setIsCityOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectCountry = (country: CountryItem) => {
    const newCode = country.code;
    setSelectedCountryCode(newCode);
    setCountrySearchQuery('');
    setIsCountryOpen(false);
    setCitySearchQuery('');
    if (onCountryChange) onCountryChange(newCode);
    if (onCityChange) onCityChange('');
  };

  const handleSelectCity = (city: CityItem) => {
    const name = city.displayName;
    setCitySearchQuery(name);
    setIsCityOpen(false);
    if (onCityChange) onCityChange(name);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full" ref={containerRef}>
      {/* 所在国家 (可打字/下拉搜索) */}
      <div className="sm:col-span-1 relative">
        <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5 flex items-center gap-1">
          <Globe className="w-3 h-3 text-emerald-500" />
          <span>{lang === 'zh' ? '所在国家' : 'Country'}</span>
        </label>
        <div className="relative">
          <input
            type="text"
            value={isCountryOpen ? countrySearchQuery : currentCountryDisplay}
            onChange={(e) => {
              setCountrySearchQuery(e.target.value);
              setIsCountryOpen(true);
              setIsCityOpen(false);
            }}
            onFocus={() => {
              setCountrySearchQuery('');
              setIsCountryOpen(true);
              setIsCityOpen(false);
            }}
            placeholder={lang === 'zh' ? '搜索国家 (如 中国, 美国)' : 'Search country (e.g. China, US)'}
            className="w-full px-3 py-2 bg-muted/40 border border-border rounded-none text-sm text-foreground focus:bg-background focus:border-emerald-500 outline-none pr-8 font-medium truncate"
          />
          <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* 可搜索国家下拉弹窗 */}
        {isCountryOpen && (
          <div className="absolute left-0 right-0 top-full mt-1 bg-card border border-border shadow-xl z-50 max-h-56 overflow-y-auto rounded-none text-card-foreground">
            {filteredCountries.length === 0 ? (
              <div className="p-3 text-center text-xs text-muted-foreground">
                {lang === 'zh' ? '未找到匹配国家' : 'No country found'}
              </div>
            ) : (
              <div className="py-1">
                <div className="px-3 py-1 text-[10px] font-extrabold uppercase text-muted-foreground bg-muted/30 border-b border-border flex items-center justify-between">
                  <span>{lang === 'zh' ? '选择或搜索国家' : 'Select Country'}</span>
                  <span>{filteredCountries.length} COUNTRIES</span>
                </div>
                {filteredCountries.map((c) => {
                  const isSelected = c.code.toUpperCase() === selectedCountryCode.toUpperCase();
                  const label = c.chinese_name ? `${c.chinese_name} (${c.code})` : `${c.name} (${c.code})`;
                  return (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => handleSelectCountry(c)}
                      className={`w-full px-3 py-2 text-left text-xs font-semibold hover:bg-emerald-500/10 hover:text-emerald-500 flex items-center justify-between transition-colors ${
                        isSelected ? 'bg-emerald-500/15 text-emerald-500' : 'text-foreground'
                      }`}
                    >
                      <span className="truncate">{label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 工作城市 (可搜索下拉) */}
      <div className="sm:col-span-2 relative">
        <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5 flex items-center gap-1">
          <MapPin className="w-3 h-3 text-emerald-500" />
          <span>{lang === 'zh' ? '工作城市 / 地区' : 'Work Location / City'}</span>
        </label>

        <div className="relative">
          <input
            type="text"
            value={citySearchQuery}
            onChange={(e) => {
              const val = e.target.value;
              setCitySearchQuery(val);
              setIsCityOpen(true);
              setIsCountryOpen(false);
              if (onCityChange) onCityChange(val);
            }}
            onFocus={() => {
              setIsCityOpen(true);
              setIsCountryOpen(false);
            }}
            placeholder={lang === 'zh' ? '输入或搜索城市 (如 北京、上海、深圳)' : 'Search city (e.g. Beijing, Tokyo)'}
            className="w-full px-3 py-2 bg-muted/40 border border-border rounded-none text-sm text-foreground focus:bg-background focus:border-emerald-500 outline-none pr-8"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-muted-foreground">
            {isFetchingCities ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
            ) : (
              <Search className="w-3.5 h-3.5" />
            )}
          </div>
        </div>

        {/* 可搜索城市下拉面板 */}
        {isCityOpen && (
          <div className="absolute left-0 right-0 top-full mt-1 bg-card border border-border shadow-xl z-50 max-h-56 overflow-y-auto rounded-none text-card-foreground">
            {cities.length === 0 ? (
              <div className="p-3 text-center text-xs text-muted-foreground">
                {isFetchingCities
                  ? (lang === 'zh' ? '正在搜索城市数据库...' : 'Searching database...')
                  : (citySearchQuery
                      ? (lang === 'zh' ? `将使用自定义输入 "${citySearchQuery}"` : `Will use custom "${citySearchQuery}"`)
                      : (lang === 'zh' ? '暂无匹配城市' : 'No matching city'))}
              </div>
            ) : (
              <div className="py-1">
                <div className="px-3 py-1 text-[10px] font-extrabold uppercase text-muted-foreground bg-muted/30 border-b border-border flex items-center justify-between">
                  <span>{lang === 'zh' ? '推荐 / 搜索匹配城市' : 'Matching Cities'}</span>
                  <span>{cities.length} CITIES</span>
                </div>
                {cities.map((city) => {
                  const isSelected = citySearchQuery.trim() === city.displayName;
                  return (
                    <button
                      key={city.id}
                      type="button"
                      onClick={() => handleSelectCity(city)}
                      className={`w-full px-3 py-2 text-left text-xs font-semibold hover:bg-emerald-500/10 hover:text-emerald-500 flex items-center justify-between transition-colors ${
                        isSelected ? 'bg-emerald-500/15 text-emerald-500' : 'text-foreground'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{city.displayName}</span>
                        {city.englishName && city.englishName !== city.displayName && (
                          <span className="text-[10px] text-muted-foreground font-normal">
                            ({city.englishName})
                          </span>
                        )}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
