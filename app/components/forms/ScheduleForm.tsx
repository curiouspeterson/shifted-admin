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
 * - Form validation
 * - Error handling
 */

import * as React from 'react';
import type { ScheduleFormData } from '@/lib/schemas';
import { scheduleFormSchema } from '@/lib/schemas';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  Input,
  Button,
} from '@/components/ui';
import { BaseForm, SelectField, DateField, TextareaField } from '../forms/base';

interface ScheduleFormProps {
  onSubmit: (data: ScheduleFormData) => Promise<void>;
  defaultValues?: Partial<ScheduleFormData>;
}

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
];

export function ScheduleForm({ onSubmit, defaultValues }: ScheduleFormProps) {
  return (
    <BaseForm
      schema={scheduleFormSchema}
      onSubmit={onSubmit}
      defaultValues={{
        name: '',
        start_date: '',
        end_date: '',
        status: 'draft',
        ...defaultValues,
      }}
      className="space-y-6"
    >
      {(form) => (
        <>
          {/* Schedule Name Field */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Schedule Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter schedule name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Description Field */}
          <TextareaField
            form={form}
            name="description"
            label="Description"
            placeholder="Enter a description for the schedule"
            description="Provide details about the schedule's purpose and any special requirements."
          />

          {/* Date Range Fields */}
          <div className="grid grid-cols-2 gap-4">
            <DateField
              form={form}
              name="start_date"
              label="Start Date"
            />
            <DateField
              form={form}
              name="end_date"
              label="End Date"
            />
          </div>

          {/* Status Selection */}
          <SelectField
            form={form}
            name="status"
            label="Status"
            options={STATUS_OPTIONS}
            placeholder="Select status"
          />

          {/* Form Actions */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? 'Saving...' : 'Save Schedule'}
            </Button>
          </div>
        </>
      )}
    </BaseForm>
  );
} 