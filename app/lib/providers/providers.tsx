/**
 * Providers Component Module
 * Last Updated: 2024
 * 
 * Root providers component that wraps the application with necessary context providers.
 * Handles UI theming and styling through NextUI and next-themes integration.
 * 
 * Features:
 * - NextUI component library provider
 * - System-aware dark/light theme handling
 * - Client-side rendering for theme switching
 * - Type-safe props handling
 * 
 * Note: This component is marked with 'use client' since theme handling
 * requires client-side interactivity.
 */

'use client'

import { createClient } from '@/app/lib/supabase/server'
import { NextUIProvider } from "@nextui-org/react"
import { ThemeProvider } from "next-themes"

/**
 * Root Providers Component
 * Wraps the application with necessary context providers for theming and UI components
 * 
 * @component
 * @param props.children - Child components to be wrapped by the providers
 * @returns Application wrapped with NextUI and theme providers
 */
export default function Providers({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <NextUIProvider>
      <ThemeProvider
        attribute="class" // CSS class attribute used for theme switching
        defaultTheme="system" // Default to system theme preference
        enableSystem // Enable system theme detection
      >
        {children}
      </ThemeProvider>
    </NextUIProvider>
  )
} 