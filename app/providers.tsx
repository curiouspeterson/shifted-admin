/**
 * Application Providers Component
 * Last Updated: January 15, 2024
 * 
 * Wraps the application with necessary context providers for:
 * - Theme management (next-themes)
 * - Query management (TanStack Query)
 * - Network status
 * - Service worker registration
 */

'use client';

import { ThemeProvider } from 'next-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { useNetworkStatus } from '@/hooks/use-network';
import { useServiceWorker } from '@/hooks/use-service-worker';

export default function Providers({ children }: { children: React.ReactNode }) {
  // Initialize query client with settings optimized for offline-first
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        cacheTime: 1000 * 60 * 60 * 24, // 24 hours
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        networkMode: 'offlineFirst',
      },
      mutations: {
        networkMode: 'offlineFirst',
      },
    },
  }));

  // Initialize network status monitoring
  useNetworkStatus();

  // Initialize service worker
  useServiceWorker({
    onSuccess: () => console.info('Service worker registered successfully'),
    onUpdate: () => console.info('Service worker update available'),
  });

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </ThemeProvider>
  );
} 