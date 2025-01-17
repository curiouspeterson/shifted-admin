/**
 * Form Error Hook
 * Last Updated: 2024-03-19 23:30 PST
 * 
 * This hook provides form error handling functionality.
 */

'use client';

import { useState, useCallback } from 'react';
import { z } from 'zod';
import { AppError } from '@/lib/errors/base';
import { getUserMessage } from '@/lib/errors/utils';

interface FormError {
  message: string;
  field?: string;
  type: 'validation' | 'submission' | 'system';
}

interface UseFormErrorProps<T> {
  onError?: (error: FormError) => void;
  schema?: z.Schema<T>;
}

interface UseFormErrorReturn {
  error: FormError | null;
  setError: (error: FormError | null) => void;
  clearError: () => void;
  handleError: (error: unknown) => void;
  validateData: <T>(data: T, schema: z.Schema<T>) => T | null;
}

/**
 * Form error handling hook
 */
export function useFormError<T>({ onError, schema }: UseFormErrorProps<T> = {}): UseFormErrorReturn {
  const [error, setError] = useState<FormError | null>(null);

  /**
   * Clear current error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Handle different types of errors
   */
  const handleError = useCallback((error: unknown) => {
    let formError: FormError;

    if (error instanceof z.ZodError) {
      // Handle validation errors
      const firstError = error.errors[0];
      formError = {
        message: firstError.message,
        field: firstError.path.join('.'),
        type: 'validation',
      };
    } else if (error instanceof AppError) {
      // Handle application errors
      formError = {
        message: getUserMessage(error),
        type: 'submission',
      };
    } else if (error instanceof Error) {
      // Handle system errors
      formError = {
        message: error.message || 'An unexpected error occurred',
        type: 'system',
      };
    } else {
      // Handle unknown errors
      formError = {
        message: 'An unexpected error occurred',
        type: 'system',
      };
    }

    setError(formError);
    onError?.(formError);
  }, [onError]);

  /**
   * Validate data against schema
   */
  const validateData = useCallback(<D>(data: D, validationSchema: z.Schema<D>): D | null => {
    try {
      return validationSchema.parse(data);
    } catch (error) {
      handleError(error);
      return null;
    }
  }, [handleError]);

  return {
    error,
    setError,
    clearError,
    handleError,
    validateData,
  };
} 