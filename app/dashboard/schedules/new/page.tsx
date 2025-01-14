/**
 * New Schedule Page Module
 * Last Updated: 2024-01-11
 * 
 * Client component that handles creating new schedules. Provides form interface
 * and handles submission flow including error states and navigation.
 * 
 * Features:
 * - Form-based schedule creation
 * - Error state handling and display
 * - Navigation after successful creation
 * - Responsive layout
 * - Type-safe form data handling
 * 
 * Route: /dashboard/schedules/new
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ScheduleForm } from '@/app/components/forms/ScheduleForm';
import type { ScheduleFormData } from '@/app/lib/schemas/forms';
import { createSchedule } from '@/app/lib/actions/schedule';

/**
 * New Schedule Page Component
 * Provides the UI and interaction handlers for creating a new schedule
 * 
 * @component
 * @returns React component for creating new schedule
 * 
 * @example
 * ```tsx
 * // Rendered automatically by Next.js when navigating to /dashboard/schedules/new
 * <NewSchedulePage />
 * ```
 */
export default function NewSchedulePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  /**
   * Handles form submission for creating a new schedule
   * Processes the form data, handles errors, and navigates on success
   * 
   * @param data - Validated schedule form data
   * @returns Promise<void>
   * 
   * @example
   * ```tsx
   * handleSubmit({
   *   name: "Week 1 Schedule",
   *   start_date: "2024-01-01",
   *   end_date: "2024-01-07",
   *   status: "draft"
   * });
   * ```
   */
  const handleSubmit = async (data: ScheduleFormData) => {
    setError(null);
    const result = await createSchedule(data);
    
    if (result.error) {
      console.error('Failed to create schedule:', result.error);
      setError(result.error);
      return;
    }

    if (!result.data) {
      console.error('No schedule data returned');
      setError('Failed to create schedule');
      return;
    }

    // Navigate to the new schedule's page
    router.push(`/dashboard/schedules/${result.data.id}`);
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-8">Create New Schedule</h1>
      {error && (
        <div className="mb-4 p-4 text-sm text-red-800 bg-red-100 rounded-lg" role="alert">
          {error}
        </div>
      )}
      <ScheduleForm onSubmit={handleSubmit} />
    </div>
  );
} 