/**
 * Request Types
 * Last Updated: 2025-03-19
 * 
 * Type definitions for time-off requests.
 */

export type RequestStatus = 'approved' | 'rejected' | 'pending'

export type RequestType = 'vacation' | 'sick' | 'personal'

export interface TimeOffRequest {
  id: string
  type: RequestType
  startDate: string
  endDate: string
  reason: string
  status: RequestStatus
}

export interface CreateTimeOffRequest {
  type: RequestType
  start_date: string
  end_date: string
  reason: string
  status: RequestStatus
} 