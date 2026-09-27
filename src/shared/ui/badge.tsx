import React from 'react';
import { cn } from '@/shared/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'neutral' | 'success' | 'warning' | 'danger' | 'accent';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'neutral',
  size = 'md',
  children,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center font-medium rounded-full border select-none';

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  };

  const variantStyles = {
    neutral: 'bg-surface-subtle text-ink-muted border-border',
    success: 'bg-semantic-success-bg text-semantic-success border-semantic-success-border',
    warning: 'bg-semantic-warning-bg text-semantic-warning border-semantic-warning-border',
    danger: 'bg-semantic-danger-bg text-semantic-danger border-semantic-danger-border',
    accent: 'bg-accent-subtle text-accent border-accent-light',
  };

  return (
    <span className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)} {...props}>
      {children}
    </span>
  );
};
