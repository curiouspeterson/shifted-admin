/**
 * Availability Page
 * Last Updated: 2024-01-15
 * 
 * Displays employee availability and allows for management of availability slots.
 */

'use client'

import { useState } from 'react'
import useSWR from 'swr'
import LoadingSpinner from '@/components/loading-spinner'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function AvailabilityPage() {
  const { data, error, isLoading, mutate } = useSWR('/api/availability')

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {error.message || 'Failed to load availability data'}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Employee Availability</h1>
      {/* Add your availability management UI here */}
    </div>
  )
} 