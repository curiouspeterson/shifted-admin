'use client'

import {
  Modal as NextUIModal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Button,
} from "@nextui-org/react"

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

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
            <ModalHeader className="flex flex-col gap-1 text-xl font-semibold">
              {title}
            </ModalHeader>
            <ModalBody className="py-4">
              {children}
            </ModalBody>
          </>
        )}
      </ModalContent>
    </NextUIModal>
  )
} 