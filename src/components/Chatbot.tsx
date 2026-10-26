import { useCallback, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MessageCircle, X, Send, Loader2, ShieldCheck, Maximize2, Minimize2, Plus, Trash2, MessageSquare } from 'lucide-react';
import type { ChatMessage, ChatSession, UserProfile, LanguageCode } from '@/lib/types';
import { t } from '@/lib/i18n';

const API_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/trustai-chat`;
const KEY_SESSIONS = 'trustai_chat_sessions';
const KEY_FONTSIZE = 'trustai_chat_fontsize';

const FONT_MIN = 12;
const FONT_MAX = 22;

function loadSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem(KEY_SESSIONS);
    if (raw) return JSON.parse(raw) as ChatSession[];
  } catch {
    // ignore
  }
  return [];
}

function saveSessions(sessions: ChatSession[]) {
  try {
    localStorage.setItem(KEY_SESSIONS, JSON.stringify(sessions));
  } catch {
    // ignore
  }
}

function loadFontSize(): number {
  try {
    const raw = localStorage.getItem(KEY_FONTSIZE);
    if (raw) {
      const n = Number(raw);
      if (!isNaN(n) && n >= FONT_MIN && n <= FONT_MAX) return n;
    }
  } catch {
    // ignore
  }
  return 14;
}

function newSessionId(): string {
  return `S-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function titleFromFirstMessage(text: string): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length > 42 ? clean.slice(0, 42) + '…' : clean || 'New chat';
}

