import React from 'react';
import type { Metadata } from 'next';
import { LayoutFrame } from '../../components/layout-frame';
import { resolveLanguage } from '../../lib/i18n';
import { seoI18n } from '../../lib/seo-i18n';

interface LangLayoutProps {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({
  params,
}: Pick<LangLayoutProps, 'params'>): Promise<Metadata> {
  const { lang: rawLang } = await params;
  const lang = resolveLanguage(rawLang);
  const seo = seoI18n[lang];

  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    openGraph: {
      type: 'website',
      siteName: 'WorkChain',
      title: seo.title,
      description: seo.description,
      locale: seo.ogLocale,
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.title,
      description: seo.description,
    },
  };
}

export default async function LangLayout({ children, params }: LangLayoutProps) {
  const { lang } = await params;

  return (
    <LayoutFrame rawLang={lang}>
      {children}
    </LayoutFrame>
  );
}
