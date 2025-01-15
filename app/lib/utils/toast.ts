/**
 * Toast Utility
 * Last updated: January 15, 2024
 * 
 * This module provides a centralized way to show toast notifications
 * using the sonner library. It includes pre-configured toast types
 * for common scenarios in our application.
 */

import { toast } from 'sonner';

// Re-export the toast function for direct use
export { toast };

// Custom toast functions for common scenarios
export const showError = (message: string) => {
  toast.error(message);
};

export const showSuccess = (message: string) => {
  toast.success(message);
};

export const showInfo = (message: string) => {
  toast.info(message);
};

// Offline-specific toasts
export const showOfflineToast = () => {
  toast.error('You are currently offline');
};

export const showOnlineToast = () => {
  toast.success('Back online');
};

// Sync-specific toasts
export const showSyncError = (message: string) => {
  toast.error(`Sync failed: ${message}`);
};

export const showSyncSuccess = () => {
  toast.success('Sync completed successfully');
};

// Cache-specific toasts
export const showCacheError = (message: string) => {
  toast.error(`Cache error: ${message}`);
};

export const showStaleDataToast = () => {
  toast.info('You are viewing cached data');
}; 