/**
 * Toast Utilities
 * Last Updated: 2025-01-16
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
    type: 'success' as const
  },
  offline: {
    title: 'Offline',
    description: 'You are now offline',
    type: 'error' as const
  },
  maxRetries: {
    title: 'Connection Failed',
    description: 'Maximum retry attempts reached',
    type: 'error' as const
  },

  // Data operations
  saveSuccess: {
    title: 'Saved',
    description: 'Changes saved successfully',
    type: 'success' as const
  },
  saveError: {
    title: 'Save Failed',
    description: 'Failed to save changes',
    type: 'error' as const
  },
  syncSuccess: {
    title: 'Synced',
    description: 'Data synchronized successfully',
    type: 'success' as const
  },
  syncError: {
    title: 'Sync Failed',
    description: 'Failed to synchronize data',
    type: 'error' as const
  },

  // Generic messages
  error: {
    title: 'Error',
    description: 'An error occurred',
    type: 'error' as const
  },
  success: {
    title: 'Success',
    description: 'Operation completed successfully',
    type: 'success' as const
  }
} 