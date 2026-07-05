'use client';
import React from 'react';
import { BottomNav } from './BottomNav';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { useLiveRoundStore } from '@/stores/liveRound';

const NAV_TITLES: Record<string, string> = {
  '/': 'Dashboard', '/bag': 'My Bag', '/log': 'Log Round',
  '/courses': 'Courses', '/chat': 'Caddie',
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { active: liveActive, course: liveCourse, scores: liveScores } = useLiveRoundStore();
  const title = Object.entries(NAV_TITLES).find(([k]) => k === '/' ? path === '/' : path.startsWith(k))?.[1] ?? 'Clarence';

  const holesEntered = liveScores.filter((s) => s !== '').length;

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top bar */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 h-12 border-b border-border bg-card">
        <Link href="/" className="font-display text-sm tracking-widest text-ink">CLARENCE</Link>
        <span className="font-display text-xs tracking-wider text-turf">{title.toUpperCase()}</span>
        <div className="flex items-center gap-3">
          {user && (
            <span className="text-xs text-ink-soft hidden sm:block">{user.displayName}</span>
          )}
          <button onClick={logout} className="text-[10px] font-display tracking-wider text-ink-muted hover:text-flag transition-colors">
            SIGN OUT
          </button>
        </div>
      </header>

      {/* Pinned live round indicator — visible from anywhere in the app */}
      {liveActive && liveCourse && path !== '/log' && (
        <button
          onClick={() => router.push('/log')}
          className="flex-shrink-0 w-full flex items-center justify-center gap-2 bg-turf text-white px-4 py-1.5 text-xs hover:bg-turf-light transition-colors"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          <span className="font-display tracking-wider text-[10px]">LIVE ROUND</span>
          <span className="opacity-90 truncate">{liveCourse.name}</span>
          <span className="opacity-70 stat-num text-[10px] flex-shrink-0">{holesEntered}/{liveScores.length}</span>
        </button>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-y-auto min-h-0">
        {children}
      </main>

      {/* Bottom nav */}
      <nav className="flex-shrink-0 border-t border-border bg-card">
        <BottomNav />
      </nav>
    </div>
  );
}
