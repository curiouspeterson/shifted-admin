/**
 * Loading Component
 * Last Updated: 2024-03
 * 
 * This component provides a consistent loading state UI
 * that can be used across the application.
 */

import React from 'react'

interface Props {
  /**
   * Optional text to display below the spinner
   */
  text?: string
  /**
   * Whether to show a full-page loading state
   */
  fullPage?: boolean
  /**
   * Optional className to override the default styles
   */
  className?: string
}

/**
 * Loading spinner component with optional text and full-page variant
 */
export function Loading({ text, fullPage, className }: Props) {
  const content = (
    <div className={`flex flex-col items-center justify-center ${className || ''}`}>
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-4 border-gray-200" />
        <div className="absolute top-0 left-0 w-12 h-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
      </div>
      {text && (
        <p className="mt-4 text-sm text-gray-600">{text}</p>
      )}
    </div>
  )

  if (fullPage) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-90 z-50">
        {content}
      </div>
    )
  }

  return content
}

/**
 * Loading skeleton component for content placeholders
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div 
      className={`animate-pulse bg-gray-200 rounded ${className || ''}`} 
      aria-hidden="true"
    />
  )
}

/**
 * Loading skeleton for text content
 */
export function TextSkeleton({ lines = 1, className }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className || ''}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          className={`h-4 ${i === lines - 1 ? 'w-4/5' : 'w-full'}`}
        />
      ))}
    </div>
  )
}

/**
 * Loading skeleton for a card or container
 */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={`p-4 rounded-lg border border-gray-200 ${className || ''}`}>
      <Skeleton className="h-6 w-3/4 mb-4" />
      <TextSkeleton lines={3} />
    </div>
  )
}

/**
 * Loading skeleton for a table row
 */
export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <div className="flex space-x-4 py-4">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton 
          key={i} 
          className={`h-4 ${i === 0 ? 'w-1/4' : 'w-1/6'}`}
        />
      ))}
    </div>
  )
}

/**
 * Loading skeleton for a grid of items
 */
export function GridSkeleton({ 
  items = 6, 
  columns = 3 
}: { 
  items?: number
  columns?: number 
}) {
  return (
    <div 
      className="grid gap-4" 
      style={{ 
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` 
      }}
    >
      {Array.from({ length: items }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
} 