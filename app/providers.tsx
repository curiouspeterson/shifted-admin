/**
 * Application Providers
 * Last Updated: 2024-03-20
 * 
 * This component wraps the application with necessary providers:
 * - Error Boundary for error handling
 * - Theme Provider for consistent styling
 * - Auth Provider for authentication state
 * - Query Provider for data fetching
 */

'use client';

import React from 'react';
import { ThemeProvider } from 'next-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary, ErrorFallback } from '@/components/error/ErrorBoundary';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ErrorBoundary
      fallback={({ error, reset }) => (
        <ErrorFallback
          error={error}
          reset={reset}
          message="An unexpected error occurred in the application."
        />
      )}
    >
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
} 