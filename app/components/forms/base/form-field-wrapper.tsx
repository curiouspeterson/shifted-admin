'use client';

/**
 * Form Field Wrapper Component
 * Last Updated: 2024-03
 * 
 * A reusable wrapper component that provides consistent structure for form fields.
 * Features:
 * - Integration with React Hook Form
 * - Common form field layout
 * - Label support
 * - Description text
 * - Error message display
 * - Type-safe field control
 */

import * as React from 'react';
import { useFormContext, type FieldValues, type Path, type UseFormReturn, type ControllerRenderProps } from 'react-hook-form';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

export interface FormFieldWrapperProps<T extends FieldValues> {
  name: Path<T>;
  label?: string;
  description?: string;
  className?: string;
  children: (field: ControllerRenderProps<T, Path<T>>) => React.ReactNode;
  form?: UseFormReturn<T>;
}

export function FormFieldWrapper<T extends FieldValues>({
  name,
  label,
  description,
  className,
  children,
  form,
}: FormFieldWrapperProps<T>) {
  const formContext = useFormContext<T>();
  const control = form?.control || formContext.control;

  if (!control) {
    throw new Error('FormFieldWrapper must be used within a FormProvider or with a form prop');
  }

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          {label && <FormLabel>{label}</FormLabel>}
          <FormControl>
            {children(field)}
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
} 