'use client';

/**
 * Error Fallback Component
 * Last Updated: 2024-03-20
 * 
 * A simple fallback UI component displayed when an error occurs in the application.
 * Used by the ErrorBoundary component.
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

export function ErrorFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Alert variant="destructive" className="max-w-md">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Something went wrong</AlertTitle>
        <AlertDescription>
          An unexpected error occurred. Please try refreshing the page.
        </AlertDescription>
        <div className="mt-4">
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </Button>
        </div>
      </Alert>
    </div>
  );
} 