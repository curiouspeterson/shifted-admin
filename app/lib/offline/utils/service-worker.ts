import { toast } from 'sonner';

export interface ServiceWorkerConfig {
  onSuccess?: () => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
}

export async function registerServiceWorker(config: ServiceWorkerConfig = {}) {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');

    registration.addEventListener('activate', () => {
      config.onSuccess?.();
      toast.success('Application is ready for offline use');
    });

    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          config.onUpdate?.(registration);
          toast.info('A new version is available. Please refresh to update.');
        }
      });
    });

    // Handle service worker messages
    navigator.serviceWorker.addEventListener('message', (event) => {
      const { type, payload } = event.data;

      switch (type) {
        case 'CACHE_UPDATED':
          toast.success('New content is available offline');
          break;
        case 'CACHE_ERROR':
          toast.error('Failed to cache content for offline use');
          break;
      }
    });

    return registration;
  } catch (error) {
    config.onError?.(error as Error);
    toast.error('Failed to register service worker');
  }
}

export async function unregisterServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.unregister();
    
    toast.success('Application will no longer work offline');
  } catch (error) {
    toast.error('Failed to unregister service worker');
  }
}

export async function checkServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }

  const registration = await navigator.serviceWorker.getRegistration();
  return !!registration;
}

export async function updateServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.update();
    
    toast.info('Checking for application updates...');
  } catch (error) {
    toast.error('Failed to check for updates');
  }
} 