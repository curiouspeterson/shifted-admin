/**
 * Date Picker Component
 * Last Updated: 2024-03-20 03:55 PST
 * 
 * This component provides a date picker input with a calendar popover.
 */

'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from '@heroicons/react/24/outline';
import { Calendar } from './calendar';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Button } from './button';
import { Input } from './input';
import { cn } from '@/lib/utils';

interface DatePickerProps extends React.InputHTMLAttributes<HTMLInputElement> {
  defaultValue?: string;
}

export function DatePicker({ className, defaultValue, ...props }: DatePickerProps) {
  const [date, setDate] = React.useState<Date | undefined>(
    defaultValue ? new Date(defaultValue) : undefined
  );
  const [open, setOpen] = React.useState(false);

  const handleSelect = (date: Date | undefined) => {
    setDate(date);
    setOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setOpen(true);
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select a date"
          className={cn(
            'w-full justify-start text-left font-normal',
            !date && 'text-muted-foreground',
            className
          )}
          onKeyDown={handleKeyDown}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, 'PPP') : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          initialFocus
          showOutsideDays={true}
        />
      </PopoverContent>
      <Input
        type="hidden"
        name={props.name}
        value={date ? format(date, 'yyyy-MM-dd') : ''}
        {...props}
      />
    </Popover>
  );
} 