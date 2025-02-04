'use client'
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
} from "@heroui/react";
import { PlusIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import api, { Service } from '@/services/api';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { withSupAdminAuth } from '@/components/withSupAdminAuth';

function ServicesDashboard() {
  const router = useRouter();
  const [services, setServices] = React.useState<Service[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const rowsPerPage = 10;
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedService, setSelectedService] = React.useState<Service | null>(null);

  React.useEffect(() => {
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
          router.push('/supAdmin/login');
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

  const handleDescriptionClick = (service: Service) => {
    setSelectedService(service);
    onOpen();
  };

  return (
    <div className="w-full p-6">
      <Card className="mb-6">
        <CardHeader className="flex justify-between items-center px-6 py-4">
          <h1 className="text-2xl font-bold">Services Dashboard</h1>
          <Button 
            isIconOnly
            color="primary" 
            onClick={() => router.push('/supAdmin/services/add_service')}
            title="Add Service"
          >
            <PlusIcon className="h-5 w-5" />
          </Button>
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
            className="min-h-[400px]"
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
                <TableRow key={item.id}>
                  <TableCell>{item.service_name}</TableCell>
                  <TableCell>{item.service_type || '-'}</TableCell>
                  <TableCell>
                    <Button
                      variant="light"
                      className="p-0 m-0 h-auto min-w-0 text-left"
                      onClick={() => handleDescriptionClick(item)}
                    >
                      {truncateText(item.description)}
                    </Button>
                  </TableCell>
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
    </div>
  );
}

export default withSupAdminAuth(ServicesDashboard);

