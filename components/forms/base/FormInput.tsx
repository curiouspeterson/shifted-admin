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
import { useFormContext } from 'react-hook-form';
import { cn } from '@/lib/utils';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

export interface FormInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'name'> {
  name: string;
  label?: string;
  description?: string;
}

export function FormInput({
  name,
  label,
  description,
  className,
  type = 'text',
  ...props
}: FormInputProps) {
  const { control } = useFormContext();

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          {label && <FormLabel>{label}</FormLabel>}
          <FormControl>
            <Input
              type={type}
              className={cn(
                'transition-colors focus-visible:ring-2',
                className
              )}
              {...field}
              {...props}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
} 