'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  registerServiceWorker,
  unregisterServiceWorker,
  updateServiceWorker,
  isServiceWorkerRegistered,
  sendMessageToServiceWorker,
  listenToServiceWorker,
} from '@/lib/utils/service-worker';
import { showError, showSuccess } from '@/lib/utils/toast';

interface UseServiceWorkerOptions {
  scope?: string;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
}

export function useServiceWorker(options: UseServiceWorkerOptions = {}) {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [hasUpdate, setHasUpdate] = useState(false);

  // Initialize service worker
  useEffect(() => {
    const init = async () => {
      try {
        const reg = await registerServiceWorker({
          scope: options.scope,
          onUpdate: (registration) => {
            setHasUpdate(true);
            options.onUpdate?.(registration);
          },
          onSuccess: (registration) => {
            setHasUpdate(false);
            options.onSuccess?.(registration);
          },
          onError: options.onError,
        });

        if (reg) {
          setRegistration(reg);
          setIsRegistered(true);
        }
      } catch (error) {
        console.error('Failed to initialize service worker:', error);
        options.onError?.(error as Error);
      }
    };

    init();
  }, [options.scope, options.onUpdate, options.onSuccess, options.onError]);

  // Check registration status
  useEffect(() => {
    const checkRegistration = async () => {
      const registered = await isServiceWorkerRegistered();
      setIsRegistered(registered);
    };

    checkRegistration();
  }, []);

  // Update service worker
  const update = useCallback(async () => {
    if (!registration) return;

    setIsUpdating(true);
    try {
      await updateServiceWorker();
      setHasUpdate(false);
      showSuccess(
        'Update Complete',
        'The application has been updated. Please refresh to apply changes.'
      );
    } catch (error) {
      console.error('Failed to update service worker:', error);
      showError(
        'Update Failed',
        'Failed to update the application. Please try again.'
      );
    } finally {
      setIsUpdating(false);
    }
  }, [registration]);

  // Unregister service worker
  const unregister = useCallback(async () => {
    const success = await unregisterServiceWorker();
    if (success) {
      setRegistration(null);
      setIsRegistered(false);
      setHasUpdate(false);
    }
    return success;
  }, []);

  // Send message to service worker
  const sendMessage = useCallback(async (message: any) => {
    if (!registration?.active) return null;
    return sendMessageToServiceWorker(message);
  }, [registration]);

  // Listen for service worker messages
  useEffect(() => {
    const unsubscribe = listenToServiceWorker((event) => {
      const { type, payload } = event.data || {};

      switch (type) {
        case 'cache-updated':
          showSuccess(
            'Content Updated',
            'New content is available offline.'
          );
          break;
        case 'sync-completed':
          showSuccess(
            'Sync Complete',
            'All changes have been synchronized.'
          );
          break;
        case 'sync-failed':
          showError(
            'Sync Failed',
            'Failed to synchronize changes. Will retry later.'
          );
          break;
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return {
    registration,
    isRegistered,
    isUpdating,
    hasUpdate,
    update,
    unregister,
    sendMessage,
  };
} 