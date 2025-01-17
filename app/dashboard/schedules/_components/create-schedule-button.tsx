/**
 * Create Schedule Button Component
 * Last Updated: 2024-01-16
 * 
 * A button that opens a dialog for creating a new schedule.
 */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { scheduleInputSchema } from '@/lib/schemas/schedule';
import { createSchedule } from '@/lib/actions/schedule';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FormField, FormLabel, FormMessage } from '@/components/forms/base/FormField';
import { DatePickerField } from '@/components/forms/base/DatePicker';
import { Input } from '@/components/ui/input';
import { toast } from '@/lib/utils/toast';
import type { ScheduleInput } from '@/lib/schemas/schedule';

export function CreateScheduleButton() {
  const [open, setOpen] = useState(false);
  const form = useForm<ScheduleInput>({
    resolver: zodResolver(scheduleInputSchema),
    defaultValues: {
      title: '',
      description: '',
      status: 'draft',
      isActive: true,
    },
  });

  const onSubmit = async (data: ScheduleInput) => {
    try {
      // Transform data to match API expectations
      const apiData = {
        name: data.title, // Map title to name for API
        description: data.description,
        start_date: new Date(data.startDate).toISOString().split('T')[0],
        end_date: new Date(data.endDate).toISOString().split('T')[0],
        status: data.status,
        is_active: data.isActive,
      };

      await createSchedule(apiData);
      setOpen(false);
      form.reset();
      toast.success('Schedule created successfully');
    } catch (error) {
      toast.error('Failed to create schedule');
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        Create Schedule
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Schedule</DialogTitle>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Schedule Title Field */}
            <div>
              <FormLabel htmlFor="title">Schedule Title</FormLabel>
              <Input id="title" {...form.register('title')} placeholder="Enter schedule title" />
              {form.formState.errors.title && (
                <FormMessage>{form.formState.errors.title.message}</FormMessage>
              )}
            </div>

            {/* Date Fields */}
            <div className="grid grid-cols-2 gap-4">
              <DatePickerField
                name="startDate"
                label="Start Date"
                validation={{ required: true }}
              />

              <DatePickerField
                name="endDate"
                label="End Date"
                validation={{ required: true }}
                minDate={form.getValues('startDate') ? new Date(form.getValues('startDate')) : undefined}
              />
            </div>

            {/* Description Field */}
            <div>
              <FormLabel htmlFor="description">Description</FormLabel>
              <Input id="description" {...form.register('description')} placeholder="Enter schedule description" />
              {form.formState.errors.description && (
                <FormMessage>{form.formState.errors.description.message}</FormMessage>
              )}
            </div>

            <Button type="submit">Create Schedule</Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
} 