/**
 * Server Button Component
 * Last Updated: 2025-03-19
 * 
 * A server-side button component that supports disabled states and variants.
 */

import * as React from 'react'
import { Button as BaseButton, type ButtonProps } from './button'

export interface ServerButtonProps extends Omit<ButtonProps, 'asChild' | 'onClick'> {}

export function ServerButton({
  children,
  disabled = false,
  ...props
}: ServerButtonProps) {
  return (
    <BaseButton
      {...props}
      disabled={Boolean(disabled)}
    >
      {children}
    </BaseButton>
  )
} 