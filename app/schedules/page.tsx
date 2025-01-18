/**
 * Schedules Page
 * Last Updated: 2025-03-19
 * 
 * Server Component that displays a list of schedules.
 */

import { Suspense } from 'react'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import ScheduleFilters from '@/app/components/schedule/schedule-filters'
import { LoadingSpinner } from '@/app/components/ui/loading-spinner'
import type { Database } from '@/app/lib/types/supabase'

type Schedule = Database['public']['Tables']['schedules']['Row']

interface PageProps {
  searchParams: {
    status?: Schedule['status']
    sort?: keyof Schedule
    order?: 'asc' | 'desc'
  }
}

export default async function SchedulesPage({ searchParams }: PageProps) {
  const cookieStore = cookies()
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )

  let query = supabase
    .from('schedules')
    .select('*')
    .order('created_at', { ascending: false })

  if (searchParams.status) {
    query = query.eq('status', searchParams.status)
  }

  if (searchParams.sort) {
    query = query.order(searchParams.sort, {
      ascending: searchParams.order === 'asc'
    })
  }

  const { data: schedules, error } = await query

  if (error) {
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
            {/* Add schedule list component here */}
          </Suspense>
        </main>
      </div>
    </div>
  )
} 