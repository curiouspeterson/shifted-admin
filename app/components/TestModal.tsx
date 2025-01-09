'use client'

import { useState } from "react"
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, useDisclosure } from "@nextui-org/react"

export default function TestModal() {
  const {isOpen, onOpen, onOpenChange} = useDisclosure()

  return (
    <div>
      <Button onPress={onOpen} color="primary">Open Modal</Button>
      <Modal 
        isOpen={isOpen} 
        onOpenChange={onOpenChange}
        placement="center"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Test Modal</ModalHeader>
              <ModalBody>
                <p>This is a test modal using NextUI.</p>
                <input 
                  type="text" 
                  placeholder="Try typing here"
                  className="w-full px-3 py-2 border rounded"
                />
              </ModalBody>
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