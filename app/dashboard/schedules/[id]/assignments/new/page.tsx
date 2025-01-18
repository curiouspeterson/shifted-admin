/**
 * New Assignment Page
 * Last Updated: 2025-03-19
 * 
 * Page for creating new schedule assignments.
 */

'use client'

import { useRouter } from 'next/navigation'
import { Alert, AlertDescription } from '@/app/components/ui/alert'
import { Spinner } from '@/app/components/ui/spinner'
import { useAppContext } from '@/app/lib/context/app-context'
import { createClient } from '@/app/lib/supabase/client-side'

export default function NewAssignmentPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const { isLoading, setIsLoading, error, setError } = useAppContext()
  const supabase = createClient()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load schedule: {error.message}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold">New Assignment</h1>
      <p className="text-gray-600">This feature is under development.</p>
    </div>
  )
} 