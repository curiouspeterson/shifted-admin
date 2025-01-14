/**
 * Utils
 * Last Updated: 2024
 * 
 * Utility functions for the application.
 * Includes:
 * - Class name merging with clsx and tailwind-merge
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge class names with clsx and tailwind-merge
 * This ensures that tailwind classes are properly merged
 * and overrides work as expected
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
} 