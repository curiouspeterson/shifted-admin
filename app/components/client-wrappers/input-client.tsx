/**
 * Input Client Wrapper
 * Last Updated: 2025-01-17
 * 
 * A client-side wrapper for the Input component that handles
 * event delegation and ensures proper client/server boundaries.
 */

'use client'

import * as React from 'react'
import { Input as BaseInput } from '../ui/input'
import type { InputProps } from '../ui/input'

export function Input({ onChange, onFocus, onBlur, ...props }: InputProps) {
  // Client-side event handler wrappers
  const handleChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      // Add debugging information in development
      if (process.env.NODE_ENV === 'development') {
        console.debug('[Input Change]', {
          timestamp: new Date().toISOString(),
          value: event.target.value,
          props,
          event: {
            type: event.type,
            target: event.target,
          },
        })
      }

      onChange?.(event)
    },
    [onChange, props]
  )

  const handleFocus = React.useCallback(
    (event: React.FocusEvent<HTMLInputElement>) => {
      if (process.env.NODE_ENV === 'development') {
        console.debug('[Input Focus]', {
          timestamp: new Date().toISOString(),
          props,
        })
      }

      onFocus?.(event)
    },
    [onFocus, props]
  )

  const handleBlur = React.useCallback(
    (event: React.FocusEvent<HTMLInputElement>) => {
      if (process.env.NODE_ENV === 'development') {
        console.debug('[Input Blur]', {
          timestamp: new Date().toISOString(),
          value: event.target.value,
          props,
        })
      }

      onBlur?.(event)
    },
    [onBlur, props]
  )

  return (
    <BaseInput
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      {...props}
    />
  )
} 