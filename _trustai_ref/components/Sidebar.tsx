'use client';
import { X, Home, History, GraduationCap, Info, ShieldCheck } from 'lucide-react';

export type View = 'home' | 'verify' | 'quiz' | 'history' | 'about';

const ITEMS: { id: View; label: string; Icon: typeof Home }[] = [
  { id: 'home', label: 'Home', Icon: Home },
  { id: 'history', label: 'History', Icon: History },
  { id: 'quiz', label: 'Learning', Icon: GraduationCap },
  { id: 'about', label: 'About', Icon: Info },
];

export default function Sidebar({
  open,
  onClose,
  onNavigate,
}: {
  open: boolean;
  onClose: () => void;
  onNavigate: (v: View) => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <aside
        className="glass-card absolute left-0 top-0 flex h-full w-72 flex-col rounded-r-2xl p-6 animate-slide-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-white shadow-lg">
              <ShieldCheck className="h-5 w-5" strokeWidth={2.5} />
            </span>
            <span className="text-lg font-bold">TrustAI</span>
          </div>
          <button onClick={onClose} className="btn-ghost flex h-9 w-9 items-center justify-center rounded-lg">
            <X size={18} />
          </button>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {ITEMS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => {
                onNavigate(id);
                onClose();
              }}
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-app hover:bg-[var(--primary-soft)] hover:text-[var(--primary)] transition"
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>
        <p className="text-xs text-muted">v2.0 · Team OffGrids</p>
      </aside>
    </div>
  );
}