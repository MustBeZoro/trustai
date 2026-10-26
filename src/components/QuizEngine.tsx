import { useCallback, useEffect, useState } from 'react';
import { Loader2, CheckCircle2, XCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { RobotSVG } from './Robot';
import type { LanguageCode, QuizQuestion } from '@/lib/types';
import { t } from '@/lib/i18n';

const LEVEL_SIZE = 5;
const API_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/trustai-quiz`;
const API_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

function CircularProgress({ percentage, lang }: { percentage: number; lang: LanguageCode }) {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setPct(percentage), 120);
    return () => clearTimeout(t);
  }, [percentage]);
  const r = 62;
  const c = 2 * Math.PI * r;
  const off = c - (pct / 100) * c;
  return (
    <div className="relative inline-flex">
      <svg width="170" height="170" className="-rotate-90">
        <circle cx="85" cy="85" r={r} stroke="var(--border-app)" strokeWidth="10" fill="none" />
        <circle
          cx="85"
          cy="85"
          r={r}
          stroke="var(--primary)"
          strokeWidth="10"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={off}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.1s ease-out', filter: 'drop-shadow(0 0 10px var(--primary-glow))' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-black text-app">{pct}%</span>
        <span className="text-[10px] uppercase tracking-wider text-muted">{t(lang, 'score')}</span>
      </div>
    </div>
  );
}

function scoreMessage(pct: number, lang: LanguageCode): string {
  if (pct === 100) return t(lang, 'brilliant');
  if (pct >= 80) return t(lang, 'great');
  if (pct >= 60) return t(lang, 'nice');
  return t(lang, 'keepPracticing');
}

export default function QuizEngine({ lang, onBack }: { lang: LanguageCode; onBack: () => void }) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [level, setLevel] = useState(1);
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [showLevelResult, setShowLevelResult] = useState(false);
  const [allComplete, setAllComplete] = useState(false);

  const fetchQuiz = useCallback(async () => {
    setLoading(true);
    setError(null);
    setQuestions([]);
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          Apikey: API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ language: lang }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to load quiz.');
      if (!Array.isArray(data.questions) || data.questions.length < LEVEL_SIZE) {
        throw new Error('Incomplete quiz received.');
      }
      setQuestions(data.questions);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Quiz failed to load.');
    } finally {
      setLoading(false);
    }
  }, [lang]);

  useEffect(() => {
    fetchQuiz();
  }, [fetchQuiz]);

  const resetForNewLevel = () => {
    setQIndex(0);
    setSelected(null);
    setAnswered(false);
    setCorrectCount(0);
    setShowLevelResult(false);
  };

  const handleSelect = (idx: number) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    const q = questions[(level - 1) * LEVEL_SIZE + qIndex];
    if (q && idx === q.correctIndex) {
      setCorrectCount((c) => c + 1);
    }
  };

  const handleNext = () => {
    if (qIndex < LEVEL_SIZE - 1) {
      setQIndex((i) => i + 1);
      setSelected(null);
      setAnswered(false);
    } else {
      setShowLevelResult(true);
    }
  };

  const handleNextLevel = () => {
    if (level < 3) {
      setLevel((l) => l + 1);
      resetForNewLevel();
    } else {
      setAllComplete(true);
      setShowLevelResult(false);
    }
  };

  const restart = () => {
    setLevel(1);
    resetForNewLevel();
    setAllComplete(false);
    fetchQuiz();
  };

  if (loading) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-16 text-center">
        <RobotSVG waving size={130} />
        <p className="mt-4 text-lg font-bold text-app">{t(lang, 'quizPreparing')}</p>
        <p className="mt-1 text-sm text-muted">{t(lang, 'quizGenerating')}</p>
        <Loader2 className="mt-4 animate-spin text-[var(--primary)]" size={28} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <XCircle className="mx-auto text-[var(--danger)]" size={48} />
        <h2 className="mt-4 text-xl font-bold text-app">{t(lang, 'quizLoadError')}</h2>
        <p className="mt-1 text-sm text-muted">{error}</p>
        <button onClick={fetchQuiz} className="btn-primary mt-6 rounded-xl px-5 py-2.5 text-sm font-semibold">
          {t(lang, 'retry')}
        </button>
      </div>
    );
  }

  if (allComplete) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center animate-fade-up">
        <div className="flex justify-center">
          <RobotSVG waving size={140} />
        </div>
        <h2 className="mt-6 text-3xl font-black text-app">{t(lang, 'congratulations')}</h2>
        <p className="mt-2 text-sm text-muted">{t(lang, 'freshChallenge')}</p>
        <button onClick={restart} className="btn-glow mt-8 rounded-xl px-6 py-3 text-sm font-bold">
          {t(lang, 'generateMore')}
        </button>
      </div>
    );
  }

  if (showLevelResult) {
    const pct = Math.round((correctCount / LEVEL_SIZE) * 100);
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center animate-fade-up">
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">{t(lang, 'level')} {level} · {t(lang, 'levelComplete')}</p>
        <h2 className="mt-1 text-2xl font-black text-app">{t(lang, 'howDid')}</h2>
        <div className="mt-8 flex justify-center">
          <CircularProgress percentage={pct} lang={lang} />
        </div>
        <p className="mt-6 text-base font-medium text-app">{scoreMessage(pct, lang)}</p>
        <p className="mt-1 text-sm text-muted">
          {correctCount} / {LEVEL_SIZE} {t(lang, 'correctCount')}
        </p>
        <button onClick={handleNextLevel} className="btn-primary mt-8 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold">
          {level < 3 ? `${t(lang, 'nextQuestion')} ${level + 1}` : t(lang, 'finish')} <ArrowRight size={16} />
        </button>
      </div>
    );
  }

  const question = questions[(level - 1) * LEVEL_SIZE + qIndex];
  if (!question) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="text-sm text-muted">{t(lang, 'questionUnavailable')}</p>
        <button onClick={restart} className="btn-primary mt-4 rounded-xl px-5 py-2.5 text-sm">
          {t(lang, 'restart')}
        </button>
      </div>
    );
  }

  const progressInLevel = ((qIndex + (answered ? 1 : 0)) / LEVEL_SIZE) * 100;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <button onClick={onBack} className="mb-6 flex items-center gap-1 text-sm text-muted hover:text-[var(--primary)]">
        <ArrowLeft size={16} /> {t(lang, 'back')}
      </button>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
            {t(lang, 'level')} {level} · {t(lang, 'question')} {qIndex + 1} / {LEVEL_SIZE}
          </p>
          <p className="text-xs text-muted">{t(lang, 'levelScore')}: {correctCount}</p>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--border-app)]">
          <div
            className="h-full rounded-full bg-[var(--primary)] transition-all duration-500"
            style={{ width: `${progressInLevel}%`, boxShadow: '0 0 10px var(--primary-glow)' }}
          />
        </div>
      </div>
      <div className="glass-card p-6">
        <div className="mb-3 flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--primary-soft)] text-xs font-bold text-[var(--primary)]">
            {qIndex + 1}
          </span>
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">{question.topic ?? t(lang, 'sampleMessage')}</span>
        </div>
        <blockquote className="rounded-xl border-l-4 border-[var(--primary)] bg-[var(--bg-surface)] p-4 text-sm italic text-app">
          {question.message}
        </blockquote>
        <p className="mt-5 text-sm font-semibold text-app">{t(lang, 'biggestWarning')}</p>
        <div className="mt-3 space-y-2">
          {question.choices.map((choice, ci) => {
            const isSelected = selected === ci;
            const isCorrect = ci === question.correctIndex;
            let cls = 'flex w-full items-start gap-3 rounded-xl border p-3 text-left text-sm transition ';
            if (!answered) {
              cls += isSelected
                ? 'border-[var(--primary)] bg-[var(--primary-soft)] text-app'
                : 'border-app hover:border-[var(--primary)] hover:bg-[var(--primary-soft)] text-app';
            } else if (isSelected) {
              cls += isCorrect ? 'border-[var(--success)] text-app' : 'border-[var(--danger)] text-app';
            } else if (isCorrect) {
              cls += 'border-[var(--success)] text-app';
            } else {
              cls += 'border-app text-muted';
            }
            return (
              <button key={ci} type="button" disabled={answered} onClick={() => handleSelect(ci)} className={cls}>
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border border-current text-[10px] font-bold">
                  {String.fromCharCode(65 + ci)}
                </span>
                <span className="flex-1">{choice}</span>
                {answered && isSelected && (
                  isCorrect ? <CheckCircle2 size={18} className="text-[var(--success)]" /> : <XCircle size={18} className="text-[var(--danger)]" />
                )}
              </button>
            );
          })}
        </div>
        {answered && (
          <div className="mt-4 rounded-xl border border-app bg-[var(--bg-surface)] p-4 animate-fade-up">
            <p className="mb-1 flex items-center gap-2 text-sm font-bold text-app">
              {selected === question.correctIndex ? (
                <><CheckCircle2 size={16} className="text-[var(--success)]" /> {t(lang, 'correct')}</>
              ) : (
                <><XCircle size={16} className="text-[var(--danger)]" /> {t(lang, 'notQuite')}</>
              )}
            </p>
            <p className="text-sm text-app">{question.explanation}</p>
            <div className="mt-4 flex justify-end">
              <button onClick={handleNext} className="btn-primary inline-flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold">
                {qIndex < LEVEL_SIZE - 1 ? t(lang, 'nextQuestion') : t(lang, 'seeResults')} <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
