'use client';

/**
 * Base Form Component
 * Last Updated: 2024-03
 * 
 * A base form component that handles common form submission logic.
 * Features:
 * - Generic form handling with TypeScript
 * - Loading state management
 * - Error handling and validation
 * - Success handling
 * - Resubmission prevention
 */

import * as React from 'react';
import { z } from 'zod';
import { toast } from 'sonner';
import { Form } from '@/components/ui';
import { useForm } from '@/lib/hooks';
import { errorLogger } from '@/lib/logging/error-logger';
import type { SubmitHandler, SubmitErrorHandler } from 'react-hook-form';

interface BaseFormProps<T extends z.ZodType> {
  schema: T;
  onSubmit: (data: z.infer<T>) => Promise<void>;
  defaultValues?: z.infer<T>;
  children: (form: ReturnType<typeof useForm<z.infer<T>>>) => React.ReactNode;
  className?: string;
  /** Optional success message to show on successful submission */
  successMessage?: string;
}

export function BaseForm<T extends z.ZodType>({
  schema,
  onSubmit,
  defaultValues,
  children,
  className,
  successMessage = 'Changes saved successfully',
}: BaseFormProps<T>) {
  // Create submit handler that includes loading state and error handling
  const handleFormSubmit: SubmitHandler<z.infer<T>> = async (formData) => {
    try {
      await onSubmit(formData);
      toast.success(successMessage);
    } catch (error) {
      errorLogger.error(error, {
        component: 'BaseForm',
        operation: 'submit',
        formData
      });
      toast.error('Failed to save changes. Please try again.');
    }
  };

  const handleFormError: SubmitErrorHandler<z.infer<T>> = (errors) => {
    errorLogger.error('Form validation failed', {
      component: 'BaseForm',
      operation: 'validate',
      errors
    });
    toast.error('Please fix the form errors before submitting.');
  };

  const form = useForm<z.infer<T>>({
    schema,
    defaultValues,
    onSubmit: handleFormSubmit,
  });

  const onSubmitForm = React.useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (form.formState.isSubmitting) {
        return;
      }
      void form.handleSubmit(handleFormSubmit, handleFormError)(e);
    },
    [form, handleFormSubmit]
  );

  return (
    <Form {...form}>
      <form 
        onSubmit={onSubmitForm}
        className={className}
      >
        {children(form)}
      </form>
    </Form>
  );
} 