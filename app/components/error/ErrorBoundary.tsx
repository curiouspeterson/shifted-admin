/**
 * Error Boundary Component
 * Last Updated: 2025-01-16
 * 
 * A React error boundary component that catches JavaScript errors anywhere in its child
 * component tree and displays a fallback UI instead of the component tree that crashed.
 */

'use client'

import React from 'react'

interface ErrorBoundaryProps {
  fallback: React.ComponentType<{
    error: Error
    reset: () => void
  }>
  children: React.ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // You can log the error to an error reporting service here
    console.error('Error caught by boundary:', error, errorInfo)
  }

  reset = () => {
    this.setState({ error: null })
  }

  render() {
    const { error } = this.state
    const { fallback: Fallback, children } = this.props

    if (error) {
      return <Fallback error={error} reset={this.reset} />
    }

    return children
  }
} 