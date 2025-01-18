import { Button } from "@/app/components/ui/button"
import Link from "next/link"

export default function EmployeeNotFound() {
  return (
    <div className="container mx-auto py-10">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-3xl font-bold tracking-tight text-red-600">
          Employee Not Found
        </h1>
        <p className="mt-4 text-muted-foreground">
          The employee you are looking for does not exist or has been removed.
        </p>
        <Button asChild className="mt-4">
          <Link href="/dashboard/employees">Back to Employees</Link>
        </Button>
      </div>
    </div>
  )
} 