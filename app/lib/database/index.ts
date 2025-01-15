/**
 * Database Module Entry Point
 * Last Updated: 2024-03-19 16:40 PST
 * 
 * This file serves as the main entry point for the database module.
 * It exports all repository implementations and database utilities.
 */

import { supabase } from '@/lib/supabase/client';
import { ScheduleRepository } from './repositories/schedule';
import { AssignmentRepository } from './repositories/assignment';
import { EmployeeRepository } from './repositories/employee';
import { ShiftRepository } from './repositories/shift';
import { createTransactionManager } from './base/transaction';

// Create repository instances
export const scheduleRepository = new ScheduleRepository(supabase);
export const assignmentRepository = new AssignmentRepository(supabase);
export const employeeRepository = new EmployeeRepository(supabase);
export const shiftRepository = new ShiftRepository(supabase);

// Create transaction manager
export const transactionManager = createTransactionManager(supabase);

// Export types
export * from './base/types';

// Export repository classes (for testing/mocking)
export {
  ScheduleRepository,
  AssignmentRepository,
  EmployeeRepository,
  ShiftRepository,
};

// Export transaction utilities
export { createTransactionManager }; 