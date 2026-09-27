import React from 'react';
import { cn } from '@/shared/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, id, rows = 3, ...props }, ref) => {
    const defaultId = React.useId();
    const textareaId = id || defaultId;
    const errorId = `${textareaId}-error`;
    const helperId = `${textareaId}-helper`;

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label htmlFor={textareaId} className="block text-sm font-medium text-ink">
            {label}
            {props.required && <span className="text-semantic-danger ml-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          className={cn(
            'w-full px-3.5 py-2 text-sm bg-white text-ink rounded-input border border-border transition-colors duration-150',
            'placeholder:text-ink-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus:border-accent',
            'disabled:bg-surface-subtle disabled:text-ink-subtle disabled:cursor-not-allowed resize-y',
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

Textarea.displayName = 'Textarea';
