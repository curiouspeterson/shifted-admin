/**
 * Performance Utility
 * Last Updated: 2024-03-20
 * 
 * This module provides utilities for measuring performance
 * and timing operations.
 */

// Cache global performance object to avoid recursion
const globalPerf = typeof performance !== 'undefined' ? performance : null

/**
 * Get high-resolution timestamp in milliseconds
 */
export function now(): number {
  if (globalPerf?.now) {
    return globalPerf.now()
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
export const perf = {
  now,
  createMeasurement
}