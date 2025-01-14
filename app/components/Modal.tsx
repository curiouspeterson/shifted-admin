/**
 * Modal Component
 * Last Updated: 2024
 * 
 * A reusable modal dialog component built on top of NextUI's Modal.
 * Provides a consistent modal experience across the application with
 * standardized styling and behavior.
 * 
 * Features:
 * - Centered placement
 * - Blur backdrop
 * - Consistent sizing
 * - Standardized header styling
 * - Flexible content area
 */

'use client'

import {
  Modal as NextUIModal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Button,
} from "@nextui-org/react"

/**
 * Modal Props Interface
 * @property open - Whether the modal is visible
 * @property onClose - Function to call when the modal should close
 * @property title - Text to display in the modal header
 * @property children - Content to display in the modal body
 */
interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

/**
 * Modal Component
 * Wraps NextUI's Modal component with standardized styling and behavior
 * 
 * @param props - Modal properties
 * @param props.open - Controls modal visibility
 * @param props.onClose - Handler for modal close events
 * @param props.title - Modal title text
 * @param props.children - Modal content
 * @returns A styled modal dialog
 */
export default function Modal({ open, onClose, title, children }: ModalProps) {
  return (
    <NextUIModal 
      isOpen={open} 
      onOpenChange={onClose}
      placement="center"
      backdrop="blur"
      size="2xl"
    >
      <ModalContent>
        {(onClose) => (
          <>
            {/* Modal Header with standardized styling */}
            <ModalHeader className="flex flex-col gap-1 text-xl font-semibold">
              {title}
            </ModalHeader>

            {/* Modal Body with consistent padding */}
            <ModalBody className="py-4">
              {children}
            </ModalBody>
          </>
        )}
      </ModalContent>
    </NextUIModal>
  )
} 