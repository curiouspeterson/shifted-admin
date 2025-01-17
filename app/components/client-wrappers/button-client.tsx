/**
 * Button Client Wrapper
 * Last Updated: 2025-01-17
 * 
 * A client-side wrapper for the Button component that handles
 * event delegation and ensures proper client/server boundaries.
 */

'use client'

import * as React from 'react'
import { Button as BaseButton } from '../ui/button'
import type { ButtonProps } from '../ui/button'

export function Button({ onClick, ...props }: ButtonProps) {
  // Client-side event handler wrapper
  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      // Add debugging information in development
      if (process.env.NODE_ENV === 'development') {
        console.debug('[Button Click]', {
          timestamp: new Date().toISOString(),
          props,
          event: {
            type: event.type,
            target: event.target,
            currentTarget: event.currentTarget,
          },
        })
      }

      onClick?.(event)
    },
    [onClick, props]
  )

  return <BaseButton onClick={handleClick} {...props} />
} 