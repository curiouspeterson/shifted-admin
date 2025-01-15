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
import type { UseFormReturn } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  Input,
} from '@/components/ui';

interface DateFieldProps {
  form: UseFormReturn<any>;
  name: string;
  label: string;
  description?: string;
  min?: string;
  max?: string;
}

export function DateField({
  form,
  name,
  label,
  description,
  min,
  max,
}: DateFieldProps) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              type="date"
              min={min}
              max={max}
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