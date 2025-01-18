/**
 * Shifts Page
 * Last Updated: 2025-03-19
 * 
 * Displays and manages shifts.
 */

'use client'

import { useAppContext } from '@/app/lib/context/app-context'
import { Alert, AlertDescription } from '@/app/components/ui/alert'
import { Spinner } from '@/app/components/ui/spinner'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'

export default function ShiftsPage() {
  const { isLoading, error } = useAppContext()

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
          Failed to load shifts: {error.message}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold">Shifts</h1>
      <Card>
        <CardHeader>
          <CardTitle>Shift Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">Shift management features are under development.</p>
        </CardContent>
      </Card>
    </div>
  )
} 