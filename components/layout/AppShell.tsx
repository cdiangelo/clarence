'use client';
import React from 'react';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar — desktop only */}
      <aside className="hidden lg:flex flex-col w-56 flex-shrink-0 border-r border-border bg-surface">
        <Sidebar />
      </aside>

      {/* Main content area */}
      <main className="flex-1 overflow-hidden flex flex-col min-w-0">
        {children}
      </main>

      {/* Bottom nav — mobile only */}
      <nav className="fixed bottom-0 inset-x-0 lg:hidden border-t border-border bg-surface/95 backdrop-blur z-50">
        <BottomNav />
      </nav>
    </div>
  );
}
