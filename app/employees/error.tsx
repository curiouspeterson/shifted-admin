"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function EmployeesError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Employees page error:", error)
  }, [error])

  return (
    <div className="container mx-auto py-10">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-red-600">Error</h1>
        <p className="mt-4 text-muted-foreground">
          Something went wrong while loading the employees.
        </p>
        <Button onClick={reset} className="mt-4">
          Try again
        </Button>
      </div>
    </div>
  )
} 