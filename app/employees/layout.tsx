import { Toaster } from "sonner"

export default function EmployeesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
      <Toaster />
    </>
  )
} 