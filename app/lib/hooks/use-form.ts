/**
 * Form Hook
 * Last Updated: 2024-03
 * 
 * A custom hook that wraps react-hook-form with additional functionality.
 * Features:
 * - Type-safe form handling
 * - Zod schema validation
 * - Error handling
 * - Loading state management
 * - Form reset utilities
 */

import { useCallback } from 'react';
import {
  useForm as useHookForm,
  UseFormProps,
  FieldValues,
  UseFormReturn,
  SubmitHandler,
  SubmitErrorHandler,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

export interface UseFormConfig<TFormValues extends FieldValues> extends Omit<UseFormProps<TFormValues>, 'resolver'> {
  schema: z.Schema<TFormValues>;
  onSubmit: SubmitHandler<TFormValues>;
  onError?: SubmitErrorHandler<TFormValues>;
}

export const useForm = <TFormValues extends FieldValues>({
  schema,
  onSubmit,
  onError,
  ...formConfig
}: UseFormConfig<TFormValues>): Omit<UseFormReturn<TFormValues>, 'handleSubmit'> & {
  handleSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
} => {
  // Initialize form with zod resolver
  const form = useHookForm<TFormValues>({
    ...formConfig,
    resolver: zodResolver(schema),
  });

  // Create submit handler that includes error handling
  const handleSubmit = useCallback(
    async (data: TFormValues) => {
      try {
        await onSubmit(data);
        form.reset();
      } catch (error) {
        console.error('Form submission failed:', error);
        form.setError('root', {
          type: 'submit',
          message: 'Failed to submit form. Please try again.',
        });
      }
    },
    [form, onSubmit]
  );

  // Override the submit handler
  const submit = form.handleSubmit(handleSubmit, onError);

  return {
    ...form,
    handleSubmit: submit,
  };
}; 