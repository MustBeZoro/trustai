'use client';
import { useRef, useState } from 'react';
import { ShieldCheck, ShieldAlert, Share2, ArrowLeft, AlertTriangle, FileSearch, Link2, Sparkles } from 'lucide-react';
import html2canvas from 'html2canvas';
import { RobotSVG, BouncingDots } from './Robot';
import type { AnalysisResult, UserProfile, Verdict } from '@/lib/types';

const VERDICT_CLASS: Record<Verdict, string> = {
  'Fraud/Scam': 'verdict-fraud',
  'Verified/Safe': 'verdict-safe',
  'Misleading': 'verdict-misleading',
  'Satire': 'verdict-satire',
  'Unverified': 'verdict-unverified',
};

const VERDICT_DESC: Record<Verdict, string> = {
  'Fraud/Scam': 'Likely malicious — do not engage or share.',
  'Verified/Safe': 'Backed by credible sources.',
  'Misleading': 'Partially true but distorted.',
  'Satire': 'Parody or humor — not real news.',
  'Unverified': 'No reliable sources found.',
};

function VerdictBadge({ verdict }: { verdict: Verdict }) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-bold ${VERDICT_CLASS[verdict]}`}>
      <span className="h-2 w-2 rounded-full bg-current" />
      {verdict}
    </span>
  );
}

function ProgressBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-semibold text-app">{label}</span>
        <span className="text-muted">{value}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--border-app)]">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: `${value}%`,
            background: 'linear-gradient(90deg, var(--primary), var(--accent))',
            boxShadow: '0 0 12px var(--primary-glow)',
          }}
        />
      </div>
    </div>
  );
}

function TrustScoreRing({ score }: { score: number }) {
  const r = 46;
  const c = 2 * Math.PI * r;
  const off = c - (score / 100) * c;
  const color = score >= 70 ? 'var(--success)' : score >= 40 ? 'var(--warning)' : 'var(--danger)';
  return (
    <div className="relative inline-flex h-32 w-32 items-center justify-center">
      <svg width="128" height="128" className="-rotate-90">
        <circle cx="64" cy="64" r={r} stroke="var(--border-app)" strokeWidth="8" fill="none" />
        <circle
          cx="64" cy="64" r={r}
          stroke={color}
          strokeWidth="8"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={off}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.2s ease-out', filter: 'drop-shadow(0 0 8px currentColor)' }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-3xl font-black text-app">{score}</div>
        <div className="text-[10px] uppercase tracking-wider text-muted">Trust</div>
      </div>
    </div>
  );
}

export default function VerificationEngine({
  user,
  onSaved,
  onBack,
}: {
  user: UserProfile | null;
  onSaved: (r: AnalysisResult) => void;
  onBack: () => void;
}) {
  const [input, setInput] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const shareRef = useRef<HTMLDivElement>(null);

  const analyze = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setAnalyzing(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Analysis failed.');
      setResult(data as AnalysisResult);
      onSaved(data as AnalysisResult);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setAnalyzing(false);
    }
  };

  const downloadCard = async () => {
    if (!shareRef.current) return;
    try {
      const canvas = await html2canvas(shareRef.current, { backgroundColor: null, scale: 2 });
      const link = document.createElement('a');
      link.download = `trustai-verdict-${result?.id ?? 'card'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch {
      alert('Could not generate card. Try again.');
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <button onClick={onBack} className="mb-6 flex items-center gap-1 text-sm text-muted hover:text-[var(--primary)]">
        <ArrowLeft size={16} /> Back
      </button>
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">Verification Engine</p>
        <h1 className="mt-1 text-3xl font-black text-app">Analyze content &amp; links</h1>
        <p className="mt-1 text-sm text-muted">
          Paste a suspicious message, email, or URL. TrustAI will cross-check it and explain what it finds.
        </p>
      </div>
      <div className="glass-card p-5">
        <label htmlFor="claim" className="mb-2 flex items-center gap-2 text-sm font-medium text-app">
          <Link2 size={16} /> Message or URL
        </label>
        <textarea
          id="claim"
          rows={5}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste a WhatsApp forward, suspicious email, or link here…"
          className="w-full resize-none rounded-xl border border-app bg-[var(--bg-surface)] px-4 py-3 text-sm text-app outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-soft)]"
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted">{input.length} chars</p>
          <div className="flex gap-2">
            {result && (
              <button
                onClick={() => {
                  setInput('');
                  setResult(null);
                  setError(null);
                }}
                className="btn-ghost rounded-xl px-4 py-2 text-sm"
              >
                Clear
              </button>
            )}
            <button
              onClick={analyze}
              disabled={!input.trim() || analyzing}
              className="btn-primary rounded-xl px-5 py-2.5 text-sm font-semibold"
            >
              {analyzing ? 'Analyzing…' : 'Analyze'}
            </button>
          </div>
        </div>
      </div>
      {analyzing && (
        <div className="glass-card mt-6 flex flex-col items-center gap-4 p-10 text-center">
          <RobotSVG waving size={110} />
          <p className="text-base font-semibold text-app">TrustAI is analyzing…</p>
          <BouncingDots />
        </div>
      )}
      {error && !analyzing && (
        <div className="mt-6 rounded-xl border border-[var(--danger)] bg-[var(--danger)]/10 p-4 text-sm text-[var(--danger)]">
          <strong>Error:</strong> {error}
        </div>
      )}
      {result && !analyzing && (
        <div className="mt-6 space-y-5 animate-fade-up">
          <div className="glass-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <VerdictBadge verdict={result.verdict} />
                <p className="mt-3 max-w-xl text-sm text-app">{result.summary}</p>
                <p className="mt-1 text-xs text-muted">{VERDICT_DESC[result.verdict]}</p>
              </div>
              <TrustScoreRing score={result.trustScore} />
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <ProgressBar label="Source Reliability" value={result.sourceReliability} />
              <ProgressBar label="Content Consistency" value={result.contentConsistency} />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-app px-3 py-1 text-xs font-semibold">
                Risk: <span className="text-[var(--danger)]">{result.riskLevel}</span>
              </span>
              <span className="text-xs text-muted">Analyzed {new Date(result.analyzedAt).toLocaleString()}</span>
            </div>
          </div>
          <div className="glass-card p-4">
            <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted">
              <Sparkles size={14} /> Verdict legend
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              {(Object.keys(VERDICT_CLASS) as Verdict[]).map((v) => (
                <span key={v} className={`rounded-full border px-3 py-1 font-semibold ${VERDICT_CLASS[v]}`}>
                  {v}
                </span>
              ))}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="glass-card p-5">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-app">
                <FileSearch size={16} /> Original Claim
              </h3>
              <p className="whitespace-pre-wrap text-sm text-app">{result.originalClaim}</p>
            </div>
            <div className="glass-card p-5">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-app">
                <AlertTriangle size={16} /> Sender Info
              </h3>
              <p className="whitespace-pre-wrap text-sm text-app">{result.senderInfo || 'Not available'}</p>
            </div>
            <div className="glass-card p-5">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-app">
                <ShieldAlert size={16} /> Tactics Used
              </h3>
              {result.tactics.length ? (
                <ul className="space-y-1.5">
                  {result.tactics.map((t) => (
                    <li key={t} className="flex items-start gap-2 text-sm text-app">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--warning)]" />
                      {t}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted">None detected.</p>
              )}
            </div>
            <div className="glass-card p-5">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-app">
                <Link2 size={16} /> Source References
              </h3>
              {result.sources.length ? (
                <ul className="space-y-2">
                  {result.sources.map((s, i) => (
                    <li key={i}>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex flex-col rounded-lg p-2 hover:bg-[var(--primary-soft)]"
                      >
                        <span className="text-xs font-semibold text-[var(--primary)]">{s.outlet}</span>
                        <span className="text-sm text-app group-hover:underline">{s.title}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted">No sources returned.</p>
              )}
            </div>
          </div>
          <div className="glass-card p-5">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-app">
              <ShieldCheck size={16} /> Detailed AI Explanation
            </h3>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-app">{result.detailedExplanation}</p>
          </div>
          <div className="flex justify-end">
            <button onClick={downloadCard} className="btn-glow flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold">
              <Share2 size={16} /> Download Summary Card
            </button>
          </div>
          <div style={{ position: 'fixed', left: '-99999px', top: 0 }}>
            <div
              ref={shareRef}
              style={{
                width: 480,
                padding: 24,
                background: 'linear-gradient(135deg, #6d28d9 0%, #a855f7 100%)',
                borderRadius: 20,
                color: 'white',
                fontFamily: 'Inter, system-ui, sans-serif',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.2)', display: 'grid', placeItems: 'center', fontWeight: 800 }}>T</div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>TrustAI Verdict</div>
                  <div style={{ fontSize: 11, opacity: 0.85 }}>{user?.name ? `For ${user.name}` : 'Analysis Report'}</div>
                </div>
              </div>
              <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 4 }}>Verdict</div>
              <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 10 }}>{result.verdict}</div>
              <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 4 }}>Trust Score</div>
              <div style={{ fontSize: 32, fontWeight: 900, marginBottom: 12 }}>{result.trustScore}%</div>
              <div style={{ fontSize: 13, lineHeight: 1.45, opacity: 0.95 }}>{result.summary}</div>
              <div style={{ marginTop: 16, fontSize: 10, opacity: 0.7 }}>© 2026 TrustAI · Team OffGrids</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}