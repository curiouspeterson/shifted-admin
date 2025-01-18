/**
 * Schedule Filters Component
 * Last Updated: 2025-03-19
 * 
 * Provides filtering controls for the schedule list.
 */

'use client'

import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select'

interface ScheduleFiltersProps {
  onFilterChange?: (filters: { status?: string }) => void
}

export default function ScheduleFilters({ onFilterChange }: ScheduleFiltersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Select
            onValueChange={(value) => onFilterChange?.({ status: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" onClick={() => onFilterChange?.({})}>
          Reset Filters
        </Button>
      </CardContent>
    </Card>
  )
} 