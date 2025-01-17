/**
 * Test Modal Component
 * Last Updated: 2025-01-17
 * 
 * A demonstration component showcasing the implementation of our
 * custom modal component with proper error boundaries and debugging.
 */

'use client'

import { useState } from 'react'
import { Button } from './client-wrappers/button-client'
import { Input } from './client-wrappers/input-client'
import { Modal } from './ui/modal'
import { ErrorBoundary } from 'react-error-boundary'

interface ErrorFallbackProps {
  error: Error
  resetErrorBoundary: () => void
}

function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <div className="p-4 border border-red-500 rounded-md">
      <h2 className="text-lg font-semibold text-red-600">Something went wrong:</h2>
      <pre className="mt-2 text-sm text-red-500">{error.message}</pre>
      <Button
        onClick={resetErrorBoundary}
        variant="outline"
        className="mt-4"
      >
        Try again
      </Button>
    </div>
  )
}

export default function TestModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }

  const handleClose = () => {
    setInputValue('')
    setIsOpen(false)
  }

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={handleClose}
      onError={(error: Error) => {
        // Log errors in development
        if (process.env.NODE_ENV === 'development') {
          console.error('[Modal Error]', {
            error,
            timestamp: new Date().toISOString(),
            componentStack: error.stack,
          })
        }
      }}
    >
      <div className="flex flex-col gap-4">
        {/* Basic Modal */}
        <div>
          <h2 className="mb-2 text-lg font-semibold">Basic Modal</h2>
          <Button onClick={() => setIsOpen(true)}>
            Open Basic Modal
          </Button>

          <Modal
            open={isOpen}
            onOpenChange={setIsOpen}
            title="Basic Modal Example"
          >
            <div className="space-y-4">
              <p>This is a basic modal example using our custom Modal component.</p>
              <Input
                type="text"
                placeholder="Try typing here"
                className="w-full"
                value={inputValue}
                onChange={handleInputChange}
              />
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleClose}
                >
                  Cancel
                </Button>
                <Button onClick={() => setIsOpen(false)}>
                  Confirm
                </Button>
              </div>
            </div>
          </Modal>
        </div>
      </div>
    </ErrorBoundary>
  )
} 