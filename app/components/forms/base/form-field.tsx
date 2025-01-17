/**
 * Form Field Components
 * Last Updated: 2024-01-16
 * 
 * Base form field components with React Hook Form integration
 */

"use client"

import * as React from "react"
import { useFormContext } from "react-hook-form"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

interface FormFieldContextValue<
  TFieldValues extends Record<string, any> = Record<string, any>
> {
  name: string
}

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
)

const FormField = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & FormFieldContextValue
>(({ className, name, ...props }, ref) => {
  const fieldContext = React.useMemo(() => ({ name }), [name])

  return (
    <FormFieldContext.Provider value={fieldContext}>
      <div ref={ref} className={cn("space-y-2", className)} {...props} />
    </FormFieldContext.Provider>
  )
})
FormField.displayName = "FormField"

const FormFieldWrapper = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("space-y-1", className)} {...props} />
))
FormFieldWrapper.displayName = "FormFieldWrapper"

interface FormLabelProps extends Omit<React.ComponentPropsWithoutRef<typeof Label>, 'ref'> {
  optional?: boolean
}

const FormLabel = React.forwardRef<HTMLLabelElement, FormLabelProps>(
  ({ className, children, optional, ...props }, ref) => (
    <Label
      className={cn("text-sm font-medium", className)}
      {...props}
    >
      {children}
      {optional && (
        <span className="text-sm text-muted-foreground"> (Optional)</span>
      )}
    </Label>
  )
)
FormLabel.displayName = "FormLabel"

const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const { name } = React.useContext(FormFieldContext)
  const { formState: { errors } } = useFormContext()
  const error = errors[name]

  if (!error) return null

  return (
    <p
      ref={ref}
      className={cn(
        "text-sm font-medium text-destructive",
        className
      )}
      {...props}
    >
      {error.message?.toString()}
    </p>
  )
})
FormMessage.displayName = "FormMessage"

export {
  FormField,
  FormFieldWrapper,
  FormLabel,
  FormMessage,
} 