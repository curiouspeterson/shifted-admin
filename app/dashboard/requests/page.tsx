'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Modal, ModalContent, ModalHeader, ModalBody, Button, useDisclosure } from "@nextui-org/react"
import LoadingSpinner from '@/app/components/LoadingSpinner'
import RequestForm from '@/app/components/RequestForm'
import ErrorBoundary from '@/app/components/ErrorBoundary'

interface TimeOffRequest {
  id: string
  employee_id: string
  start_date: string
  end_date: string
  request_type: 'vacation' | 'sick' | 'personal' | 'other'
  status: 'pending' | 'approved' | 'denied'
  reason: string | null
  approved_by: string | null
  created_at: string
  updated_at: string
  employee?: {
    first_name: string
    last_name: string
  }
}

const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second

export default function RequestsPage() {
  const router = useRouter()
  const [requests, setRequests] = useState<TimeOffRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isManager, setIsManager] = useState(false)
  const {isOpen, onOpen, onClose} = useDisclosure()
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    fetchRequests()
  }, [])

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  const fetchRequests = async (retry = true) => {
    try {
      // Get and validate session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) {
        console.error('Session error:', sessionError)
        throw sessionError
      }
      if (!session) {
        router.push('/sign-in')
        return
      }

      console.log('Fetching employee details for user:', session.user.id)

      // Get employee details to check if user is a supervisor/manager
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .select('id, position')
        .eq('user_id', session.user.id)
        .maybeSingle()

      if (employeeError) {
        console.error('Employee fetch error:', employeeError)
        
        // Retry logic for database errors
        if (retry && retryCount < MAX_RETRIES) {
          console.log(`Retrying fetch (attempt ${retryCount + 1}/${MAX_RETRIES})...`)
          setRetryCount(prev => prev + 1)
          await sleep(RETRY_DELAY * (retryCount + 1))
          return fetchRequests(true)
        }

        setError('Failed to fetch employee details. Please try again.')
        setLoading(false)
        return
      }

      if (!employee) {
        console.error('No employee record found for user:', session.user.id)
        setError('No employee record found. Please contact your administrator to set up your employee profile.')
        setLoading(false)
        return
      }

      // Reset retry count on successful fetch
      setRetryCount(0)

      console.log('Employee details:', employee)
      setIsManager(['shift_supervisor', 'management'].includes(employee.position))

      // Fetch requests using API route
      console.log('Fetching requests...')
      const response = await fetch('/api/requests', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Request fetch error:', errorData)
        
        // Retry logic for API errors
        if (retry && retryCount < MAX_RETRIES) {
          console.log(`Retrying fetch (attempt ${retryCount + 1}/${MAX_RETRIES})...`)
          setRetryCount(prev => prev + 1)
          await sleep(RETRY_DELAY * (retryCount + 1))
          return fetchRequests(true)
        }

        throw new Error(errorData.error || 'Failed to fetch requests')
      }

      const { requests: requestsData } = await response.json()
      console.log('Requests fetched:', requestsData?.length || 0)
      setRequests(requestsData || [])
      setLoading(false)
      
      // Reset retry count on successful fetch
      setRetryCount(0)
    } catch (err) {
      console.error('Error in fetchRequests:', err)
      
      // Retry logic for unexpected errors
      if (retry && retryCount < MAX_RETRIES) {
        console.log(`Retrying fetch (attempt ${retryCount + 1}/${MAX_RETRIES})...`)
        setRetryCount(prev => prev + 1)
        await sleep(RETRY_DELAY * (retryCount + 1))
        return fetchRequests(true)
      }

      setError(err instanceof Error ? err.message : 'Failed to fetch requests')
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (requestId: string, newStatus: 'approved' | 'denied') => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) throw sessionError
      if (!session) throw new Error('No active session')

      // Update request status via API route
      const response = await fetch(`/api/requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update request')
      }

      // Refresh the requests list
      await fetchRequests()
    } catch (err) {
      console.error('Error updating request:', err)
      setError(err instanceof Error ? err.message : 'Failed to update request')
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'denied':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Time Off Requests</h1>
          <button
            onClick={onOpen}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            New Request
          </button>
        </div>

        {error && (
          <div className="mx-4 my-2 rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        <div className="flex flex-col">
          <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
              <div className="overflow-hidden border-t border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {isManager && (
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Employee
                        </th>
                      )}
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dates
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reason
                      </th>
                      {isManager && (
                        <th scope="col" className="relative px-6 py-3">
                          <span className="sr-only">Actions</span>
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {requests.map((request) => (
                      <tr key={request.id}>
                        {isManager && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {request.employee?.first_name} {request.employee?.last_name}
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                          {request.request_type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(request.start_date).toLocaleDateString()} - {new Date(request.end_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusBadgeColor(request.status)}`}>
                            {request.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {request.reason || '-'}
                        </td>
                        {isManager && request.status === 'pending' && (
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleStatusUpdate(request.id, 'approved')}
                              className="text-green-600 hover:text-green-900 mr-4"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(request.id, 'denied')}
                              className="text-red-600 hover:text-red-900"
                            >
                              Deny
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                    {requests.length === 0 && (
                      <tr>
                        <td colSpan={isManager ? 6 : 5} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                          No requests found
                        </td>
                      </tr>
                    )}
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
              New Time Off Request
            </ModalHeader>
            <ModalBody>
              <RequestForm
                onSave={() => {
                  onClose()
                  fetchRequests()
                }}
                onCancel={onClose}
              />
            </ModalBody>
          </ModalContent>
        </Modal>
      </div>
    </ErrorBoundary>
  )
} 