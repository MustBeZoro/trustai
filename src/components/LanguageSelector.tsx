import { useEffect, useRef, useState } from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import { LANGUAGES, t } from '@/lib/i18n';
import type { LanguageCode } from '@/lib/types';

export default function LanguageSelector({
  language,
  onChange,
}: {
  language: LanguageCode;
  onChange: (l: LanguageCode) => void;
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

  const current = LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={t(language, 'language')}
        className="btn-ghost flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium"
      >
        <Globe size={18} />
        <span className="text-base leading-none">{current.flag}</span>
        <span className="hidden sm:inline">{current.label}</span>
        <ChevronDown size={14} className="opacity-60" />
      </button>
      {open && (
        <div className="glass-card absolute right-0 top-full z-50 mt-2 max-h-80 w-52 overflow-y-auto p-1.5">
          {LANGUAGES.map(({ code, label, flag }) => (
            <button
              key={code}
              onClick={() => {
                onChange(code);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                language === code
                  ? 'bg-[var(--primary-soft)] text-[var(--primary)] font-semibold'
                  : 'text-app hover:bg-[var(--primary-soft)]'
              }`}
            >
              <span className="text-base leading-none">{flag}</span>
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
