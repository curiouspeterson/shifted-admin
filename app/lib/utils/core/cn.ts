/**
 * Class Name Utility
 * Last Updated: 2024-03-21
 * 
 * Utility for merging class names with Tailwind CSS support.
 * Uses clsx for conditional classes and tailwind-merge for
 * deduplicating Tailwind CSS classes.
 */

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge class names with Tailwind CSS support
 * 
 * @param inputs - Class names to merge
 * @returns Merged class names string
 * 
 * @example
 * ```tsx
 * // Basic usage
 * cn('px-2 py-1', 'bg-blue-500')
 * // => 'px-2 py-1 bg-blue-500'
 * 
 * // With conditions
 * cn('px-2 py-1', isActive && 'bg-blue-500')
 * // => 'px-2 py-1 bg-blue-500' or 'px-2 py-1'
 * 
 * // With Tailwind conflicts
 * cn('px-2 py-1', 'px-4')
 * // => 'py-1 px-4'
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
} 