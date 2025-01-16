/**
 * Validation Utilities
 * Last Updated: 2024-03-21
 * 
 * Common validation and helper utilities.
 */

/**
 * Debounce a function call
 * 
 * @param fn - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 * 
 * @example
 * ```ts
 * const debouncedSearch = debounce((query: string) => {
 *   // Search logic here
 * }, 300)
 * 
 * // Call the debounced function
 * debouncedSearch('test')
 * ```
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout
  
  return function (...args: Parameters<T>) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}

/**
 * Create a deep clone of an object
 * 
 * @param obj - Object to clone
 * @returns Deep cloned object
 * 
 * @example
 * ```ts
 * const obj = { a: 1, b: { c: 2 } }
 * const clone = deepClone(obj)
 * // => { a: 1, b: { c: 2 } }
 * ```
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item)) as unknown as T
  }
  
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [key, deepClone(value)])
  ) as T
}

/**
 * Check if a value is empty
 * 
 * @param value - Value to check
 * @returns True if the value is empty
 * 
 * @example
 * ```ts
 * isEmpty('')      // => true
 * isEmpty([])      // => true
 * isEmpty({})      // => true
 * isEmpty(null)    // => true
 * isEmpty('test')  // => false
 * ```
 */
export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) {
    return true
  }
  
  if (typeof value === 'string' || Array.isArray(value)) {
    return value.length === 0
  }
  
  if (typeof value === 'object') {
    return Object.keys(value as object).length === 0
  }
  
  return false
}

/**
 * Ensure a value is within a range
 * 
 * @param value - Value to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped value
 * 
 * @example
 * ```ts
 * clamp(5, 0, 10)   // => 5
 * clamp(-5, 0, 10)  // => 0
 * clamp(15, 0, 10)  // => 10
 * ```
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Check if a value is a valid email address
 * 
 * @param email - Email address to validate
 * @returns True if the email is valid
 * 
 * @example
 * ```ts
 * isValidEmail('test@example.com')  // => true
 * isValidEmail('invalid-email')     // => false
 * ```
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
} 