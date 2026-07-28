'use client';

import Script from 'next/script';
import { useEffect, useId, useRef, useState } from 'react';

interface TurnstileApi {
  render(
    target: HTMLElement,
    options: {
      sitekey: string;
      theme: 'auto';
      size: 'flexible';
      callback: (token: string) => void;
      'error-callback': () => void;
      'expired-callback': () => void;
    }
  ): string;
  remove(widgetId: string): void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export const humanVerificationEnabled =
  process.env.NEXT_PUBLIC_HUMAN_VERIFICATION_PROVIDER === 'turnstile';

export function HumanVerification({
  onToken,
  resetKey,
}: {
  onToken: (token: string | null) => void;
  resetKey: number;
}) {
  const reactId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const provider = process.env.NEXT_PUBLIC_HUMAN_VERIFICATION_PROVIDER || 'disabled';
  const siteKey = process.env.NEXT_PUBLIC_HUMAN_VERIFICATION_SITE_KEY || '';

  useEffect(() => {
    if (provider !== 'turnstile' || !siteKey || !scriptReady || !window.turnstile) {
      return;
    }
    const container = containerRef.current;
    if (!container) return;

    onToken(null);
    widgetIdRef.current = window.turnstile.render(container, {
      sitekey: siteKey,
      theme: 'auto',
      size: 'flexible',
      callback: (token) => onToken(token),
      'error-callback': () => onToken(null),
      'expired-callback': () => onToken(null),
    });

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
      widgetIdRef.current = null;
    };
  }, [onToken, provider, resetKey, scriptReady, siteKey]);

  if (provider === 'disabled') return null;
  if (provider !== 'turnstile') {
    return <p className="text-xs text-rose-500">Unsupported human verification provider.</p>;
  }
  if (!siteKey) {
    return <p className="text-xs text-rose-500">Turnstile site key is not configured.</p>;
  }

  return (
    <div className="space-y-1" data-verification-id={reactId}>
      <Script
        id="cloudflare-turnstile-api"
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
      />
      <div ref={containerRef} className="min-h-[65px]" />
    </div>
  );
}
