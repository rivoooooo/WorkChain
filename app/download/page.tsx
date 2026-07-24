'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { i18n, Language } from '../../lib/i18n';
import {
  ArrowLeft,
  Database,
  Lock,
  Download,
  FileText,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileSpreadsheet,
  FileJson
} from 'lucide-react';

interface BackupMetadata {
  id: string;
  date: string;
  createdAt: string;
  reviewCount: number;
  csvSize: number;
  xlsxSize: number;
  sqlSize: number;
}

export default function DownloadPage() {
  const [lang, setLang] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('lang') as Language;
      if (savedLang === 'zh' || savedLang === 'en') {
        return savedLang;
      }
    }
    return 'zh';
  });

  const [backups, setBackups] = useState<BackupMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTriggering, setIsTriggering] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const toggleLang = () => {
    const nextLang = lang === 'zh' ? 'en' : 'zh';
    setLang(nextLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('lang', nextLang);
    }
  };

  const t = i18n[lang];

  // Fetch backups from API
  const fetchBackups = async (showLoading = false) => {
    try {
      if (showLoading) {
        setIsLoading(true);
      }
      const res = await fetch('/api/backups');
      const data = await res.json();
      if (data.success) {
        setBackups(data.backups || []);
      }
    } catch (err) {
      console.error('Error fetching backups list:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBackups(false);
  }, []);

  // Trigger a manual backup
  const handleTriggerBackup = async () => {
    if (isTriggering) return;
    setIsTriggering(true);
    setNotification(null);

    try {
      const res = await fetch('/api/backups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (data.success) {
        setNotification({
          type: 'success',
          message: t.downloadTriggerSuccess
        });
        // Refresh the list
        await fetchBackups();
      } else {
        setNotification({
          type: 'error',
          message: data.error || t.downloadTriggerFail
        });
      }
    } catch (err) {
      console.error('Failed to trigger backup:', err);
      setNotification({
        type: 'error',
        message: t.downloadTriggerFail
      });
    } finally {
      setIsTriggering(false);
      // Auto dismiss notification after 5 seconds
      setTimeout(() => {
        setNotification(null);
      }, 5000);
    }
  };

  // Helper for formatting file size
  const formatBytes = (bytes: number) => {
    if (bytes === 0 || !bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-[#070708] text-[#e4e4e7] font-sans antialiased selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Top Ledger Assurance Banner */}
      <div className="w-full bg-[#0d0d0f] border-b border-white/5 px-4 py-2.5 text-xs text-gray-400" id="top_banner">
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

      <div className="max-w-5xl mx-auto px-4 py-8" id="download_archive_container">
        {/* Navigation back */}
        <div className="flex items-center justify-between mb-8" id="download_nav">
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
              className="px-2.5 py-1 bg-[#121214] hover:bg-[#1a1a1f] border border-white/5 text-gray-400 hover:text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
            >
              <span>🌐</span>
              <span>{lang === 'zh' ? 'EN' : 'ZH'}</span>
            </button>
          </div>

          <div className="inline-flex items-center gap-2 text-xs text-gray-500">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Daily Schedule: 00:00 UTC</span>
          </div>
        </div>

        {/* Heading section */}
        <div className="mb-8" id="download_heading">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/5 border border-emerald-500/20 rounded-full shadow-xs text-xs text-emerald-400 font-medium mb-3">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t.downloadNavLabel}</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">
                {t.downloadTitle}
              </h1>
              <p className="text-sm text-gray-400 mt-2 max-w-2xl leading-relaxed">
                {t.downloadSub}
              </p>
            </div>
            <button
              onClick={handleTriggerBackup}
              disabled={isTriggering || isLoading}
              className="self-start md:self-center px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-800 disabled:text-emerald-500 text-black font-bold rounded-xl text-sm transition-colors flex items-center gap-2 shadow-lg cursor-pointer"
            >
              {isTriggering ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t.downloadTriggering}</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>{t.downloadTriggerBtn}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Toast Notification */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`p-4 rounded-xl mb-6 flex items-center gap-3 border ${
                notification.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
              }`}
            >
              {notification.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
              )}
              <span className="text-sm font-medium">{notification.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Backups List Card */}
        <div className="bg-[#0b0b0d] border border-white/5 rounded-2xl overflow-hidden" id="backups_table_card">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20" id="backups_loading">
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-4" />
              <p className="text-sm text-gray-500">
                {lang === 'zh' ? '正在加载归档历史记录...' : 'Loading archival download list...'}
              </p>
            </div>
          ) : backups.length === 0 ? (
            <div className="text-center py-16 px-4" id="backups_empty">
              <Database className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-white mb-1">{t.downloadNoData}</h3>
              <p className="text-xs text-gray-500 max-w-xs mx-auto">
                {lang === 'zh'
                  ? '目前还没有归档备份，您可以点击上方按钮手动触发系统生成第一笔备份！'
                  : 'No archived backups found. Trigger one manually using the button above to seed the archive list.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto" id="backups_table_wrapper">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.01] text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    <th className="py-4 px-6">{t.downloadColDate}</th>
                    <th className="py-4 px-4">{t.downloadColRecords}</th>
                    <th className="py-4 px-6 text-right">{t.downloadColFiles}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {backups.map((backup) => (
                    <tr
                      key={backup.id}
                      className="hover:bg-white/[0.01] transition-colors text-sm"
                    >
                      <td className="py-4.5 px-6 font-mono font-bold text-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        {backup.date}
                      </td>
                      <td className="py-4.5 px-4 text-gray-300 font-medium">
                        {backup.reviewCount} {lang === 'zh' ? '条记录' : 'reviews'}
                      </td>
                      <td className="py-4.5 px-6 text-right">
                        <div className="flex flex-wrap items-center justify-end gap-2.5">
                          {/* CSV Download */}
                          <a
                            href={`/api/backups/download?id=${backup.id}&format=csv`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#121214] hover:bg-[#1c1c22] border border-white/5 hover:border-white/10 text-xs text-gray-300 hover:text-white rounded-lg transition-all font-semibold"
                            title={`${t.downloadBtnCsv} (${formatBytes(backup.csvSize)})`}
                          >
                            <FileText className="w-3.5 h-3.5 text-blue-400" />
                            <span>CSV</span>
                            <span className="text-[10px] text-gray-500 font-normal">
                              {formatBytes(backup.csvSize)}
                            </span>
                            <Download className="w-3 h-3 text-gray-500 ml-0.5" />
                          </a>

                          {/* XLSX Download */}
                          <a
                            href={`/api/backups/download?id=${backup.id}&format=xlsx`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#121214] hover:bg-[#1c1c22] border border-white/5 hover:border-white/10 text-xs text-gray-300 hover:text-white rounded-lg transition-all font-semibold"
                            title={`${t.downloadBtnXlsx} (${formatBytes(backup.xlsxSize)})`}
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                            <span>XLSX</span>
                            <span className="text-[10px] text-gray-500 font-normal">
                              {formatBytes(backup.xlsxSize)}
                            </span>
                            <Download className="w-3 h-3 text-gray-500 ml-0.5" />
                          </a>

                          {/* SQL Download */}
                          <a
                            href={`/api/backups/download?id=${backup.id}&format=sql`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#121214] hover:bg-[#1c1c22] border border-white/5 hover:border-white/10 text-xs text-gray-300 hover:text-white rounded-lg transition-all font-semibold"
                            title={`${t.downloadBtnSql} (${formatBytes(backup.sqlSize)})`}
                          >
                            <FileJson className="w-3.5 h-3.5 text-amber-400" />
                            <span>SQL Dump</span>
                            <span className="text-[10px] text-gray-500 font-normal">
                              {formatBytes(backup.sqlSize)}
                            </span>
                            <Download className="w-3 h-3 text-gray-500 ml-0.5" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
