'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Modal, ModalContent, ModalHeader, ModalBody, Button, useDisclosure } from "@nextui-org/react"
import LoadingSpinner from '@/app/components/LoadingSpinner'
import RequestForm from '@/app/components/RequestForm'

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

export default function RequestsPage() {
  const router = useRouter()
  const [requests, setRequests] = useState<TimeOffRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isManager, setIsManager] = useState(false)
  const {isOpen, onOpen, onOpenChange} = useDisclosure()

  useEffect(() => {
    checkSessionAndFetchRequests()
  }, [])

  const checkSessionAndFetchRequests = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) throw sessionError
      
      if (!session) {
        router.push('/sign-in')
        return
      }

      // Get employee details to check if user is a manager
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .select('position')
        .eq('user_id', session.user.id)
        .single()

      if (employeeError) throw employeeError

      setIsManager(employee?.position === 'manager')

      // Fetch requests with employee names
      const { data: requestsData, error: requestsError } = await supabase
        .from('time_off_requests')
        .select(`
          *,
          employee:employees (
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false })

      if (requestsError) throw requestsError

      setRequests(requestsData || [])
      setLoading(false)
    } catch (err) {
      console.error('Error:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch requests')
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (requestId: string, newStatus: 'approved' | 'denied') => {
    try {
      const { error } = await supabase
        .from('time_off_requests')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId)

      if (error) throw error

      checkSessionAndFetchRequests()
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
    return <LoadingSpinner />
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Time Off Requests</h1>
        <Button 
          color="primary"
          onPress={onOpen}
        >
          New Request
        </Button>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 text-red-700 text-sm">
          {error}
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
        onOpenChange={onOpenChange}
        placement="center"
        size="2xl"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                New Time Off Request
              </ModalHeader>
              <ModalBody>
                <RequestForm
                  onSave={() => {
                    onClose()
                    checkSessionAndFetchRequests()
                  }}
                  onCancel={onClose}
                />
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  )
} 