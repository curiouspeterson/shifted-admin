/**
 * Shift List Component
 * Last Updated: 2024-01-16
 * 
 * A component that displays a list of shifts with their details
 * and handles offline states.
 */

'use client'

import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Clock } from 'lucide-react'

interface Shift {
  id: string
  startDate: string
  endDate: string
  requirements: string[]
  status: 'pending' | 'approved' | 'rejected'
}

interface ShiftListProps {
  shifts: Shift[]
  isOffline: boolean
  onRetry?: () => void
}

export function ShiftList({ shifts, isOffline, onRetry }: ShiftListProps) {
  if (shifts.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">No shifts found</p>
          {isOffline && onRetry && (
            <Button
              variant="outline"
              onClick={onRetry}
              className="mt-4"
            >
              Retry Loading Shifts
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {shifts.map((shift) => (
        <Card key={shift.id}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <CardTitle className="text-lg">
                  Shift {shift.id.slice(0, 8)}
                </CardTitle>
                <div className="flex items-center text-sm text-gray-500 space-x-4">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span>
                      {format(new Date(shift.startDate), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    <span>
                      {format(new Date(shift.startDate), 'h:mm a')} -
                      {format(new Date(shift.endDate), 'h:mm a')}
                    </span>
                  </div>
                </div>
              </div>
              <Badge
                variant={
                  shift.status === 'approved'
                    ? 'success'
                    : shift.status === 'rejected'
                    ? 'destructive'
                    : 'default'
                }
              >
                {shift.status.charAt(0).toUpperCase() + shift.status.slice(1)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {shift.requirements.map((req) => (
                <Badge key={req} variant="outline">
                  {req}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
} 