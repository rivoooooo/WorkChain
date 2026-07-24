'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';

const emptySubscribe = () => () => {};

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-full border border-border bg-background/50" />
    );
  }

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-border/60 bg-background/80 hover:bg-accent hover:text-accent-foreground transition-colors backdrop-blur-sm cursor-pointer"
      title={isDark ? '切换至浅色模式 / Switch to Light Mode' : '切换至深色模式 / Switch to Dark Mode'}
      aria-label="Toggle Theme"
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-400 transition-all" />
      ) : (
        <Moon className="w-4 h-4 text-slate-700 transition-all" />
      )}
    </button>
  );
}
