'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { Modal, ModalContent, ModalHeader, ModalBody, useDisclosure } from "@nextui-org/react"
import LoadingSpinner from '@/app/components/LoadingSpinner'
import ErrorBoundary from '@/app/components/ErrorBoundary'

interface Availability {
  id: string
  employee_id: string
  day_of_week: string
  start_time: string
  end_time: string
  is_available: boolean
  created_at: string
  updated_at: string
}

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Failed to fetch data')
  }
  return res.json()
}

export default function AvailabilityPage() {
  const router = useRouter()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    start_time: '',
    end_time: '',
    is_available: true
  })
  
  const { data, error, mutate } = useSWR<{ availability: Availability[] }>('/api/availability', fetcher, {
    revalidateOnFocus: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDay) return

    try {
      const response = await fetch('/api/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          day_of_week: selectedDay,
          ...formData
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update availability')
      }

      // Refresh the availability list
      mutate()
      onClose()
    } catch (err) {
      console.error('Error updating availability:', err)
      // Handle error appropriately
    }
  }

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  if (!data && !error) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    if (error.message === 'Unauthorized') {
      router.push('/sign-in')
      return null
    }
    return (
      <div className="mx-4 my-2 rounded-md bg-red-50 p-4">
        <div className="text-sm text-red-700">{error.message}</div>
      </div>
    )
  }

  const availability = data?.availability || []

  return (
    <ErrorBoundary>
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Availability</h1>
          <button
            onClick={() => {
              setSelectedDay(null)
              setFormData({
                start_time: '',
                end_time: '',
                is_available: true
              })
              onOpen()
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Update Availability
          </button>
        </div>

        <div className="flex flex-col">
          <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
              <div className="overflow-hidden border-t border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Day
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hours
                      </th>
                      <th scope="col" className="relative px-6 py-3">
                        <span className="sr-only">Edit</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {daysOfWeek.map((day) => {
                      const dayAvailability = availability.find(a => a.day_of_week === day)
                      return (
                        <tr key={day}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {day}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${dayAvailability?.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {dayAvailability?.is_available ? 'Available' : 'Unavailable'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {dayAvailability ? (
                              `${dayAvailability.start_time} - ${dayAvailability.end_time}`
                            ) : (
                              'Not set'
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => {
                                setSelectedDay(day)
                                setFormData({
                                  start_time: dayAvailability?.start_time || '',
                                  end_time: dayAvailability?.end_time || '',
                                  is_available: dayAvailability?.is_available ?? true
                                })
                                onOpen()
                              }}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <Modal 
          isOpen={isOpen} 
          onClose={onClose}
          size="2xl"
        >
          <ModalContent>
            <ModalHeader>
              Update Availability {selectedDay ? `for ${selectedDay}` : ''}
            </ModalHeader>
            <ModalBody>
              <form onSubmit={handleSubmit} className="space-y-4">
                {!selectedDay && (
                  <div>
                    <label htmlFor="day" className="block text-sm font-medium text-gray-700">
                      Day of Week
                    </label>
                    <select
                      id="day"
                      name="day"
                      value={selectedDay || ''}
                      onChange={(e) => setSelectedDay(e.target.value)}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 sm:text-sm"
                    >
                      <option value="">Select a day</option>
                      {daysOfWeek.map((day) => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label htmlFor="is_available" className="block text-sm font-medium text-gray-700">
                    Availability Status
                  </label>
                  <select
                    id="is_available"
                    name="is_available"
                    value={formData.is_available.toString()}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_available: e.target.value === 'true' }))}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 sm:text-sm"
                  >
                    <option value="true">Available</option>
                    <option value="false">Unavailable</option>
                  </select>
                </div>

                {formData.is_available && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="start_time" className="block text-sm font-medium text-gray-700">
                        Start Time
                      </label>
                      <input
                        type="time"
                        id="start_time"
                        name="start_time"
                        value={formData.start_time}
                        onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                        required={formData.is_available}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label htmlFor="end_time" className="block text-sm font-medium text-gray-700">
                        End Time
                      </label>
                      <input
                        type="time"
                        id="end_time"
                        name="end_time"
                        value={formData.end_time}
                        onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                        required={formData.is_available}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 sm:text-sm"
                      />
                    </div>
                  </div>
                )}

                <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                  <button
                    type="submit"
                    disabled={!selectedDay}
                    className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:col-start-2 sm:text-sm"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:col-start-1 sm:mt-0 sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </ModalBody>
          </ModalContent>
        </Modal>
      </div>
    </ErrorBoundary>
  )
} 