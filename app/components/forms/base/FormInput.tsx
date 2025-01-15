'use client';

/**
 * Form Input Component
 * Last Updated: 2024-03
 * 
 * A reusable form input component that provides:
 * - Integration with React Hook Form
 * - Validation feedback
 * - Error display
 * - Label support
 * - Description text
 */

import * as React from 'react';
import { type FieldValues, type Path } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { FormFieldWrapper } from './FormFieldWrapper';

export interface FormInputProps<T extends FieldValues = FieldValues>
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'name'> {
  name: Path<T>;
  label?: string;
  description?: string;
}

export function FormInput<T extends FieldValues = FieldValues>({
  name,
  label,
  description,
  className,
  type = 'text',
  ...props
}: FormInputProps<T>) {
  return (
    <FormFieldWrapper<T>
      name={name}
      label={label}
      description={description}
    >
      {(field) => (
        <Input
          type={type}
          className={cn(
            'transition-colors focus-visible:ring-2',
            className
          )}
          {...field}
          {...props}
        />
      )}
    </FormFieldWrapper>
  );
} 