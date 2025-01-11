'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import LoadingSpinner from '@/app/components/LoadingSpinner'
import Link from 'next/link'

export default function Dashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) throw error
        
        if (!session) {
          router.push('/sign-in')
          return
        }

        setLoading(false)
      } catch (err) {
        console.error('Dashboard error:', err)
        setError(err instanceof Error ? err.message : 'An error occurred')
        setLoading(false)
      }
    }

    checkSession()
  }, [router])

  if (loading) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">Error</h2>
            <p className="mt-2 text-sm text-red-600">{error}</p>
            <button
              onClick={() => router.push('/sign-in')}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Return to Sign In
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Dashboard Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-indigo-50 p-6 rounded-lg">
          <h2 className="text-lg font-medium text-indigo-900 mb-2">Current Schedule</h2>
          <p className="text-indigo-600">View your upcoming shifts and schedule</p>
          <Link href="/dashboard/schedules" className="mt-4 inline-block text-sm text-indigo-600 hover:text-indigo-500">
            View Schedule →
          </Link>
        </div>

        <div className="bg-green-50 p-6 rounded-lg">
          <h2 className="text-lg font-medium text-green-900 mb-2">Team Members</h2>
          <p className="text-green-600">Manage your team and their schedules</p>
          <Link href="/dashboard/employees" className="mt-4 inline-block text-sm text-green-600 hover:text-green-500">
            View Team →
          </Link>
        </div>

        <div className="bg-purple-50 p-6 rounded-lg">
          <h2 className="text-lg font-medium text-purple-900 mb-2">Time-off Requests</h2>
          <p className="text-purple-600">Review and manage time-off requests</p>
          <Link href="/dashboard/requests" className="mt-4 inline-block text-sm text-purple-600 hover:text-purple-500">
            View Requests →
          </Link>
        </div>

        <div className="bg-yellow-50 p-6 rounded-lg">
          <h2 className="text-lg font-medium text-yellow-900 mb-2">Your Availability</h2>
          <p className="text-yellow-600">Set your weekly availability preferences</p>
          <Link href="/dashboard/availability" className="mt-4 inline-block text-sm text-yellow-600 hover:text-yellow-500">
            Set Availability →
          </Link>
        </div>
      </div>
    </div>
  )
} 