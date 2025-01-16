/**
 * Form Date Picker Component
 * Last Updated: 2024-01-16
 * 
 * A reusable date picker component that combines FormInputWrapper with
 * the DatePicker component and integrates with react-hook-form.
 */

import { Control, FieldValues, Path } from 'react-hook-form'
import { DatePicker } from '@/components/ui/date-picker'
import { FormInputWrapper } from '@/components/ui/form-input-wrapper'

interface FormDatePickerProps<T extends FieldValues> {
  id: string
  name: Path<T>
  label: string
  control: Control<T>
  error?: string
  required?: boolean
  description?: string
  className?: string
}

export function FormDatePicker<T extends FieldValues>({
  id,
  name,
  label,
  control,
  error,
  required,
  description,
  className
}: FormDatePickerProps<T>) {
  return (
    <FormInputWrapper
      id={id}
      label={label}
      error={error}
      required={required}
      description={description}
      className={className}
    >
      <DatePicker
        name={name}
        control={control}
        error={error}
        className="w-full"
      />
    </FormInputWrapper>
  )
} 