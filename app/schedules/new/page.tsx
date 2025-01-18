/**
 * New Schedule Page
 * Last Updated: 2025-03-19
 * 
 * This page provides a form for creating new schedules.
 */

import { Metadata } from 'next'
import { NewScheduleForm } from './_components/new-schedule-form'

export const metadata: Metadata = {
  title: 'New Schedule',
  description: 'Create a new schedule',
}

export default function NewSchedulePage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Create New Schedule</h1>
        <NewScheduleForm />
      </div>
    </div>
  )
} 