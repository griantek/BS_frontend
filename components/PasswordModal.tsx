import React from "react";
import { 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter, 
  Button, 
  Input,
  useDisclosure
} from "@heroui/react";

interface PasswordModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (password: string) => void;
  onCancel: () => void;
}

export const PasswordModal: React.FC<PasswordModalProps> = ({
  isOpen,
  onOpenChange,
  onConfirm,
  onCancel
}) => {
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [error, setError] = React.useState("");

  const handleConfirm = () => {
    if (!password) {
      setError("Password is required");
      return;
    }
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    onConfirm(password);
    setPassword("");
    setConfirmPassword("");
    setError("");
  };

  const handleCancel = () => {
    setPassword("");
    setConfirmPassword("");
    setError("");
    onCancel();
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          Create Client Password
        </ModalHeader>
        <ModalBody>
          <p className="text-sm text-gray-600 mb-4">
            This client account doesn&apos;t exist yet. Please create a password for the new client account.
          </p>
          <Input
            type="password"
            label="Password"
            placeholder="Enter password for client account"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            isRequired
          />
          <Input
            type="password"
            label="Confirm Password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            isRequired
          />
          {error && <p className="text-danger text-sm mt-2">{error}</p>}
        </ModalBody>
        <ModalFooter>
          <Button color="danger" variant="light" onPress={handleCancel}>
            Cancel
          </Button>
          <Button color="primary" onPress={handleConfirm}>
            Create Account
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default PasswordModal;
