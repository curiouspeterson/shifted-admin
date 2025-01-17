/**
 * Request Form Component
 * Last Updated: 2024-01-15
 * 
 * Form for submitting time-off requests with validation and error handling.
 * Features:
 * - Type-safe form handling
 * - Zod schema validation
 * - Loading state management
 * - Error feedback
 * - Success/failure callbacks
 */

'use client';

import { z } from 'zod';
import { useForm } from '@/hooks/form';
import { AppError } from '@/lib/errors';

interface RequestFormProps {
  onSave: () => void;
  onCancel: () => void;
}

// Request form schema with validation
const requestSchema = z.object({
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  request_type: z.enum(['vacation', 'sick', 'personal', 'other']),
  reason: z.string().optional()
}).refine(
  (data) => new Date(data.start_date) <= new Date(data.end_date),
  { message: 'End date must be after or equal to start date' }
);

type RequestFormData = z.infer<typeof requestSchema>;

export default function RequestForm({ onSave, onCancel }: RequestFormProps) {
  const {
    values,
    handleChange,
    handleSubmit,
    error,
    isLoading
  } = useForm<typeof requestSchema>({
    schema: requestSchema,
    defaultValues: {
      start_date: '',
      end_date: '',
      request_type: 'vacation',
      reason: ''
    },
    onSubmit: async (data) => {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new AppError(
          errorData.error || 'Failed to create request',
          'API_ERROR',
          response.status,
          { data: errorData }
        );
      }

      onSave();
    }
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Error Display */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error.message}</div>
        </div>
      )}

      {/* Date Range Selection - Grid Layout */}
      <div className="grid grid-cols-2 gap-4">
        {/* Start Date Field */}
        <div>
          <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
            Start Date
          </label>
          <input
            type="date"
            id="start_date"
            name="start_date"
            value={values.start_date}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 sm:text-sm"
          />
        </div>

        {/* End Date Field */}
        <div>
          <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">
            End Date
          </label>
          <input
            type="date"
            id="end_date"
            name="end_date"
            value={values.end_date}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 sm:text-sm"
          />
        </div>
      </div>

      {/* Request Type Selection */}
      <div>
        <label htmlFor="request_type" className="block text-sm font-medium text-gray-700">
          Request Type
        </label>
        <select
          id="request_type"
          name="request_type"
          value={values.request_type}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 sm:text-sm"
        >
          <option value="vacation">Vacation</option>
          <option value="sick">Sick Leave</option>
          <option value="personal">Personal</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Optional Reason Field */}
      <div>
        <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
          Reason (optional)
        </label>
        <textarea
          id="reason"
          name="reason"
          rows={3}
          value={values.reason || ''}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 sm:text-sm"
        />
      </div>

      {/* Form Actions */}
      <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:col-start-2 sm:text-sm"
        >
          {isLoading ? 'Submitting...' : 'Submit Request'}
        </button>

        {/* Cancel Button */}
        <button
          type="button"
          onClick={onCancel}
          className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:col-start-1 sm:mt-0 sm:text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
} 