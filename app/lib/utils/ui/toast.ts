/**
 * Toast Utilities
 * Last Updated: 2025-01-16
 * 
 * Utility functions and constants for toast notifications.
 */

import { toast as sonnerToast } from 'sonner'

export interface ToastOptions {
  title?: string
  description?: string
  variant?: 'default' | 'destructive' | 'success'
}

export const toast = (options: ToastOptions | string) => {
  if (typeof options === 'string') {
    sonnerToast(options)
    return
  }

  const { title, description, variant = 'default' } = options

  switch (variant) {
    case 'destructive':
      sonnerToast.error(title, { description })
      break
    case 'success':
      sonnerToast.success(title, { description })
      break
    default:
      sonnerToast(title, { description })
  }
}

export const toastMessages = {
  online: {
    title: 'Back Online',
    description: 'Your connection has been restored',
    variant: 'success' as const
  },
  offline: {
    title: 'Connection Lost',
    description: 'You are currently offline',
    variant: 'destructive' as const
  },
  error: {
    title: 'Error',
    description: 'An unexpected error occurred',
    variant: 'destructive' as const
  },
  success: {
    title: 'Success',
    description: 'Operation completed successfully',
    variant: 'success' as const
  }
} 