/**
 * Toast Component
 * Last Updated: 2025-03-19
 * 
 * A toast notification component built on top of Sonner.
 */

'use client'

import { toast as sonnerToast, Toaster as SonnerToaster } from 'sonner'

export const toast = sonnerToast

export function Toaster() {
  return (
    <SonnerToaster
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton:
            'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton:
            'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
        },
      }}
    />
  )
} 