import { X, Home, History, GraduationCap, Info, MessageSquare, Phone } from 'lucide-react';
import type { LanguageCode } from '@/lib/types';
import { t } from '@/lib/i18n';

export type View = 'home' | 'verify' | 'quiz' | 'history' | 'about' | 'chat-history' | 'helplines';

export default function Sidebar({
  open,
  onClose,
  onNavigate,
  lang,
}: {
  open: boolean;
  onClose: () => void;
  onNavigate: (v: View) => void;
  lang: LanguageCode;
}) {
  if (!open) return null;
  const items: { id: View; label: string; Icon: typeof Home }[] = [
    { id: 'home', label: t(lang, 'navHome'), Icon: Home },
    { id: 'history', label: t(lang, 'navAnalysisHistory'), Icon: History },
    { id: 'chat-history', label: t(lang, 'navChatHistory'), Icon: MessageSquare },
    { id: 'quiz', label: t(lang, 'navLearning'), Icon: GraduationCap },
    { id: 'helplines', label: t(lang, 'navHelplines'), Icon: Phone },
    { id: 'about', label: t(lang, 'navAbout'), Icon: Info },
  ];
  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <aside
        className="glass-card absolute left-0 top-0 flex h-full w-72 flex-col rounded-r-2xl p-6 animate-slide-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/icon-192.png" alt="TrustAI" className="h-9 w-9 rounded-xl object-cover shadow-lg" />
            <span className="text-lg font-bold">TrustAI</span>
          </div>
          <button onClick={onClose} className="btn-ghost flex h-9 w-9 items-center justify-center rounded-lg">
            <X size={18} />
          </button>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {items.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => {
                onNavigate(id);
                onClose();
              }}
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-app transition hover:bg-[var(--primary-soft)] hover:text-[var(--primary)]"
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
