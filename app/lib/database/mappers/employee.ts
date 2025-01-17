/**
 * Employee Type Mapper
 * Last Updated: 2025-01-16
 * 
 * Handles type mapping between domain and database types for employees.
 * Includes validation and type safety checks.
 */

import type { Database, Json } from '@/lib/database/database.types';
import type { 
  Employee,
  CreateEmployeeInput,
  UpdateEmployeeInput 
} from '@/employees/types';
import { getEmployeeFullName } from '@/employees/types';
import { employeeSchema, employeeInputSchema, employeeUpdateSchema } from '@/lib/schemas/employee';

type DbEmployee = Database['public']['Tables']['employees']['Row'];
type DbEmployeeInsert = Database['public']['Tables']['employees']['Insert'];
type DbEmployeeUpdate = Database['public']['Tables']['employees']['Update'];

/**
 * Converts domain employee data to database format
 * Throws error if validation fails
 */
export function toDbEmployee(input: CreateEmployeeInput): DbEmployeeInsert {
  // Validate input
  const validatedData = employeeInputSchema.parse({
    ...input,
    user_id: input.user_id,
    created_by: null,
    updated_by: null
  });

  return {
    ...validatedData,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    metadata: null as Json
  };
}

/**
 * Converts database employee data to domain format
 * Throws error if validation fails
 */
export function toDomainEmployee(data: DbEmployee): Employee {
  // Validate database data
  const validatedData = employeeSchema.parse(data);

  return {
    ...validatedData,
    metadata: validatedData.metadata as Json,
    full_name: getEmployeeFullName(validatedData)
  };
}

/**
 * Converts domain update data to database format
 * Throws error if validation fails
 */
export function toDbEmployeeUpdate(input: UpdateEmployeeInput): DbEmployeeUpdate {
  // Validate update data
  const validatedData = employeeUpdateSchema.parse(input);

  return {
    ...validatedData,
    metadata: validatedData.metadata as Json | undefined,
    updated_at: new Date().toISOString()
  };
}

/**
 * Type guard to check if value is a valid employee
 */
export function isValidEmployee(value: unknown): value is Employee {
  try {
    employeeSchema.parse(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Type guard to check if value is a valid employee input
 */
export function isValidEmployeeInput(value: unknown): value is CreateEmployeeInput {
  try {
    employeeInputSchema.parse(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Type guard to check if value is a valid employee update
 */
export function isValidEmployeeUpdate(value: unknown): value is UpdateEmployeeInput {
  try {
    employeeUpdateSchema.parse(value);
    return true;
  } catch {
    return false;
  }
} 