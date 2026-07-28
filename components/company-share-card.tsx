'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Check, Copy, Download, Share2, X } from 'lucide-react';
import { motion } from 'motion/react';
import type { Language } from '@/lib/i18n';

interface CompanyShareCardProps {
  open: boolean;
  onClose: () => void;
  company: {
    name: string;
    location: string;
    reviewCount: number;
    rating: number;
    companyType?: string | null;
    establishmentDate?: string | null;
    registeredCapital?: string | null;
  };
  lang: Language;
}

const shareText = (lang: Language) =>
  lang === 'zh'
    ? {
        title: '分享企业',
        subtitle: '匿名企业信息与工作体验',
        reviews: '条匿名评价',
        type: '企业类型',
        established: '成立日期',
        capital: '注册资本',
        scan: '扫描二维码查看企业详情',
        copy: '复制链接',
        copied: '已复制',
        download: '下载卡片',
        share: '分享',
      }
    : {
        title: 'Share company',
        subtitle: 'Anonymous company information and workplace experiences',
        reviews: 'anonymous reviews',
        type: 'Company type',
        established: 'Established',
        capital: 'Registered capital',
        scan: 'Scan to view the company profile',
        copy: 'Copy link',
        copied: 'Copied',
        download: 'Download card',
        share: 'Share',
      };

