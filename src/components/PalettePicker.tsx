import { useEffect, useRef, useState } from 'react';
import { Palette } from 'lucide-react';
import { PALETTE_COLORS } from '@/lib/i18n';
import type { PaletteColor } from '@/lib/types';

export default function PalettePicker({
  color,
  onChange,
}: {
  color: PaletteColor;
  onChange: (c: PaletteColor) => void;
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

  const current = PALETTE_COLORS.find((p) => p.id === color) ?? PALETTE_COLORS[0];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Theme palette"
        className="btn-ghost flex h-9 w-9 items-center justify-center rounded-xl"
      >
        <Palette size={16} />
        <span
          className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white"
          style={{ background: current.hex }}
        />
      </button>
      {open && (
        <div className="glass-card absolute right-0 top-full z-50 mt-2 w-44 p-1.5">
          <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-muted">Color</p>
          {PALETTE_COLORS.map(({ id, label, hex }) => (
            <button
              key={id}
              onClick={() => {
                onChange(id);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                color === id
                  ? 'bg-[var(--primary-soft)] text-[var(--primary)] font-semibold'
                  : 'text-app hover:bg-[var(--primary-soft)]'
              }`}
            >
              <span className="h-4 w-4 rounded-full" style={{ background: hex }} />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
