import React from 'react';

interface BadgeProps {
  label: string;
  className?: string;
}

export function Badge({ label, className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-display tracking-wider ${className}`}>
      {label.toUpperCase()}
    </span>
  );
}
