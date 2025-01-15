'use client';

/**
 * Base Form Component
 * Last Updated: 2024-03
 * 
 * A base form component that handles common form submission logic.
 * Features:
 * - Generic form handling with TypeScript
 * - Loading state management
 * - Error handling
 * - Success handling
 * - Form validation
 */

import * as React from 'react';
import { z } from 'zod';
import { Form } from '@/components/ui';
import { useForm } from '@/app/lib/hooks';

interface BaseFormProps<T extends z.ZodType> {
  schema: T;
  onSubmit: (data: z.infer<T>) => Promise<void>;
  defaultValues?: z.infer<T>;
  children: (form: ReturnType<typeof useForm<z.infer<T>>>) => React.ReactNode;
  className?: string;
}

export function BaseForm<T extends z.ZodType>({
  schema,
  onSubmit,
  defaultValues,
  children,
  className,
}: BaseFormProps<T>) {
  const form = useForm<z.infer<T>>({
    schema,
    defaultValues,
    onSubmit,
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await onSubmit(data);
      form.reset(defaultValues);
    } catch (error) {
      console.error('Form submission failed:', error);
      // You could add toast notifications here
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className={className}>
        {children(form)}
      </form>
    </Form>
  );
} 