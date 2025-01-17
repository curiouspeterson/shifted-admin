/**
 * Schedule Form Component
 * Last Updated: 2024-01-16
 * 
 * A form component for creating and editing schedules.
 */

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { scheduleFormSchema } from '@/lib/schemas/forms';
import type { ScheduleFormData } from '@/lib/schemas/forms';
import { FormField, FormLabel, FormMessage } from '../forms/base/form-field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DatePicker } from '../forms/base/date-picker';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

interface ScheduleFormProps {
  initialData?: Partial<ScheduleFormData>;
  onSubmit: (data: ScheduleFormData) => Promise<void>;
}

export function ScheduleForm({
  initialData,
  onSubmit
}: ScheduleFormProps) {
  const form = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      title: initialData?.title || '',
      startDate: initialData?.startDate || new Date(),
      endDate: initialData?.endDate || new Date(),
      description: initialData?.description || '',
      status: initialData?.status || 'draft'
    }
  });

  const handleSubmit = async (data: ScheduleFormData) => {
    await onSubmit(data);
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <FormField name="title">
        <FormLabel>Title</FormLabel>
        <Input
          {...form.register('title')}
          placeholder="Enter schedule title"
        />
        <FormMessage />
      </FormField>

      <FormField name="startDate">
        <FormLabel>Start Date</FormLabel>
        <DatePicker
          selected={form.getValues('startDate')}
          onSelect={(date: Date | null) => form.setValue('startDate', date || new Date())}
        />
        <FormMessage />
      </FormField>

      <FormField name="endDate">
        <FormLabel>End Date</FormLabel>
        <DatePicker
          selected={form.getValues('endDate')}
          onSelect={(date: Date | null) => form.setValue('endDate', date || new Date())}
        />
        <FormMessage />
      </FormField>

      <FormField name="description">
        <FormLabel>Description</FormLabel>
        <Input
          {...form.register('description')}
          placeholder="Enter schedule description"
        />
        <FormMessage />
      </FormField>

      <FormField name="status">
        <FormLabel>Status</FormLabel>
        <Select
          onValueChange={(value) => form.setValue('status', value as 'draft' | 'published' | 'archived')}
          value={form.watch('status')}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <FormMessage />
      </FormField>

      <Button type="submit">
        {initialData ? 'Update Schedule' : 'Create Schedule'}
      </Button>
    </form>
  );
} 