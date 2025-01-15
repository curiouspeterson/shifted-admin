/**
 * Performance Utility
 * Last Updated: 2024-03-20
 * 
 * This module provides utilities for measuring performance
 * and timing operations.
 */

/**
 * Get high-resolution timestamp in milliseconds
 */
export function now(): number {
  if (typeof performance !== 'undefined' && performance.now) {
    return performance.now()
  }
  return Date.now()
}

/**
 * Create a performance measurement
 */
export function createMeasurement() {
  const startTime = now()
  
  return {
    /**
     * Get elapsed time in milliseconds
     */
    elapsed(): number {
      return now() - startTime
    },

    /**
     * Get start time
     */
    startTime
  }
}

/**
 * Performance measurement utilities
 */
export const performance = {
  now,
  createMeasurement
} 