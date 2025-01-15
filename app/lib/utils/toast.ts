/**
 * Toast Utility
 * Last Updated: 2024-03-20
 * 
 * Type-safe toast notifications following modern React patterns.
 */

import { toast as showToast } from '@/components/ui/toast'

type ToastVariant = 'default' | 'destructive'

interface ToastOptions {
  title: string
  description?: string
  variant?: ToastVariant
  duration?: number
}

/**
 * Show a toast notification with type safety
 */
export function toast(options: ToastOptions) {
  return showToast({
    ...options,
    variant: options.variant || 'default',
    duration: options.duration || 5000
  })
}

/**
 * Predefined toast messages for consistent messaging
 */
export const toastMessages = {
  offline: {
    title: 'Offline',
    description: 'No internet connection available',
    variant: 'destructive' as const
  },
  online: {
    title: 'Connected',
    description: 'You are back online',
    variant: 'default' as const
  },
  syncError: {
    title: 'Sync Failed',
    description: 'Could not sync with server',
    variant: 'destructive' as const
  },
  syncSuccess: {
    title: 'Synced',
    description: 'Your data is up to date',
    variant: 'default' as const
  },
  saveError: {
    title: 'Error',
    description: 'Failed to save changes',
    variant: 'destructive' as const
  },
  saveSuccess: {
    title: 'Changes Saved',
    description: 'Your changes have been saved',
    variant: 'default' as const
  }
} as const 