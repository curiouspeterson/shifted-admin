/**
 * String Utilities
 * Last Updated: 2024-03-21
 * 
 * Common string manipulation utilities.
 */

/**
 * Truncate a string to a maximum length and append an ellipsis
 * 
 * @param str - String to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated string with ellipsis if needed
 * 
 * @example
 * ```ts
 * truncateText('This is a long string', 10)
 * // => 'This is...'
 * 
 * truncateText('Short', 10)
 * // => 'Short'
 * ```
 */
export function truncateText(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - 3) + '...'
}

/**
 * Generate a random ID string
 * 
 * @param length - Length of the ID (default: 8)
 * @returns Random ID string
 * 
 * @example
 * ```ts
 * generateId()
 * // => 'a1b2c3d4'
 * 
 * generateId(4)
 * // => 'w9x8'
 * ```
 */
export function generateId(length = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  return Array.from(
    { length },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join('')
}

/**
 * Convert a string to title case
 * 
 * @param str - String to convert
 * @returns Title cased string
 * 
 * @example
 * ```ts
 * toTitleCase('hello world')
 * // => 'Hello World'
 * 
 * toTitleCase('THE QUICK BROWN FOX')
 * // => 'The Quick Brown Fox'
 * ```
 */
export function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Convert a string to kebab case
 * 
 * @param str - String to convert
 * @returns Kebab cased string
 * 
 * @example
 * ```ts
 * toKebabCase('Hello World')
 * // => 'hello-world'
 * 
 * toKebabCase('ThisIsATest')
 * // => 'this-is-a-test'
 * ```
 */
export function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()
}

/**
 * Convert a string to camel case
 * 
 * @param str - String to convert
 * @returns Camel cased string
 * 
 * @example
 * ```ts
 * toCamelCase('hello world')
 * // => 'helloWorld'
 * 
 * toCamelCase('this-is-a-test')
 * // => 'thisIsATest'
 * ```
 */
export function toCamelCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '')
} 