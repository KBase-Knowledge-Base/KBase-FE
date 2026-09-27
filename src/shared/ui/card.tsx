import React from 'react';
import { cn } from '@/shared/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'elevated' | 'flat' | 'card';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'card', children, ...props }, ref) => {
    const variantStyles = {
      card: 'neu-card rounded-card p-6 bg-white',
      elevated: 'neu-elevated rounded-card p-6 bg-white border border-border-subtle',
      flat: 'neu-flat rounded-card p-6 border border-border',
    };

    return (
      <div ref={ref} className={cn(variantStyles[variant], className)} {...props}>
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
