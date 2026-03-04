"use client";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmLabel?: string;
  confirmColor?: "danger" | "warning" | "primary";
  isLoading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm",
  message,
  confirmLabel = "Confirm",
  confirmColor = "danger",
  isLoading,
}: ConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} size="sm" onClose={onClose}>
      <ModalContent>
        <ModalHeader className="pb-2">{title}</ModalHeader>
        <ModalBody>
          <p className="text-default-600 text-sm">{message}</p>
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={onClose}>
            Cancel
          </Button>
          <Button
            color={confirmColor}
            isLoading={isLoading}
            onPress={onConfirm}
          >
            {confirmLabel}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
