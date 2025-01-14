/**
 * Error Boundary Component
 * Last Updated: 2024
 * 
 * This component provides error handling for React component trees.
 * It catches JavaScript errors anywhere in its child component tree,
 * logs those errors, and displays a fallback UI instead of the
 * component tree that crashed.
 * 
 * Features:
 * - Catches render errors in child components
 * - Prevents entire app from crashing
 * - Displays user-friendly error message
 * - Logs errors for debugging
 */

'use client'

import { Component, ErrorInfo, ReactNode } from 'react'

/**
 * Component Props
 * @property children - Child components to be rendered and error-handled
 */
interface Props {
  children: ReactNode
}

/**
 * Component State
 * @property hasError - Whether an error has been caught
 * @property error - The error object if one was caught
 */
interface State {
  hasError: boolean
  error: Error | null
}

/**
 * Error Boundary Class Component
 * Implements React's error boundary pattern using class component lifecycle methods
 * Must be a class component to use error boundary lifecycle methods
 */
export default class ErrorBoundary extends Component<Props, State> {
  /**
   * Initial state
   * No errors caught by default
   */
  public state: State = {
    hasError: false,
    error: null
  }

  /**
   * Static method to update state when an error occurs
   * Called during render phase, must be static
   * @param error - The error that was caught
   * @returns New state object with error information
   */
  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  /**
   * Lifecycle method called after an error is caught
   * Used for side effects like error logging
   * @param error - The error that was caught
   * @param errorInfo - Additional information about the error
   */
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  /**
   * Render method
   * Displays error UI if an error occurred, otherwise renders children
   * @returns Error message or child components
   */
  public render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Something went wrong
              </h3>
              <div className="mt-2 text-sm text-red-700">
                {this.state.error?.message || 'An unexpected error occurred'}
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
} 