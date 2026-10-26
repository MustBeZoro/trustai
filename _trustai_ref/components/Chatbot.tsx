'use client';
import { useEffect, useRef, useState } from 'react';
import { MessageCircle, X, Send, Loader2, ShieldCheck } from 'lucide-react';
import type { ChatMessage, UserProfile } from '@/lib/types';

export default function Chatbot({
  user,
  open,
  onOpenChange,
}: {
  user: UserProfile | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const greeting = user?.name
    ? `Hi ${user.name}! How can I keep you safe today?`
    : 'Hi there! How can I keep you safe today?';

  useEffect(() => {
    if (user?.name && messages.length === 0) {
      setMessages([{ role: 'assistant', text: greeting }]);
    }
  }, [user?.name, greeting, messages.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sending, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    const history = messages;
    setMessages((m) => [...m, { role: 'user', text }]);
    setInput('');
    setSending(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          userName: user?.name ?? 'friend',
          history,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Chat failed.');
      setMessages((m) => [...m, { role: 'assistant', text: data.reply }]);
    } catch (e: unknown) {
      setMessages((m) => [...m, { role: 'assistant', text: 'Error: ' + (e instanceof Error ? e.message : 'Something went wrong.') }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => onOpenChange(true)}
          aria-label="Chat with TrustAI"
          className="btn-glow pulse-ring fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full px-5 py-3.5 text-sm font-bold shadow-2xl"
        >
          <MessageCircle size={20} />
          <span className="hidden sm:inline">Chat with TrustAI</span>
        </button>
      )}
      {open && (
        <div className="fixed bottom-4 right-4 z-50 flex h-[540px] w-[min(400px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl chat-window animate-fade-up">
          <div className="flex items-center justify-between border-b border-[var(--border-app)] px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-white">
                <ShieldCheck className="h-4 w-4" strokeWidth={2.5} />
              </span>
              <div>
                <p className="text-sm font-bold text-app">TrustAI</p>
                <p className="text-[10px] text-muted">Your safety companion</p>
              </div>
            </div>
            <button onClick={() => onOpenChange(false)} className="btn-ghost flex h-8 w-8 items-center justify-center rounded-lg">
              <X size={16} />
            </button>
          </div>
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'ml-auto bg-[var(--primary)] text-white'
                    : 'bg-[var(--bg-surface-solid)] text-app border border-[var(--border-app)]'
                }`}
              >
                {m.text}
              </div>
            ))}
            {sending && (
              <div className="flex items-center gap-2 text-xs text-muted">
                <Loader2 size={14} className="animate-spin" /> TrustAI is typing…
              </div>
            )}
          </div>
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
                placeholder={user?.name ? `Ask anything, ${user.name}…` : 'Ask anything…'}
                className="flex-1 rounded-xl border border-[var(--border-app)] bg-[var(--bg-surface-solid)] px-3 py-2.5 text-sm text-app outline-none focus:border-[var(--primary)]"
              />
              <button
                onClick={send}
                disabled={sending || !input.trim()}
                aria-label="Send"
                className="btn-primary grid h-10 w-10 place-items-center rounded-xl"
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