/**
 * Service Worker Utilities
 * Last Updated: 2025-01-17
 * 
 * Utilities for working with service workers in offline mode.
 */

import { toast } from 'sonner';
import { errorLogger, ErrorSeverity } from '@/lib/logging/error-logger';
import { ServiceWorkerError } from '@/lib/errors';

export interface ServiceWorkerConfig {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
}

/**
 * Register and initialize the service worker
 * @param config Configuration options for service worker lifecycle callbacks
 * @returns Promise that resolves when registration is complete
 */
export async function registerServiceWorker(config: ServiceWorkerConfig = {}): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    errorLogger.info('Service worker registration skipped - not supported', {
      component: 'ServiceWorker',
      operation: 'register',
      supported: typeof window !== 'undefined' && 'serviceWorker' in navigator
    });
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    
    errorLogger.info('Service worker registered successfully', {
      component: 'ServiceWorker',
      operation: 'register',
      scope: registration.scope
    });

    registration.addEventListener('activate', () => {
      config.onSuccess?.(registration);
      toast.success('Application is ready for offline use');
      
      errorLogger.info('Service worker activated', {
        component: 'ServiceWorker',
        operation: 'activate',
        scope: registration.scope
      });
    });

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      
      if (!newWorker) {
        return;
      }

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          config.onUpdate?.(registration);
          toast.info('New version available', {
            description: 'Refresh the page to update',
            action: {
              label: 'Refresh',
              onClick: () => window.location.reload()
            }
          });

          errorLogger.info('Service worker update available', {
            component: 'ServiceWorker',
            operation: 'update',
            scope: registration.scope
          });
        }
      });
    });
  } catch (error) {
    const swError = new ServiceWorkerError(
      'Failed to register service worker',
      { error }
    );
    
    errorLogger.error(swError, {
      component: 'ServiceWorker',
      operation: 'register',
      severity: ErrorSeverity.CRITICAL
    });

    config.onError?.(swError);
    toast.error('Failed to enable offline support');
    
    throw swError;
  }
}

export async function unregisterServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    errorLogger.info('Service worker unregistration skipped - not supported', {
      component: 'ServiceWorker',
      operation: 'unregister',
      supported: typeof window !== 'undefined' && 'serviceWorker' in navigator
    });
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.unregister();
    
    errorLogger.info('Service worker unregistered successfully', {
      component: 'ServiceWorker',
      operation: 'unregister'
    });
    
    toast.success('Application will no longer work offline');
  } catch (error) {
    const swError = new ServiceWorkerError(
      'Failed to unregister service worker',
      { error }
    );
    errorLogger.error(swError, {
      component: 'ServiceWorker',
      operation: 'unregister'
    });
    
    toast.error('Failed to unregister service worker');
    throw swError;
  }
}

export async function checkServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    
    errorLogger.debug('Service worker status checked', {
      component: 'ServiceWorker',
      operation: 'check',
      active: !!registration
    });
    
    return !!registration;
  } catch (error) {
    const swError = new ServiceWorkerError(
      'Failed to check service worker status',
      { error }
    );
    errorLogger.warn(swError, {
      component: 'ServiceWorker',
      operation: 'check'
    });
    return false;
  }
}

export async function updateServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    errorLogger.info('Service worker update skipped - not supported', {
      component: 'ServiceWorker',
      operation: 'update',
      supported: typeof window !== 'undefined' && 'serviceWorker' in navigator
    });
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.update();
    
    errorLogger.info('Service worker update initiated', {
      component: 'ServiceWorker',
      operation: 'update'
    });
    
    toast.info('Checking for application updates...');
  } catch (error) {
    const swError = new ServiceWorkerError(
      'Failed to check for updates',
      { error }
    );
    errorLogger.error(swError, {
      component: 'ServiceWorker',
      operation: 'update'
    });
    
    toast.error('Failed to check for updates');
    throw swError;
  }
} 