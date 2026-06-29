'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/',          label: 'Dashboard', icon: GridIcon },
  { href: '/chat',      label: 'Analyst',   icon: ChatIcon },
  { href: '/research',  label: 'Research',  icon: DocIcon  },
  { href: '/markets',   label: 'Markets',   icon: TrendIcon },
  { href: '/reports',   label: 'Reports',   icon: BarIcon  },
];

export function Sidebar() {
  const path = usePathname();

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 pt-5 pb-4 border-b border-border">
        <span className="font-mono text-sm font-bold tracking-widest text-ink">CLARENCE</span>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="w-1.5 h-1.5 rounded-full bg-gain animate-pulse-slow" />
          <span className="text-[10px] text-ink-muted font-mono">ANALYST ONLINE</span>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? path === '/' : path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-primary/15 text-primary'
                  : 'text-ink-secondary hover:bg-elevated hover:text-ink'
              }`}
            >
              <Icon size={16} className={active ? 'text-primary' : 'text-ink-muted'} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom status */}
      <div className="px-4 pb-4 pt-2 border-t border-border">
        <div className="text-[10px] text-ink-muted font-mono leading-relaxed">
          <div>claude-opus-4-8</div>
          <div className="text-ink-muted/60">Personal research tool</div>
        </div>
      </div>
    </div>
  );
}

// Icon components
function GridIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function ChatIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M14 8.5C14 11.538 11.314 14 8 14c-.966 0-1.878-.222-2.676-.614L2 14l.667-2.917C2.24 10.18 2 9.37 2 8.5 2 5.462 4.686 3 8 3s6 2.462 6 5.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function DocIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M9 1H4a1 1 0 00-1 1v12a1 1 0 001 1h8a1 1 0 001-1V6L9 1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M9 1v5h5M5.5 9h5M5.5 11.5h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function TrendIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M2 11l4-4 3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 4h3v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BarIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <rect x="2" y="8" width="3" height="6" rx="0.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="6.5" y="5" width="3" height="9" rx="0.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11" y="2" width="3" height="12" rx="0.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
