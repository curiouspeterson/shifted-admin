/**
 * Employees Page Component
 * Last Updated: 2024
 * 
 * A client-side page component that manages employee records.
 * Provides functionality to view, add, and edit employee information
 * with real-time updates and responsive design.
 * 
 * Features:
 * - Employee list display
 * - Add/Edit employee modal
 * - Real-time data updates with SWR
 * - Loading and error states
 * - Responsive table layout
 * - Status indicators
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { Modal, ModalContent, ModalHeader, ModalBody, useDisclosure } from "@nextui-org/react"
import EmployeeForm from '@/app/components/EmployeeForm'
import LoadingSpinner from '@/app/components/LoadingSpinner'

/**
 * Employee Interface
 * Defines the structure of employee data
 * 
 * @property id - Unique identifier for the employee
 * @property first_name - Employee's first name
 * @property last_name - Employee's last name
 * @property position - Employee's role/position
 * @property email - Employee's email address
 * @property phone - Optional phone number
 * @property created_at - Record creation timestamp
 * @property updated_at - Last update timestamp
 * @property user_id - Associated user account ID
 * @property is_active - Employee's active status
 */
interface Employee {
  id: string
  first_name: string
  last_name: string
  position: string
  email: string | null
  phone?: number | null
  created_at: string | null
  updated_at: string | null
  user_id: string | null
  is_active: boolean | null
}

/**
 * Data Fetcher Function
 * Handles API requests for employee data with error handling
 * 
 * @param url - API endpoint URL
 * @returns Parsed JSON response
 * @throws Error with API error message
 */
const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Failed to fetch data')
  }
  return res.json()
}

/**
 * Employees Page Component
 * Main component for managing employee records
 * 
 * @returns A responsive page with employee management features
 */
export default function EmployeesPage() {
  const router = useRouter()
  const { isOpen, onOpen, onClose } = useDisclosure()
  
  // State management for editing employee records
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  
  // Data fetching with SWR for real-time updates
  const { data, error, mutate } = useSWR<{ employees: Employee[] }>('/api/employees', fetcher, {
    revalidateOnFocus: false,
  })

  /**
   * Edit Handler
   * Opens modal with selected employee data for editing
   * 
   * @param employee - Employee record to edit
   */
  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee)
    onOpen()
  }

  /**
   * Add Handler
   * Opens modal for adding a new employee
   */
  const handleAdd = () => {
    setEditingEmployee(null)
    onOpen()
  }

  /**
   * Save Handler
   * Processes form submission and updates the employee list
   */
  const handleSave = async () => {
    await mutate()
    onClose()
    setEditingEmployee(null)
  }

  // Loading state
  if (!data && !error) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  // Error handling
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

  const employees = data?.employees || []

  return (
    <div className="bg-white shadow rounded-lg">
      {/* Header Section */}
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Employees</h1>
        <button
          onClick={handleAdd}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Add Employee
        </button>
      </div>

      {/* Employee Table */}
      <div className="flex flex-col">
        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div className="overflow-hidden border-t border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                {/* Table Header */}
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Position
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Edit</span>
                    </th>
                  </tr>
                </thead>
                {/* Table Body */}
                <tbody className="bg-white divide-y divide-gray-200">
                  {employees.map((employee) => (
                    <tr key={employee.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {employee.first_name} {employee.last_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {employee.position}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {employee.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          employee.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {employee.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(employee)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                  {/* Empty State */}
                  {employees.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        No employees found. Add one to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Employee Form Modal */}
      <Modal 
        isOpen={isOpen} 
        onClose={() => {
          onClose()
          setEditingEmployee(null)
        }}
        size="2xl"
      >
        <ModalContent>
          <ModalHeader>
            {editingEmployee ? 'Edit Employee' : 'Add Employee'}
          </ModalHeader>
          <ModalBody>
            <EmployeeForm
              onSave={handleSave}
              onCancel={() => {
                onClose()
                setEditingEmployee(null)
              }}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  )
} 