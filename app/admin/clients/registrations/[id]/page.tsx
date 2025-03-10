"use client";
import React, { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Divider,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Spinner,
} from "@heroui/react";
import { format } from 'date-fns';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import api from '@/services/api';
import { WithAdminAuth } from '@/components/withAdminAuth';
import type { Registration, BankAccount, Editor } from '@/services/api';
import { toast } from 'react-toastify';

interface RegistrationContent {
  regId: string;
}

function RegistrationContent({ regId }: RegistrationContent) {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(true);
  const [registrationData, setRegistrationData] = React.useState<Registration | null>(null);
  const [editors, setEditors] = React.useState<Editor[]>([]);
  const { isOpen: isDeleteModalOpen, onOpen: onDeleteModalOpen, onClose: onDeleteModalClose } = useDisclosure();
  const [isDeleting, setIsDeleting] = React.useState(false);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [registrationResponse, editorsResponse] = await Promise.all([
          api.getRegistrationById(parseInt(regId)),
          api.getAllEditors(),
        ]);
        setRegistrationData(registrationResponse.data);
        setEditors(editorsResponse.data);
      } catch (error) {
        console.error('Error fetching registration:', error);
        toast.error('Failed to load registration data');
        router.push('/admin/clients/registrations');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [regId, router]);

  // Handle delete registration
  const handleDelete = async () => {
    try {
      if (!registrationData) return;
      
      setIsDeleting(true);
      await api.deleteRegistration(registrationData.id);
      toast.success('Registration deleted successfully');
      router.push('/admin/clients/registrations');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete registration');
    } finally {
      setIsDeleting(false);
      onDeleteModalClose();
    }
  };

  if (isLoading) return <div className="flex justify-center items-center h-[400px]"><Spinner size="lg" /></div>;
  if (!registrationData) return <div>No data found</div>;

  // Reuse the same InfoField component and other helper functions from executive view
  const InfoField = ({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) => (
    <div className="space-y-1">
      <p className="text-sm text-gray-600">{label}</p>
      {children || <p className="font-medium">{value}</p>}
    </div>
  );

  const formatDate = (date: string) => format(new Date(date), 'dd/MM/yyyy');

  return (
    <>
      <Button
        isIconOnly
        variant="light"
        className="fixed top-4 left-4 z-50"
        onClick={() => router.push('/admin/clients/registrations')}
      >
        <ArrowLeftIcon className="h-5 w-5" />
      </Button>

      {/* Rest of the JSX structure from executive view */}
      {/* ... Copy and paste the JSX structure from the executive registration view ... */}
      {/* Just remove the edit functionality since admin should only view/delete */}
      
      {/* Delete Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={onDeleteModalClose}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Delete Registration</ModalHeader>
              <ModalBody>
                Are you sure you want to delete this registration? This action cannot be undone.
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button 
                  color="danger" 
                  onPress={handleDelete}
                  isLoading={isDeleting}
                >
                  Delete Registration
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}

interface PageProps {
  params: Promise<{ id: string }>;
}

function RegistrationView({ params }: PageProps) {
  const resolvedParams = React.use(params);
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RegistrationContent regId={resolvedParams.id} />
    </Suspense>
  );
}

export default WithAdminAuth(RegistrationView);
