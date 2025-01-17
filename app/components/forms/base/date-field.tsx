/**
 * Date Field Component
 * Last Updated: 2024-01-16
 * 
 * Date input field with React Hook Form integration
 */

"use client"

import * as React from "react"
import { useFormContext } from "react-hook-form"
import { BaseInput, type BaseInputProps } from "@/components/ui/base-input"
import {
  FormField,
  FormFieldWrapper,
  FormLabel,
  FormMessage,
} from "./FormField"
import { cn } from "@/lib/utils"

interface DateFieldProps extends Omit<BaseInputProps, 'type'> {
  name: string
  label?: string
  description?: string
  optional?: boolean
}

export const DateField = React.forwardRef<HTMLInputElement, DateFieldProps>(
  ({ name, label, description, optional, className, ...props }, ref) => {
    const { register } = useFormContext()
    const { ref: registerRef, ...registerRest } = register(name)

    // Merge refs to handle both React Hook Form and external refs
    const mergeRefs = React.useCallback(
      (element: HTMLInputElement | null) => {
        registerRef(element)
        if (typeof ref === 'function') ref(element)
        else if (ref) ref.current = element
      },
      [registerRef, ref]
    )

    return (
      <FormField name={name}>
        <FormFieldWrapper>
          {label && <FormLabel optional={optional}>{label}</FormLabel>}
          <div className="relative">
            <BaseInput
              {...registerRest}
              {...props}
              type="date"
              className={cn(
                "w-full",
                className
              )}
              ref={mergeRefs}
            />
          </div>
          {description && (
            <p className="text-sm text-muted-foreground">
              {description}
            </p>
          )}
          <FormMessage />
        </FormFieldWrapper>
      </FormField>
    )
  }
)
DateField.displayName = "DateField" 