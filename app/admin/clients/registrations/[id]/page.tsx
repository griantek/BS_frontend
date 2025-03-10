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
  const [error, setError] = React.useState<string | null>(null);
  // Add a mounted ref to prevent state updates after unmount
  const isMounted = React.useRef(true);

  React.useEffect(() => {
    // Mark component as mounted
    isMounted.current = true;
    console.log('Registration detail page mounted, ID:', regId);

    const fetchData = async () => {
      if (!regId) return;
      
      try {
        setIsLoading(true);
        console.log('Fetching registration data for ID:', regId);
        
        const registrationResponse = await api.getRegistrationById(parseInt(regId));
        console.log('Registration data received:', registrationResponse.success);
        
        // Check if component is still mounted before updating state
        if (!isMounted.current) return;
        
        if (registrationResponse.success) {
          setRegistrationData(registrationResponse.data);
          
          try {
            // Fetch editors after confirming registration exists
            const editorsResponse = await api.getAllEditors();
            
            // Check again if component is mounted
            if (!isMounted.current) return;
            
            setEditors(editorsResponse.data);
          } catch (editorError) {
            console.error('Error fetching editors:', editorError);
            // Don't fail the whole page just because editors couldn't be fetched
          }
        } else {
          setError('Registration not found');
        }
      } catch (error: any) {
        console.error('Error fetching registration:', error);
        
        // Check if component is still mounted before updating state
        if (!isMounted.current) return;
        
        setError(error.message || 'Failed to load registration data');
        toast.error('Failed to load registration data');
      } finally {
        // Final check for mounted state
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    // Clean up function to prevent state updates after unmount
    return () => {
      console.log('Registration detail page unmounting');
      isMounted.current = false;
    };
  }, [regId]);

  // Handle back button with history navigation to avoid redirect loops
  const handleBack = () => {
    try {
      router.back();
    } catch (e) {
      // Fallback if router.back() fails
      router.push('/admin/clients/registrations');
    }
  };

  // Create the missing handleDelete function
  const handleDelete = async () => {
    try {
      if (!registrationData) return;
      
      setIsDeleting(true);
      const response = await api.deleteRegistration(registrationData.id);
      
      if (response.success) {
        toast.success('Registration deleted successfully');
        console.log('Navigation after delete: /admin/clients/registrations');
        
        // Force navigation using window.location to avoid routing issues
        window.location.href = '/admin/clients/registrations';
      } else {
        toast.error('Failed to delete registration');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete registration');
    } finally {
      setIsDeleting(false);
      onDeleteModalClose();
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-[400px]">
        <Spinner size="lg" />
        <p className="mt-4">Loading registration data...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-[400px]">
        <p className="text-danger">{error}</p>
        <Button 
          className="mt-4"
          onClick={() => router.push('/admin/clients/registrations')}
        >
          Return to Registrations
        </Button>
      </div>
    );
  }

  if (!registrationData) {
    return (
      <div className="flex flex-col justify-center items-center h-[400px]">
        <p>Registration not found</p>
        <Button 
          className="mt-4"
          onClick={() => router.push('/admin/clients/registrations')}
        >
          Return to Registrations
        </Button>
      </div>
    );
  }

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
        onPress={handleBack} // Use onPress instead of onClick
      >
        <ArrowLeftIcon className="h-5 w-5" />
      </Button>

      <div className="w-full p-6 space-y-6">
        {/* Header with status and actions */}
        <Card className="w-full">
          <CardHeader className="flex justify-between items-center px-6 py-4">
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold">Registration Details</h1>
              <p className="text-small text-default-500">ID: {registrationData.prospectus.reg_id}</p>
            </div>
            <Button
              color="danger"
              variant="flat"
              onPress={onDeleteModalOpen}
            >
              Delete Registration
            </Button>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Client Details */}
          <Card className="w-full">
            <CardHeader>
              <h2 className="text-xl font-bold">Client Information</h2>
            </CardHeader>
            <Divider />
            <CardBody className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <InfoField label="Client Name" value={registrationData.prospectus.client_name} />
                <InfoField label="Email" value={registrationData.prospectus.email} />
                <InfoField label="Phone" value={registrationData.prospectus.phone} />
                <InfoField label="Department" value={registrationData.prospectus.department} />
                <InfoField label="State" value={registrationData.prospectus.state} />
                {registrationData.assigned_to && (
                  <InfoField 
                    label="Assigned Editor" 
                    value={editors?.find(e => e.id === registrationData.assigned_to)?.username || 'N/A'} 
                  />
                )}
                <InfoField label="Status">
                  <Chip
                    color={registrationData.status === 'registered' ? 'success' : 'warning'}
                    variant="flat"
                  >
                    {registrationData.status}
                  </Chip>
                </InfoField>
              </div>
            </CardBody>
          </Card>

          {/* Registration Details */}
          <Card className="w-full">
            <CardHeader>
              <h2 className="text-xl font-bold">Registration Details</h2>
            </CardHeader>
            <Divider />
            <CardBody className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <InfoField label="Registration Date" value={formatDate(registrationData.date)} />
                <InfoField label="Services" value={registrationData.services} />
                <InfoField label="Accept Period" value={registrationData.accept_period} />
                <InfoField label="Publication Period" value={registrationData.pub_period} />
                <InfoField label="Month/Year" value={`${registrationData.month}/${registrationData.year}`} />
              </div>
            </CardBody>
          </Card>

          {/* Financial Information */}
          <Card className="w-full md:col-span-2">
            <CardHeader>
              <h2 className="text-xl font-bold">Financial Overview</h2>
            </CardHeader>
            <Divider />
            <CardBody className="space-y-8">
              {/* Amount Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-default-50 p-4 rounded-xl">
                  <p className="text-sm text-default-600 mb-1">Total Amount</p>
                  <p className="text-2xl font-bold">₹{registrationData.total_amount.toLocaleString()}</p>
                </div>
                {registrationData.status === 'registered' && (
                  <>
                    <div className="bg-default-50 p-4 rounded-xl">
                      <p className="text-sm text-default-600 mb-1">Amount Paid</p>
                      <p className="text-2xl font-bold text-success">
                        ₹{registrationData.transactions.amount.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-default-50 p-4 rounded-xl">
                      <p className="text-sm text-default-600 mb-1">Payment Status</p>
                      <Chip 
                        color={registrationData.transactions.amount === registrationData.total_amount ? 'success' : 'warning'}
                        variant="flat"
                      >
                        {registrationData.transactions.amount === registrationData.total_amount ? 'Paid' : 'Partial'}
                      </Chip>
                    </div>
                  </>
                )}
              </div>

              {/* Transaction Details */}
              {registrationData.status === 'registered' && (
                <div className="bg-default-50 p-6 rounded-xl">
                  <h3 className="text-md font-semibold mb-4">Transaction Information</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <InfoField label="Payment Method">
                      <Chip color="primary" variant="flat">
                        {registrationData.transactions.transaction_type}
                      </Chip>
                    </InfoField>
                    <InfoField 
                      label="Transaction ID" 
                      value={registrationData.transactions.transaction_id} 
                    />
                    <InfoField 
                      label="Transaction Date" 
                      value={formatDate(registrationData.transactions.transaction_date)} 
                    />
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Bank Details */}
          {registrationData.status === 'registered' && (
            <Card className="w-full md:col-span-2">
              <CardHeader>
                <h2 className="text-xl font-bold">Bank Information</h2>
              </CardHeader>
              <Divider />
              <CardBody className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <InfoField label="Bank Name" value={registrationData.bank_accounts.bank} />
                  <InfoField label="Branch" value={registrationData.bank_accounts.branch} />
                  <InfoField label="Account Name" value={registrationData.bank_accounts.account_name} />
                  <InfoField label="Account Number" value={registrationData.bank_accounts.account_number} />
                  <InfoField label="IFSC Code" value={registrationData.bank_accounts.ifsc_code} />
                  {registrationData.bank_accounts.upi_id && (
                    <InfoField label="UPI ID" value={registrationData.bank_accounts.upi_id} />
                  )}
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>

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
                  onPress={handleDelete} // Update to use the handleDelete function
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
