'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/',        label: 'Home',    icon: DashIcon },
  { href: '/bag',     label: 'Bag',     icon: BagIcon },
  { href: '/log',     label: 'Log',     icon: PlusIcon },
  { href: '/courses', label: 'Courses', icon: FlagIcon },
  { href: '/chat',    label: 'Caddie',  icon: ChatIcon },
];

export function BottomNav() {
  const path = usePathname();
  return (
    <div className="flex items-center justify-around px-1 py-2 pb-safe">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = href === '/' ? path === '/' : path.startsWith(href);
        return (
          <Link key={href} href={href}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${active ? 'text-turf' : 'text-ink-muted'}`}>
            <Icon size={20} />
            <span className="text-[9px] font-display tracking-wider">{label.toUpperCase()}</span>
          </Link>
        );
      })}
    </div>
  );
}

function DashIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <rect x="2" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="11" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="2" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="11" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
function BagIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M7 3h6l1 3H6L7 3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <rect x="4" y="6" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4 10h12" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2 1.5" />
    </svg>
  );
}
function PlusIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10 6v8M6 10h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function FlagIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M4 17V4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4 4l10 3-10 4" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" fill="none" />
    </svg>
  );
}
function ChatIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M17 10.5C17 13.538 13.866 16 10 16c-1.167 0-2.267-.267-3.222-.74L3 16l.8-3.51A5.95 5.95 0 0 1 3 10.5C3 7.462 6.134 5 10 5s7 2.462 7 5.5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}
