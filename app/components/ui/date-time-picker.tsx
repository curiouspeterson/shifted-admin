/**
 * Date Time Picker Component
 * Last Updated: 2024-01-15
 * 
 * A date and time picker component that works with react-hook-form.
 * Uses the Shadcn UI calendar component for the date selection.
 */

'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { Calendar as CalendarIcon, Clock } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Control, Controller, FieldValues, Path } from 'react-hook-form'

interface DateTimePickerProps<T extends FieldValues> {
  name: Path<T>
  control: Control<T>
  error?: string
  className?: string
}

export function DateTimePicker<T extends FieldValues>({
  name,
  control,
  error,
  className
}: DateTimePickerProps<T>) {
  return (
    <div className="space-y-2">
      <Controller
        name={name}
        control={control}
        render={({ field }) => {
          const value = field.value ? new Date(field.value) : undefined
          const timeString = value ? format(value, 'HH:mm') : ''

          return (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !value && 'text-muted-foreground',
                    error && 'border-red-500',
                    className
                  )}
                >
                  <div className="flex items-center">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {value ? (
                      <span>
                        {format(value, 'PPP')} at {format(value, 'HH:mm')}
                      </span>
                    ) : (
                      <span>Pick date and time</span>
                    )}
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="p-4">
                  <Calendar
                    mode="single"
                    selected={value}
                    onSelect={(date) => {
                      if (date) {
                        const currentValue = value || new Date()
                        date.setHours(currentValue.getHours())
                        date.setMinutes(currentValue.getMinutes())
                        field.onChange(date.toISOString())
                      }
                    }}
                  />
                  <div className="mt-4 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <Input
                      type="time"
                      value={timeString}
                      onChange={(e) => {
                        const [hours, minutes] = e.target.value.split(':')
                        const newDate = value || new Date()
                        newDate.setHours(parseInt(hours))
                        newDate.setMinutes(parseInt(minutes))
                        field.onChange(newDate.toISOString())
                      }}
                      className="w-full"
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )
        }}
      />
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  )
} 