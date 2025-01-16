/**
 * Toast Utilities
 * Last Updated: 2024-01-16
 * 
 * Common toast notifications and messages for the application.
 */

import { toast as sonnerToast } from 'sonner'

// Re-export toast function
export const toast = sonnerToast

// Common toast messages
export const toastMessages = {
  // Connection status
  online: {
    title: 'Online',
    description: 'You are now online',
    variant: 'success' as const
  },
  offline: {
    title: 'Offline',
    description: 'You are now offline',
    variant: 'destructive' as const
  },

  // Data operations
  saveSuccess: {
    title: 'Saved',
    description: 'Changes saved successfully',
    variant: 'success' as const
  },
  saveError: {
    title: 'Save Failed',
    description: 'Failed to save changes',
    variant: 'destructive' as const
  },
  syncSuccess: {
    title: 'Synced',
    description: 'Data synchronized successfully',
    variant: 'success' as const
  },
  syncError: {
    title: 'Sync Failed',
    description: 'Failed to synchronize data',
    variant: 'destructive' as const
  },

  // Generic messages
  error: {
    title: 'Error',
    description: 'An error occurred',
    variant: 'destructive' as const
  },
  success: {
    title: 'Success',
    description: 'Operation completed successfully',
    variant: 'success' as const
  }
} 