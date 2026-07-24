'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';

const emptySubscribe = () => () => {};

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const mounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const defaultClasses = "inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-white/10 text-white/90 hover:text-white transition-colors cursor-pointer";

  if (!mounted) {
    return (
      <div className={className || defaultClasses} />
    );
  }

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={className || defaultClasses}
      title={isDark ? '切换至浅色模式 / Switch to Light Mode' : '切换至深色模式 / Switch to Dark Mode'}
      aria-label="Toggle Theme"
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-current transition-all" />
      ) : (
        <Moon className="w-4 h-4 text-current transition-all" />
      )}
    </button>
  );
}

