/**
 * Schedule Form Component
 * Last Updated: 2024-03-20 02:35 PST
 * 
 * This component provides a form for creating and editing schedules.
 */

'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useScheduleForm, type ScheduleFormData } from '@/hooks/use-schedule-form';
import {
  Button,
  Input,
  Textarea,
  DatePicker,
  Switch,
  Label,
} from '@/components/ui';
import { cn } from '@/lib/utils';

interface ScheduleFormProps {
  initialData?: Partial<ScheduleFormData>;
  className?: string;
}

export function ScheduleForm({ initialData, className }: ScheduleFormProps) {
  const router = useRouter();
  const { defaultData, errors, handleSubmit } = useScheduleForm(initialData);

  const onSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data: Partial<ScheduleFormData> = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      start_date: formData.get('start_date') as string,
      end_date: formData.get('end_date') as string,
      is_active: formData.get('is_active') === 'true',
    };

    try {
      await handleSubmit(data);
      router.push('/schedules');
    } catch (error) {
      // Error is handled by the form hook
      console.error('Form submission failed:', error);
    }
  }, [handleSubmit, router]);

  return (
    <form onSubmit={onSubmit} className={cn('space-y-6', className)}>
      {errors.root && (
        <div className="p-4 rounded-md bg-red-50 text-red-900">
          {errors.root}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            defaultValue={defaultData.name}
            className={cn(errors.name && 'border-red-500')}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-500">{errors.name}</p>
          )}
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            defaultValue={defaultData.description}
            className={cn(errors.description && 'border-red-500')}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-500">{errors.description}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="start_date">Start Date</Label>
            <DatePicker
              id="start_date"
              name="start_date"
              defaultValue={defaultData.start_date}
              className={cn(errors.start_date && 'border-red-500')}
            />
            {errors.start_date && (
              <p className="mt-1 text-sm text-red-500">{errors.start_date}</p>
            )}
          </div>

          <div>
            <Label htmlFor="end_date">End Date</Label>
            <DatePicker
              id="end_date"
              name="end_date"
              defaultValue={defaultData.end_date}
              className={cn(errors.end_date && 'border-red-500')}
            />
            {errors.end_date && (
              <p className="mt-1 text-sm text-red-500">{errors.end_date}</p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="is_active"
            name="is_active"
            defaultChecked={defaultData.is_active}
          />
          <Label htmlFor="is_active">Active</Label>
          {errors.is_active && (
            <p className="text-sm text-red-500">{errors.is_active}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
        <Button type="submit">
          Save Schedule
        </Button>
      </div>
    </form>
  );
} 