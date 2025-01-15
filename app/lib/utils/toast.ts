import { toast as sonnerToast } from 'sonner';

interface ToastOptions {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
  duration?: number;
}

/**
 * Utility function for showing toast notifications
 */
export function toast({
  title,
  description,
  variant = 'default',
  duration = 5000,
}: ToastOptions) {
  const toastFn = variant === 'destructive' ? sonnerToast.error : sonnerToast;

  toastFn(title, {
    description,
    duration,
  });
}

/**
 * Show a success toast
 */
export function showSuccess(title: string, description?: string) {
  toast({
    title,
    description,
    variant: 'default',
  });
}

/**
 * Show an error toast
 */
export function showError(title: string, description?: string) {
  toast({
    title,
    description,
    variant: 'destructive',
  });
}

/**
 * Show a network error toast
 */
export function showNetworkError(error: Error) {
  toast({
    title: 'Network Error',
    description: error.message || 'Failed to connect to the server.',
    variant: 'destructive',
  });
}

/**
 * Show an offline toast
 */
export function showOffline() {
  toast({
    title: 'You\'re Offline',
    description: 'Some features may be unavailable until you\'re back online.',
    variant: 'destructive',
  });
}

/**
 * Show a back online toast
 */
export function showOnline() {
  toast({
    title: 'Back Online',
    description: 'Your connection has been restored.',
    variant: 'default',
  });
}

/**
 * Show a sync error toast
 */
export function showSyncError() {
  toast({
    title: 'Sync Error',
    description: 'Failed to synchronize your changes. They will be retried later.',
    variant: 'destructive',
  });
}

/**
 * Show a sync success toast
 */
export function showSyncSuccess() {
  toast({
    title: 'Sync Complete',
    description: 'All changes have been synchronized.',
    variant: 'default',
  });
}

/**
 * Show a cache error toast
 */
export function showCacheError() {
  toast({
    title: 'Cache Error',
    description: 'Failed to access offline storage.',
    variant: 'destructive',
  });
}

/**
 * Show a stale data toast
 */
export function showStaleData() {
  toast({
    title: 'Using Cached Data',
    description: 'You\'re viewing an older version of this content.',
    variant: 'destructive',
  });
} 