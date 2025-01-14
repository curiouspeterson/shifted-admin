/**
 * Create Schedule Button Component
 * Last Updated: 2024
 * 
 * This component provides a button to create new schedules.
 * It includes:
 * - A dialog for entering schedule details
 * - Form validation
 * - Server action integration
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { createSchedule, type Schedule } from '@/lib/actions/schedule';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus } from 'lucide-react';
import { ControllerRenderProps } from 'react-hook-form';

const formSchema = z.object({
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  is_published: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

export function CreateScheduleButton() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      start_date: '',
      end_date: '',
      status: 'draft',
      is_published: false,
    },
  });

  async function onSubmit(data: FormValues) {
    try {
      await createSchedule(data);
      setOpen(false);
      form.reset();
      router.refresh();
    } catch (error) {
      console.error('Failed to create schedule:', error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Schedule
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Schedule</DialogTitle>
          <DialogDescription>
            Create a new schedule by entering the start and end dates.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="start_date"
              render={({ field }: { field: ControllerRenderProps<FormValues, 'start_date'> }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="end_date"
              render={({ field }: { field: ControllerRenderProps<FormValues, 'end_date'> }) => (
                <FormItem>
                  <FormLabel>End Date</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <Button type="submit">Create</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 