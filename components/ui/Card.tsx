import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  accentColor?: string;
  elevated?: boolean;
}

export function Card({ children, className = '', elevated = false }: CardProps) {
  const bg = elevated ? 'bg-elevated' : 'bg-surface';
  return (
    <div className={`${bg} border border-border rounded-xl p-4 ${className}`}>
      {children}
    </div>
  );
}
