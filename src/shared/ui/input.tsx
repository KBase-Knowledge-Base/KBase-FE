import React from 'react';
import { cn } from '@/shared/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, helperText, id, ...props }, ref) => {
    const defaultId = React.useId();
    const inputId = id || defaultId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-ink">
            {label}
            {props.required && <span className="text-semantic-danger ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          className={cn(
            'w-full px-3.5 py-2 text-sm bg-white text-ink rounded-input border border-border transition-colors duration-150',
            'placeholder:text-ink-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus:border-accent',
            'disabled:bg-surface-subtle disabled:text-ink-subtle disabled:cursor-not-allowed',
            error && 'border-semantic-danger focus-visible:outline-semantic-danger focus:border-semantic-danger',
            className
          )}
          {...props}
        />
        {error && (
          <p id={errorId} className="text-xs text-semantic-danger font-medium">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={helperId} className="text-xs text-ink-muted">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
