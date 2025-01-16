export type EmployeeStatus = 'active' | 'inactive'

export interface Employee {
  id: string
  name: string
  email: string
  phone: string | null
  position: string
  department: string
  status: EmployeeStatus
  created_at: string
  updated_at: string
}

export type CreateEmployeeInput = {
  first_name: string
  last_name: string
  email: string
  phone?: string | null
  position: string
  department: string
  is_active?: boolean
} 