/**
 * Input Component
 * Last Updated: 2025-01-16
 * 
 * A styled input component that extends the native HTML input element.
 * The interface extends HTMLInputElement attributes to create a branded type
 * that can be used for type safety and future extensions.
 */

import * as React from "react"
import { cn } from "@/lib/utils"

// This type alias creates a branded type for our input component
// while maintaining all HTML input attributes
type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
export type { InputProps } 