export type EmployeeStatus = 'active' | 'inactive'

export interface Employee {
  id: string
  name: string
  email: string
  phone: string | null
  position: string
  status: EmployeeStatus
  created_at: string
  updated_at: string
}

export type CreateEmployeeInput = Omit<Employee, 'id' | 'created_at' | 'updated_at'> 