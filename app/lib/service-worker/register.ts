/**
 * Service Worker Registration
 * Last Updated: 2025-01-16
 * 
 * Handles service worker registration with proper error handling
 */

import { errorLogger } from '@/lib/logging/error-logger';

export async function registerServiceWorker(): Promise<void> {
  if (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    window.workbox !== undefined &&
    process.env.NODE_ENV === 'production'
  ) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');

      // Ensure the service worker is at the correct scope
      if (registration.scope !== window.location.origin + '/') {
        errorLogger.warn('Service worker scope mismatch', {
          expected: window.location.origin + '/',
          actual: registration.scope,
        });
      }

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New content is available, notify the user
            window.dispatchEvent(new CustomEvent('swUpdate'));
          }
        });
      });

      // Log successful registration
      console.info('Service Worker registered successfully');
    } catch (error) {
      errorLogger.error('Failed to register service worker', { error });
      // Don't throw the error as SW registration failure shouldn't break the app
    }
  }
}

export async function unregisterServiceWorker(): Promise<void> {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.unregister();
      console.info('Service Worker unregistered successfully');
    } catch (error) {
      errorLogger.error('Failed to unregister service worker', { error });
      throw error;
    }
  }
} 