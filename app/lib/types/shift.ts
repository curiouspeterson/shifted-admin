/**
 * Shift Type Definitions
 * Last Updated: 2024-01-16
 */

import type { Database } from '../database/database.types';

export type Shift = Database['public']['Tables']['shifts']['Row'];
export type ShiftInsert = Database['public']['Tables']['shifts']['Insert'];
export type ShiftUpdate = Database['public']['Tables']['shifts']['Update'];