export default function Chatbot({
  user,
  open,
  onOpenChange,
  lang,
}: {
  user: UserProfile | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  lang: LanguageCode;
}) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [showSessionList, setShowSessionList] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSessions(loadSessions());
    setFontSize(loadFontSize());
  }, []);

  useEffect(() => {
    if (!activeSessionId && sessions.length > 0) {
      setActiveSessionId(sessions[0].id);
    }
  }, [sessions, activeSessionId]);

  const activeSession = sessions.find((s) => s.id === activeSessionId) ?? null;
  const messages = activeSession?.messages ?? [];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sending, open, activeSessionId]);

  const updateSessions = useCallback((next: ChatSession[]) => {
    setSessions(next);
    saveSessions(next);
  }, []);

  const createSession = () => {
    const greeting = user?.name
      ? `Hi ${user.name}! How can I keep you safe today?`
      : 'Hi there! How can I keep you safe today?';
    const session: ChatSession = {
      id: newSessionId(),
      title: 'New chat',
      messages: [{ role: 'assistant', text: greeting }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    updateSessions([session, ...sessions]);
    setActiveSessionId(session.id);
    setShowSessionList(false);
  };

  const deleteSession = (id: string) => {
    const next = sessions.filter((s) => s.id !== id);
    updateSessions(next);
    if (activeSessionId === id) {
      setActiveSessionId(next.length > 0 ? next[0].id : null);
    }
  };

  const send = async () => {
    const text = input.trim();
    if (!text || sending || !activeSession) return;
    const userMsg: ChatMessage = { role: 'user', text };
    const isFirstUserMessage = activeSession.messages.filter((m) => m.role === 'user').length === 0;
    const updatedMessages = [...activeSession.messages, userMsg];
    const updatedSession: ChatSession = {
      ...activeSession,
      messages: updatedMessages,
      title: isFirstUserMessage ? titleFromFirstMessage(text) : activeSession.title,
      updatedAt: new Date().toISOString(),
    };
    updateSessions(sessions.map((s) => (s.id === activeSession.id ? updatedSession : s)));
    setInput('');
    setSending(true);
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          userName: user?.name ?? 'friend',
          history: activeSession.messages,
          language: lang,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Chat failed.');
      const replyMsg: ChatMessage = { role: 'assistant', text: data.reply };
      const sessionWithReply: ChatSession = {
        ...updatedSession,
        messages: [...updatedMessages, replyMsg],
        updatedAt: new Date().toISOString(),
      };
      updateSessions(sessions.map((s) => (s.id === activeSession.id ? sessionWithReply : s)));
    } catch (e: unknown) {
      const errMsg: ChatMessage = {
        role: 'assistant',
        text: 'Error: ' + (e instanceof Error ? e.message : 'Something went wrong.'),
      };
      const sessionWithError: ChatSession = {
        ...updatedSession,
        messages: [...updatedMessages, errMsg],
        updatedAt: new Date().toISOString(),
      };
      updateSessions(sessions.map((s) => (s.id === activeSession.id ? sessionWithError : s)));
    } finally {
      setSending(false);
    }
  };

  const changeFontSize = (delta: number) => {
    setFontSize((prev) => {
      const next = Math.max(FONT_MIN, Math.min(FONT_MAX, prev + delta));
      try {
        localStorage.setItem(KEY_FONTSIZE, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const containerClass = expanded
    ? 'fixed inset-0 z-50 flex flex-col overflow-hidden chat-window animate-fade-up'
    : 'fixed bottom-4 right-4 z-50 flex h-[540px] w-[min(400px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl chat-window animate-fade-up';

  return (
    <>
      {!open && (
        <button
          onClick={() => onOpenChange(true)}
          aria-label="Chat with TrustAI"
          className="btn-glow pulse-ring fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full px-5 py-3.5 text-sm font-bold shadow-2xl"
        >
          <MessageCircle size={20} />
          <span className="hidden sm:inline">{t(lang, 'chatWithTrustAI')}</span>
        </button>
      )}
      {open && (
        <div className={containerClass}>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--border-app)] px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-white">
                <ShieldCheck className="h-4 w-4" strokeWidth={2.5} />
              </span>
              <div>
                <p className="text-sm font-bold text-app">TrustAI</p>
                <p className="text-[10px] text-muted">{activeSession?.title ?? t(lang, 'chatNoActive')}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowSessionList((s) => !s)}
                aria-label={t(lang, 'chatSessionList')}
                className="btn-ghost flex h-8 w-8 items-center justify-center rounded-lg"
              >
                <MessageSquare size={16} />
              </button>
              <button
                onClick={() => changeFontSize(-1)}
                aria-label="Decrease font size"
                disabled={fontSize <= FONT_MIN}
                className="btn-ghost flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold disabled:opacity-40"
              >
                A−
              </button>
              <button
                onClick={() => changeFontSize(1)}
                aria-label="Increase font size"
                disabled={fontSize >= FONT_MAX}
                className="btn-ghost flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold disabled:opacity-40"
              >
                A+
              </button>
              <button
                onClick={() => setExpanded((e) => !e)}
                aria-label={expanded ? t(lang, 'chatCollapse') : t(lang, 'chatExpand')}
                className="btn-ghost flex h-8 w-8 items-center justify-center rounded-lg"
              >
                {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
              <button onClick={() => onOpenChange(false)} className="btn-ghost flex h-8 w-8 items-center justify-center rounded-lg">
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Session list drawer */}
            {showSessionList && (
              <div className="flex w-56 shrink-0 flex-col border-r border-[var(--border-app)] bg-[var(--bg-surface)]">
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-muted">{t(lang, 'sessions')}</span>
                  <button
                    onClick={createSession}
                    aria-label={t(lang, 'chatNewSession')}
                    className="btn-ghost flex h-7 w-7 items-center justify-center rounded-lg"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <div className="flex-1 space-y-1 overflow-y-auto px-2 pb-2">
                  {sessions.length === 0 && (
                    <p className="px-2 py-4 text-center text-[11px] text-muted">{t(lang, 'noSessions')}</p>
                  )}
                  {sessions.map((s) => (
                    <div
                      key={s.id}
                      className={`group flex items-center gap-2 rounded-lg px-2 py-2 transition ${
                        s.id === activeSessionId ? 'bg-[var(--primary-soft)]' : 'hover:bg-[var(--primary-soft)]'
                      }`}
                    >
                      <button
                        onClick={() => {
                          setActiveSessionId(s.id);
                          setShowSessionList(false);
                        }}
                        className="flex-1 truncate text-left text-xs font-medium text-app"
                      >
                        {s.title}
                      </button>
                      <button
                        onClick={() => deleteSession(s.id)}
                        aria-label="Delete session"
                        className="opacity-0 transition group-hover:opacity-100 btn-ghost flex h-6 w-6 items-center justify-center rounded-md shrink-0"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
              {messages.length === 0 && (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                  <p className="text-sm text-muted">{t(lang, 'chatStart')}</p>
                  <button onClick={createSession} className="btn-primary rounded-xl px-4 py-2 text-xs font-semibold">
                    {t(lang, 'newChat')}
                  </button>
                </div>
              )}
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed ${
                    m.role === 'user'
                      ? 'ml-auto bg-[var(--primary)] text-white'
                      : 'bg-[var(--bg-surface-solid)] text-app border border-[var(--border-app)]'
                  }`}
                  style={{ fontSize: `${fontSize}px` }}
                >
                  {m.role === 'user' ? (
                    m.text
                  ) : (
                    <div className="chat-markdown">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                          ul: ({ children }) => <ul className="mb-2 list-disc pl-5">{children}</ul>,
                          ol: ({ children }) => <ol className="mb-2 list-decimal pl-5">{children}</ol>,
                          li: ({ children }) => <li className="mb-1">{children}</li>,
                          strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                          em: ({ children }) => <em className="italic">{children}</em>,
                          a: ({ children, href }) => (
                            <a href={href} target="_blank" rel="noopener noreferrer" className="underline">
                              {children}
                            </a>
                          ),
                          code: ({ children }) => (
                            <code className="rounded bg-[var(--bg-surface)] px-1.5 py-0.5 text-[0.85em] font-mono">
                              {children}
                            </code>
                          ),
                          pre: ({ children }) => (
                            <pre className="mb-2 overflow-x-auto rounded-lg bg-[var(--bg-surface)] p-3 text-[0.85em]">
                              {children}
                            </pre>
                          ),
                          blockquote: ({ children }) => (
                            <blockquote className="mb-2 border-l-2 border-[var(--primary)] pl-3 italic">
                              {children}
                            </blockquote>
                          ),
                          h1: ({ children }) => <h1 className="mb-2 text-base font-bold">{children}</h1>,
                          h2: ({ children }) => <h2 className="mb-2 text-sm font-bold">{children}</h2>,
                          h3: ({ children }) => <h3 className="mb-2 text-sm font-bold">{children}</h3>,
                        }}
                      >
                        {m.text}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              ))}
              {sending && (
                <div className="flex items-center gap-2 text-xs text-muted">
                  <Loader2 size={14} className="animate-spin" /> {t(lang, 'chatTyping')}
                </div>
              )}
            </div>
          </div>

          {/* Input */}
          <div className="border-t border-[var(--border-app)] p-3">
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder={user?.name ? `${t(lang, 'chatAsk')}, ${user.name}…` : `${t(lang, 'chatAsk')}…`}
                className="flex-1 rounded-xl border border-[var(--border-app)] bg-[var(--bg-surface-solid)] px-3 py-2.5 text-sm text-app outline-none focus:border-[var(--primary)]"
              />
              <button
                onClick={send}
                disabled={sending || !input.trim() || !activeSession}
                aria-label={t(lang, 'chatSend')}
                className="btn-primary grid h-10 w-10 place-items-center rounded-xl disabled:opacity-40"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