export function CompanyShareCard({
  open,
  onClose,
  company,
  lang,
}: CompanyShareCardProps) {
  const [shareUrl, setShareUrl] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [cardTilt, setCardTilt] = useState({ x: 0, y: 0 });
  const text = shareText(lang);
  const visibleDetails = [
    [text.type, company.companyType],
    [text.established, company.establishmentDate],
    [text.capital, company.registeredCapital],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));

  useEffect(() => {
    if (!open) return;
    const url = `${window.location.origin}${window.location.pathname}`;
    setShareUrl(url);
    void QRCode.toDataURL(url, {
      width: 360,
      margin: 2,
      color: { dark: '#111827', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    }).then(setQrDataUrl);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose, open]);

  if (!open) return null;

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `${company.name} · WorkChain`,
        text: text.subtitle,
        url: shareUrl,
      });
      return;
    }
    await copyLink();
  };

  const downloadCard = async () => {
    if (!qrDataUrl) return;
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 1500;
    const context = canvas.getContext('2d');
    if (!context) return;

    const heroImage = new Image();
    heroImage.src = '/after.png';
    await heroImage.decode();
    const heroScale = Math.max(
      canvas.width / heroImage.naturalWidth,
      canvas.height / heroImage.naturalHeight
    );
    const heroWidth = heroImage.naturalWidth * heroScale;
    const heroHeight = heroImage.naturalHeight * heroScale;
    context.drawImage(
      heroImage,
      (canvas.width - heroWidth) / 2,
      (canvas.height - heroHeight) / 2,
      heroWidth,
      heroHeight
    );
    const backgroundMask = context.createLinearGradient(0, 0, 0, canvas.height);
    backgroundMask.addColorStop(0, 'rgba(248, 250, 252, 1)');
    backgroundMask.addColorStop(0.46, 'rgba(248, 250, 252, 0.92)');
    backgroundMask.addColorStop(1, 'rgba(248, 250, 252, 0.12)');
    context.fillStyle = backgroundMask;
    context.fillRect(0, 0, canvas.width, canvas.height);
    const bottomMask = context.createLinearGradient(
      0,
      canvas.height * 0.56,
      0,
      canvas.height
    );
    bottomMask.addColorStop(0, 'rgba(15, 23, 42, 0)');
    bottomMask.addColorStop(1, 'rgba(15, 23, 42, 0.72)');
    context.fillStyle = bottomMask;
    context.fillRect(0, canvas.height * 0.56, canvas.width, canvas.height * 0.44);
    context.fillStyle = '#111827';
    context.fillRect(0, 0, canvas.width, 18);
    context.font = '900 58px system-ui, sans-serif';
    context.fillText('WORKCHAIN', 90, 125);
    context.fillStyle = '#d97706';
    context.font = '800 24px system-ui, sans-serif';
    context.fillText('BETA', 430, 118);

    context.fillStyle = '#111827';
    context.font = '900 76px system-ui, sans-serif';
    const displayName =
      company.name.length > 18 ? `${company.name.slice(0, 18)}…` : company.name;
    context.fillText(displayName, 90, 285);
    context.fillStyle = '#64748b';
    context.font = '400 30px system-ui, sans-serif';
    context.fillText(company.location || text.subtitle, 90, 350);
    context.font = '700 32px system-ui, sans-serif';
    context.fillText(
      `${company.rating.toFixed(1)} / 5  ·  ${company.reviewCount} ${text.reviews}`,
      90,
      425
    );

    let detailY = 520;
    for (const [label, value] of visibleDetails) {
      context.fillStyle = '#64748b';
      context.font = '700 23px system-ui, sans-serif';
      context.fillText(label.toUpperCase(), 90, detailY);
      context.fillStyle = '#111827';
      context.font = '600 30px system-ui, sans-serif';
      const displayValue = value.length > 42 ? `${value.slice(0, 42)}…` : value;
      context.fillText(displayValue, 90, detailY + 42);
      detailY += 105;
    }

    const qrImage = new Image();
    qrImage.src = qrDataUrl;
    await qrImage.decode();
    context.fillStyle = 'rgba(255, 255, 255, 0.96)';
    context.fillRect(90, 1100, 280, 280);
    context.drawImage(qrImage, 105, 1115, 250, 250);

    context.fillStyle = '#111827';
    context.font = '800 31px system-ui, sans-serif';
    context.fillText(text.scan, 415, 1190);
    context.fillStyle = '#ffffff';
    context.font = '600 24px system-ui, sans-serif';
    context.fillText('workchain', 415, 1240);

    const link = document.createElement('a');
    link.download = `workchain-${company.name}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={text.title}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-md [perspective:1200px]">
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          className="relative"
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute -right-3 -top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white backdrop-blur hover:bg-black/80"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>

          <motion.div
            animate={{ rotateX: cardTilt.x, rotateY: cardTilt.y }}
            whileHover={{ y: -4, scale: 1.008 }}
            transition={{ type: 'spring', stiffness: 220, damping: 22 }}
            onMouseMove={(event) => {
              const bounds = event.currentTarget.getBoundingClientRect();
              const horizontal = (event.clientX - bounds.left) / bounds.width - 0.5;
              const vertical = (event.clientY - bounds.top) / bounds.height - 0.5;
              setCardTilt({ x: vertical * -5, y: horizontal * 5 });
            }}
            onMouseLeave={() => setCardTilt({ x: 0, y: 0 })}
            className="relative aspect-[4/5] select-none overflow-hidden border border-white/30 bg-slate-50 p-6 text-slate-950 shadow-2xl [transform-style:preserve-3d]"
          >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/after.png')" }}
            aria-hidden="true"
          />
          <div
            className="absolute inset-0 bg-gradient-to-b from-slate-50 from-0% via-slate-50/90 via-50% to-slate-50/10"
            aria-hidden="true"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/15 via-40% to-transparent"
            aria-hidden="true"
          />
          <div className="relative flex items-center justify-between border-b border-slate-300 pb-3">
            <span className="text-lg font-black tracking-tighter">WORKCHAIN</span>
            <span className="border border-amber-500 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-widest text-amber-700">
              Beta
            </span>
          </div>
          <h3 className="relative mt-6 break-words text-3xl font-black tracking-tight">
            {company.name}
          </h3>
          {company.location && (
            <p className="relative mt-1 text-sm text-slate-600">{company.location}</p>
          )}
          <p className="relative mt-3 text-sm font-bold">
            {company.rating.toFixed(1)} / 5 · {company.reviewCount} {text.reviews}
          </p>

          {visibleDetails.length > 0 && (
            <dl className="relative mt-6 grid grid-cols-2 gap-x-5 gap-y-4 border-t border-slate-300/70 pt-5">
              {visibleDetails.map(([label, value]) => (
                <div key={label} className="min-w-0">
                  <dt className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500">
                    {label}
                  </dt>
                  <dd className="mt-1 truncate text-xs font-bold" title={value}>
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          )}

          <div className="absolute bottom-6 left-6 right-6 flex items-end gap-4">
            <div className="flex h-28 w-28 shrink-0 items-center justify-center bg-white/95 p-1.5 shadow-lg">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrDataUrl}
                  alt={text.scan}
                  className="h-full w-full"
                  draggable={false}
                />
              ) : (
                <span className="text-xs text-slate-400">...</span>
              )}
            </div>
            <div className="min-w-0 pb-1 text-white drop-shadow-md">
              <p className="text-xs font-extrabold">{text.scan}</p>
              <p className="mt-2 text-[9px] uppercase tracking-widest">WorkChain</p>
            </div>
          </div>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.28 }}
          className="mt-4 grid grid-cols-3 gap-2"
        >
          <button
            type="button"
            onClick={() => void copyLink()}
            className="flex items-center justify-center gap-1.5 border border-white/20 bg-background/90 px-3 py-2 text-xs font-bold text-foreground shadow-lg backdrop-blur hover:bg-background"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? text.copied : text.copy}
          </button>
          <button
            type="button"
            onClick={() => void downloadCard()}
            disabled={!qrDataUrl}
            className="flex items-center justify-center gap-1.5 border border-white/20 bg-background/90 px-3 py-2 text-xs font-bold text-foreground shadow-lg backdrop-blur hover:bg-background disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            {text.download}
          </button>
          <button
            type="button"
            onClick={() => void shareLink()}
            className="flex items-center justify-center gap-1.5 bg-foreground px-3 py-2 text-xs font-bold text-background shadow-lg hover:opacity-90"
          >
            <Share2 className="h-3.5 w-3.5" />
            {text.share}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
