import React from 'react';
import { LayoutFrame } from '../../components/layout-frame';

interface LangLayoutProps {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}

export default async function LangLayout({ children, params }: LangLayoutProps) {
  const { lang } = await params;

  return (
    <LayoutFrame rawLang={lang}>
      {children}
    </LayoutFrame>
  );
}
