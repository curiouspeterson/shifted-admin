/**
 * Request Form Component
 * Last Updated: 2025-03-19
 * 
 * Form for creating and editing time-off requests.
 */

'use client'

import * as React from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { toast } from 'sonner'
import { Alert, AlertDescription } from '@/app/components/ui/alert'
import { Button } from '@/app/components/ui/button/index'
import { Calendar } from '@/app/components/ui/calendar'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/app/components/ui/form'
import { Textarea } from '@/app/components/ui/textarea'
import { Popover, PopoverContent, PopoverTrigger } from '@/app/components/ui/popover'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'

const requestFormSchema = z.object({
  type: z.enum(['vacation', 'sick', 'personal'] as const),
  startDate: z.date(),
  endDate: z.date(),
  reason: z.string().min(10, {
    message: 'Reason must be at least 10 characters.',
  }),
})

type RequestFormValues = z.infer<typeof requestFormSchema>

interface RequestFormProps {
  onSubmit: (data: RequestFormValues) => Promise<void>
}

export default function RequestForm({ onSubmit }: RequestFormProps) {
  const [error, setError] = React.useState<string | null>(null)
  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestFormSchema),
    defaultValues: {
      type: 'vacation',
      reason: '',
    },
  })

  async function handleSubmit(data: RequestFormValues) {
    try {
      setError(null)
      await onSubmit(data)
      form.reset()
      toast.success('Request submitted successfully')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit request'
      setError(errorMessage)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {error !== null && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Request Type</FormLabel>
              <FormControl>
                <select
                  {...field}
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                >
                  <option value="vacation">Vacation</option>
                  <option value="sick">Sick Leave</option>
                  <option value="personal">Personal Leave</option>
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full pl-3 text-left font-normal',
                          field.value === undefined && 'text-muted-foreground'
                        )}
                      >
                        {field.value instanceof Date ? (
                          format(field.value, 'PPP')
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < new Date() || date < new Date('1900-01-01')
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full pl-3 text-left font-normal',
                          field.value === undefined && 'text-muted-foreground'
                        )}
                      >
                        {field.value instanceof Date ? (
                          format(field.value, 'PPP')
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < form.getValues('startDate') ||
                        date < new Date('1900-01-01')
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reason</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Please provide a reason for your request..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          <Button type="submit">Submit Request</Button>
        </div>
      </form>
    </Form>
  )
} 