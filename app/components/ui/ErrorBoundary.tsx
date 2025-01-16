/**
 * Error Boundary Component
 * Last Updated: 2024-01-16
 * 
 * A React error boundary component that catches errors in its children
 * and displays a fallback UI.
 */

'use client'

import { Component, ReactNode } from 'react'
import { errorLogger } from '@/lib/logging/error-logger'

interface Props {
  children: ReactNode
  fallback: (props: { error: Error; reset: () => void }) => ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    errorLogger.error('React component error', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      }
    })
  }

  reset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return this.props.fallback({
        error: this.state.error,
        reset: this.reset
      })
    }

    return this.props.children
  }
} 