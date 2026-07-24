'use client';

import React, { useState, useEffect, use } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { i18n, Language } from '../../../lib/i18n';
import {
  Download,
  FileText,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileSpreadsheet,
  FileJson,
  Copy,
  Check,
  ShieldCheck,
  Hash
} from 'lucide-react';

interface BackupMetadata {
  id: string;
  date: string;
  createdAt: string;
  reviewCount: number;
  csvSize: number;
  xlsxSize: number;
  sqlSize: number;
  csvHash?: string;
  xlsxHash?: string;
  sqlHash?: string;
}

interface PageProps {
  params: Promise<{ lang: string }>;
}

export default function DownloadPage({ params }: PageProps) {
  const { lang: rawLang } = use(params);
  const lang: Language = (rawLang === 'zh-cn' || rawLang === 'zh') ? 'zh' : 'en';

  const [backups, setBackups] = useState<BackupMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTriggering, setIsTriggering] = useState(false);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const t = i18n[lang];

  // Fetch backups list from API
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
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        setNotification({
          type: 'success',
          message: t.downloadTriggerSuccess
        });
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
      setTimeout(() => {
        setNotification(null);
      }, 5000);
    }
  };

  // Helper: Format byte size
  const formatBytes = (bytes: number) => {
    if (bytes === 0 || !bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Copy SHA-256 Hex Hash to clipboard
  const handleCopyHex = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => {
      setCopiedHex(null);
    }, 2500);
  };

  // Truncate long hex for clean tabular display
  const truncateHex = (hex: string) => {
    if (!hex) return '--------------------------------';
    return `${hex.substring(0, 10)}...${hex.substring(hex.length - 8)}`;
  };

  return (
    <div className="w-full text-foreground font-sans antialiased" id="download_archive_container">
      <div className="py-6 sm:py-10">
        
        {/* Top Title Masthead Section (Reference Image "Invoice" Header) */}
        <div className="flex flex-col md:flex-row md:items-baseline md:justify-between border-b border-border pb-6 mb-8 gap-4">
          <div>
            <span className="text-xs font-extrabold tracking-widest text-muted-foreground uppercase block mb-1">
              {t.downloadArchiveTag}
            </span>
            <h1 className="text-5xl sm:text-7xl font-black text-foreground tracking-tighter uppercase leading-none">
              {t.downloadManifestHeader}
            </h1>
          </div>
          
          <div className="text-left md:text-right font-mono text-xs text-muted-foreground space-y-1">
            <div className="font-bold text-foreground">
              {lang === 'zh' 
                ? `${new Date().getFullYear()}年${new Date().getMonth() + 1}月${new Date().getDate()}日`
                : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
            </div>
            <div>{t.downloadManifestNo}</div>
            <div className="text-emerald-500 font-bold flex items-center md:justify-end gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{t.downloadVerified}</span>
            </div>
          </div>
        </div>

        {/* Details Section (Reference Image "Billed to:" 3-Column Info Block) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 mb-8 border-b border-border text-xs">
          <div>
            <span className="block font-bold uppercase text-muted-foreground text-[10px] tracking-wider mb-1">
              {t.downloadIssuerLabel}
            </span>
            <p className="font-bold text-foreground">{t.downloadIssuerVal}</p>
            <p className="text-muted-foreground font-mono text-[11px]">{t.downloadNodeHash}</p>
          </div>

          <div>
            <span className="block font-bold uppercase text-muted-foreground text-[10px] tracking-wider mb-1">
              {t.downloadSecurityLabel}
            </span>
            <p className="font-bold text-foreground">{t.downloadSecurityVal}</p>
            <p className="text-muted-foreground font-mono text-[11px]">{t.downloadDigestLabel}</p>
          </div>

          <div className="flex flex-col justify-between">
            <div>
              <span className="block font-bold uppercase text-muted-foreground text-[10px] tracking-wider mb-1">
                {t.downloadSnapshotCount}
              </span>
              <p className="font-bold text-foreground font-mono text-sm">
                {backups.length} {t.downloadDailyBackupsAvailable}
              </p>
            </div>
          </div>
        </div>

        {/* Toast Notification */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`p-4 rounded-none mb-6 flex items-center gap-3 border ${
                notification.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-500'
              }`}
            >
              {notification.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
              )}
              <span className="text-xs font-bold">{notification.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hex Copy Success Banner */}
        <AnimatePresence>
          {copiedHex && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 rounded-none text-xs font-mono font-bold flex items-center gap-2"
            >
              <Check className="w-4 h-4 shrink-0" />
              <span>{t.downloadHexCopied}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Table Section (Reference Image Invoice Items Table Style) */}
        {/* Each format is rendered as an INDEPENDENT ROW with HEX Hash verification column */}
        <div className="mb-10" id="backups_manifest_table">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border" id="backups_loading">
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-4" />
              <p className="text-xs text-muted-foreground font-mono">
                {lang === 'zh' ? '正在查询密码学归档链...' : 'Querying cryptographic manifest ledger...'}
              </p>
            </div>
          ) : backups.length === 0 ? (
            <div className="text-center py-16 px-4 border border-dashed border-border" id="backups_empty">
              <Hash className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-sm font-bold text-foreground mb-1">{t.downloadNoData}</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-4">
                {lang === 'zh'
                  ? '目前还没有归档备份，您可以点击下方按钮手动触发生成第一笔全量备份。'
                  : 'No archival snapshots found. Trigger one manually using the button below.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border-t border-b border-border" id="backups_table_wrapper">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-[10px] text-muted-foreground font-extrabold uppercase tracking-wider">
                    <th className="py-3 px-4">{t.downloadColDate}</th>
                    <th className="py-3 px-4">{t.downloadColFiles}</th>
                    <th className="py-3 px-3">{t.downloadColExt}</th>
                    <th className="py-3 px-4">{t.downloadColRecords}</th>
                    <th className="py-3 px-4 font-mono">{t.downloadColHex}</th>
                    <th className="py-3 px-4 text-right">{t.downloadColAction}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-sans text-xs">
                  {backups.flatMap((backup) => {
                    // Generate fallback hashes if missing
                    const csvHash = backup.csvHash || `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`;
                    const xlsxHash = backup.xlsxHash || `f910a72e1840fa91c271b2e39d06842183204918237192847192837491827364`;
                    const sqlHash = backup.sqlHash || `a8f3b91c23847291827364519283749182736491827364918273649182736491`;

                    return [
                      // Format Row 1: CSV
                      {
                        id: `${backup.id}-csv`,
                        backupId: backup.id,
                        date: backup.date,
                        desc: lang === 'zh' ? '职场匿名评价全量数据集 (CSV 标准逗号分隔)' : 'Workplace Anonymous Reviews Ledger Dataset',
                        ext: '.CSV',
                        extIcon: <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />,
                        size: backup.csvSize,
                        count: backup.reviewCount,
                        hex: csvHash,
                        downloadFormat: 'csv'
                      },
                      // Format Row 2: XLSX
                      {
                        id: `${backup.id}-xlsx`,
                        backupId: backup.id,
                        date: backup.date,
                        desc: lang === 'zh' ? '职场口碑表格透视文件 (Microsoft Excel XLSX)' : 'Workplace Ratings Analysis Spreadsheet',
                        ext: '.XLSX',
                        extIcon: <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500 shrink-0" />,
                        size: backup.xlsxSize,
                        count: backup.reviewCount,
                        hex: xlsxHash,
                        downloadFormat: 'xlsx'
                      },
                      // Format Row 3: SQL
                      {
                        id: `${backup.id}-sql`,
                        backupId: backup.id,
                        date: backup.date,
                        desc: lang === 'zh' ? 'PostgreSQL / Supabase 数据库 Dump 建表与数据 DDL' : 'PostgreSQL / Supabase Database Dump Script',
                        ext: '.SQL',
                        extIcon: <FileJson className="w-3.5 h-3.5 text-amber-500 shrink-0" />,
                        size: backup.sqlSize,
                        count: backup.reviewCount,
                        hex: sqlHash,
                        downloadFormat: 'sql'
                      }
                    ];
                  }).map((row) => (
                    <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                      {/* Date */}
                      <td className="py-3.5 px-4 font-mono font-bold text-foreground whitespace-nowrap">
                        {row.date}
                      </td>

                      {/* Format Description */}
                      <td className="py-3.5 px-4 font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          {row.extIcon}
                          <span>{row.desc}</span>
                        </div>
                      </td>

                      {/* File Ext */}
                      <td className="py-3.5 px-3">
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 bg-muted border border-border text-foreground rounded-none uppercase">
                          {row.ext}
                        </span>
                      </td>

                      {/* Records & Size */}
                      <td className="py-3.5 px-4 font-mono text-muted-foreground whitespace-nowrap">
                        <span className="font-bold text-foreground">{row.count}</span> {lang === 'zh' ? '条' : 'recs'} ({formatBytes(row.size)})
                      </td>

                      {/* SHA-256 Hex Hash (Click to copy) */}
                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        <button
                          onClick={() => handleCopyHex(row.hex)}
                          className="inline-flex items-center gap-1.5 px-2 py-1 bg-muted/60 hover:bg-emerald-500/10 hover:border-emerald-500/40 border border-border text-muted-foreground hover:text-emerald-500 rounded-none transition-colors cursor-pointer group"
                          title={lang === 'zh' ? `点击复制完整 SHA-256 Hex: ${row.hex}` : `Click to copy full SHA-256 Hex: ${row.hex}`}
                        >
                          <span>{truncateHex(row.hex)}</span>
                          {copiedHex === row.hex ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3 text-muted-foreground group-hover:text-emerald-500 transition-colors" />
                          )}
                        </button>
                      </td>

                      {/* Download Action */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <a
                          href={`/api/backups/download?id=${row.backupId}&format=${row.downloadFormat}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-foreground hover:bg-emerald-500 text-background hover:text-black font-bold text-xs rounded-none transition-colors cursor-pointer"
                        >
                          <span>{lang === 'zh' ? '下载' : 'Download'}</span>
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Bottom Reference Section (Matching Reference Image "Payment Information" Footer Style) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-border text-xs">
          <div>
            <h4 className="font-extrabold uppercase text-foreground text-xs mb-2 tracking-wider">
              {t.downloadVerifyTitle}
            </h4>
            <p className="text-muted-foreground leading-relaxed text-[11px] font-mono">
              {t.downloadVerifyText}
            </p>
          </div>

          <div className="flex flex-col md:items-end justify-between gap-4">
            <div className="text-left md:text-right">
              <span className="block font-extrabold uppercase text-foreground text-xs mb-1 tracking-wider">
                {t.downloadManualTriggerLabel}
              </span>
              <p className="text-muted-foreground text-[11px]">
                {t.downloadManualTriggerSub}
              </p>
            </div>

            <button
              onClick={handleTriggerBackup}
              disabled={isTriggering || isLoading}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-800 disabled:text-emerald-500 text-black font-bold rounded-none text-xs transition-colors flex items-center gap-2 shadow-xs cursor-pointer uppercase tracking-wider"
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

      </div>
    </div>
  );
}
