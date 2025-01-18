/**
 * Client Button Component
 * Last Updated: 2025-03-19
 * 
 * A client-side button component that supports loading and disabled states.
 */

'use client'

import * as React from 'react'
import { Button as BaseButton, type ButtonProps } from './button'

export interface ClientButtonProps extends Omit<ButtonProps, 'asChild'> {
  isLoading?: boolean
}

export const Button = ({
  children,
  disabled = false,
  isLoading = false,
  ...props
}: ClientButtonProps) => {
  const isDisabled = Boolean(disabled) || Boolean(isLoading)

  return (
    <BaseButton
      {...props}
      disabled={isDisabled}
      data-state={isLoading ? 'loading' : undefined}
    >
      {Boolean(isLoading) ? 'Loading...' : children}
    </BaseButton>
  )
}

// Also export as ClientButton for backwards compatibility
export const ClientButton = Button 