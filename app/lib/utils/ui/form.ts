/**
 * Form Utilities
 * Last Updated: 2025-01-16
 * 
 * Common form handling utilities.
 */

import { FieldValues, Path } from 'react-hook-form'

/**
 * Get the error message for a form field
 * 
 * @param errors - Form errors object
 * @param field - Field name
 * @returns Error message or undefined
 * 
 * @example
 * ```tsx
 * const { register, formState: { errors } } = useForm()
 * 
 * const emailError = getFieldError(errors, 'email')
 * // => 'Email is required'
 * ```
 */
export function getFieldError<T extends FieldValues>(
  errors: Record<string, any>,
  field: Path<T>
): string | undefined {
  const error = errors[field]
  return error?.message
}

/**
 * Parse FormData into a plain object
 * 
 * @param formData - FormData object
 * @returns Parsed form data object
 * 
 * @example
 * ```ts
 * const formData = new FormData()
 * formData.append('name', 'John')
 * formData.append('age', '30')
 * 
 * const data = parseFormData(formData)
 * // => { name: 'John', age: '30' }
 * ```
 */
export function parseFormData(formData: FormData): Record<string, unknown> {
  const data: Record<string, unknown> = {}
  const entries = Array.from(formData.entries())

  for (const [key, value] of entries) {
    // Handle arrays
    if (key.endsWith('[]')) {
      const arrayKey = key.slice(0, -2)
      if (!data[arrayKey]) {
        data[arrayKey] = []
      }
      ;(data[arrayKey] as unknown[]).push(value)
      continue
    }

    // Handle files
    if (value instanceof File) {
      if (value.size > 0) {
        data[key] = value
      }
      continue
    }

    // Handle other values
    data[key] = value
  }

  return data
}

/**
 * Format validation errors for display
 * 
 * @param errors - Validation errors object
 * @returns Formatted error messages
 * 
 * @example
 * ```ts
 * const errors = {
 *   name: { type: 'required', message: 'Name is required' },
 *   age: { type: 'min', message: 'Must be at least 18' }
 * }
 * 
 * const messages = formatValidationErrors(errors)
 * // => {
 * //   name: 'Name is required',
 * //   age: 'Must be at least 18'
 * // }
 * ```
 */
export function formatValidationErrors(
  errors: Record<string, any>
): Record<string, string> {
  const messages: Record<string, string> = {}

  for (const [key, value] of Object.entries(errors)) {
    if (value?.message) {
      messages[key] = value.message
    }
  }

  return messages
}

/**
 * Create a form data object from a plain object
 * 
 * @param data - Object to convert
 * @returns FormData object
 * 
 * @example
 * ```ts
 * const data = {
 *   name: 'John',
 *   age: 30,
 *   files: [file1, file2]
 * }
 * 
 * const formData = createFormData(data)
 * ```
 */
export function createFormData(data: Record<string, unknown>): FormData {
  const formData = new FormData()

  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) {
      continue
    }

    if (Array.isArray(value)) {
      value.forEach((item) => {
        formData.append(`${key}[]`, item)
      })
      continue
    }

    if (value instanceof File) {
      formData.append(key, value)
      continue
    }

    if (typeof value === 'object') {
      formData.append(key, JSON.stringify(value))
      continue
    }

    formData.append(key, String(value))
  }

  return formData
} 