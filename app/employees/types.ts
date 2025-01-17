/**
 * Employee Types
 * Last Updated: 2025-01-16
 * 
 * Type definitions for employee-related data structures.
 * These types are aligned with the database schema and validation.
 */

import type { Database } from '@/lib/database/database.types';

// Base types from database schema
export type DbEmployee = Database['public']['Tables']['employees']['Row'];
export type DbEmployeeInsert = Database['public']['Tables']['employees']['Insert'];
export type DbEmployeeUpdate = Database['public']['Tables']['employees']['Update'];

// Enum types from database schema
export type EmployeeRole = Database['public']['Enums']['employee_role'];
export type EmployeeStatus = Database['public']['Enums']['employee_status'];

// Employee type with required fields
export interface Employee extends DbEmployee {
  full_name: string; // Computed field
}

// Input type for creating employees
export type CreateEmployeeInput = Omit<
  DbEmployeeInsert,
  'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'metadata'
>;

// Input type for updating employees
export type UpdateEmployeeInput = Partial<
  Omit<DbEmployeeUpdate, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'metadata'>
>;

// Helper function to create full name
export function getEmployeeFullName(employee: Pick<DbEmployee, 'first_name' | 'last_name'>): string {
  return `${employee.first_name} ${employee.last_name}`.trim();
}

// Helper function to check if employee is active
export function isEmployeeActive(employee: Pick<DbEmployee, 'status'>): boolean {
  return employee.status === 'active';
}

// Helper function to check if employee is supervisor or admin
export function isEmployeeSupervisor(employee: Pick<DbEmployee, 'role'>): boolean {
  return employee.role === 'supervisor' || employee.role === 'admin';
} 