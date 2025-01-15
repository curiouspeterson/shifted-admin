'use client';

/**
 * Form Wrapper Component
 * Last Updated: 2024-03
 * 
 * A wrapper component for forms that provides:
 * - Loading state handling
 * - Error display
 * - Success/failure feedback
 * - Consistent styling
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { AppError } from '@/lib/errors';

export interface FormWrapperProps extends React.FormHTMLAttributes<HTMLFormElement> {
  isLoading?: boolean;
  error?: AppError | null;
  success?: string;
  children: React.ReactNode;
}

export function FormWrapper({
  isLoading = false,
  error = null,
  success,
  children,
  className,
  ...props
}: FormWrapperProps) {
  return (
    <form
      className={cn('relative space-y-4', className)}
      {...props}
    >
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error.message}
            {error.details && (
              <ul className="mt-2 list-disc pl-4">
                {Object.entries(error.details).map(([field, message]) => (
                  <li key={field}>
                    <span className="font-medium">{field}:</span> {message}
                  </li>
                ))}
              </ul>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Success Alert */}
      {success && (
        <Alert variant="default" className="border-green-500 bg-green-50">
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Form Content */}
      <div className={cn('space-y-4', isLoading && 'pointer-events-none opacity-50')}>
        {children}
      </div>
    </form>
  );
} 