/**
 * Utility Functions
 * Last Updated: 2025-01-17
 * 
 * Common utility functions used throughout the application
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges class names using clsx and tailwind-merge
 * Ensures proper handling of Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a date string using Intl.DateTimeFormat
 * Provides consistent date formatting across the app
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
}

/**
 * Formats a timestamp to a relative time string
 * Uses Intl.RelativeTimeFormat for localized relative times
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (years > 0) return rtf.format(-years, 'year');
  if (months > 0) return rtf.format(-months, 'month');
  if (days > 0) return rtf.format(-days, 'day');
  if (hours > 0) return rtf.format(-hours, 'hour');
  if (minutes > 0) return rtf.format(-minutes, 'minute');
  if (seconds > 10) return rtf.format(-seconds, 'second');
  return 'just now';
}

/**
 * Formats a number as currency
 * Uses Intl.NumberFormat for consistent currency display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Safely parses JSON with error handling
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * Generates a random string with specified length
 */
export function generateId(length: number = 8): string {
  return Array.from(
    { length },
    () => Math.random().toString(36)[2]
  ).join('');
}

/**
 * Debounces a function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
} 