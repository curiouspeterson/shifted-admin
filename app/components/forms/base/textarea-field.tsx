/**
 * TextareaField Component
 * Last Updated: 2024-01-16
 * 
 * A form textarea component with React Hook Form integration.
 * Features:
 * - Form validation
 * - Error handling
 * - Optional labels and descriptions
 * - Accessibility support
 */

"use client"

import * as React from "react"
import { useFormContext } from "react-hook-form"
import { FormField, FormLabel, FormMessage } from "./FormField"
import { Textarea } from "@/components/ui/textarea"

interface TextareaFieldProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  name: string
  label?: string
  description?: string
  optional?: boolean
}

export function TextareaField({
  name,
  label,
  description,
  optional,
  className,
  ...props
}: TextareaFieldProps) {
  const {
    register,
    formState: { errors }
  } = useFormContext()

  const error = errors[name]
  const errorMessage = error?.message as string | undefined

  return (
    <FormField name={name}>
      {label && (
        <FormLabel htmlFor={name} optional={optional}>
          {label}
        </FormLabel>
      )}
      <Textarea
        id={name}
        className={className}
        error={!!error}
        aria-describedby={
          error ? `${name}-error` : description ? `${name}-description` : undefined
        }
        {...register(name)}
        {...props}
      />
      {description && !error && (
        <div id={`${name}-description`} className="text-sm text-muted-foreground">
          {description}
        </div>
      )}
      {error && (
        <FormMessage id={`${name}-error`}>
          {errorMessage}
        </FormMessage>
      )}
    </FormField>
  )
} 