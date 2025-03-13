"use client"
import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Button,
  Card,
  CardHeader,
  CardBody,
  Input,
  Chip,
  Pagination,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  useDisclosure,
  ModalFooter,
  Textarea,
} from "@heroui/react";
import { PlusIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import api, { Service } from '@/services/api';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { WithAdminAuth } from '@/components/withAdminAuth';
import { currentUserHasPermission, PERMISSIONS, isSuperAdmin } from '@/utils/permissions';

function ServicesDashboard() {
  const router = useRouter();
  const [services, setServices] = React.useState<Service[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const rowsPerPage = 10;
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedService, setSelectedService] = React.useState<Service | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [editingService, setEditingService] = React.useState<Service | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [canAddService, setCanAddService] = React.useState(false);
  const [userIsSuperAdmin, setUserIsSuperAdmin] = React.useState(false);

  React.useEffect(() => {
    // Check permissions
    const userData = api.getStoredUser();
    setUserIsSuperAdmin(userData?.role?.entity_type === 'SupAdmin');
    
    if (userData?.role?.entity_type !== 'SupAdmin') {
      setCanAddService(currentUserHasPermission(PERMISSIONS.SHOW_ADD_SERVICE_BUTTON));
    }
    
    // Rest of initialization
    const initializePage = async () => {
      try {
        setIsLoading(true);
        console.log('Auth state:', {
          token: api.getStoredToken(),
          isLoggedIn: localStorage.getItem('isLoggedIn'),
          userRole: localStorage.getItem('userRole')
        });

        const response = await api.getAllServices();
        if (response?.data) {
          setServices(response.data);
        }
      } catch (error: any) {
        console.error('Error fetching services:', error);
        const errorMessage = api.handleError(error);
        toast.error(errorMessage.error || 'Failed to load services');
        
        if (error?.response?.status === 401) {
          router.push('/admin/login');
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializePage();
  }, [router]);

  const columns = [
    { key: "service_name", label: "SERVICE NAME" },
    { key: "service_type", label: "TYPE" },
    { key: "description", label: "DESCRIPTION" },
    { key: "fee", label: "FEE" },
    { key: "duration", label: "DURATION" },
  ];

  const pages = Math.ceil(services.length / rowsPerPage);
  const items = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return services.slice(start, end);
  }, [page, services]);

  const truncateText = (text: string | null, maxLength: number = 50) => {
    if (!text) return '-';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  const handleRowClick = (service: Service) => {
    setEditingService(service);
    setIsEditModalOpen(true);
  };

  const refreshServices = async () => {
    try {
      setIsLoading(true);
      const response = await api.getAllServices();
      if (response?.data) {
        setServices(response.data);
      }
    } catch (error: any) {
      const errorMessage = api.handleError(error);
      toast.error(errorMessage.error || 'Failed to refresh services');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateService = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingService) return;

    setIsSubmitting(true);
    try {
        const formData = new FormData(event.currentTarget);
        const updateData = {
            service_name: formData.get('service_name') as string,
            service_type: formData.get('service_type') as string || undefined,
            description: formData.get('description') as string || undefined,
            fee: Number(formData.get('fee')),
            min_duration: formData.get('min_duration') as string || undefined,
            max_duration: formData.get('max_duration') as string || undefined,
        };

        await api.updateService(editingService.id, updateData);
        await refreshServices();
        
        toast.success('Service updated successfully');
        setIsEditModalOpen(false);
    } catch (error: any) {
        const errorMessage = api.handleError(error);
        toast.error(errorMessage.error || 'Failed to update service');
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDeleteService = async () => {
    if (!editingService) return;
    
    setIsSubmitting(true);
    try {
      await api.deleteService(editingService.id);
      await refreshServices();
      toast.success('Service deleted successfully');
      setIsEditModalOpen(false);
    } catch (error: any) {
      const errorMessage = api.handleError(error);
      toast.error(errorMessage.error || 'Failed to delete service');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full p-6">
      <Card className="mb-6">
        <CardHeader className="flex justify-between items-center px-6 py-4">
          <h1 className="text-2xl font-bold">Services Dashboard</h1>
          {/* Only show Add Service button if user has permission or is SuperAdmin */}
          {(userIsSuperAdmin || canAddService) && (
            <Button 
              isIconOnly
              color="primary" 
              onClick={() => router.push('/admin/services/add_service')}
              title="Add Service"
            >
              <PlusIcon className="h-5 w-5" />
            </Button>
          )}
        </CardHeader>
      </Card>

      <Card>
        <CardBody>
          <Table
            aria-label="Services table"
            bottomContent={
              <div className="flex w-full justify-center">
                <Pagination
                  isCompact
                  showControls
                  showShadow
                  color="primary"
                  page={page}
                  total={pages}
                  onChange={setPage}
                />
              </div>
            }
            classNames={{
              wrapper: "min-h-[400px]",
              tr: "cursor-pointer hover:bg-default-100",
            }}
          >
            <TableHeader columns={columns}>
              {(column) => (
                <TableColumn key={column.key}>
                  {column.label}
                </TableColumn>
              )}
            </TableHeader>
            <TableBody 
              items={items}
              emptyContent="No services found"
              isLoading={isLoading}
            >
              {(item) => (
                <TableRow 
                  key={item.id}
                  onClick={() => handleRowClick(item)}
                >
                  <TableCell>{item.service_name}</TableCell>
                  <TableCell>{item.service_type || '-'}</TableCell>
                  <TableCell>{truncateText(item.description)}</TableCell>
                  <TableCell>₹{item.fee.toLocaleString()}</TableCell>
                  <TableCell>
                    {item.min_duration && item.max_duration 
                      ? `${item.min_duration} - ${item.max_duration}`
                      : item.min_duration || item.max_duration || '-'
                    }
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {selectedService?.service_name}
                <span className="text-small text-default-500">
                  {selectedService?.service_type || 'No type specified'}
                </span>
              </ModalHeader>
              <ModalBody className="py-6">
                <div className="space-y-2">
                  <h4 className="text-medium font-medium">Description:</h4>
                  <p className="text-default-500">
                    {selectedService?.description || 'No description available.'}
                  </p>
                  <div className="flex justify-between pt-4 text-small text-default-400">
                    <span>Fee: ₹{selectedService?.fee.toLocaleString()}</span>
                    <span>
                      Duration: {selectedService?.min_duration && selectedService?.max_duration 
                        ? `${selectedService.min_duration} - ${selectedService.max_duration}`
                        : selectedService?.min_duration || selectedService?.max_duration || 'Not specified'
                      }
                    </span>
                  </div>
                </div>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)}
        size="2xl"
      >
        <ModalContent>
          {(onClose) => (
            <form onSubmit={handleUpdateService}>
              <ModalHeader>Edit Service</ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <Input
                    label="Service Name"
                    name="service_name"
                    defaultValue={editingService?.service_name}
                    isRequired
                  />
                  <Input
                    label="Service Type"
                    name="service_type"
                    defaultValue={editingService?.service_type || ''}
                  />
                  <Textarea
                    label="Description"
                    name="description"
                    defaultValue={editingService?.description || ''}
                    rows={3}
                  />
                  <Input
                    type="number"
                    label="Fee (₹)"
                    name="fee"
                    defaultValue={editingService?.fee?.toString()}
                    isRequired
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Minimum Duration"
                      name="min_duration"
                      defaultValue={editingService?.min_duration || ''}
                      placeholder="e.g., 3 months"
                    />
                    <Input
                      label="Maximum Duration"
                      name="max_duration"
                      defaultValue={editingService?.max_duration || ''}
                      placeholder="e.g., 12 months"
                    />
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button 
                  variant="light" 
                  onPress={onClose}
                >
                  Cancel
                </Button>
                <Button 
                  color="danger"
                  variant="flat"
                  onPress={handleDeleteService}
                  isLoading={isSubmitting}
                >
                  Delete
                </Button>
                <Button 
                  color="primary"
                  type="submit"
                  isLoading={isSubmitting}
                >
                  Save Changes
                </Button>
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}

// Update the export to use the SHOW_SERVICES_TAB permission
export default WithAdminAuth(ServicesDashboard, PERMISSIONS.SHOW_SERVICES_TAB);

