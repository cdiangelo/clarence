'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/',         label: 'Home',     icon: '⊞' },
  { href: '/chat',     label: 'Analyst',  icon: '◉' },
  { href: '/research', label: 'Research', icon: '◧' },
  { href: '/markets',  label: 'Markets',  icon: '↗' },
  { href: '/reports',  label: 'Reports',  icon: '▤' },
];

export function BottomNav() {
  const path = usePathname();

  return (
    <div className="flex items-center justify-around px-2 py-2 pb-safe">
      {NAV.map(({ href, label, icon }) => {
        const active = href === '/' ? path === '/' : path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${
              active ? 'text-primary' : 'text-ink-muted'
            }`}
          >
            <span className="text-lg leading-none">{icon}</span>
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        );
      })}
    </div>
  );
}
