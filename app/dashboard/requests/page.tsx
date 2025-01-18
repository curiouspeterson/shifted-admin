/**
 * Requests Page
 * Last Updated: 2025-03-19
 * 
 * Displays and manages time-off requests.
 */

'use client'

import useSWR from 'swr'
import { Alert, AlertDescription } from '@/app/components/ui/alert'
import { Button } from '@/app/components/ui/button/index'
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/app/components/ui/dialog'
import { Spinner } from '@/app/components/ui/spinner'
import RequestForm from '@/app/components/request/request-form'
import { createClient } from '@/app/lib/supabase/client-side'
import type { TimeOffRequest, CreateTimeOffRequest } from '@/app/lib/types/requests'

export default function RequestsPage() {
  const { data, error, isLoading, mutate } = useSWR<TimeOffRequest[]>('/api/requests')
  const supabase = createClient()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (error instanceof Error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load requests: {error.message}
        </AlertDescription>
      </Alert>
    )
  }

  const handleSubmit = async (formData: {
    type: string
    startDate: Date
    endDate: Date
    reason: string
  }) => {
    const newRequest: CreateTimeOffRequest = {
      type: formData.type as TimeOffRequest['type'],
      start_date: formData.startDate.toISOString(),
      end_date: formData.endDate.toISOString(),
      reason: formData.reason,
      status: 'pending'
    }

    const { error: submitError } = await supabase
      .from('requests')
      .insert([newRequest])

    if (submitError) {
      throw new Error(submitError.message)
    }

    await mutate()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Time-Off Requests</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button>New Request</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Time-Off Request</DialogTitle>
            </DialogHeader>
            <RequestForm onSubmit={handleSubmit} />
          </DialogContent>
        </Dialog>
      </div>

      {data && data.length > 0 ? (
        <div className="space-y-4">
          {data.map((request) => (
            <div
              key={request.id}
              className="rounded-lg border p-4 shadow-sm"
            >
              <h3 className="font-medium">{request.type}</h3>
              <p className="text-sm text-gray-600">
                {new Date(request.startDate).toLocaleDateString()} -{' '}
                {new Date(request.endDate).toLocaleDateString()}
              </p>
              <p className="mt-2 text-sm">{request.reason}</p>
              <div className="mt-4">
                <span
                  className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                    request.status === 'approved'
                      ? 'bg-green-100 text-green-800'
                      : request.status === 'rejected'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Alert>
          <AlertDescription>No requests found.</AlertDescription>
        </Alert>
      )}
    </div>
  )
} 