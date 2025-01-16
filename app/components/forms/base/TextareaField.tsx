'use client';

/**
 * Textarea Field Component
 * Last Updated: 2024-01-15
 * 
 * A reusable textarea field component with form integration.
 * Features:
 * - Form control integration via FormFieldWrapper
 * - Label and description support
 * - Error handling through form context
 * - Resizable text area
 * - Accessible design
 */

import * as React from 'react';
import { type FieldValues, type UseFormReturn, type Path } from 'react-hook-form';
import { Textarea } from '@/components/ui';
import { FormFieldWrapper } from './FormFieldWrapper';

interface TextareaFieldProps<T extends FieldValues = FieldValues> {
  form: UseFormReturn<T>;
  name: Path<T>;
  label: string;
  description?: string;
  placeholder?: string;
}

export function TextareaField<T extends FieldValues = FieldValues>({
  form,
  name,
  label,
  description,
  placeholder,
}: TextareaFieldProps<T>) {
  // Get field error state
  const error = form.formState.errors[name];

  return (
    <FormFieldWrapper<T>
      form={form}
      name={name}
      label={label}
      description={description}
    >
      {(field) => (
        <Textarea
          placeholder={placeholder}
          error={!!error}
          {...field}
        />
      )}
    </FormFieldWrapper>
  );
} 