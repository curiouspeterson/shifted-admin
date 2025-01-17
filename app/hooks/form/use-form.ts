/**
 * Generic Form Hook
 * Last Updated: 2024-01-15
 * 
 * A reusable hook for form handling with Zod validation and React Hook Form.
 * Features:
 * - Type-safe form state management
 * - Zod schema validation
 * - Loading state handling
 * - Error management
 * - Success/failure callbacks
 * - Form submission utilities
 */

import { useState, useCallback } from 'react';
import { useForm as useHookForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import type { 
  UseFormProps as UseHookFormProps,
  Path,
  PathValue,
  FieldErrors,
  UseFormSetValue
} from 'react-hook-form';
import { AppError } from '@/lib/errors';

export interface UseFormProps<T extends z.ZodType> {
  schema: T;
  defaultValues?: Partial<z.infer<T>>;
  onSubmit: (data: z.infer<T>) => Promise<void>;
  onSuccess?: () => void;
  onError?: (error: AppError) => void;
}

export interface UseFormReturn<T extends z.ZodType> {
  form: ReturnType<typeof useHookForm<z.infer<T>>>;
  values: z.infer<T>;
  errors: FieldErrors<z.infer<T>> | null;
  isLoading: boolean;
  error: AppError | null;
  handleSubmit: () => Promise<void>;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  setFieldValue: UseFormSetValue<z.infer<T>>;
  reset: () => void;
}

/**
 * Generic form hook that combines React Hook Form with Zod validation
 * 
 * @param props - Form configuration options
 * @returns Form utilities and state
 */
export function useForm<T extends z.ZodType>({
  schema,
  defaultValues,
  onSubmit,
  onSuccess,
  onError,
}: UseFormProps<T>): UseFormReturn<T> {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  // Initialize React Hook Form with Zod resolver
  const form = useHookForm<z.infer<T>>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as UseHookFormProps<z.infer<T>>['defaultValues'],
  });

  /**
   * Handles form field changes
   */
  const handleChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    form.setValue(name as Path<z.infer<T>>, value as PathValue<z.infer<T>, Path<z.infer<T>>>);
  }, [form]);

  /**
   * Handles form submission with loading state and error handling
   */
  const handleSubmit = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get form data and validate
      const data = form.getValues();
      const validatedData = await schema.parseAsync(data);
      
      // Submit form data
      await onSubmit(validatedData);
      
      // Handle success
      onSuccess?.();
    } catch (err) {
      // Handle error
      const error = err instanceof AppError ? err : new AppError({
        code: 'VALIDATION_ERROR',
        message: err instanceof Error ? err.message : 'Form submission failed',
        statusCode: 400,
      });
      
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [form, schema, onSubmit, onSuccess, onError]);

  /**
   * Resets form state
   */
  const reset = useCallback(() => {
    form.reset(defaultValues as UseHookFormProps<z.infer<T>>['defaultValues']);
    setError(null);
  }, [form, defaultValues]);

  return {
    form,
    values: form.getValues(),
    errors: form.formState.errors,
    isLoading,
    error,
    handleSubmit,
    handleChange,
    setFieldValue: form.setValue,
    reset,
  };
}

export type { z }; 