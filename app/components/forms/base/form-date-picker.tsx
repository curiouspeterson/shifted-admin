'use client';

/**
 * Form Date Picker Component
 * Last Updated: 2024-01-16
 * 
 * A form field component that provides a date picker interface
 * using the Calendar component.
 */

import { Calendar } from "@/components/ui/calendar"
import { type FieldValues, type Path, type ControllerRenderProps } from "react-hook-form"
import { cn } from "@/lib/utils"
import { FormControl } from "./FormControl"

interface FormDatePickerProps<T extends FieldValues = FieldValues> {
  name: Path<T>;
  label?: string;
  description?: string;
  className?: string;
  optional?: boolean;
  showOutsideDays?: boolean;
}

export function FormDatePicker<T extends FieldValues = FieldValues>({
  name,
  label,
  description,
  className,
  optional,
  showOutsideDays = false,
}: FormDatePickerProps<T>) {
  return (
    <FormControl
      name={name}
      label={label}
      description={description}
      optional={optional}
      useController={true}
    >
      {(field) => {
        const controllerField = field as ControllerRenderProps<T, Path<T>>
        return (
          <Calendar
            className={cn("w-full", className)}
            mode="single"
            selected={controllerField.value as Date}
            onSelect={(date) => controllerField.onChange(date)}
            disabled={(date) =>
              date > new Date() || date < new Date("1900-01-01")
            }
            showOutsideDays={showOutsideDays}
          />
        )
      }}
    </FormControl>
  )
} 