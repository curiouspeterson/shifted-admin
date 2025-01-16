/**
 * Error Boundary Component
 * Last Updated: 2024-01-16
 * 
 * React error boundary for catching and handling client-side errors.
 */

'use client'

import React from 'react'
import { AppError } from '@/lib/errors/base'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
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
    console.error('Error caught by boundary:', error, errorInfo)
    this.props.onError?.(error)
  }

  render() {
    if (this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="p-4 rounded-md bg-red-50 border border-red-200">
          <h2 className="text-lg font-semibold text-red-800">
            Something went wrong
          </h2>
          <p className="mt-2 text-sm text-red-700">
            {this.state.error instanceof AppError
              ? this.state.error.message
              : 'An unexpected error occurred. Please try again later.'}
          </p>
          <button
            className="mt-4 px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200"
            onClick={() => this.setState({ error: null })}
          >
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
} 