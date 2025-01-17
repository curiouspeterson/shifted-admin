'use client';

/**
 * Form Wrapper Component
 * Last Updated: 2024-01-16
 * 
 * A wrapper component for forms that provides:
 * - Loading state handling with overlay
 * - Error display with alert
 * - Success message display
 * - Consistent spacing and styling
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
      className={cn('space-y-4', className)}
      {...props}
    >
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Success Alert */}
      {success && (
        <Alert variant="default">
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>
            {success}
          </AlertDescription>
        </Alert>
      )}

      {children}
    </form>
  );
} 