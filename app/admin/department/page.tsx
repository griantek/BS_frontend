'use client'
import React from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Card,
  CardHeader,
  CardBody,
  Spinner,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  useDisclosure,
} from "@heroui/react";
import { PlusIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import api from '@/services/api';
import type { Department, CreateDepartmentRequest } from '@/services/api';
import { WithAdminAuth } from '@/components/withAdminAuth';

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

function DepartmentsPage() {
  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedDepartment, setSelectedDepartment] = React.useState<Department | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const { 
    isOpen: isAddModalOpen, 
    onOpen: onAddModalOpen, 
    onClose: onAddModalClose 
  } = useDisclosure();
  
  const { 
    isOpen: isEditModalOpen, 
    onOpen: onEditModalOpen, 
    onClose: onEditModalClose 
  } = useDisclosure();

  const refreshDepartments = async () => {
    try {
      setIsLoading(true);
      // Force a fresh fetch by avoiding cache
      const response = await api.axiosInstance.get('/common/departments/all');
      if (response?.data?.data) {
        setDepartments(response.data.data);
      }
    } catch (error: any) {
      const errorMessage = api.handleError(error);
      toast.error(errorMessage.error || 'Failed to refresh departments');
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setIsLoading(true);
        await refreshDepartments();
      } catch (error) {
        console.error('Error fetching departments:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDepartments();
  }, []);

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    
    try {
      const formData = new FormData(event.currentTarget);
      const data: CreateDepartmentRequest = {
        name: formData.get('name') as string,
        entity_id: formData.get('entity_id') as string || 'Admin' // Default to 'admin' if empty
      };

      await api.createDepartment(data);
      await refreshDepartments();
      toast.success('Department created successfully');
      onAddModalClose();
    } catch (error: any) {
      const errorMessage = api.handleError(error);
      toast.error(errorMessage.error || 'Failed to create department');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedDepartment) return;
    
    setIsSubmitting(true);
    try {
      const formData = new FormData(event.currentTarget);
      const entity_id = formData.get('entity_id') as string;
      const data: CreateDepartmentRequest = {
        name: formData.get('name') as string,
        entity_id: entity_id || 'admin' // Default to 'admin' if empty
      };

      await api.updateDepartment(selectedDepartment.id, data);
      await refreshDepartments();
      toast.success('Department updated successfully');
      onEditModalClose();
    } catch (error: any) {
      const errorMessage = api.handleError(error);
      toast.error(errorMessage.error || 'Failed to update department');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedDepartment) return;
    
    setIsSubmitting(true);
    try {
      await api.deleteDepartment(selectedDepartment.id);
      await refreshDepartments();
      toast.success('Department deleted successfully');
      onEditModalClose();
    } catch (error: any) {
      const errorMessage = api.handleError(error);
      toast.error(errorMessage.error || 'Failed to delete department');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRowClick = (department: Department) => {
    setSelectedDepartment(department);
    onEditModalOpen();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-4rem)]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="w-full p-6">
      <Card className="mb-6">
        <CardHeader className="flex justify-between items-center px-6 py-4">
          <h1 className="text-2xl font-bold">Departments</h1>
          <Button
            isIconOnly
            color="primary"
            onClick={onAddModalOpen}
            title="Add Department"
          >
            <PlusIcon className="h-5 w-5" />
          </Button>
        </CardHeader>
      </Card>

      <Card>
        <CardBody>
          <Table aria-label="Departments table">
            <TableHeader>
              <TableColumn>Sl.No</TableColumn>
              <TableColumn>Name</TableColumn>
              <TableColumn>Created At</TableColumn>
              <TableColumn>Executive ID</TableColumn>
            </TableHeader>
            <TableBody>
              {departments.map((dept, index) => (
                <TableRow 
                  key={dept.id}
                  className="cursor-pointer hover:bg-default-100"
                  onClick={() => handleRowClick(dept)}
                >
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{dept.name}</TableCell>
                  <TableCell>{formatDate(dept.created_at)}</TableCell>
                  <TableCell>{dept.entity_id}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* Add Modal */}
      <Modal isOpen={isAddModalOpen} onClose={onAddModalClose} size="md">
        <ModalContent>
          {(onClose) => (
            <form onSubmit={handleCreate}>
              <ModalHeader>Add Department</ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <Input
                    label="Department Name"
                    name="name"
                    isRequired
                  />
                  <Input
                    label="Executive ID (Optional)"
                    name="entity_id"
                    placeholder="Leave empty for admin"
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button color="primary" type="submit" isLoading={isSubmitting}>
                  Add Department
                </Button>
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditModalOpen} onClose={onEditModalClose} size="md">
        <ModalContent>
          {(onClose) => (
            <form onSubmit={handleUpdate}>
              <ModalHeader>Edit Department</ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <Input
                    label="Department Name"
                    name="name"
                    defaultValue={selectedDepartment?.name}
                    isRequired
                  />
                  <Input
                    label="Executive ID (Optional)"
                    name="entity_id"
                    defaultValue={selectedDepartment?.entity_id}
                    placeholder="Leave empty for admin"
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button 
                  color="danger"
                  variant="flat"
                  onPress={handleDelete}
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

export default WithAdminAuth(DepartmentsPage);
