import React from 'react';
import { cn } from '@/shared/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, disabled, children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-button transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none select-none';

    const sizeStyles = {
      sm: 'text-xs px-3 py-1.5 h-8 gap-1.5',
      md: 'text-sm px-4 py-2 h-10 gap-2',
      lg: 'text-base px-6 py-2.5 h-12 gap-2.5',
    };

    const variantStyles = {
      primary: 'bg-ink text-white shadow-sm hover:bg-[#2A2E37] active:scale-[0.99] focus-visible:outline-ink',
      secondary: 'neu-button text-ink hover:text-ink focus-visible:outline-accent',
      outline: 'border border-border bg-white text-ink hover:bg-surface-subtle active:bg-border-subtle focus-visible:outline-accent',
      danger: 'bg-semantic-danger text-white hover:bg-[#991B1B] active:scale-[0.99] focus-visible:outline-semantic-danger',
      ghost: 'bg-transparent text-ink hover:bg-surface-subtle focus-visible:outline-accent',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
