/**
 * Schedule Client Actions Module
 * Last Updated: 2024
 * 
 * Client-side wrapper for schedule actions. Provides type-safe access to
 * server actions while maintaining client-side compatibility.
 */

'use client';

import type { Database } from '@/lib/supabase/database.types';

type Schedule = Database['public']['Tables']['schedules']['Row'];
type ScheduleInsert = Database['public']['Tables']['schedules']['Insert'];

/**
 * Creates a new schedule
 * @param data Schedule data to insert
 * @returns Created schedule
 */
export async function createSchedule(data: {
  name: string;
  start_date: string;
  end_date: string;
  status?: "draft" | "published" | "archived";
  is_active?: boolean;
  description?: string;
}) {
  const response = await fetch('/api/schedules', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...data,
      created_by: null, // Will be set by the server
      status: data.status || 'draft',
      is_active: data.is_active ?? true,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create schedule');
  }

  return response.json();
}

/**
 * Fetches schedules with optional filtering
 * @param params Query parameters for filtering
 * @returns List of schedules
 */
export async function getSchedules(params?: Record<string, any>) {
  const searchParams = new URLSearchParams(params);
  const response = await fetch(`/api/schedules?${searchParams.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch schedules');
  }

  return response.json();
}

/**
 * Publishes a schedule
 * @param id Schedule ID to publish
 * @returns Updated schedule
 */
export async function publishSchedule(id: string) {
  const response = await fetch(`/api/schedules/${id}/publish`, {
    method: 'POST',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to publish schedule');
  }

  return response.json();
}

/**
 * Unpublishes a schedule
 * @param id Schedule ID to unpublish
 * @returns Updated schedule
 */
export async function unpublishSchedule(id: string) {
  const response = await fetch(`/api/schedules/${id}/unpublish`, {
    method: 'POST',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to unpublish schedule');
  }

  return response.json();
} 