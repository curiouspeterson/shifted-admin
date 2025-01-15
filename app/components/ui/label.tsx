"use client"

/**
 * Label Component
 * Last Updated: 2024-03
 * 
 * A reusable label component for form inputs.
 * Features:
 * - Custom styling
 * - Disabled states
 * - Error states
 * - Required indicator
 * - Accessibility support
 */

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const labelVariants = cva(
  'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
)

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants> & {
      error?: boolean;
      required?: boolean;
    }
>(({ className, error, required, children, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(
      labelVariants(),
      error && 'text-destructive',
      className
    )}
    {...props}
  >
    {children}
    {required && <span className="ml-1 text-destructive">*</span>}
  </LabelPrimitive.Root>
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
