/**
 * Button Client Wrapper
 * Last Updated: 2025-01-17
 * 
 * Client-side wrapper for the base Button component.
 * Handles all interactivity and event delegation.
 */

'use client'

import * as React from 'react'
import { useTransition } from 'react'
import { Button as BaseButton, type ButtonProps } from '../ui/button'

type ButtonClickHandler = (event: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>

interface ButtonState {
  isLoading: boolean
  error: Error | null
}

type ButtonAction = 
  | { type: 'START_LOADING' }
  | { type: 'FINISH_LOADING' }
  | { type: 'SET_ERROR'; error: Error }
  | { type: 'CLEAR_ERROR' }

function buttonReducer(state: ButtonState, action: ButtonAction): ButtonState {
  switch (action.type) {
    case 'START_LOADING':
      return { ...state, isLoading: true, error: null }
    case 'FINISH_LOADING':
      return { ...state, isLoading: false }
    case 'SET_ERROR':
      return { ...state, error: action.error, isLoading: false }
    case 'CLEAR_ERROR':
      return { ...state, error: null }
    default:
      return state
  }
}

export interface ClientButtonProps extends Omit<ButtonProps, 'isLoading'> {
  onClick?: ButtonClickHandler
}

export function Button({ onClick, disabled, children, ...props }: ClientButtonProps) {
  const [isPending, startTransition] = useTransition()
  const [state, dispatch] = React.useReducer(buttonReducer, {
    isLoading: false,
    error: null
  })

  // Create a container ref for event handling
  const buttonRef = React.useRef<HTMLDivElement>(null)

  // Memoize the click handler to prevent unnecessary re-renders
  const handleClick = React.useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!onClick || disabled || state.isLoading) return

      try {
        dispatch({ type: 'START_LOADING' })
        
        // Use startTransition to avoid blocking the UI
        startTransition(async () => {
          try {
            await onClick(e)
            dispatch({ type: 'FINISH_LOADING' })
          } catch (error) {
            dispatch({ type: 'SET_ERROR', error: error as Error })
            // Re-throw for error boundary
            throw error
          }
        })
      } catch (error) {
        console.error('Button click error:', error)
        throw error
      }
    },
    [onClick, disabled, state.isLoading]
  )

  // Development-only logging
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Button client wrapper mounted')
      return () => console.log('Button client wrapper unmounted')
    }
  }, [])

  // Handle error cleanup
  React.useEffect(() => {
    if (state.error) {
      const timer = setTimeout(() => {
        dispatch({ type: 'CLEAR_ERROR' })
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [state.error])

  // Attach click handler to container instead of button
  React.useEffect(() => {
    const container = buttonRef.current
    if (!container) return

    const handleContainerClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'BUTTON') {
        handleClick(e as unknown as React.MouseEvent<HTMLButtonElement>)
      }
    }

    container.addEventListener('click', handleContainerClick)
    return () => container.removeEventListener('click', handleContainerClick)
  }, [handleClick])

  return (
    <div ref={buttonRef} className="relative">
      <BaseButton
        {...props}
        disabled={disabled || state.isLoading || isPending}
        isLoading={state.isLoading || isPending}
      >
        {state.isLoading || isPending ? (
          <span className="flex items-center gap-2">
            <span className="animate-spin">⌛</span>
            {children}
          </span>
        ) : (
          children
        )}
      </BaseButton>
      {state.error && (
        <div className="absolute top-full left-0 mt-1 text-sm text-red-500">
          {state.error.message}
        </div>
      )}
    </div>
  )
} 