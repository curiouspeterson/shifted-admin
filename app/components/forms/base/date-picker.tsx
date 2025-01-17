'use client';

import { forwardRef } from 'react';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { cn } from '@/lib/utils';

interface DatePickerProps {
  selected: Date | null;
  onSelect: (date: Date | null) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  ({ selected, onSelect, className, placeholder = 'Select date...', disabled }, ref) => {
    return (
      <ReactDatePicker
        selected={selected}
        onChange={(date: Date | null) => onSelect(date)}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        placeholderText={placeholder}
        disabled={disabled}
        dateFormat="yyyy-MM-dd"
        isClearable
        showYearDropdown
        scrollableYearDropdown
        yearDropdownItemNumber={10}
      />
    );
  }
);

DatePicker.displayName = 'DatePicker'; 