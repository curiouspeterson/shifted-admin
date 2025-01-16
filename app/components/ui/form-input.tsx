/**
 * Form Input Component
 * Last Updated: 2024-01-16
 * 
 * A reusable form input component that combines FormInputWrapper with
 * various input types and handles form state.
 */

import { forwardRef } from 'react'
import { UseFormRegisterReturn } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { FormInputWrapper } from '@/components/ui/form-input-wrapper'
import { cn } from '@/lib/utils'

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string
  label: string
  error?: string
  registration?: Partial<UseFormRegisterReturn>
  required?: boolean
  description?: string
  wrapperClassName?: string
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({
    id,
    label,
    error,
    registration,
    className,
    required,
    description,
    wrapperClassName,
    type = 'text',
    ...props
  }, ref) => {
    return (
      <FormInputWrapper
        id={id}
        label={label}
        error={error}
        required={required}
        description={description}
        className={wrapperClassName}
      >
        <Input
          id={id}
          type={type}
          className={cn(error && 'border-red-500', className)}
          ref={ref}
          aria-describedby={error ? `${id}-error` : undefined}
          {...registration}
          {...props}
        />
      </FormInputWrapper>
    )
  }
)

FormInput.displayName = 'FormInput' 