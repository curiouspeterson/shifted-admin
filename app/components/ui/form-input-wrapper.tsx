/**
 * Form Input Wrapper Component
 * Last Updated: 2024-01-16
 * 
 * A reusable wrapper component for form inputs that provides consistent
 * styling and structure for labels, inputs, and error messages.
 */

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface FormInputWrapperProps {
  id: string
  label: string
  error?: string
  className?: string
  children: ReactNode
  required?: boolean
  description?: string
}

export function FormInputWrapper({
  id,
  label,
  error,
  className,
  children,
  required,
  description
}: FormInputWrapperProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex justify-between">
        <label
          htmlFor={id}
          className={cn(
            'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
            error ? 'text-red-500' : 'text-gray-900'
          )}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      </div>
      
      {description && (
        <p className="text-sm text-gray-500">{description}</p>
      )}
      
      {children}
      
      {error && (
        <p className="text-sm font-medium text-red-500">{error}</p>
      )}
    </div>
  )
} 