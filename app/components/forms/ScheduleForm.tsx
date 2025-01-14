/**
 * Schedule Form Component
 * Last Updated: 2024
 * 
 * A form component for creating and editing schedules. Handles the collection
 * of schedule metadata including name, description, date range, and status.
 * Uses react-hook-form for form management and zod for schema validation.
 * 
 * Features:
 * - Schedule metadata collection
 * - Date range selection
 * - Status management
 * - Active state toggle
 * - Form validation
 * - Error handling
 */

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ScheduleFormData } from '@/app/lib/schemas/forms';
import { scheduleFormSchema } from '@/app/lib/schemas/forms';

/**
 * Schedule Form Props Interface
 * @property onSubmit - Callback function for form submission
 * @property defaultValues - Optional initial form values
 */
interface ScheduleFormProps {
  onSubmit: (data: ScheduleFormData) => Promise<void>;
  defaultValues?: Partial<ScheduleFormData>;
}

/**
 * Schedule Form Component
 * Form for creating and editing schedule metadata
 * 
 * @param props - Component properties
 * @param props.onSubmit - Success callback
 * @param props.defaultValues - Initial values
 * @returns A form for schedule metadata entry
 */
export function ScheduleForm({ onSubmit, defaultValues }: ScheduleFormProps) {
  // Form management with react-hook-form
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      status: 'draft',
      is_active: true,
      ...defaultValues,
    },
  });

  /**
   * Form Submission Handler
   * Processes the form submission and resets form on success
   * @param data - Form data to submit
   */
  const onSubmitForm = async (data: ScheduleFormData) => {
    try {
      await onSubmit(data);
      reset();
    } catch (error) {
      console.error('Failed to submit schedule:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
      {/* Schedule Name Field */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Schedule Name
        </label>
        <input
          type="text"
          id="name"
          {...register('name')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      {/* Description Field */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id="description"
          {...register('description')}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      {/* Date Range Fields */}
      <div className="grid grid-cols-2 gap-4">
        {/* Start Date Field */}
        <div>
          <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
            Start Date
          </label>
          <input
            type="date"
            id="start_date"
            {...register('start_date')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          {errors.start_date && (
            <p className="mt-1 text-sm text-red-600">{errors.start_date.message}</p>
          )}
        </div>

        {/* End Date Field */}
        <div>
          <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">
            End Date
          </label>
          <input
            type="date"
            id="end_date"
            {...register('end_date')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          {errors.end_date && (
            <p className="mt-1 text-sm text-red-600">{errors.end_date.message}</p>
          )}
        </div>
      </div>

      {/* Status Selection */}
      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700">
          Status
        </label>
        <select
          id="status"
          {...register('status')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
        {errors.status && (
          <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
        )}
      </div>

      {/* Active State Toggle */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="is_active"
          {...register('is_active')}
          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
        <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
          Active Schedule
        </label>
        {errors.is_active && (
          <p className="mt-1 text-sm text-red-600">{errors.is_active.message}</p>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Save Schedule'}
        </button>
      </div>
    </form>
  );
} 