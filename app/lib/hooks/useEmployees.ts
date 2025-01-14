/**
 * Employees Hook Module
 * Last Updated: 2024
 * 
 * Custom React hook for fetching and managing employee data using SWR.
 * Provides real-time employee data with automatic revalidation and
 * error handling.
 * 
 * Features:
 * - Automatic data fetching and caching
 * - Loading and error state management
 * - Type-safe data handling
 * - Database to client data mapping
 */

import useSWR from 'swr';
import type { Employee } from '@/app/lib/types/scheduling';
import { mapDatabaseEmployeeToEmployee } from '../database/mappers';

/**
 * Return type for useEmployees hook
 * 
 * @property employees - List of all employees
 * @property isLoading - Whether employee data is currently being fetched
 * @property isError - Whether an error occurred during fetching
 * @property error - Error message if any, null otherwise
 */
interface UseEmployeesReturn {
  employees: Employee[];
  isLoading: boolean;
  isError: boolean;
  error: string | null;
}

/**
 * Custom hook for fetching employee data
 * Uses SWR for data fetching with caching and revalidation
 * 
 * @returns Object containing employee data, loading state, and error information
 */
export function useEmployees(): UseEmployeesReturn {
  // Fetch employee data using SWR
  const { data, error } = useSWR<{ data: Employee[]; error: string | null }>(
    '/api/employees'
  );

  // Return processed employee data with status information
  return {
    employees: data?.data ? data.data.map(mapDatabaseEmployeeToEmployee) : [],
    isLoading: !error && !data,
    isError: error !== undefined || data?.error !== null,
    error: data?.error ?? null,
  };
} 