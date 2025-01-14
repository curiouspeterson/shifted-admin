/**
 * @file utils.ts
 * @description Utility functions for handling CSS class names and Tailwind CSS merging
 * @lastUpdated 2024-01-24
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merges multiple class names or class value arrays into a single string,
 * resolving Tailwind CSS conflicts in the process.
 * 
 * This utility combines the power of clsx for conditional class name handling
 * with tailwind-merge for proper Tailwind CSS class merging. It helps prevent
 * duplicate or conflicting Tailwind classes while maintaining readability.
 * 
 * @param inputs - Array of class values that can include strings, objects, or arrays
 * @returns A merged string of class names with resolved Tailwind conflicts
 * 
 * @example
 * // Basic usage
 * cn('px-2', 'py-1') // => 'px-2 py-1'
 * 
 * @example
 * // With conditional classes
 * cn('px-2', isActive && 'bg-blue-500') 
 * 
 * @example
 * // Resolving Tailwind conflicts
 * cn('px-2 py-1', 'px-4') // => 'py-1 px-4'
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
