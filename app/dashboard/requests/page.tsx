'use client'

import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { Modal, ModalContent, ModalHeader, ModalBody, useDisclosure } from "@nextui-org/react"
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

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Failed to fetch data')
  }
  return res.json()
}

export default function RequestsPage() {
  const router = useRouter()
  const { isOpen, onOpen, onClose } = useDisclosure()
  
  const { data, error, mutate } = useSWR<{ requests: TimeOffRequest[] }>('/api/requests', fetcher, {
    revalidateOnFocus: false,
  })

  const handleStatusUpdate = async (requestId: string, newStatus: 'approved' | 'denied') => {
    try {
      const response = await fetch(`/api/requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update request')
      }

      // Refresh the requests list
      mutate()
    } catch (err) {
      console.error('Error updating request:', err)
      // Handle error appropriately
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

  const requests = data?.requests || []
  const isManager = requests.some(request => request.employee && request.employee_id !== request.employee.id)

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
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(request.status)}`}>
                            {request.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {request.reason || '-'}
                        </td>
                        {isManager && request.status === 'pending' && (
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                            <button
                              onClick={() => handleStatusUpdate(request.id, 'approved')}
                              className="text-green-600 hover:text-green-900"
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
                  mutate()
                  onClose()
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