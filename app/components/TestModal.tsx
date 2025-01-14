/**
 * Test Modal Component
 * Last Updated: 2024
 * 
 * A demonstration component showcasing the implementation of NextUI's
 * modal functionality. Provides a simple example of modal usage with
 * basic interaction elements.
 * 
 * Features:
 * - Modal trigger button
 * - Centered placement
 * - Header, body, and footer sections
 * - Text input field
 * - Action buttons
 * - NextUI integration
 */

'use client'

import { useState } from "react"
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, useDisclosure } from "@nextui-org/react"

/**
 * Test Modal Component
 * Demonstrates modal functionality using NextUI components
 * 
 * @returns A button that opens a demo modal with example content
 */
export default function TestModal() {
  // Modal state management using NextUI's useDisclosure hook
  const {isOpen, onOpen, onOpenChange} = useDisclosure()

  return (
    <div>
      {/* Modal Trigger Button */}
      <Button onPress={onOpen} color="primary">Open Modal</Button>

      {/* Modal Component */}
      <Modal 
        isOpen={isOpen} 
        onOpenChange={onOpenChange}
        placement="center"
      >
        <ModalContent>
          {(onClose) => (
            <>
              {/* Modal Header */}
              <ModalHeader className="flex flex-col gap-1">Test Modal</ModalHeader>

              {/* Modal Body with Example Content */}
              <ModalBody>
                <p>This is a test modal using NextUI.</p>
                <input 
                  type="text" 
                  placeholder="Try typing here"
                  className="w-full px-3 py-2 border rounded"
                />
              </ModalBody>

              {/* Modal Footer with Action Buttons */}
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Close
                </Button>
                <Button color="primary" onPress={onClose}>
                  Action
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  )
} 