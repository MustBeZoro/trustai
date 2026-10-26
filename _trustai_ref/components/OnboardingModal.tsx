'use client';
import { useState } from 'react';
import { RobotSVG } from './Robot';
import type { UserProfile } from '@/lib/types';

export default function OnboardingModal({
  onComplete,
}: {
  onComplete: (profile: UserProfile) => void;
}) {
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const canSubmit = name.trim().length > 0;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onComplete({ name: name.trim().slice(0, 40), dob });
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-up">
      <form onSubmit={submit} className="glass-card w-full max-w-md rounded-2xl p-7 shadow-2xl">
        <div className="mb-4 flex justify-center">
          <RobotSVG waving size={100} />
        </div>
        <h2 className="text-center text-xl font-bold text-app">Welcome to TrustAI</h2>
        <p className="mt-2 text-center text-sm text-muted">
          Hello! I am TrustAI, your digital safety companion. What should I call you?
        </p>
        <div className="mt-6 space-y-4">
          <div>
            <label htmlFor="ob-name" className="mb-1 block text-sm font-medium text-app">
              Your name
            </label>
            <input
              id="ob-name"
              type="text"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Roman"
              maxLength={40}
              className="w-full rounded-xl border border-app bg-[var(--bg-surface)] px-4 py-2.5 text-sm text-app outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-soft)]"
            />
          </div>
          <div>
            <label htmlFor="ob-dob" className="mb-1 block text-sm font-medium text-app">
              Date of birth (month / year)
            </label>
            <input
              id="ob-dob"
              type="month"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full rounded-xl border border-app bg-[var(--bg-surface)] px-4 py-2.5 text-sm text-app outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-soft)]"
            />
            <p className="mt-1 text-xs text-muted">Optional — helps tailor safety tips.</p>
          </div>
        </div>
        <button
          type="submit"
          disabled={!canSubmit}
          className="btn-primary mt-6 w-full rounded-xl px-4 py-3 text-sm font-semibold"
        >
          Let&apos;s Get Started
        </button>
        <p className="mt-3 text-center text-[11px] text-muted">
          Stored only on your device. Never sent to our servers.
        </p>
      </form>
    </div>
  );
}