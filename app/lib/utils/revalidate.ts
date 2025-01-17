/**
 * Cache Revalidation Utilities
 * Last Updated: 2024-03-21
 * 
 * Utility functions for revalidating cached data.
 */

import { revalidateTag } from 'next/cache';

/**
 * Revalidate schedule-related cache entries
 */
export async function revalidateSchedule(scheduleId: string) {
  revalidateTag('schedule');
}

/**
 * Revalidate employee-related cache entries
 */
export async function revalidateEmployee(employeeId: string) {
  revalidateTag('employee');
}

/**
 * Revalidate shift-related cache entries
 */
export async function revalidateShift(shiftId: string) {
  revalidateTag('shift');
} 