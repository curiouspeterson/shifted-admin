/**
 * Error Filters Component
 * Last Updated: 2025-03-19
 * 
 * Provides filtering options for error reports.
 */

'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select'
import { DateRangePicker } from '@/app/components/ui/date-range-picker'
import { ErrorSeverity, type ErrorSeverityType } from '@/app/lib/logging/error-logger'
import { DateRange } from 'react-day-picker'

interface ErrorFiltersProps {
  onSeverityChange: (severity: ErrorSeverityType | null) => void
  onDateRangeChange: (range: DateRange | undefined) => void
}

export function ErrorFilters({
  onSeverityChange,
  onDateRangeChange,
}: ErrorFiltersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Filter Errors</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Select onValueChange={(value) => onSeverityChange(value as ErrorSeverityType | null)}>
            <SelectTrigger>
              <SelectValue placeholder="Select severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ErrorSeverity.DEBUG}>Debug</SelectItem>
              <SelectItem value={ErrorSeverity.INFO}>Info</SelectItem>
              <SelectItem value={ErrorSeverity.WARN}>Warning</SelectItem>
              <SelectItem value={ErrorSeverity.ERROR}>Error</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <DateRangePicker
            onChange={onDateRangeChange}
            placeholder="Select date range"
          />
        </div>
      </CardContent>
    </Card>
  )
} 