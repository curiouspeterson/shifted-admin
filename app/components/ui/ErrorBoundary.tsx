/**
 * Error Boundary Component
 * Last Updated: 2024-03-20
 * 
 * This component provides error boundary functionality with
 * fallback UI and error logging.
 */

'use client'

import { Component, ReactNode } from 'react'
import { errorLogger } from '@/lib/logging/error-logger'

interface Props {
  children: ReactNode
  fallback: (props: { error: Error; reset: () => void }) => ReactNode
}

interface State {
  error: Error | null
}

/**
 * Format error for logging
 */
function formatError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause instanceof Error ? {
        name: error.cause.name,
        message: error.cause.message,
        stack: error.cause.stack
      } : undefined
    }
  }
  return {
    name: 'UnknownError',
    message: String(error)
  }
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    errorLogger.error('React error boundary caught error', {
      error: formatError(error),
      componentStack: errorInfo.componentStack
    })
  }

  reset = () => {
    this.setState({ error: null })
  }

  render() {
    const { error } = this.state

    if (error) {
      return this.props.fallback({
        error,
        reset: this.reset
      })
    }

    return this.props.children
  }
} 