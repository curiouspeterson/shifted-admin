/**
 * Error Boundary Component
 * Last Updated: 2024-03
 * 
 * This component provides a React error boundary for handling
 * and displaying errors in a user-friendly way.
 */

'use client'

import React from 'react'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode | ((error: Error) => React.ReactNode)
}

interface State {
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

/**
 * Error boundary component that catches JavaScript errors anywhere in their child
 * component tree, logs those errors, and displays a fallback UI.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error to an error reporting service
    console.error('Error caught by boundary:', error, errorInfo)
    this.setState({ error, errorInfo })
  }

  render() {
    if (this.state.error) {
      // You can render any custom fallback UI
      if (this.props.fallback) {
        return typeof this.props.fallback === 'function'
          ? this.props.fallback(this.state.error)
          : this.props.fallback
      }

      return (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200">
          <h2 className="text-lg font-semibold text-red-800 mb-2">
            Something went wrong
          </h2>
          <p className="text-sm text-red-600">
            {this.state.error.message}
          </p>
          {this.state.errorInfo && (
            <pre className="mt-2 p-2 bg-red-100 rounded overflow-auto text-xs">
              {this.state.errorInfo.componentStack}
            </pre>
          )}
          <button
            onClick={() => this.setState({ error: null, errorInfo: null })}
            className="mt-4 px-4 py-2 bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors"
          >
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Higher-order component that wraps a component with an error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode | ((error: Error) => React.ReactNode)
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
} 