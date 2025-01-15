'use client';

/**
 * Form Date Picker Component
 * Last Updated: 2024-03
 * 
 * A reusable form date picker component that provides:
 * - Integration with React Hook Form
 * - Date selection
 * - Validation feedback
 * - Label support
 * - Description text
 */

import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { type FieldValues, type Path } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { Button, type ButtonProps } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { FormFieldWrapper } from './FormFieldWrapper';

export interface FormDatePickerProps<T extends FieldValues = FieldValues> {
  name: Path<T>;
  label?: string;
  description?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
}

export function FormDatePicker<T extends FieldValues = FieldValues>({
  name,
  label,
  description,
  placeholder = 'Pick a date',
  className,
  disabled = false,
  minDate,
  maxDate,
}: FormDatePickerProps<T>) {
  return (
    <FormFieldWrapper<T>
      name={name}
      label={label}
      description={description}
      className="flex flex-col"
    >
      {(field) => (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className={cn(
                'w-full pl-3 text-left font-normal',
                !field.value && 'text-muted-foreground',
                className
              )}
              disabled={disabled}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {field.value ? (
                format(field.value, 'PPP')
              ) : (
                <span>{placeholder}</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={field.value}
              onSelect={field.onChange}
              disabled={disabled}
              initialFocus
              fromDate={minDate}
              toDate={maxDate}
            />
          </PopoverContent>
        </Popover>
      )}
    </FormFieldWrapper>
  );
} 