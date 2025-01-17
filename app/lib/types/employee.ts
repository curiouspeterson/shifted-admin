/**
 * Employee Type Definitions
 * Last Updated: 2024-01-16
 */

import type { Database } from '../database/database.types';

export type Employee = Database['public']['Tables']['employees']['Row'];
export type EmployeeInsert = Database['public']['Tables']['employees']['Insert'];
export type EmployeeUpdate = Database['public']['Tables']['employees']['Update'];