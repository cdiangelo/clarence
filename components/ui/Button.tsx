import React from 'react';

interface ButtonProps {
  label?: string;
  children?: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

export function Button({
  label, children, onClick, type = 'button',
  variant = 'primary', size = 'md', disabled = false, className = '',
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center rounded-lg font-body font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-turf';
  const sizeClass = size === 'sm' ? 'px-3 py-1.5 text-xs' : size === 'lg' ? 'px-6 py-3 text-base' : 'px-4 py-2 text-sm';
  const variantClass =
    variant === 'primary' ? 'bg-turf text-white hover:bg-turf-light shadow-sm' :
    variant === 'outline' ? 'border border-turf text-turf hover:bg-turf-wash' :
    variant === 'danger' ? 'bg-flag/10 text-flag border border-flag/30 hover:bg-flag/20' :
    'text-ink-soft hover:bg-sand/60';

  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`${base} ${sizeClass} ${variantClass} ${className}`}>
      {label ?? children}
    </button>
  );
}
