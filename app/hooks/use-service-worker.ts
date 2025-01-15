/**
 * Service Worker Hook
 * Last Updated: January 15, 2024
 * 
 * Custom hook for managing service worker registration and updates.
 * Provides functionality for registering, updating, and handling service worker lifecycle.
 */

'use client';

import { useEffect } from 'react';
import { toast } from '@/lib/utils/toast';

interface ServiceWorkerOptions {
  onSuccess?: () => void;
  onUpdate?: () => void;
}

export function useServiceWorker(options: ServiceWorkerOptions = {}) {
  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !('serviceWorker' in navigator) ||
      process.env.NODE_ENV !== 'production'
    ) {
      return;
    }

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');

        registration.addEventListener('activated', () => {
          options.onSuccess?.();
        });

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          
          newWorker?.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              options.onUpdate?.();
              toast.info('App update available. Refresh to update.');
            }
          });
        });

        // Handle service worker messages
        navigator.serviceWorker.addEventListener('message', (event) => {
          const { type, payload } = event.data;

          switch (type) {
            case 'CACHE_UPDATED':
              toast.success(`${payload.url} has been cached for offline use`);
              break;
            case 'CACHE_ERROR':
              toast.error(`Failed to cache ${payload.url}`);
              break;
            case 'SYNC_COMPLETED':
              toast.success('Background sync completed');
              break;
            case 'SYNC_ERROR':
              toast.error('Background sync failed');
              break;
          }
        });

      } catch (error) {
        console.error('Service worker registration failed:', error);
        toast.error('Failed to enable offline support');
      }
    };

    registerServiceWorker();
  }, [options.onSuccess, options.onUpdate]);
} 