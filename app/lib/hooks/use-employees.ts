/**
 * useEmployees Hook
 * Last Updated: 2024-01-16
 * 
 * Custom hook for fetching and managing employee data
 */

'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '../database/database.types';

type Employee = Database['public']['Tables']['employees']['Row'];

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    async function fetchEmployees() {
      try {
        const { data, error } = await supabase
          .from('employees')
          .select('*')
          .eq('is_active', true)
          .order('last_name', { ascending: true });

        if (error) throw error;
        setEmployees(data || []);
      } catch (e) {
        setError(e as Error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchEmployees();
  }, [supabase]);

  return { employees, isLoading, error };
} 