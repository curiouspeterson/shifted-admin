'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import LoadingSpinner from '@/app/components/LoadingSpinner'
import { toast } from 'sonner'

interface AvailabilitySlot {
  id?: string
  day_of_week: number
  start_time: string
  end_time: string
  is_available: boolean
}

const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
]

const TIME_SLOTS = Array.from({ length: 24 * 4 }, (_, i) => {
  const hour = Math.floor(i / 4)
  const minute = (i % 4) * 15
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
})

export default function AvailabilityPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [availability, setAvailability] = useState<AvailabilitySlot[]>(
    DAYS_OF_WEEK.map((_, index) => ({
      day_of_week: index,
      start_time: '09:00',
      end_time: '17:00',
      is_available: true
    }))
  )

  useEffect(() => {
    checkSessionAndFetchAvailability()
  }, [])

  const checkSessionAndFetchAvailability = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) throw sessionError
      
      if (!session) {
        router.push('/sign-in')
        return
      }

      const response = await fetch('/api/availability')
      if (!response.ok) {
        throw new Error('Failed to fetch availability')
      }

      const { availability: savedAvailability } = await response.json()

      if (savedAvailability && savedAvailability.length > 0) {
        setAvailability(savedAvailability)
      }

      setLoading(false)
    } catch (err) {
      console.error('Error:', err)
      toast.error('Failed to load availability')
      setLoading(false)
    }
  }

  const handleAvailabilityChange = (dayIndex: number, field: keyof AvailabilitySlot, value: boolean | string) => {
    setAvailability(prev => prev.map((slot, index) => 
      index === dayIndex ? { ...slot, [field]: value } : slot
    ))
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      const response = await fetch('/api/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ availability })
      })

      if (!response.ok) {
        throw new Error('Failed to save availability')
      }

      toast.success('Availability saved successfully')
    } catch (err) {
      console.error('Error:', err)
      toast.error('Failed to save availability')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="container mx-auto py-8">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Set Your Availability</h2>
        </div>
        <div className="p-6">
          <div className="space-y-6">
            {DAYS_OF_WEEK.map((day, index) => (
              <div key={day} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-32">
                  <span className="text-sm font-medium text-gray-700">{day}</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={availability[index].is_available}
                    onChange={(e) => handleAvailabilityChange(index, 'is_available', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
                {availability[index].is_available && (
                  <>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-700">From</span>
                      <select
                        value={availability[index].start_time}
                        onChange={(e) => handleAvailabilityChange(index, 'start_time', e.target.value)}
                        className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      >
                        {TIME_SLOTS.map((time) => (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-700">To</span>
                      <select
                        value={availability[index].end_time}
                        onChange={(e) => handleAvailabilityChange(index, 'end_time', e.target.value)}
                        className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      >
                        {TIME_SLOTS.map((time) => (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
              </div>
            ))}
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Availability'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 