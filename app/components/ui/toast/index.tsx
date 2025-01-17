/**
 * Toast Component
 * Last Updated: 2025-01-16
 * 
 * Modern toast notifications using sonner
 */

'use client';

import { toast as sonnerToast, Toaster } from 'sonner';

interface ToastOptions {
  description?: string;
  variant?: 'default' | 'destructive';
}

export const toast = Object.assign(
  (message: string, options?: ToastOptions) => {
    return sonnerToast(message, {
      description: options?.description,
      className: options?.variant === 'destructive' ? 'bg-destructive text-destructive-foreground' : undefined,
    });
  },
  {
    error: (message: string, options?: { description?: string }) => {
      return sonnerToast.error(message, { 
        description: options?.description,
        className: 'bg-destructive text-destructive-foreground',
      });
    },
    success: (message: string, options?: { description?: string }) => {
      return sonnerToast.success(message, { 
        description: options?.description,
        className: 'bg-success text-success-foreground',
      });
    },
  }
);

export function ToastProvider() {
  return (
    <Toaster 
      position="top-center"
      richColors
      closeButton
      theme="system"
      className="toaster-wrapper"
    />
  );
} 