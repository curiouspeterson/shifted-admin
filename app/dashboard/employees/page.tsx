'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { createClient } from '@supabase/supabase-js'
import { Modal, ModalContent, ModalHeader, ModalBody, Button, useDisclosure } from "@nextui-org/react"
import EmployeeForm from '@/app/components/EmployeeForm'
import LoadingSpinner from '@/app/components/LoadingSpinner'

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

export default function EmployeeList() {
  const router = useRouter()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [positionFilter, setPositionFilter] = useState<string>('all')
  const {isOpen, onOpen, onOpenChange} = useDisclosure()

  useEffect(() => {
    checkSessionAndFetchEmployees()
  }, [])

  const checkSessionAndFetchEmployees = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) throw sessionError
      
      if (!session) {
        router.push('/sign-in')
        return
      }

      const tempSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { data, error } = await tempSupabase
        .from('employees')
        .select('*')
        .order('last_name', { ascending: true })

      if (error) throw error

      const employeesData = data || []

      setEmployees(employeesData)
      setLoading(false)
    } catch (err) {
      console.error('Error:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch employees')
      setLoading(false)
    }
  }

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee)
    onOpen()
  }

  const handleSave = () => {
    onOpenChange()
    setEditingEmployee(null)
    checkSessionAndFetchEmployees()
  }

  const handleModalClose = () => {
    onOpenChange()
    setEditingEmployee(null)
  }

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
              onClick={() => checkSessionAndFetchEmployees()}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  const filteredEmployees = positionFilter === 'all'
    ? employees
    : employees.filter(emp => emp.position === positionFilter)

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Employees</h1>
        <div className="flex space-x-4">
          <select
            value={positionFilter}
            onChange={(e) => setPositionFilter(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900"
          >
            <option value="all">All Positions</option>
            <option value="dispatcher">Dispatchers</option>
            <option value="supervisor">Supervisors</option>
            <option value="manager">Managers</option>
          </select>
          <Button 
            color="primary"
            onPress={() => {
              setEditingEmployee(null)
              onOpen()
            }}
          >
            Add Employee
          </Button>
        </div>
      </div>

      <div className="flex flex-col">
        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div className="overflow-hidden border-t border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
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
                      Phone
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Edit</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEmployees.map((employee) => (
                    <tr key={employee.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {employee.first_name} {employee.last_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                          employee.position === 'supervisor' ? 'bg-blue-100 text-blue-800' :
                          employee.position === 'manager' ? 'bg-purple-100 text-purple-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {employee.position}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {employee.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {employee.phone || '-'}
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
                  {filteredEmployees.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        No employees found
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
        onOpenChange={handleModalClose}
        placement="center"
        size="2xl"
        isDismissable={false}
        hideCloseButton={false}
        shouldBlockScroll={true}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 font-bold">
                {editingEmployee ? 'Edit Employee' : 'Add Employee'}
              </ModalHeader>
              <ModalBody className="px-6 py-4">
                <EmployeeForm
                  employeeId={editingEmployee?.id}
                  initialData={editingEmployee || undefined}
                  onSave={handleSave}
                  onCancel={() => {
                    onClose()
                    setEditingEmployee(null)
                  }}
                />
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  )
} 