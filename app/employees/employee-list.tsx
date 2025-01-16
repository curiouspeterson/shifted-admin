"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Employee } from "./types"
import { useRouter } from "next/navigation"

interface EmployeeListProps {
  employees: Employee[]
}

export function EmployeeList({ employees }: EmployeeListProps) {
  const router = useRouter()

  if (!employees.length) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">No employees found.</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-semibold text-black">Name</TableHead>
            <TableHead className="font-semibold text-black">Email</TableHead>
            <TableHead className="font-semibold text-black">Phone</TableHead>
            <TableHead className="font-semibold text-black">Position</TableHead>
            <TableHead className="font-semibold text-black">Department</TableHead>
            <TableHead className="font-semibold text-black">Status</TableHead>
            <TableHead className="text-right font-semibold text-black">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.map((employee) => (
            <TableRow key={employee.id}>
              <TableCell className="font-medium text-black">{employee.name}</TableCell>
              <TableCell className="text-black">{employee.email}</TableCell>
              <TableCell className="text-black">{employee.phone || "—"}</TableCell>
              <TableCell className="text-black">{employee.position}</TableCell>
              <TableCell className="text-black">{employee.department}</TableCell>
              <TableCell>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    employee.status === "active"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {employee.status}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/dashboard/employees/${employee.id}`)}
                >
                  Edit
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
} 