import { Menu } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import LanguageSelector from './LanguageSelector';
import PalettePicker from './PalettePicker';
import type { LanguageCode, PaletteColor, Theme } from '@/lib/types';
import { t } from '@/lib/i18n';

export default function Navbar({
  theme,
  onThemeChange,
  onMenuClick,
  onLogoClick,
  language,
  onLanguageChange,
  palette,
  onPaletteChange,
}: {
  theme: Theme;
  onThemeChange: (t: Theme) => void;
  onMenuClick: () => void;
  onLogoClick: () => void;
  language: LanguageCode;
  onLanguageChange: (l: LanguageCode) => void;
  palette: PaletteColor;
  onPaletteChange: (c: PaletteColor) => void;
}) {
  return (
    <header className="navbar-glass sticky top-0 z-30 w-full">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:px-6">
        <button
          onClick={onMenuClick}
          aria-label={t(language, 'openMenu')}
          className="btn-ghost flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        >
          <Menu size={20} />
        </button>
        <button onClick={onLogoClick} className="flex items-center gap-2 font-bold text-app">
          <img src="/icon-192.png" alt="TrustAI" className="h-9 w-9 rounded-xl object-cover shadow-lg" />
          <span className="text-lg tracking-tight">TrustAI</span>
        </button>
        <div className="flex items-center gap-2">
          <LanguageSelector language={language} onChange={onLanguageChange} />
          <PalettePicker color={palette} onChange={onPaletteChange} />
          <ThemeToggle theme={theme} onChange={onThemeChange} lang={language} />
        </div>
      </div>
    </header>
  );
}
