/**
 * Sonner Component
 * Last Updated: 2025-03-19
 * 
 * A wrapper around the Sonner toast library with custom styling.
 */

'use client'

import { useTheme } from 'next-themes'
import { Toaster } from 'sonner'
import type { ToasterProps } from 'sonner'

export interface SonnerToasterProps extends Partial<ToasterProps> {
  theme?: 'light' | 'dark' | 'system'
}

export function SonnerToaster({
  className = 'toaster group',
  theme: themeProp,
  ...props
}: SonnerToasterProps) {
  const { theme = themeProp } = useTheme()

  return (
    <Toaster
      theme={theme as 'light' | 'dark' | 'system'}
      className={className}
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
      {...props}
    />
  )
} 