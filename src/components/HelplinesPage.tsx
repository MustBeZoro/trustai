import { Phone, ExternalLink, AlertTriangle, Globe } from 'lucide-react';
import type { LanguageCode } from '@/lib/types';
import { t } from '@/lib/i18n';

export default function HelplinesPage({ lang }: { lang: LanguageCode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="text-center animate-fade-up">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-500 ring-2 ring-red-500/30">
          <AlertTriangle size={32} strokeWidth={2.2} />
        </div>
        <h1 className="text-3xl font-black text-app">{t(lang, 'helplinesTitle')}</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted">{t(lang, 'helplinesSub')}</p>
      </div>

      <div className="mt-10 space-y-4">
        {/* Call National Cyber Helpline */}
        <a
          href="tel:1930"
          className="group glass-card flex flex-col gap-3 p-6 transition hover:ring-2 hover:ring-red-500/50 sm:flex-row sm:items-center"
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-500 text-white shadow-lg shadow-red-500/30">
            <Phone size={26} strokeWidth={2.4} />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-app">{t(lang, 'callHelpline')}</h3>
            <p className="mt-1 text-xs text-muted">{t(lang, 'callHelplineDesc')}</p>
          </div>
          <span className="btn-primary rounded-xl bg-red-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-red-500/30 transition group-hover:bg-red-600">
            1930
          </span>
        </a>

        {/* Report Fraud to CyberCrime.gov.in */}
        <a
          href="https://www.cybercrime.gov.in"
          target="_blank"
          rel="noopener noreferrer"
          className="group glass-card flex flex-col gap-3 p-6 transition hover:ring-2 hover:ring-[var(--primary)]/50 sm:flex-row sm:items-center"
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/30">
            <Globe size={26} strokeWidth={2.4} />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-app">{t(lang, 'reportFraud')}</h3>
            <p className="mt-1 text-xs text-muted">{t(lang, 'reportFraudDesc')}</p>
          </div>
          <span className="btn-glow flex items-center gap-1.5 rounded-xl px-5 py-3 text-sm font-bold">
            <ExternalLink size={16} />
          </span>
        </a>
      </div>

      <div className="mt-8 space-y-3">
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <p className="text-xs font-medium text-red-500">{t(lang, 'urgentHelp')}</p>
        </div>
        <div className="rounded-xl border border-app bg-[var(--bg-surface)] p-4">
          <p className="text-xs text-muted">{t(lang, 'helplineNote')}</p>
        </div>
      </div>
    </div>
  );
}
