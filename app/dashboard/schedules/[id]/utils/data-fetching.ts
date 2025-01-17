/**
 * Schedule Data Fetching Utilities
 * Last Updated: 2024-03-21
 * 
 * Utility functions for fetching schedule data with proper caching and type safety.
 */

import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { unstable_cache as cache } from 'next/cache';
import type { Schedule, Assignment, TimeBasedRequirement } from '@/lib/types/scheduling';
import type { GroupedAssignments } from '@/lib/scheduling/utils/schedule.types';
import type { ApiResponse } from '@/lib/types/api';

// Cache static schedule data with type safety
export const getScheduleDetails = cache(
  async (scheduleId: string): Promise<ApiResponse<Schedule>> => {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('id', scheduleId)
        .single();
      
      if (error) {
        return {
          status: 'error',
          error: {
            message: error.message,
            code: error.code
          }
        };
      }
      
      if (!data) {
        return { status: 'notFound' };
      }
      
      return {
        status: 'success',
        data
      };
    } catch (error) {
      return {
        status: 'error',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  },
  ['schedule-details'],
  {
    revalidate: 60, // Revalidate every minute
    tags: ['schedule']
  }
);

// Fetch assignments with streaming support and type safety
export async function getAssignments(scheduleId: string): Promise<ApiResponse<GroupedAssignments>> {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  
  try {
    const { data, error } = await supabase
      .from('schedule_assignments')
      .select(`
        *,
        employee:employees(*),
        shift:shifts(*)
      `)
      .eq('schedule_id', scheduleId);
    
    if (error) {
      return {
        status: 'error',
        error: {
          message: error.message,
          code: error.code
        }
      };
    }
    
    // Transform assignments into grouped format with type safety
    const transformedAssignments = (data as Assignment[]).reduce<GroupedAssignments>((acc, assignment) => {
      const date = assignment.date;
      const shiftId = assignment.shift_id;
      
      if (!date || !shiftId) return acc;
      
      if (!acc[date]) {
        acc[date] = {};
      }
      
      if (!acc[date][shiftId]) {
        acc[date][shiftId] = [];
      }
      
      acc[date][shiftId].push(assignment);
      return acc;
    }, {});
    
    return {
      status: 'success',
      data: transformedAssignments
    };
  } catch (error) {
    return {
      status: 'error',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

// Cache time requirements with revalidation and type safety
export const getTimeRequirements = cache(
  async (scheduleId: string): Promise<ApiResponse<TimeBasedRequirement[]>> => {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    
    try {
      const { data, error } = await supabase
        .from('time_requirements')
        .select('*')
        .eq('schedule_id', scheduleId);
      
      if (error) {
        return {
          status: 'error',
          error: {
            message: error.message,
            code: error.code
          }
        };
      }
      
      return {
        status: 'success',
        data: data || []
      };
    } catch (error) {
      return {
        status: 'error',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  },
  ['time-requirements'],
  {
    revalidate: 300, // Revalidate every 5 minutes
    tags: ['schedule']
  }
); 