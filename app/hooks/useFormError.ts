/**
 * Form Error Hook
 * Last Updated: 2024-03-20
 * 
 * This hook provides form error handling with validation support,
 * accessibility features, and integration with our error logging system.
 */

import { useState, useCallback } from 'react'
import { errorLogger } from '@/lib/logging/error-logger'
import { createValidationError } from '@/lib/errors/middleware-errors'

interface FormErrorState {
  message: string | null
  field?: string
  details?: unknown
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

export function useFormError() {
  const [error, setError] = useState<FormErrorState | null>(null)
  const [pending, setPending] = useState(false)

  const handleError = useCallback((err: unknown, field?: string) => {
    const formError: FormErrorState = {
      message: 'An unexpected error occurred',
      field,
      details: err
    }

    if (err instanceof Error) {
      formError.message = err.message
    }

    setError(formError)
    errorLogger.error('Form error', { error: formatError(err), field })
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const validateField = useCallback(async (
    field: string,
    value: unknown,
    validationFn: (value: unknown) => Promise<string | null>
  ) => {
    try {
      const errorMessage = await validationFn(value)
      if (errorMessage) {
        setError({
          message: errorMessage,
          field
        })
        return false
      }
      return true
    } catch (err) {
      handleError(err, field)
      return false
    }
  }, [handleError])

  return {
    error,
    pending,
    setPending,
    handleError,
    clearError,
    validateField
  }
} 