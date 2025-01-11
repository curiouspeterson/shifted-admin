// Updated: 2025-01-11: This file fetches a specific schedule's details from the database in a server component.
// It then passes the data to the EditScheduleClient component for editing.

import { supabaseAdmin } from '@/lib/supabase/admin'
import EditScheduleClient from './EditScheduleClient'
import { notFound } from 'next/navigation'

// This is now a Server Component
export default async function EditSchedulePage({ params }: { params: { id: string } }) {
  const scheduleId = params.id

  // Fetch schedule details in the server component
  let initialData = null;
  let error = null;

  try {
    const { data: schedule, error: fetchError } = await supabaseAdmin
      .from('schedules')
      .select('*')
      .eq('id', scheduleId)
      .single()

    if (fetchError) throw fetchError;
    if (!schedule) {
      notFound();
    };

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
    <EditScheduleClient scheduleId={scheduleId} initialData={initialData} error={error} />
  );
} 