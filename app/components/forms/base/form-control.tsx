/**
 * Form Control Component
 * Last Updated: 2024-01-16
 * 
 * A form control component that handles React Hook Form integration
 * and provides proper field registration and typing.
 */

"use client"

import * as React from "react"
import {
  type FieldValues,
  type Path,
  type UseFormRegisterReturn,
  type ControllerRenderProps,
  useFormContext,
  useController
} from "react-hook-form"
import {
  FormField,
  FormFieldWrapper,
  FormLabel,
  FormMessage,
} from "./FormField"

interface FormControlProps<T extends FieldValues = FieldValues> {
  name: Path<T>
  label?: string
  description?: string
  optional?: boolean
  useController?: boolean
  children: (
    field: UseFormRegisterReturn | ControllerRenderProps<T, Path<T>>
  ) => React.ReactNode
}

export function FormControl<T extends FieldValues = FieldValues>({
  name,
  label,
  description,
  optional,
  useController: shouldUseController = false,
  children
}: FormControlProps<T>) {
  const form = useFormContext<T>()
  
  // Use controller for complex inputs that need value/onChange
  if (shouldUseController) {
    const { field } = useController({
      name,
      control: form.control
    })
    
    return (
      <FormField name={name}>
        <FormFieldWrapper>
          {label && <FormLabel optional={optional}>{label}</FormLabel>}
          {children(field)}
          <FormMessage />
        </FormFieldWrapper>
      </FormField>
    )
  }

  // Use register for simple inputs
  const registerField = form.register(name)
  
  return (
    <FormField name={name}>
      <FormFieldWrapper>
        {label && <FormLabel optional={optional}>{label}</FormLabel>}
        {children(registerField)}
        <FormMessage />
      </FormFieldWrapper>
    </FormField>
  )
} 