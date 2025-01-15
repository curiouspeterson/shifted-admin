/**
 * Form Error Hook
 * Last Updated: 2024-03-20 02:15 PST
 * 
 * This hook provides form error handling functionality with Zod validation.
 */

import { useState, useCallback } from 'react';
import { z } from 'zod';

type ErrorMessage = string;

export type FormErrors<T> = Partial<Record<keyof T | 'root', ErrorMessage>>;

export function useFormError<T extends Record<string, any>>() {
  const [errors, setErrors] = useState<FormErrors<T>>({});

  const setError = useCallback((field: keyof T | 'root', message: ErrorMessage) => {
    setErrors(prev => ({
      ...prev,
      [field]: message,
    }));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const validateData = useCallback(async <S extends z.ZodType<any, any>>(
    data: Partial<T>,
    schema: S
  ): Promise<z.infer<S>> => {
    try {
      return await schema.parseAsync(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formErrors: FormErrors<T> = {};
        error.errors.forEach(err => {
          const path = err.path.join('.') as keyof T | 'root';
          formErrors[path] = err.message;
        });
        setErrors(formErrors);
      }
      throw error;
    }
  }, []);

  return {
    errors,
    setError,
    clearErrors,
    validateData,
  };
} 