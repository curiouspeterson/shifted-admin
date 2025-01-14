'use client'

import { NextUIProvider } from "@nextui-org/react"
import { ThemeProvider } from "next-themes"
import { AppProvider } from "./lib/context/app-context"

interface ProvidersProps {
  children: React.ReactNode
  employee?: any
}

export default function Providers({
  children,
  employee
}: ProvidersProps) {
  return (
    <NextUIProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
      >
        <AppProvider employee={employee}>
          {children}
        </AppProvider>
      </ThemeProvider>
    </NextUIProvider>
  )
} 