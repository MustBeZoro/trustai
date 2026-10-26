import { useCallback, useEffect, useRef, useState } from 'react';
import { Shield, GraduationCap, ShieldCheck, Sparkles, MessageSquare, Trash2, ArrowRight, Plus } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Sidebar, { type View } from '@/components/Sidebar';
import OnboardingModal from '@/components/OnboardingModal';
import VerificationEngine from '@/components/VerificationEngine';
import QuizEngine from '@/components/QuizEngine';
import Chatbot from '@/components/Chatbot';
import HelplinesPage from '@/components/HelplinesPage';
import { RobotSVG } from '@/components/Robot';
import type { AnalysisResult, ChatSession, Theme, UserProfile } from '@/lib/types';
import type { LanguageCode, PaletteColor } from '@/lib/types';
import { t, LANGUAGES, DEFAULT_LANGUAGE } from '@/lib/i18n';

const KEY_USER = 'trustai_user';
const KEY_THEME = 'trustai_theme';
const KEY_HISTORY = 'trustai_history';
const KEY_ONBOARDED = 'trustai_onboarded';
const KEY_CHAT_SESSIONS = 'trustai_chat_sessions';
const KEY_LANG = 'trustai_lang';
const KEY_PALETTE = 'trustai_palette';
const KEY_PALETTE_MANUAL = 'trustai_palette_manual';

