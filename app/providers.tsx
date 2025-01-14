/**
 * Application Providers Component
 * Last Updated: 2024
 * 
 * Wraps the application with necessary context providers for UI theming,
 * component styling, and application state management. This component
 * serves as the root provider for all global contexts.
 * 
 * Features:
 * - NextUI component library provider
 * - Theme management with system preference detection
 * - Global application context for employee data
 * - Client-side only functionality
 */

'use client'

import { NextUIProvider } from "@nextui-org/react"
import { ThemeProvider } from "next-themes"
import { AppProvider } from "./lib/context/app-context"

/**
 * Props for the Providers component
 * @property children - Child components to be wrapped by providers
 * @property employee - Optional employee data for the app context
 */
interface ProvidersProps {
  children: React.ReactNode
  employee?: any
}

/**
 * Root Providers Component
 * Wraps the application with all necessary context providers
 * Manages UI theming, styling, and global state
 * 
 * @param props - Component properties
 * @returns Provider-wrapped application content
 */
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