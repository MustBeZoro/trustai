'use client';
import { Menu, ShieldCheck } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import type { Theme } from '@/lib/types';

export default function Navbar({
  theme,
  onThemeChange,
  onMenuClick,
  onLogoClick,
}: {
  theme: Theme;
  onThemeChange: (t: Theme) => void;
  onMenuClick: () => void;
  onLogoClick: () => void;
}) {
  return (
    <header className="navbar-glass sticky top-0 z-30 w-full">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <button
          onClick={onMenuClick}
          aria-label="Open menu"
          className="btn-ghost flex h-10 w-10 items-center justify-center rounded-xl"
        >
          <Menu size={20} />
        </button>
        <button onClick={onLogoClick} className="flex items-center gap-2 font-bold text-app">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-white shadow-lg">
            <ShieldCheck className="h-5 w-5" strokeWidth={2.5} />
          </span>
          <span className="text-lg tracking-tight">TrustAI</span>
        </button>
        <ThemeToggle theme={theme} onChange={onThemeChange} />
      </div>
    </header>
  );
}