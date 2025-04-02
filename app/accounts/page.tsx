"use client";
import React, { useState, useEffect } from "react";
import { 
  Card, 
  CardHeader, 
  CardBody, 
  Input, 
  Button, 
  Spinner,
  useDisclosure,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter
} from "@heroui/react";
import { useRouter } from "next/navigation";
import { UserCircleIcon, KeyIcon, EnvelopeIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import api from "@/services/api";
import { toast } from "react-toastify";

export default function AccountsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [user, setUser] = useState<{id: string; username: string; email: string; is_protected?: boolean} | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
  });
  const [isProtected, setIsProtected] = useState(false);
  
  // Password change state
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verifyingPassword, setVerifyingPassword] = useState(false);
  const [passwordVerified, setPasswordVerified] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Check if user is logged in
        const token = localStorage.getItem('token');
        const userString = localStorage.getItem('user');
        
        if (!token || !userString) {
          // Not logged in, redirect to home page
          router.replace('/');
          return;
        }
        
        const userData = JSON.parse(userString);
        if (userData) {
          setUser(userData);
          
          // Check if user is protected
          if (userData.is_protected) {
            setIsProtected(true);
          } else {
            setFormData({
              username: userData.username || "",
              email: userData.email || "",
            });
          }
        } else {
          // Invalid user data, redirect to home page
          router.replace('/');
          return;
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast.error("Failed to load user data");
        // On error, also redirect to home
        router.replace('/');
      }
    };

    fetchUserData();
  }, [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setIsSaving(true);
    try {
      // Use the updateUserProfile method from our API service
      const response = await api.updateUserProfile(user.id, {
        username: formData.username,
        email: formData.email
      });

      if (response.success) {
        // Update the stored user data
        const updatedUser = { ...user, ...formData };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        toast.success("Profile updated successfully");
      } else {
        toast.error("Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const verifyPassword = async () => {
    if (!user?.id || !oldPassword) return;

    setVerifyingPassword(true);
    setPasswordError("");
    
    try {
      // Use the verifyPassword method from our API service
      const response = await api.verifyPassword({
        entityId: user.id,
        password: oldPassword
      });
      console.log("Password verification response:", response);

      if (response.success && response.data.success) {
        setPasswordVerified(true);
      } else {
        // Use custom message if available, otherwise use default message
        setPasswordError(response.message || "Current password is incorrect");
        setOldPassword("");  // Clear the password field for retry
      }
    } catch (error) {
      console.error("Error verifying password:", error);
      setPasswordError("Failed to verify password. Please try again.");
      setOldPassword("");  // Clear the password field for retry
    } finally {
      setVerifyingPassword(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user?.id || !newPassword || !confirmPassword) return;
    
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords don't match");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters long");
      return;
    }

    setVerifyingPassword(true);
    setPasswordError("");
    
    try {
      // Use the changePassword method from our API service
      const response = await api.changePassword(user.id, {
        newPassword: newPassword
      });

      if (response.success) {
        toast.success("Password updated successfully");
        onClose();
        // Reset all password fields
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setPasswordVerified(false);
      } else {
        setPasswordError("Failed to update password");
      }
    } catch (error) {
      console.error("Error updating password:", error);
      setPasswordError("Failed to update password");
    } finally {
      setVerifyingPassword(false);
    }
  };

  const handlePasswordChange = () => {
    onOpen();
    setPasswordVerified(false);
    setPasswordError("");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isProtected) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <span className="font-medium">Access Restricted:</span> Your account is protected and cannot be modified through this interface.
              </p>
              <p className="mt-2 text-sm text-yellow-700">
                Please contact an administrator if you need to update your account information.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Account Settings</h1>
      
      <Card className="mb-6">
        <CardHeader className="flex gap-3">
          <UserCircleIcon className="w-8 h-8" />
          <div>
            <p className="text-xl font-medium">Profile Information</p>
            <p className="text-sm text-default-500">Update your account details</p>
          </div>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <Input
                label="Username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                startContent={<UserCircleIcon className="w-4 h-4 text-default-400" />}
                placeholder="Enter your username"
                isRequired
              />
              
              <Input
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                startContent={<EnvelopeIcon className="w-4 h-4 text-default-400" />}
                placeholder="Enter your email"
                isRequired
              />
              
              <div className="pt-2">
                <Button 
                  color="primary"
                  type="submit"
                  isLoading={isSaving}
                  className="w-full sm:w-auto"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </form>
        </CardBody>
      </Card>
      
      <Card>
        <CardHeader className="flex gap-3">
          <KeyIcon className="w-8 h-8" />
          <div>
            <p className="text-xl font-medium">Change Password</p>
            <p className="text-sm text-default-500">Update your security credentials</p>
          </div>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <p className="text-sm text-default-500">
              Passwords must be at least 8 characters long and contain a mix of letters and numbers.
            </p>
            
            <Button 
              color="primary" 
              variant="flat"
              onClick={handlePasswordChange}
              className="w-full sm:w-auto"
            >
              Change Password
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Password Change Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            Change Password
          </ModalHeader>
          <ModalBody>
            {!passwordVerified ? (
              <>
                <p className="text-sm text-default-500 mb-2">
                  Please enter your current password to continue.
                </p>
                <Input
                  label="Current Password"
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Enter your current password"
                  isInvalid={!!passwordError}
                  errorMessage={passwordError}
                />
              </>
            ) : (
              <>
                <Input
                  label="New Password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="mb-2"
                />
                <Input
                  label="Confirm Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  isInvalid={!!passwordError}
                  errorMessage={passwordError}
                />
              </>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onClose}>
              Cancel
            </Button>
            {!passwordVerified ? (
              <Button 
                color="primary" 
                isLoading={verifyingPassword}
                onPress={verifyPassword}
              >
                Verify Password
              </Button>
            ) : (
              <Button 
                color="primary" 
                isLoading={verifyingPassword}
                onPress={handleChangePassword}
              >
                Update Password
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
