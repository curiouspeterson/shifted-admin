'use client';

/**
 * Card Component
 * Last Updated: 2025-01-15
 * 
 * A versatile card component that provides a container with consistent styling.
 * Features:
 * - Customizable padding and margins
 * - Shadow and hover effects
 * - Border radius customization
 * - Responsive design
 */

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-lg border bg-card text-card-foreground shadow-sm',
          'hover:shadow-md transition-shadow duration-200',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
