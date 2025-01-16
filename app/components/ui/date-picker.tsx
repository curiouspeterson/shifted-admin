/**
 * Date Picker Component
 * Last Updated: 2024-01-15
 * 
 * A date picker component that works with react-hook-form.
 * Uses the Shadcn UI calendar component for the date selection.
 */

'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Control, Controller, FieldValues, Path } from 'react-hook-form'

interface DatePickerProps<T extends FieldValues> {
  name: Path<T>
  control: Control<T>
  error?: string
  className?: string
}

export function DatePicker<T extends FieldValues>({
  name,
  control,
  error,
  className
}: DatePickerProps<T>) {
  return (
    <div className="space-y-2">
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !field.value && 'text-muted-foreground',
                  error && 'border-red-500',
                  className
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {field.value ? (
                  format(new Date(field.value), 'PPP')
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={field.value ? new Date(field.value) : undefined}
                onSelect={date => field.onChange(date?.toISOString().split('T')[0])}
              />
            </PopoverContent>
          </Popover>
        )}
      />
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  )
} 