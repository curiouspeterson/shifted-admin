/**
 * Error Chart Component
 * Last Updated: 2025-03-19
 * 
 * Displays error statistics in a chart format.
 */

'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { BarChart } from '@/app/components/ui/charts/bar-chart'

interface ErrorChartProps {
  data: {
    date: string
    count: number
  }[]
}

export function ErrorChart({ data }: ErrorChartProps) {
  // Transform data to match BarChart's expected format
  const chartData = data.map(item => ({
    name: item.date,
    value: item.count
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Error Frequency</CardTitle>
      </CardHeader>
      <CardContent>
        <BarChart
          data={chartData}
          height={300}
        />
      </CardContent>
    </Card>
  )
} 