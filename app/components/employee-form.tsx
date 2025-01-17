/**
 * Employee Form Component
 * Last Updated: 2024-01-15
 * 
 * Form for creating new employee records with validation and error handling.
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

interface EmployeeFormProps {
  onSave: () => void;
  onCancel: () => void;
}

// Employee form schema with validation
const employeeSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  position: z.enum(['employee', 'shift_supervisor', 'management']),
  hourly_rate: z.string().min(1, 'Hourly rate is required'),
  start_date: z.string().min(1, 'Start date is required'),
  phone: z.string().min(1, 'Phone number is required')
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

export default function EmployeeForm({ onSave, onCancel }: EmployeeFormProps) {
  const {
    values,
    handleChange,
    handleSubmit,
    error,
    isLoading
  } = useForm<typeof employeeSchema>({
    schema: employeeSchema,
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      position: 'employee',
      hourly_rate: '',
      start_date: '',
      phone: ''
    },
    onSubmit: async (data) => {
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new AppError(
          errorData.error || 'Failed to create employee',
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

      {/* Name Fields - Grid Layout */}
      <div className="grid grid-cols-2 gap-4">
        {/* First Name Field */}
        <div>
          <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
            First Name
          </label>
          <input
            type="text"
            id="first_name"
            name="first_name"
            value={values.first_name}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 sm:text-sm"
          />
        </div>

        {/* Last Name Field */}
        <div>
          <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
            Last Name
          </label>
          <input
            type="text"
            id="last_name"
            name="last_name"
            value={values.last_name}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 sm:text-sm"
          />
        </div>
      </div>

      {/* Email Field */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={values.email}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 sm:text-sm"
        />
      </div>

      {/* Position Selection */}
      <div>
        <label htmlFor="position" className="block text-sm font-medium text-gray-700">
          Position
        </label>
        <select
          id="position"
          name="position"
          value={values.position}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 sm:text-sm"
        >
          <option value="employee">Employee</option>
          <option value="shift_supervisor">Shift Supervisor</option>
          <option value="management">Management</option>
        </select>
      </div>

      {/* Hourly Rate Field */}
      <div>
        <label htmlFor="hourly_rate" className="block text-sm font-medium text-gray-700">
          Hourly Rate
        </label>
        <input
          type="number"
          id="hourly_rate"
          name="hourly_rate"
          value={values.hourly_rate}
          onChange={handleChange}
          required
          min="0"
          step="0.01"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 sm:text-sm"
        />
      </div>

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

      {/* Phone Number Field */}
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
          Phone Number
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={values.phone}
          onChange={handleChange}
          required
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
          {isLoading ? 'Creating...' : 'Create Employee'}
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