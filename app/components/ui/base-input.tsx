/**
 * Base Input Component
 * Last Updated: 2024-01-16
 * 
 * A base input component that properly handles refs for form integration
 */

"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface BaseInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

const BaseInput = React.forwardRef<HTMLInputElement, BaseInputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-destructive focus-visible:ring-destructive",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
BaseInput.displayName = "BaseInput"

export { BaseInput } 