/**
 * Create Schedule Button Component
 * Last Updated: 2024
 * 
 * This component provides a button that opens a dialog for creating a new schedule.
 * It handles form validation, date selection, and schedule creation through server actions.
 */

'use client';

import { useRouter } from 'next/navigation';
import { useTransition, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createSchedule } from '@/lib/actions/schedule.client';
import { scheduleSchema } from '@/lib/schemas/schedule';

type FormValues = z.infer<typeof scheduleSchema>;

export function CreateScheduleButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      name: '',
      start_date: '',
      end_date: '',
      status: 'draft',
      is_active: true,
    },
  });

  const onSubmit = async (data: FormValues) => {
    startTransition(async () => {
      try {
        const result = await createSchedule(data);
        if (result.error) {
          throw new Error(result.error);
        }
        setOpen(false);
        router.refresh();
        router.push(`/dashboard/schedules/${result.data.id}`);
      } catch (error) {
        console.error('Failed to create schedule:', error);
        // Handle error (show toast, etc.)
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create Schedule</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Schedule</DialogTitle>
          <DialogDescription>
            Create a new schedule by filling out the form below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              {...form.register('name')}
              placeholder="Enter schedule name"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="start_date">Start Date</Label>
            <Input
              id="start_date"
              type="date"
              {...form.register('start_date')}
            />
            {form.formState.errors.start_date && (
              <p className="text-sm text-red-500">
                {form.formState.errors.start_date.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="end_date">End Date</Label>
            <Input
              id="end_date"
              type="date"
              {...form.register('end_date')}
            />
            {form.formState.errors.end_date && (
              <p className="text-sm text-red-500">
                {form.formState.errors.end_date.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              {...form.register('description')}
              placeholder="Enter schedule description"
            />
          </div>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Creating...' : 'Create Schedule'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
} 