function App() {
  const [theme, setTheme] = useState<Theme>('default');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [view, setView] = useState<View>('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [language, setLanguage] = useState<LanguageCode>(DEFAULT_LANGUAGE);
  const [palette, setPalette] = useState<PaletteColor>('purple');
  const paletteManual = useRef(false);

  useEffect(() => {
    try {
      const th = (localStorage.getItem(KEY_THEME) as Theme) || 'default';
      if (th === 'default' || th === 'dark' || th === 'cyber') setTheme(th);
      const rawUser = localStorage.getItem(KEY_USER);
      if (rawUser) setUser(JSON.parse(rawUser));
      const rawHistory = localStorage.getItem(KEY_HISTORY);
      if (rawHistory) setHistory(JSON.parse(rawHistory));
      const onboarded = localStorage.getItem(KEY_ONBOARDED);
      if (!rawUser && !onboarded) setShowOnboarding(true);
      const rawChatSessions = localStorage.getItem(KEY_CHAT_SESSIONS);
      if (rawChatSessions) setChatSessions(JSON.parse(rawChatSessions) as ChatSession[]);
      const savedLang = localStorage.getItem(KEY_LANG) as LanguageCode | null;
      if (savedLang && LANGUAGES.some((l) => l.code === savedLang)) {
        setLanguage(savedLang);
        const meta = LANGUAGES.find((l) => l.code === savedLang);
        if (meta) setPalette(meta.palette);
      }
      const savedPalette = localStorage.getItem(KEY_PALETTE) as PaletteColor | null;
      if (savedPalette) {
        setPalette(savedPalette);
        paletteManual.current = localStorage.getItem(KEY_PALETTE_MANUAL) === '1';
      }
    } catch {
      // localStorage not available
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-palette', palette);
    try {
      localStorage.setItem(KEY_THEME, theme);
      localStorage.setItem(KEY_PALETTE, palette);
    } catch {
      // ignore
    }
  }, [theme, palette, hydrated]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [view]);

  const handleLanguageChange = (lang: LanguageCode) => {
    setLanguage(lang);
    try {
      localStorage.setItem(KEY_LANG, lang);
    } catch {
      // ignore
    }
    if (!paletteManual.current) {
      const meta = LANGUAGES.find((l) => l.code === lang);
      if (meta) setPalette(meta.palette);
    }
  };

  const handlePaletteChange = (c: PaletteColor) => {
    setPalette(c);
    paletteManual.current = true;
    try {
      localStorage.setItem(KEY_PALETTE, c);
      localStorage.setItem(KEY_PALETTE_MANUAL, '1');
    } catch {
      // ignore
    }
  };

  const handleOnboard = (profile: UserProfile) => {
    setUser(profile);
    try {
      localStorage.setItem(KEY_USER, JSON.stringify(profile));
      localStorage.setItem(KEY_ONBOARDED, '1');
    } catch {
      // ignore
    }
    setShowOnboarding(false);
  };

  const handleSaveAnalysis = useCallback((r: AnalysisResult) => {
    setHistory((prev) => {
      const next = [r, ...prev].slice(0, 25);
      try {
        localStorage.setItem(KEY_HISTORY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const clearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(KEY_HISTORY);
    } catch {
      // ignore
    }
  };

  const deleteChatSession = (id: string) => {
    const next = chatSessions.filter((s) => s.id !== id);
    setChatSessions(next);
    try {
      localStorage.setItem(KEY_CHAT_SESSIONS, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const tr = (key: string) => t(language, key);

  const renderChatHistory = () => (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-app">{tr('chatHistory')}</h1>
          <p className="text-sm text-muted">{tr('chatHistorySub')}</p>
        </div>
        <button
          onClick={() => {
            setChatOpen(true);
            setView('home');
          }}
          className="btn-glow flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold"
        >
          <Plus size={14} /> {tr('newChat')}
        </button>
      </div>
      {chatSessions.length === 0 ? (
        <div className="glass-card mt-6 p-10 text-center">
          <MessageSquare className="mx-auto text-[var(--primary)]" size={36} />
          <p className="mt-4 text-sm text-muted">{tr('noChatHistory')}</p>
          <button
            onClick={() => {
              setChatOpen(true);
              setView('home');
            }}
            className="btn-primary mt-4 rounded-xl px-4 py-2 text-sm font-semibold"
          >
            {tr('startChatting')}
          </button>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {chatSessions.map((s) => (
            <div key={s.id} className="glass-card group p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <MessageSquare className="text-[var(--primary)]" size={16} />
                  <span className="text-sm font-bold text-app">{s.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted">{new Date(s.updatedAt).toLocaleString()}</span>
                  <button
                    onClick={() => deleteChatSession(s.id)}
                    aria-label="Delete chat session"
                    className="opacity-0 transition group-hover:opacity-100 btn-ghost flex h-8 w-8 items-center justify-center rounded-lg"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <p className="mt-2 line-clamp-2 text-xs text-muted">
                {s.messages.filter((m) => m.role === 'user').length} {tr('messages')}
              </p>
              <button
                onClick={() => {
                  setChatOpen(true);
                  setView('home');
                }}
                className="btn-ghost mt-3 flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold"
              >
                {tr('loadConversation')} <ArrowRight size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderHome = () => (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <div className="text-center animate-fade-up">
        <div className="mx-auto mb-4 flex justify-center">
          <RobotSVG waving size={120} lang={language} />
        </div>
        <p className="text-xs font-bold uppercase tracking-widest text-[var(--primary)]">{tr('welcomeTitle')}</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-app sm:text-5xl">
          {tr('welcomeName')}{user?.name ? `, ${user.name}` : ''}.
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-base text-muted">{tr('welcomeMsg')}</p>
      </div>
      <div className="mt-12 flex flex-col items-center gap-4">
        <button
          onClick={() => setView('verify')}
          className="btn-glow flex w-full max-w-md items-center justify-center gap-3 rounded-2xl px-6 py-5 text-base font-bold"
        >
          <Shield size={22} />
          {tr('analyzeBtn')}
        </button>
        <button
          onClick={() => setView('quiz')}
          className="btn-glow flex w-full max-w-md items-center justify-center gap-3 rounded-2xl px-6 py-5 text-base font-bold"
        >
          <GraduationCap size={22} />
          {tr('trainBtn')}
        </button>
      </div>
      <div className="mt-16 grid gap-4 sm:grid-cols-3">
        {[
          { Icon: ShieldCheck, title: tr('feat1Title'), text: tr('feat1Text') },
          { Icon: Sparkles, title: tr('feat2Title'), text: tr('feat2Text') },
          { Icon: GraduationCap, title: tr('feat3Title'), text: tr('feat3Text') },
        ].map(({ Icon, title, text }) => (
          <div key={title} className="glass-card p-5">
            <Icon className="text-[var(--primary)]" size={22} />
            <h3 className="mt-3 text-sm font-bold text-app">{title}</h3>
            <p className="mt-1 text-xs text-muted">{text}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-app">{tr('analysisHistory')}</h1>
          <p className="text-sm text-muted">{tr('analysisHistorySub')}</p>
        </div>
        {history.length > 0 && (
          <button onClick={clearHistory} className="btn-ghost rounded-xl px-3 py-2 text-xs font-semibold">
            {tr('clear')}
          </button>
        )}
      </div>
      {history.length === 0 ? (
        <div className="glass-card mt-6 p-10 text-center">
          <p className="text-sm text-muted">{tr('noAnalysisHistory')}</p>
          <button onClick={() => setView('verify')} className="btn-primary mt-4 rounded-xl px-4 py-2 text-sm font-semibold">
            {tr('analyzeBtn')}
          </button>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {history.map((r) => {
            const color =
              r.verdict === 'Fraud/Scam'
                ? 'var(--danger)'
                : r.verdict === 'Verified/Safe'
                  ? 'var(--success)'
                  : r.verdict === 'Misleading'
                    ? 'var(--warning)'
                    : r.verdict === 'Satire'
                      ? 'var(--info)'
                      : 'var(--muted)';
            return (
              <div key={r.id} className="glass-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="rounded-full border px-3 py-1 text-xs font-bold" style={{ borderColor: color, color }}>
                    {r.verdict}
                  </span>
                  <span className="text-xs text-muted">{new Date(r.analyzedAt).toLocaleString()}</span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-app">{r.summary}</p>
                <p className="mt-1 text-xs text-muted">Trust score: {r.trustScore}% · Risk: {r.riskLevel}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderAbout = () => (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-black text-app">{tr('aboutTitle')}</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">{tr('aboutDesc')}</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="glass-card p-5">
          <h3 className="text-sm font-bold text-app">{tr('privacyFirst')}</h3>
          <p className="mt-1 text-xs text-muted">{tr('privacyFirstDesc')}</p>
        </div>
        <div className="glass-card p-5">
          <h3 className="text-sm font-bold text-app">{tr('aiPowered')}</h3>
          <p className="mt-1 text-xs text-muted">{tr('aiPoweredDesc')}</p>
        </div>
        <div className="glass-card p-5">
          <h3 className="text-sm font-bold text-app">{tr('learnLevelUp')}</h3>
          <p className="mt-1 text-xs text-muted">{tr('learnLevelUpDesc')}</p>
        </div>
        <div className="glass-card p-5">
          <h3 className="text-sm font-bold text-app">{tr('teamOffGrids')}</h3>
          <p className="mt-1 text-xs text-muted">{tr('teamOffGridsDesc')}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-app-gradient">
      <Navbar
        theme={theme}
        onThemeChange={setTheme}
        onMenuClick={() => setSidebarOpen(true)}
        onLogoClick={() => setView('home')}
        language={language}
        onLanguageChange={handleLanguageChange}
        palette={palette}
        onPaletteChange={handlePaletteChange}
      />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onNavigate={(v) => setView(v)} lang={language} />
      <main className="min-h-[calc(100vh-160px)]">
        {view === 'home' && renderHome()}
        {view === 'verify' && (
          <VerificationEngine user={user} lang={language} onSaved={handleSaveAnalysis} onBack={() => setView('home')} />
        )}
        {view === 'quiz' && <QuizEngine lang={language} onBack={() => setView('home')} />}
        {view === 'helplines' && <HelplinesPage lang={language} />}
        {view === 'history' && renderHistory()}
        {view === 'chat-history' && renderChatHistory()}
        {view === 'about' && renderAbout()}
      </main>
      <footer className="border-t border-app py-6 text-center text-xs text-muted">
        © 2026 TrustAI. {tr('teamOffGrids')}
      </footer>
      {showOnboarding && <OnboardingModal onComplete={handleOnboard} lang={language} />}
      <Chatbot user={user} open={chatOpen} onOpenChange={setChatOpen} lang={language} />
    </div>
  );
}

export default App;
