'use client';

/**
 * Textarea Field Component
 * Last Updated: 2024-03
 * 
 * A reusable textarea field component with form integration.
 * Features:
 * - Form control integration
 * - Label and description support
 * - Error handling
 * - Resizable text area
 * - Accessible design
 */

import * as React from 'react';
import type { UseFormReturn } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  Textarea,
} from '@/components/ui';

interface TextareaFieldProps {
  form: UseFormReturn<any>;
  name: string;
  label: string;
  description?: string;
  placeholder?: string;
}

export function TextareaField({
  form,
  name,
  label,
  description,
  placeholder,
}: TextareaFieldProps) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Textarea
              placeholder={placeholder}
              error={!!form.formState.errors[name]}
              {...field}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
} 