/**
 * Error Boundary Component
 * Last Updated: 2024-01-17
 * 
 * Consolidated error boundary implementation that combines features from all previous versions:
 * - Reusable ErrorFallback component
 * - Offline error handling
 * - Development mode stack traces
 * - Comprehensive error logging
 * - Flexible styling options
 */

'use client'

import React from 'react'
import { AppError } from '@/lib/errors'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { errorLogger } from '@/lib/logging/error-logger'

interface ErrorFallbackProps {
  error: Error
  reset: () => void
  className?: string
  message?: string
}

/**
 * Reusable error fallback component for displaying errors
 * Can be used standalone or as a fallback for ErrorBoundary
 */
export function ErrorFallback({
  error,
  reset,
  className,
  message
}: ErrorFallbackProps) {
  const isOfflineError = error instanceof AppError && error.name === 'OfflineError'
  const displayMessage = message || (error instanceof AppError
    ? error.message
    : 'An unexpected error occurred. Please try again later.')

  return (
    <div className={cn(
      "p-4 rounded-md",
      isOfflineError ? "bg-yellow-50 border border-yellow-200" : "bg-red-50 border border-red-200",
      className
    )}>
      <h2 className={cn(
        "text-lg font-semibold",
        isOfflineError ? "text-yellow-800" : "text-red-800"
      )}>
        {isOfflineError ? "Offline Error" : "Something went wrong"}
      </h2>
      <p className={cn(
        "mt-2 text-sm",
        isOfflineError ? "text-yellow-700" : "text-red-700"
      )}>
        {displayMessage}
      </p>
      <Button
        variant={isOfflineError ? "outline" : "destructive"}
        className="mt-4"
        onClick={reset}
      >
        Try again
      </Button>
      {process.env.NODE_ENV === 'development' && (
        <pre className="mt-4 p-2 text-xs bg-gray-800 text-gray-200 rounded overflow-auto">
          {error.stack}
        </pre>
      )}
    </div>
  )
}

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode | ((props: { error: Error; reset: () => void }) => React.ReactNode)
  onError?: (error: Error) => void
}

interface State {
  error: Error | null
}

/**
 * Error boundary component for catching and handling client-side errors
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to error logging service
    errorLogger.error('React component error', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      }
    })
    
    // Call custom error handler if provided
    this.props.onError?.(error)
  }

  reset = () => {
    this.setState({ error: null })
  }

  render() {
    if (this.state.error) {
      // Handle function fallback
      if (typeof this.props.fallback === 'function') {
        return this.props.fallback({
          error: this.state.error,
          reset: this.reset
        })
      }
      
      // Handle ReactNode fallback
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default fallback
      return (
        <ErrorFallback
          error={this.state.error}
          reset={this.reset}
        />
      )
    }

    return this.props.children
  }
} 