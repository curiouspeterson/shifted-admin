'use client'

/**
 * Client Button Component
 * Last Updated: 2025-01-17
 * 
 * Client-side wrapper for the base Button component.
 * Handles all interactive functionality.
 */

import * as React from 'react'
import { Button, type ButtonProps } from './button'

export interface ClientButtonProps extends Omit<ButtonProps, 'onClick'> {
  onClick?: () => void
}

export function ClientButton({
  onClick,
  ...props
}: ClientButtonProps): React.ReactElement {
  return (
    <Button
      {...props}
      onClick={onClick}
    />
  )
} 