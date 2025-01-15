'use client';

/**
 * Calendar Component
 * Last Updated: 2025-01-15
 * 
 * A reusable calendar component based on react-day-picker.
 * Features:
 * - Single and range selection modes
 * - Custom styling with Tailwind CSS
 * - Full accessibility support
 * - Date constraints and disabled dates
 * - Always shows outside days for better context
 */

import * as React from 'react';
import { DayPicker, type DateRange, type DayPickerProps } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

type BaseCalendarProps = {
  className?: string;
  classNames?: Parameters<typeof DayPicker>[0]['classNames'];
  disabled?: boolean | Date | Date[];
  fromDate?: Date;
  toDate?: Date;
  required?: boolean;
};

type SingleCalendarProps = BaseCalendarProps & {
  mode: 'single';
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
};

type RangeCalendarProps = BaseCalendarProps & {
  mode: 'range';
  selected?: DateRange;
  onSelect?: (range: DateRange | undefined) => void;
};

type MultipleCalendarProps = BaseCalendarProps & {
  mode: 'multiple';
  selected?: Date[];
  onSelect?: (dates: Date[] | undefined) => void;
};

export type CalendarProps = SingleCalendarProps | RangeCalendarProps | MultipleCalendarProps;

function Calendar(props: CalendarProps) {
  const { className, classNames, mode, selected, onSelect, disabled, fromDate, toDate, required } = props;

  const commonProps = {
    showOutsideDays: true,
    className: cn('p-3', className),
    classNames: {
      months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
      month: 'space-y-4',
      caption: 'flex justify-center pt-1 relative items-center',
      caption_label: 'text-sm font-medium',
      nav: 'space-x-1 flex items-center',
      nav_button: cn(
        buttonVariants({ variant: 'outline' }),
        'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100'
      ),
      nav_button_previous: 'absolute left-1',
      nav_button_next: 'absolute right-1',
      table: 'w-full border-collapse space-y-1',
      head_row: 'flex',
      head_cell:
        'text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]',
      row: 'flex w-full mt-2',
      cell: 'h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
      day: cn(
        buttonVariants({ variant: 'ghost' }),
        'h-9 w-9 p-0 font-normal aria-selected:opacity-100'
      ),
      day_range_end: 'day-range-end',
      day_selected:
        'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
      day_today: 'bg-accent text-accent-foreground',
      day_outside:
        'day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30',
      day_disabled: 'text-muted-foreground opacity-50',
      day_range_middle:
        'aria-selected:bg-accent aria-selected:text-accent-foreground',
      day_hidden: 'invisible',
      ...classNames,
    },
    disabled,
    fromDate,
    toDate,
    required,
  };

  switch (mode) {
    case 'single':
      return (
        <DayPicker
          {...commonProps}
          mode="single"
          selected={selected as Date | undefined}
          onSelect={onSelect as (date: Date | undefined) => void}
        />
      );
    case 'range':
      return (
        <DayPicker
          {...commonProps}
          mode="range"
          selected={selected as DateRange | undefined}
          onSelect={onSelect as (range: DateRange | undefined) => void}
        />
      );
    case 'multiple':
      return (
        <DayPicker
          {...commonProps}
          mode="multiple"
          selected={selected as Date[] | undefined}
          onSelect={onSelect as (dates: Date[] | undefined) => void}
        />
      );
  }
}

Calendar.displayName = 'Calendar';

export { Calendar }; 