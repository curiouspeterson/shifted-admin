/**
 * Server Button Component
 * Last Updated: 2025-01-17
 *
 * Pure server component that provides the base button UI.
 * All interactivity must be handled by the client wrapper.
 */

import * as React from 'react'
import { cn } from '@/lib/utils'
import type { ComponentPropsWithoutRef } from 'react'

export interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  isLoading?: boolean
}

type ButtonVariantProps = {
  variant?: ButtonProps['variant']
  size?: ButtonProps['size'] 
  className?: string | undefined
}

export function buttonVariants({
  variant = 'default',
  size = 'default',
  className,
}: ButtonVariantProps = {}): string {
  return cn(
    'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
    {
      'bg-primary text-primary-foreground hover:bg-primary/90': variant === 'default',
      'bg-destructive text-destructive-foreground hover:bg-destructive/90': variant === 'destructive',
      'border border-input bg-background hover:bg-accent hover:text-accent-foreground': variant === 'outline',
      'bg-secondary text-secondary-foreground hover:bg-secondary/80': variant === 'secondary',
      'hover:bg-accent hover:text-accent-foreground': variant === 'ghost',
      'text-primary underline-offset-4 hover:underline': variant === 'link',
    },
    {
      'h-10 px-4 py-2': size === 'default',
      'h-9 rounded-md px-3': size === 'sm',
      'h-11 rounded-md px-8': size === 'lg',
      'h-10 w-10': size === 'icon',
    },
    className
  )
}

export function Button({
  className,
  variant = 'default',
  size = 'default',
  type = 'button',
  disabled,
  isLoading,
  children,
  ...props
}: ButtonProps): React.ReactElement {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      aria-disabled={disabled || isLoading}
      data-state={isLoading ? 'loading' : undefined}
      className={buttonVariants({ variant, size, className })}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <span className="animate-spin">⌛</span>
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  )
} 