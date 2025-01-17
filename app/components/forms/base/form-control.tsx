'use client'

/**
 * Form Control Component
 * Last Updated: 2025-01-17
 * 
 * A wrapper component that provides consistent form field layout and behavior.
 * Supports both simple inputs (with register) and complex inputs (with controller).
 */

import * as React from 'react'
import type { ControllerRenderProps, FieldValues, Path, UseFormRegisterReturn } from 'react-hook-form'
import { useController, useFormContext } from 'react-hook-form'
import { FormField, FormLabel, FormMessage } from '@/components/ui'
import { cn } from '@/lib/utils'

interface FormFieldWrapperProps {
  children: React.ReactNode
}

function FormFieldWrapper({ children }: FormFieldWrapperProps): React.ReactElement {
  return (
    <div className={cn("space-y-2")}>
      {children}
    </div>
  )
}

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
  optional,
  useController: shouldUseController = false,
  children
}: FormControlProps<T>): React.ReactElement {
  const form = useFormContext<T>()
  
  const controller = useController({
    name,
    control: form.control
  })
  
  const field = shouldUseController 
    ? controller.field 
    : form.register(name)
  
  return (
    <FormField
      name={name}
      control={form.control}
      render={() => (
        <FormFieldWrapper>
          {label && (
            <div className="flex items-center gap-1">
              <FormLabel>{label}</FormLabel>
              {optional && <span className="text-sm text-muted-foreground">(Optional)</span>}
            </div>
          )}
          {children(field)}
          <FormMessage />
        </FormFieldWrapper>
      )}
    />
  )
} 