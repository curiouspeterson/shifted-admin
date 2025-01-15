import { toast } from '@/components/ui/toast';

export async function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service Worker registered with scope:', registration.scope);

    // Request notification permission
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      console.log('Notification permission:', permission);
    }

    // Listen for service worker updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          toast({
            title: 'Update Available',
            description: 'A new version is available. Please refresh to update.',
            variant: 'default',
          });
        }
      });
    });

    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    toast({
      title: 'Offline Support Failed',
      description: 'Failed to enable offline support. Some features may be unavailable.',
      variant: 'destructive',
    });
  }
} 