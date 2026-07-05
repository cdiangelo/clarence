'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';

type Step = 'email' | 'login' | 'register';

export default function AuthPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleEmailContinue(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) { setError('Enter a valid email'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/me', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = await res.json();
      setEmail(trimmed);
      setStep(data.exists ? 'login' : 'register');
    } catch {
      setError('Connection error — try again');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (pin.length !== 5) { setError('PIN must be 5 digits'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, pin }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Login failed'); return; }
      setUser(data.user);
      router.replace('/');
    } catch {
      setError('Connection error — try again');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim()) { setError('Enter your name'); return; }
    if (pin.length !== 5) { setError('PIN must be 5 digits'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, pin, displayName: displayName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Registration failed'); return; }
      setUser(data.user);
      router.replace('/');
    } catch {
      setError('Connection error — try again');
    } finally {
      setLoading(false);
    }
  }

  function handlePinInput(val: string) {
    if (/^\d{0,5}$/.test(val)) setPin(val);
  }

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="font-display text-4xl tracking-widest text-turf mb-1">CLARENCE</div>
          <p className="text-sm text-ink-soft">Your personal golf advisor</p>
        </div>

        <div className="bg-card border border-border rounded-2xl shadow-elevated p-6">

          {/* Step 1: Email */}
          {step === 'email' && (
            <form onSubmit={handleEmailContinue} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink-soft mb-1.5">Email address</label>
                <input
                  type="email"
                  autoFocus
                  className="w-full border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-turf bg-paper transition-colors"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                />
              </div>
              {error && <p className="text-xs text-flag">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-turf text-white font-display tracking-wider text-sm py-3 rounded-xl disabled:opacity-50 hover:bg-turf-light transition-colors"
              >
                {loading ? 'CHECKING…' : 'CONTINUE'}
              </button>
            </form>
          )}

          {/* Step 2a: Login */}
          {step === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="text-center pb-2">
                <p className="text-xs text-ink-soft">Welcome back</p>
                <p className="text-sm font-semibold text-ink">{email}</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-soft mb-1.5">5-digit PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  autoFocus
                  maxLength={5}
                  className="w-full border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-turf bg-paper text-center tracking-[0.5em] font-mono transition-colors"
                  placeholder="•••••"
                  value={pin}
                  onChange={(e) => handlePinInput(e.target.value)}
                />
              </div>
              {error && <p className="text-xs text-flag">{error}</p>}
              <button
                type="submit"
                disabled={loading || pin.length !== 5}
                className="w-full bg-turf text-white font-display tracking-wider text-sm py-3 rounded-xl disabled:opacity-50 hover:bg-turf-light transition-colors"
              >
                {loading ? 'SIGNING IN…' : 'SIGN IN'}
              </button>
              <button type="button" onClick={() => { setStep('email'); setPin(''); setError(''); }}
                className="w-full text-xs text-ink-muted hover:text-ink py-1 transition-colors">
                ← Use a different email
              </button>
            </form>
          )}

          {/* Step 2b: Register */}
          {step === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="text-center pb-1">
                <p className="text-xs text-ink-soft">New account for</p>
                <p className="text-sm font-semibold text-ink">{email}</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-soft mb-1.5">Your name</label>
                <input
                  type="text"
                  autoFocus
                  className="w-full border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-turf bg-paper transition-colors"
                  placeholder="First name or nickname"
                  value={displayName}
                  onChange={(e) => { setDisplayName(e.target.value); setError(''); }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-soft mb-1.5">Create a 5-digit PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={5}
                  className="w-full border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-turf bg-paper text-center tracking-[0.5em] font-mono transition-colors"
                  placeholder="•••••"
                  value={pin}
                  onChange={(e) => handlePinInput(e.target.value)}
                />
              </div>
              {error && <p className="text-xs text-flag">{error}</p>}
              <button
                type="submit"
                disabled={loading || pin.length !== 5 || !displayName.trim()}
                className="w-full bg-turf text-white font-display tracking-wider text-sm py-3 rounded-xl disabled:opacity-50 hover:bg-turf-light transition-colors"
              >
                {loading ? 'CREATING…' : 'CREATE ACCOUNT'}
              </button>
              <button type="button" onClick={() => { setStep('email'); setPin(''); setDisplayName(''); setError(''); }}
                className="w-full text-xs text-ink-muted hover:text-ink py-1 transition-colors">
                ← Use a different email
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
