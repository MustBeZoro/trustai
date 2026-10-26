'use client';
import { useEffect, useRef, useState } from 'react';
import { Sun, Moon, Shield, ChevronDown } from 'lucide-react';
import type { Theme } from '@/lib/types';

const THEMES: { id: Theme; label: string; Icon: typeof Sun }[] = [
  { id: 'default', label: 'Light', Icon: Sun },
  { id: 'dark', label: 'Dark', Icon: Moon },
  { id: 'cyber', label: 'Cyber-Shield', Icon: Shield },
];

export default function ThemeToggle({
  theme,
  onChange,
}: {
  theme: Theme;
  onChange: (t: Theme) => void;
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
        aria-label="Toggle theme"
        className="btn-ghost flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium"
      >
        <Icon size={18} />
        <span className="hidden sm:inline">{current.label}</span>
        <ChevronDown size={14} className="opacity-60" />
      </button>
      {open && (
        <div className="glass-card absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden p-1.5">
          {THEMES.map(({ id, label, Icon }) => (
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
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}