/**
 * Edit Schedule Page Module
 * Last Updated: 2025-01-11
 * 
 * Server component that handles fetching and displaying schedule details for editing.
 * Fetches schedule data from Supabase and passes it to the client component.
 * 
 * Features:
 * - Server-side data fetching
 * - Error handling and notFound routing
 * - Type-safe props
 * - Separation of server/client concerns
 * 
 * Route: /dashboard/schedules/edit/[id]
 */

import { supabaseAdmin } from '@/lib/supabase/admin'
import EditScheduleClient from './EditScheduleClient'
import { notFound } from 'next/navigation'

/**
 * Props interface for the EditSchedulePage component
 * 
 * @property params.id - Schedule ID from dynamic route parameter
 */
interface EditSchedulePageProps {
  params: {
    id: string;
  };
}

/**
 * Edit Schedule Page Component
 * Server component that fetches schedule data and renders the edit interface
 * 
 * @component
 * @param props - Component props containing route parameters
 * @returns React server component for editing schedule
 * 
 * @throws {Error} When schedule fetch fails
 * @throws {notFound} When schedule doesn't exist
 * 
 * @example
 * ```tsx
 * // Rendered automatically by Next.js when navigating to /dashboard/schedules/edit/123
 * <EditSchedulePage params={{ id: "123" }} />
 * ```
 */
export default async function EditSchedulePage({ params }: EditSchedulePageProps) {
  const scheduleId = params.id

  // Initialize state variables
  let initialData: {
    start_date: string;
    end_date: string;
    status: string;
    name: string;
  } | null = null;
  let error: string | null = null;

  try {
    // Fetch schedule details from Supabase
    const { data: schedule, error: fetchError } = await supabaseAdmin
      .from('schedules')
      .select('*')
      .eq('id', scheduleId)
      .single()

    // Handle fetch errors
    if (fetchError) throw fetchError;
    if (!schedule) {
      notFound();
    };

    // Transform database data into component props
    initialData = {
      start_date: schedule.start_date,
      end_date: schedule.end_date,
      status: schedule.status,
      name: schedule.name
    };
  } catch (err) {
    console.error('Error fetching schedule:', err);
    error = err instanceof Error ? err.message : 'Failed to load schedule';
  }

  return (
    <EditScheduleClient 
      scheduleId={scheduleId} 
      initialData={initialData} 
      error={error} 
    />
  );
} 