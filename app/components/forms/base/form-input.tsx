'use client';

/**
 * Form Input Component
 * Last Updated: 2024-01-16
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
import { FormControl } from './FormControl';

export interface FormInputProps<T extends FieldValues = FieldValues>
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'name'> {
  name: Path<T>;
  label?: string;
  description?: string;
  optional?: boolean;
}

export function FormInput<T extends FieldValues = FieldValues>({
  name,
  label,
  description,
  optional,
  className,
  type = 'text',
  ...props
}: FormInputProps<T>) {
  return (
    <FormControl
      name={name}
      label={label}
      description={description}
      optional={optional}
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
    </FormControl>
  );
} 