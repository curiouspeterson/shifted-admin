/**
 * Employee Hooks
 * Last Updated: 2024-03
 * 
 * Custom hooks for fetching and managing employees.
 * Provides type-safe access to employee data with loading and error states.
 */

import { useQuery } from './use-query';
import { supabase } from '@/lib/supabase/client';
import type { Employee, EmployeePosition } from '@/lib/schemas';

/**
 * Use Employee
 * Fetches a single employee by ID
 */
export function useEmployee(id: string) {
  return useQuery<Employee>(async () => {
    return await supabase
      .from('employees')
      .select('*')
      .eq('id', id)
      .single();
  });
}

/**
 * Use Employees
 * Fetches all employees with optional filters
 */
export function useEmployees(filters?: {
  isActive?: boolean;
  position?: EmployeePosition;
}) {
  return useQuery<Employee[]>(async () => {
    let query = supabase
      .from('employees')
      .select('*')
      .order('last_name', { ascending: true });

    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }

    if (filters?.position) {
      query = query.eq('position', filters.position);
    }

    return await query;
  });
}

/**
 * Use Create Employee
 * Creates a new employee
 */
export async function createEmployee(
  data: Omit<Employee, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>
) {
  const { data: employee, error } = await supabase
    .from('employees')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return employee;
}

/**
 * Use Update Employee
 * Updates an existing employee
 */
export async function updateEmployee(
  id: string,
  data: Partial<Omit<Employee, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>>
) {
  const { data: employee, error } = await supabase
    .from('employees')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return employee;
}

/**
 * Use Delete Employee
 * Soft deletes an employee by setting is_active to false
 */
export async function deleteEmployee(id: string) {
  const { data: employee, error } = await supabase
    .from('employees')
    .update({ is_active: false })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return employee;
} 