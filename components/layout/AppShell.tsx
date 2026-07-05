'use client';
import React from 'react';
import { BottomNav } from './BottomNav';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';

const NAV_TITLES: Record<string, string> = {
  '/': 'Dashboard', '/bag': 'My Bag', '/log': 'Log Round',
  '/courses': 'Courses', '/chat': 'Caddie',
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { user, logout } = useAuthStore();
  const title = Object.entries(NAV_TITLES).find(([k]) => k === '/' ? path === '/' : path.startsWith(k))?.[1] ?? 'Clarence';

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
