'use client';

/**
 * Schedule Form Component
 * Last Updated: 2024-03
 * 
 * A form component for creating and editing schedules.
 * Features:
 * - Schedule metadata collection
 * - Date range selection
 * - Status management
 * - Active state toggle
 * - Form validation
 * - Error handling
 */

import * as React from 'react';
import { z } from 'zod';
import { useForm } from '@/app/hooks/form';
import {
  FormWrapper,
  FormInput,
  FormSelect,
  FormDatePicker,
} from '../base';
import { Button } from '@/components/ui/button';

/**
 * Schedule Form Schema
 */
const scheduleFormSchema = z.object({
  name: z.string().min(1, 'Schedule name is required'),
  description: z.string().optional(),
  start_date: z.date({
    required_error: 'Start date is required',
  }),
  end_date: z.date({
    required_error: 'End date is required',
  }),
  status: z.enum(['draft', 'published', 'archived'], {
    required_error: 'Status is required',
  }).default('draft'),
  is_active: z.boolean().default(true),
}).refine((data) => {
  return data.end_date >= data.start_date;
}, {
  message: 'End date must be after start date',
  path: ['end_date'],
});

type ScheduleFormData = z.infer<typeof scheduleFormSchema>;

/**
 * Schedule Form Props Interface
 */
interface ScheduleFormProps {
  onSubmit: (data: ScheduleFormData) => Promise<void>;
  defaultValues?: Partial<ScheduleFormData>;
}

/**
 * Status Options
 */
const statusOptions = [
  { label: 'Draft', value: 'draft' },
  { label: 'Published', value: 'published' },
  { label: 'Archived', value: 'archived' },
];

/**
 * Schedule Form Component
 */
export function ScheduleForm({
  onSubmit,
  defaultValues,
}: ScheduleFormProps) {
  const {
    form,
    isLoading,
    error,
    handleSubmit,
    reset,
  } = useForm<typeof scheduleFormSchema>({
    schema: scheduleFormSchema,
    defaultValues: {
      status: 'draft',
      is_active: true,
      ...defaultValues,
    },
    onSubmit,
    onSuccess: () => {
      reset();
    },
  });

  return (
    <FormWrapper
      isLoading={isLoading}
      error={error}
      onSubmit={form.handleSubmit(handleSubmit)}
      className="space-y-6"
    >
      {/* Schedule Name Field */}
      <FormInput
        name="name"
        label="Schedule Name"
        description="Enter a name for the schedule"
        placeholder="Q1 2024 Schedule"
      />

      {/* Description Field */}
      <FormInput
        name="description"
        label="Description"
        description="Optional description for the schedule"
        placeholder="Schedule for Q1 2024"
        type="textarea"
      />

      {/* Date Range Fields */}
      <div className="grid grid-cols-2 gap-4">
        <FormDatePicker
          name="start_date"
          label="Start Date"
          description="Select the schedule start date"
        />

        <FormDatePicker
          name="end_date"
          label="End Date"
          description="Select the schedule end date"
        />
      </div>

      {/* Status Selection */}
      <FormSelect
        name="status"
        label="Status"
        description="Select the schedule status"
        options={statusOptions}
      />

      {/* Active State Toggle */}
      <FormInput
        type="checkbox"
        name="is_active"
        label="Active Schedule"
        description="Whether this schedule is currently active"
      />

      {/* Form Actions */}
      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => reset()}
          disabled={isLoading}
        >
          Reset
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : 'Save Schedule'}
        </Button>
      </div>
    </FormWrapper>
  );
} 