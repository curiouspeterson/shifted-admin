import useSWR from 'swr';
import type { Employee } from '@/app/types/scheduling';
import { mapDatabaseEmployeeToEmployee } from '../database/mappers';

interface UseEmployeesReturn {
  employees: Employee[];
  isLoading: boolean;
  isError: boolean;
  error: string | null;
}

export function useEmployees(): UseEmployeesReturn {
  const { data, error } = useSWR<{ data: Employee[]; error: string | null }>(
    '/api/employees'
  );

  return {
    employees: data?.data ? data.data.map(mapDatabaseEmployeeToEmployee) : [],
    isLoading: !error && !data,
    isError: error !== undefined || data?.error !== null,
    error: data?.error ?? null,
  };
} 