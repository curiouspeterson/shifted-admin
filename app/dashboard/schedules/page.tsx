/**
 * Schedules Page
 * Last Updated: 2025-03-19
 * 
 * Displays a list of schedules with filtering and sorting options.
 */

import { Suspense } from 'react'
import { createClient } from '@/app/lib/supabase/server'
import { errorLogger } from '@/app/lib/logging/error-logger'
import ScheduleFilters from '@/app/components/schedule/schedule-filters'
import ScheduleList from './_components/schedule-list'
import { LoadingSpinner } from '@/app/components/ui/loading-spinner'
import type { Database } from '@/app/lib/types/supabase'

type Schedule = Database['public']['Tables']['schedules']['Row']

interface PageProps {
  searchParams: {
    status?: Schedule['status']
    sort?: string
    order?: 'asc' | 'desc'
  }
}

export default async function SchedulesPage({ searchParams }: PageProps) {
  try {
    const supabase = createClient()
    
    let query = supabase
      .from('schedules')
      .select('*')
      .order('created_at', { ascending: false })

    if (searchParams.status && searchParams.status !== 'all') {
      query = query.eq('status', searchParams.status)
    }

    if (searchParams.sort) {
      query = query.order(searchParams.sort, {
        ascending: searchParams.order === 'asc'
      })
    }

    const { data: schedules, error } = await query

    if (error) {
      errorLogger.error('Failed to fetch schedules', error, {
        context: {
          component: 'SchedulesPage',
          action: 'fetchSchedules',
          params: searchParams
        }
      })
      throw error
    }

    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Schedules</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <aside>
            <Suspense fallback={<LoadingSpinner />}>
              <ScheduleFilters />
            </Suspense>
          </aside>
          <main className="md:col-span-3">
            <Suspense fallback={<LoadingSpinner />}>
              <ScheduleList schedules={schedules || []} />
            </Suspense>
          </main>
        </div>
      </div>
    )
  } catch (error) {
    errorLogger.error('Error in schedules page', {
      error,
      context: {
        component: 'SchedulesPage',
        action: 'render'
      }
    })
    throw error // Let error boundary handle the UI
  }
} 