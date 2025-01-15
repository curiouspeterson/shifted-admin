'use client';

/**
 * Date Field Component
 * Last Updated: 2024-03
 * 
 * A reusable date field component with form integration.
 * Features:
 * - Form control integration
 * - Label and description support
 * - Error handling
 * - Date validation
 * - Accessible design
 */

import * as React from 'react';
import { type FieldValues, type UseFormReturn, type Path } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { FormFieldWrapper } from './FormFieldWrapper';

interface DateFieldProps<T extends FieldValues = FieldValues> {
  form: UseFormReturn<T>;
  name: Path<T>;
  label: string;
  description?: string;
  min?: string;
  max?: string;
}

export function DateField<T extends FieldValues = FieldValues>({
  form,
  name,
  label,
  description,
  min,
  max,
}: DateFieldProps<T>) {
  return (
    <FormFieldWrapper<T>
      form={form}
      name={name}
      label={label}
      description={description}
    >
      {(field) => (
        <Input
          type="date"
          min={min}
          max={max}
          {...field}
        />
      )}
    </FormFieldWrapper>
  );
} 