'use client'

/**
 * Client Button Component
 * Last Updated: 2025-01-17
 * 
 * Client-side wrapper for shadcn button that adds:
 * - Loading state handling
 * - onClick event handling
 * - Proper client/server boundary separation
 */

import * as React from 'react'
import { Button, type ButtonProps } from './button'

export interface ClientButtonProps extends Omit<ButtonProps, 'loading'> {
  loading?: boolean
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>
}

export function ClientButton({
  onClick,
  loading = false,
  disabled,
  children,
  ...props
}: ClientButtonProps): React.ReactElement {
  const [isLoading, setIsLoading] = React.useState<boolean>(loading)
  const isMounted = React.useRef<boolean>(false)

  React.useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  const handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    if (typeof onClick !== 'function' || isLoading === true) return

    try {
      setIsLoading(true)
      await onClick(event)
    } finally {
      if (isMounted.current === true) {
        setIsLoading(false)
      }
    }
  }

  return (
    <Button
      onClick={handleClick}
      disabled={disabled === true || isLoading === true}
      loading={isLoading}
      {...props}
    >
      {children}
    </Button>
  )
} 