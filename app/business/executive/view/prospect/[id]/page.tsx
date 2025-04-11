"use client"
import React, { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { checkAuth } from '@/utils/authCheck';
import { toast } from 'react-toastify';
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Divider,
  Chip,
  Avatar,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/react";
import { format } from 'date-fns';
import { ArrowLeftIcon, TrashIcon } from '@heroicons/react/24/outline';
import api from '@/services/api';
import { withExecutiveAuth } from '@/components/withExecutiveAuth';
import { hasPermission, PERMISSIONS, UserWithPermissions } from '@/utils/permissions';

// Define params type
interface PageParams {
  id: string;
}

interface ProspectData {
  id: number;
  entity_id: string;
  date: string;
  email: string;
  reg_id: string;
  client_name: string;
  phone: string;
  department: string;
  state: string;
  tech_person: string;
  requirement: string;
  proposed_service_period: string;
  created_at: string;
  services: string;
  // Additional fields that match the display
  address?: string;
  city?: string;
  pincode?: string;
  proposedService?: string;  // Map to services if needed
  period?: string;          // Map to proposed_service_period if needed
  notes?: string;
  lastContact?: string;
  next_follow_up?: string;
  status?: string;
}

interface ApiResponse {
  success: boolean;
  data: ProspectData;
  timestamp: string;
}

function ProspectContent({ regId }: { regId: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(true);
  const [prospectData, setProspectData] = React.useState<ProspectData | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isDeleting, setIsDeleting] = React.useState(false);
  
  // Add permission states
  const [permissions, setPermissions] = React.useState({
    canSendQuotation: false,
    canRegister: false,
    canEdit: false,
    canDelete: false
  });

  React.useEffect(() => {
    if (!checkAuth(router)) return;

    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    
    const userData: UserWithPermissions = JSON.parse(userStr);
    
    // Check permissions
    setPermissions({
      canSendQuotation: hasPermission(userData, PERMISSIONS.SHOW_SEND_QUOTE_BTN),
      canRegister: hasPermission(userData, PERMISSIONS.SHOW_REGISTER_BTN),
      canEdit: hasPermission(userData, PERMISSIONS.SHOW_EDIT_BUTTON_EXECUTIVE),
      canDelete: hasPermission(userData, PERMISSIONS.SHOW_DELETE_BUTTON_EXECUTIVE)
    });

    const fetchProspectData = async () => {
      try {
        setIsLoading(true);
        const response = await api.getProspectusByRegId(regId);
        // Map API response fields to display fields
        const mappedData: ProspectData = {
          ...response.data,
          proposedService: response.data.services,
          period: response.data.proposed_service_period,
          // Add default values for optional fields
          address: '',
          city: '',
          pincode: '',
          notes:  response.data.notes,
          lastContact: response.data.created_at, // Fallback to created_at
          next_follow_up: response.data.next_follow_up, 
          status: 'Active' // Default status
        };
        setProspectData(mappedData);
      } catch (error) {
        console.error('Error fetching prospect:', error);
        const errorMessage = api.handleError(error);
        toast.error(errorMessage.error || 'Failed to load prospect data');
        // router.push('/business/executive');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProspectData();
  }, [router, regId]);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await api.deleteProspectus([regId]);
      toast.success('Prospect deleted successfully');
      setTimeout(() => {
        window.location.href = '/business/executive';
      }, 1500);
    } catch (error) {
      console.error('Delete error:', error);
      const errorMessage = api.handleError(error);
      toast.error(errorMessage.error || 'Failed to delete prospect');
    } finally {
      setIsDeleting(false);
      onClose();
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (!prospectData) return <div>No data found</div>;

  return (
    <>
      {/* Back button */}
      <Button
        isIconOnly
        variant="light"
        className="fixed top-4 left-4 z-50"
        onClick={() => router.push('/business/executive/records')}
      >
        <ArrowLeftIcon className="h-5 w-5" />
      </Button>

      <div className="w-full p-6 space-y-6">
        {/* Header with actions */}
        <Card className="w-full">
          <CardHeader className="flex justify-between items-center px-6 py-4">
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold">Prospect Details</h1>
              <p className="text-small text-default-500">ID: {prospectData.reg_id}</p>
            </div>
            <div className="flex gap-3">
              {permissions.canSendQuotation && (
                <Button
                  color="secondary"
                  variant="flat"
                  onClick={() => router.push(`/business/executive/quotation/${regId}`)}
                >
                  Send Quotation
                </Button>
              )}
              {permissions.canRegister && (
                <Button
                  color="success"
                  variant="flat"
                  onPress={() => router.push(`/business/executive/register/${regId}`)}
                >
                  Register
                </Button>
              )}
              {permissions.canEdit && (
                <Button
                  color="primary"
                  variant="flat"
                  onPress={() => router.push(`/business/executive/edit/prospect/${regId}`)}
                >
                  Edit Details
                </Button>
              )}
              {permissions.canDelete && (
                <Button
                  color="danger"
                  variant="flat"
                  onPress={onOpen}
                  startContent={<TrashIcon className="h-5 w-5" />}
                >
                  Delete
                </Button>
              )}
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card className="w-full">
            <CardHeader className="flex gap-3">
              <div className="flex flex-col">
                <p className="text-md font-semibold">Basic Information</p>
              </div>
            </CardHeader>
            <Divider/>
            <CardBody className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-small text-default-500">Client Name</p>
                <p className="font-medium">{prospectData.client_name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-small text-default-500">Email</p>
                <p className="font-medium">{prospectData.email}</p>
              </div>
              <div className="space-y-1">
                <p className="text-small text-default-500">Phone</p>
                <p className="font-medium">{prospectData.phone}</p>
              </div>
              <div className="space-y-1">
                <p className="text-small text-default-500">Department</p>
                <p className="font-medium">{prospectData.department}</p>
              </div>
              {/* <div className="space-y-1">
                <p className="text-small text-default-500">Status</p>
                <Chip color="success" variant="flat" size="sm">
                  {prospectData.status}
                </Chip>
              </div> */}
              <div className="space-y-1">
                <p className="text-small text-default-500">Location</p>
                <p className="font-medium">{prospectData.state}</p>
              </div>
            </CardBody>
          </Card>

          {/* Service Information */}
          <Card className="w-full">
            <CardHeader className="flex gap-3">
              <div className="flex flex-col">
                <p className="text-md font-semibold">Service Details</p>
              </div>
            </CardHeader>
            <Divider/>
            <CardBody className="space-y-4">
              <div className="space-y-1">
                <p className="text-small text-default-500">Proposed Service</p>
                <p className="font-medium">{prospectData.proposedService}</p>
              </div>
              <div className="space-y-1">
                <p className="text-small text-default-500">Period</p>
                <p className="font-medium">{prospectData.period}</p>
              </div>
              <div className="space-y-1">
                <p className="text-small text-default-500">Tech person</p>
                <p className="font-medium">{prospectData.tech_person}</p>
              </div>
            </CardBody>
          </Card>

          {/* Requirements & Notes */}
          <Card className="w-full md:col-span-2">
            <CardHeader className="flex gap-3">
              <div className="flex flex-col">
                <p className="text-md font-semibold">Requirements & Follow-up</p>
              </div>
            </CardHeader>
            <Divider/>
            <CardBody className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-small text-default-500">Requirements</p>
                  <p className="font-medium">{prospectData.requirement}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-small text-default-500">Notes</p>
                  <p className="font-medium">{prospectData.notes}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-small text-default-500">Created At</p>
                  <p className="font-medium">{prospectData.lastContact ? format(new Date(prospectData.lastContact), 'dd/MM/yyyy') : 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-small text-default-500">Next Follow-up</p>
                  <p className="font-medium">{prospectData.next_follow_up ? format(new Date(prospectData.next_follow_up), 'dd/MM/yyyy') : 'N/A'}</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Add Delete Confirmation Modal */}
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalContent>
            <ModalHeader>Confirm Delete</ModalHeader>
            <ModalBody>
              Are you sure you want to delete this prospect? This action cannot be undone.
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose} isDisabled={isDeleting}>
                Cancel
              </Button>
              <Button color="danger" onPress={handleDelete} isLoading={isDeleting}>
                Delete
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    </>
  );
}

interface PageProps {
  params: Promise<{ id: string }>;
}

// Main component wrapper that handles the Promise params
function ProspectView({ params }: PageProps) {
  const resolvedParams = React.use(params);
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProspectContent regId={resolvedParams.id} />
    </Suspense>
  );
}

export default withExecutiveAuth(ProspectView);
