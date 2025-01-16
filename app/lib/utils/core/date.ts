/**
 * Date Utilities
 * Last Updated: 2024-03-21
 * 
 * Common date formatting and manipulation utilities.
 * Uses date-fns for consistent date handling.
 */

import { format, parseISO, isValid } from 'date-fns'

/**
 * Format a date into a readable string
 * 
 * @param date - Date to format (Date object or ISO string)
 * @param formatStr - Format string (defaults to 'PPP')
 * @returns Formatted date string
 * 
 * @example
 * ```ts
 * formatDate(new Date())
 * // => 'March 21st, 2024'
 * 
 * formatDate('2024-03-21', 'MM/dd/yyyy')
 * // => '03/21/2024'
 * ```
 */
export function formatDate(date: Date | string, formatStr = 'PPP'): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(dateObj)) {
      throw new Error('Invalid date')
    }
    return format(dateObj, formatStr)
  } catch (error) {
    console.error('Error formatting date:', error)
    return 'Invalid date'
  }
}

/**
 * Format a time into a readable string
 * 
 * @param date - Date to format (Date object or ISO string)
 * @param formatStr - Format string (defaults to 'p')
 * @returns Formatted time string
 * 
 * @example
 * ```ts
 * formatTime(new Date())
 * // => '3:45 PM'
 * 
 * formatTime('2024-03-21T15:45:00', 'HH:mm')
 * // => '15:45'
 * ```
 */
export function formatTime(date: Date | string, formatStr = 'p'): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(dateObj)) {
      throw new Error('Invalid date')
    }
    return format(dateObj, formatStr)
  } catch (error) {
    console.error('Error formatting time:', error)
    return 'Invalid time'
  }
}

/**
 * Format a date and time into a readable string
 * 
 * @param date - Date to format (Date object or ISO string)
 * @param formatStr - Format string (defaults to 'PPp')
 * @returns Formatted date and time string
 * 
 * @example
 * ```ts
 * formatDateTime(new Date())
 * // => 'March 21st, 2024 at 3:45 PM'
 * 
 * formatDateTime('2024-03-21T15:45:00', 'MM/dd/yyyy HH:mm')
 * // => '03/21/2024 15:45'
 * ```
 */
export function formatDateTime(date: Date | string, formatStr = 'PPp'): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(dateObj)) {
      throw new Error('Invalid date')
    }
    return format(dateObj, formatStr)
  } catch (error) {
    console.error('Error formatting date and time:', error)
    return 'Invalid date and time'
  }
} 