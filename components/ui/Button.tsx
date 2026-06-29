import React from 'react';

interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'ghost' | 'outline';
  size?: 'sm' | 'md';
  disabled?: boolean;
  className?: string;
}

export function Button({
  label,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center rounded-full font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed';
  const sizeClass = size === 'sm' ? 'px-3 py-1 text-xs' : 'px-5 py-2 text-sm';
  const variantClass =
    variant === 'primary'
      ? 'bg-primary text-white hover:bg-primary-light'
      : variant === 'outline'
      ? 'border border-primary text-primary hover:bg-primary/10'
      : 'text-primary hover:bg-primary/10';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${sizeClass} ${variantClass} ${className}`}
    >
      {label}
    </button>
  );
}
