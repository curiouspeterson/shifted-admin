/**
 * Create Schedule Button Component
 * Last Updated: 2025-03-19
 * 
 * Button component for creating new schedules.
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/app/components/ui/button/index'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/app/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/app/components/ui/form'
import { Input } from '@/app/components/ui/input'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createClient } from '@/app/lib/supabase/client-side'
import type { Database } from '@/app/lib/supabase/database.types'

const scheduleFormSchema = z.object({
  title: z.string().min(2, {
    message: 'Title must be at least 2 characters.',
  }),
  description: z.string().optional(),
})

type ScheduleFormValues = z.infer<typeof scheduleFormSchema>

export default function CreateScheduleButton() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  })

  async function onSubmit(data: ScheduleFormValues) {
    try {
      setIsLoading(true)
      const scheduleData: Database['public']['Tables']['schedules']['Insert'] = {
        title: data.title,
        description: data.description ?? null,
        status: 'draft',
      }

      const { error } = await supabase.from('schedules').insert([scheduleData])

      if (error) throw error

      form.reset()
      router.refresh()
    } catch (error) {
      console.error('Error creating schedule:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Create Schedule</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Schedule</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter schedule title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter schedule description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create Schedule'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 