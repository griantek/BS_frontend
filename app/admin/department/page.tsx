"use client"
import React from 'react';
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
  Spinner,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  useDisclosure,
} from "@heroui/react";
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { WithAdminAuth } from '@/components/withAdminAuth';
import { toast } from 'react-toastify';
import api, { Department } from '@/services/api';
import { PERMISSIONS, currentUserHasPermission } from '@/utils/permissions';

function DepartmentPage() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [selectedDepartment, setSelectedDepartment] = React.useState<Department | null>(null);
  const [departmentName, setDepartmentName] = React.useState("");
  const [editMode, setEditMode] = React.useState(false);
  const [canAddDepartment, setCanAddDepartment] = React.useState(false);
  const [userIsSuperAdmin, setUserIsSuperAdmin] = React.useState(false);

  React.useEffect(() => {
    // Check permissions
    const userData = api.getStoredUser();
    setUserIsSuperAdmin(userData?.role?.entity_type === 'SupAdmin');
    
    if (userData?.role?.entity_type !== 'SupAdmin') {
      setCanAddDepartment(currentUserHasPermission(PERMISSIONS.SHOW_ADD_DEPARTMENT_BUTTON));
    } else {
      setCanAddDepartment(true); // SuperAdmin can always add departments
    }
    
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setIsLoading(true);
      const response = await api.getAllDepartments();
      setDepartments(response.data);
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast.error('Failed to load departments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDepartment = async () => {
    if (!departmentName.trim()) {
      toast.error('Department name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createDepartment({ name: departmentName });
      await fetchDepartments();
      toast.success('Department created successfully');
      onClose();
      setDepartmentName("");
    } catch (error: any) {
      toast.error(error.message || 'Failed to create department');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (department: Department) => {
    setSelectedDepartment(department);
    setDepartmentName(department.name);
    setEditMode(true);
    onOpen();
  };

  const handleUpdateDepartment = async () => {
    if (!selectedDepartment || !departmentName.trim()) return;

    setIsSubmitting(true);
    try {
      await api.updateDepartment(selectedDepartment.id, { name: departmentName });
      await fetchDepartments();
      toast.success('Department updated successfully');
      onClose();
      setDepartmentName("");
      setEditMode(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update department');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDepartment = async () => {
    if (!selectedDepartment) return;

    setIsSubmitting(true);
    try {
      await api.deleteDepartment(selectedDepartment.id);
      await fetchDepartments();
      toast.success('Department deleted successfully');
      onClose();
      setEditMode(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete department');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  const handleModalOpen = () => {
    setDepartmentName("");
    setEditMode(false);
    setSelectedDepartment(null);
    onOpen();
  };

  return (
    <div className="w-full p-6">
      <Card>
        <CardHeader className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Department Management</h1>
          {(userIsSuperAdmin || canAddDepartment) && (
            <Button
              color="primary"
              endContent={<PlusIcon className="w-4 h-4" />}
              onClick={handleModalOpen}
            >
              Add Department
            </Button>
          )}
        </CardHeader>
        <CardBody>
          {isLoading ? (
            <div className="flex justify-center items-center h-[200px]">
              <Spinner size="lg" />
            </div>
          ) : (
            <Table aria-label="Departments table">
              <TableHeader>
                <TableColumn>NAME</TableColumn>
                <TableColumn>CREATED</TableColumn>
                <TableColumn>ACTIONS</TableColumn>
              </TableHeader>
              <TableBody>
                {departments.map((department) => (
                  <TableRow key={department.id}>
                    <TableCell>
                      <div className="font-medium">{department.name}</div>
                    </TableCell>
                    <TableCell>{formatDateTime(department.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onClick={() => handleEditClick(department)}
                        >
                          <PencilIcon className="w-4 h-4" />
                        </Button>
                        <Button
                          isIconOnly
                          size="sm"
                          color="danger"
                          variant="light"
                          onClick={() => {
                            setSelectedDepartment(department);
                            handleDeleteDepartment();
                          }}
                        >
                          <TrashIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>{editMode ? 'Edit Department' : 'Add Department'}</ModalHeader>
          <ModalBody>
            <Input
              label="Department Name"
              placeholder="Enter department name"
              value={departmentName}
              onChange={(e) => setDepartmentName(e.target.value)}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              Cancel
            </Button>
            {editMode && (
              <Button
                color="danger"
                variant="flat"
                onPress={handleDeleteDepartment}
                isLoading={isSubmitting}
              >
                Delete
              </Button>
            )}
            <Button
              color="primary"
              onPress={editMode ? handleUpdateDepartment : handleCreateDepartment}
              isLoading={isSubmitting}
            >
              {editMode ? 'Update' : 'Create'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

export default WithAdminAuth(DepartmentPage, PERMISSIONS.SHOW_DEPARTMENT_TAB);
