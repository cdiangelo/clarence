import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  shadow?: boolean;
}

export function Card({ children, className = '', shadow = true }: CardProps) {
  return (
    <div className={`bg-card rounded-xl border border-border ${shadow ? 'shadow-card' : ''} ${className}`}>
      {children}
    </div>
  );
}
