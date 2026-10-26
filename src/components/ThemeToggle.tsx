import { useEffect, useRef, useState } from 'react';
import { Sun, Moon, Shield, ChevronDown } from 'lucide-react';
import type { LanguageCode, Theme } from '@/lib/types';
import { t } from '@/lib/i18n';

const THEMES: { id: Theme; key: string; Icon: typeof Sun }[] = [
  { id: 'default', key: 'light', Icon: Sun },
  { id: 'dark', key: 'dark', Icon: Moon },
  { id: 'cyber', key: 'cyberShield', Icon: Shield },
];

export default function ThemeToggle({
  theme,
  onChange,
  lang,
}: {
  theme: Theme;
  onChange: (t: Theme) => void;
  lang: LanguageCode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const current = THEMES.find((t) => t.id === theme) ?? THEMES[0];
  const Icon = current.Icon;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={t(lang, 'toggleTheme')}
        className="btn-ghost flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium"
      >
        <Icon size={18} />
        <span className="hidden sm:inline">{t(lang, current.key)}</span>
        <ChevronDown size={14} className="opacity-60" />
      </button>
      {open && (
        <div className="glass-card absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden p-1.5">
          {THEMES.map(({ id, key, Icon }) => (
            <button
              key={id}
              onClick={() => {
                onChange(id);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                theme === id
                  ? 'bg-[var(--primary-soft)] text-[var(--primary)] font-semibold'
                  : 'text-app hover:bg-[var(--primary-soft)]'
              }`}
            >
              <Icon size={16} />
              {t(lang, key)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
