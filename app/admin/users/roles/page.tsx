'use client'
import React from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Spinner,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Textarea,
  useDisclosure,
  Select,
  SelectItem,  // Add this import
  Checkbox
} from "@heroui/react";
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import { WithAdminAuth } from '@/components/withAdminAuth';
import api, { Role, CreateRoleRequest, Permission } from '@/services/api';

// Update the RoleFormData interface
interface RoleFormData {
  name: string;
  description: string;
  entity_type: 'Admin' | 'Editor' | 'Executive' | '';
}

function RolesPage() {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [roles, setRoles] = React.useState<Role[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [formData, setFormData] = React.useState<RoleFormData>({
        name: '',
        description: '',
        entity_type: '',
    });
    const [editingRole, setEditingRole] = React.useState<Role | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
    const [roleToDelete, setRoleToDelete] = React.useState<Role | null>(null);
    const [availablePermissions, setAvailablePermissions] = React.useState<Permission[]>([]);
    const [selectedEntityType, setSelectedEntityType] = React.useState<'Admin' | 'Editor' | 'Executive' | ''>('');
    const [selectedPermissions, setSelectedPermissions] = React.useState<number[]>([]);
    const [permissionsByType, setPermissionsByType] = React.useState<Record<string, Permission[]>>({});

    const entityTypes = ['Admin', 'Editor', 'Executive'] as const;

    React.useEffect(() => {
        const fetchRoles = async () => {
            try {
                const response = await api.getAllRoles();
                setRoles(response.data);
            } catch (error) {
                console.error('Error fetching roles:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRoles();
    }, []);

    React.useEffect(() => {
        const fetchAllPermissions = async () => {
            try {
                // Fetch permissions for all entity types when the component mounts
                const types = ['Admin', 'Editor', 'Executive'] as const;
                const permissionsMap: Record<string, Permission[]> = {};
                
                for (const type of types) {
                  const response = await api.getPermissionsByEntityType(type);
                  permissionsMap[type] = response.data;
                }
                
                setPermissionsByType(permissionsMap);
              } catch (error) {
                console.error('Error fetching permissions:', error);
                toast.error('Failed to load permissions');
              }
        };

        fetchAllPermissions();
    }, []); // Only run once when component mounts

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const togglePermission = (permissionId: number) => {
        setSelectedPermissions(prev => 
            prev.includes(permissionId) 
                ? prev.filter(id => id !== permissionId)
                : [...prev, permissionId]
        );
    };

    const handleCreateRole = async () => {
        try {
            setIsSubmitting(true);
            
            if (!formData.name || !selectedEntityType || selectedPermissions.length === 0) {
                toast.error('Please fill in all required fields');
                return;
            }

            const roleData: CreateRoleRequest = {
                name: formData.name,
                description: formData.description,
                permissions: selectedPermissions,
                entity_type: selectedEntityType
            };

            const response = await api.createRole(roleData);
            setRoles([...roles, response.data]);
            toast.success('Role created successfully');
            onClose();

            // Reset form
            setFormData({ name: '', description: '', entity_type: '' });
            setSelectedEntityType('');
            setSelectedPermissions([]);
            setAvailablePermissions([]);
        } catch (error: any) {
            toast.error(error.error || 'Failed to create role');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Update handleEditClick to use selectedPermissions instead of permissions object
    const handleEditClick = (role: Role) => {
        setEditingRole(role);
        setFormData({
            name: role.name,
            description: role.description,
            entity_type: role.entity_type
        });
        
        setSelectedEntityType(role.entity_type);
        // Handle both old and new permission formats
        if (role.permission_ids) {
            setSelectedPermissions(role.permission_ids);
        } else if (role.permissions) {
            // Convert old format permissions to IDs if needed
            const oldFormatPermissionIds = Object.entries(role.permissions)
                .filter(([_, value]) => value)
                .map(([key]) => key);
            setSelectedPermissions(oldFormatPermissionIds.map(Number));
        }
        
        setIsEditModalOpen(true);
    };

    // Fix handleUpdateRole function
    const handleUpdateRole = async () => {
        if (!editingRole) return;
        try {
            setIsSubmitting(true);
            const updateData: CreateRoleRequest = {
                name: formData.name,
                description: formData.description,
                permissions: selectedPermissions,
                entity_type: formData.entity_type as 'Admin' | 'Editor' | 'Executive'
            };
            
            const response = await api.updateRole(editingRole.id, updateData);
            setRoles(roles.map(role => 
                role.id === editingRole.id ? response.data : role
            ));
            toast.success('Role updated successfully');
            setIsEditModalOpen(false);
        } catch (error: any) {
            toast.error(error.error || 'Failed to update role');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteClick = (role: Role) => {
        setRoleToDelete(role);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteRole = async () => {
        if (!roleToDelete) return;
        try {
            setIsSubmitting(true);
            await api.deleteRole(roleToDelete.id);
            setRoles(roles.filter(role => role.id !== roleToDelete.id));
            toast.success('Role deleted successfully');
            setIsDeleteModalOpen(false);
        } catch (error: any) {
            toast.error(error.error || 'Failed to delete role');
        } finally {
            setIsSubmitting(false);
            setRoleToDelete(null);
        }
    };

    // Fix getPermissionNames function
    const getPermissionNames = async (permissionIds: number[] | undefined) => {
        if (!permissionIds?.length) return [];
        try {
            const response = await api.getPermissionsByEntityType(editingRole?.entity_type || 'Executive');
            return permissionIds.map(id => {
                const permission = response.data.find(p => p.id === id);
                return permission?.description || '';
            }).filter(Boolean);
        } catch (error) {
            console.error('Error fetching permission names:', error);
            return [];
        }
    };

    // Add state for resolved permission names
    const [permissionNames, setPermissionNames] = React.useState<Record<number, string[]>>({});

    // Add effect to fetch permission names for each role
    React.useEffect(() => {
        const fetchPermissionNames = async () => {
            const namesMap: Record<number, string[]> = {};
            for (const role of roles) {
                namesMap[role.id] = await getPermissionNames(role.permission_ids);
            }
            setPermissionNames(namesMap);
        };

        if (roles.length) {
            fetchPermissionNames();
        }
    }, [roles]);

    const renderCreateRoleModal = () => (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader>Create New Role</ModalHeader>
                        <ModalBody>
                            <div className="space-y-6">
                                <Input
                                    label="Role Name"
                                    placeholder="Enter role name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    isRequired
                                />

                                <Textarea
                                    label="Description"
                                    placeholder="Enter role description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />

                                <Select
                                    label="Entity Type"
                                    placeholder="Select entity type"
                                    value={selectedEntityType}
                                    onChange={(e) => setSelectedEntityType(e.target.value as typeof entityTypes[number])}
                                    isRequired
                                >
                                    {entityTypes.map((type) => (
                                        <SelectItem key={type} value={type}>
                                            {type}
                                        </SelectItem>
                                    ))}
                                </Select>

                                {selectedEntityType && availablePermissions.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium">Select Permissions</p>
                                        <div className="flex flex-wrap gap-2 p-4 border rounded-lg bg-default-50">
                                            {availablePermissions.map((permission) => (
                                                <Chip
                                                    key={permission.id}
                                                    variant="flat"
                                                    color={selectedPermissions.includes(permission.id) ? "primary" : "default"}
                                                    className="cursor-pointer transition-colors"
                                                    onClick={() => togglePermission(permission.id)}
                                                >
                                                    {permission.description}
                                                </Chip>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="light" onPress={onClose}>
                                Cancel
                            </Button>
                            <Button
                                color="primary"
                                onPress={handleCreateRole}
                                isLoading={isSubmitting}
                                isDisabled={!formData.name || !selectedEntityType || selectedPermissions.length === 0}
                            >
                                Create Role
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );

    // Update the Edit Modal JSX to use selectedPermissions instead of formData.permissions
    const renderEditModal = () => (
        <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader>Edit Role</ModalHeader>
                        <ModalBody>
                            <div className="space-y-4">
                                <Input
                                    label="Role Name"
                                    placeholder="Enter role name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        name: e.target.value
                                    })}
                                />
                                <Textarea
                                    label="Description"
                                    placeholder="Enter role description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        description: e.target.value
                                    })}
                                />
                                <Select
                                    label="Entity Type"
                                    placeholder="Select entity type"
                                    value={selectedEntityType}
                                    onChange={(e) => setSelectedEntityType(e.target.value as typeof entityTypes[number])}
                                    isRequired
                                >
                                    {entityTypes.map((type) => (
                                        <SelectItem key={type} value={type}>
                                            {type}
                                        </SelectItem>
                                    ))}
                                </Select>

                                {selectedEntityType && availablePermissions.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium">Select Permissions</p>
                                        <div className="flex flex-wrap gap-2 p-4 border rounded-lg bg-default-50">
                                            {availablePermissions.map((permission) => (
                                                <Chip
                                                    key={permission.id}
                                                    variant="flat"
                                                    color={selectedPermissions.includes(permission.id) ? "primary" : "default"}
                                                    className="cursor-pointer transition-colors"
                                                    onClick={() => togglePermission(permission.id)}
                                                >
                                                    {permission.name}
                                                </Chip>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="light" onPress={onClose}>
                                Cancel
                            </Button>
                            <Button 
                                color="primary"
                                onPress={handleUpdateRole}
                                isLoading={isSubmitting}
                            >
                                Update Role
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );

    const renderRolePermissions = (role: Role) => {
        const permissions = permissionsByType[role.entity_type] || [];
        const rolePermissionIds = role.permission_ids || [];
    
        return permissions
          .filter(p => rolePermissionIds.includes(p.id))
          .map((permission) => (
            <Chip
              key={permission.id}
              size="sm"
              variant="flat"
              className="max-w-[200px] truncate"
            >
              {permission.description}
            </Chip>
          ));
      };

    return (
        <div className="w-full p-6">
            <Card>
                <CardHeader className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">Roles Management</h1>
                    <Button
                        color="primary"
                        endContent={<PlusIcon className="w-4 h-4" />}
                        onClick={onOpen}
                    >
                        Add Role
                    </Button>
                </CardHeader>
                <CardBody>
                    {isLoading ? (
                        <div className="flex justify-center items-center h-[200px]">
                            <Spinner size="lg" />
                        </div>
                    ) : (
                        <Table aria-label="Roles table">
                            <TableHeader>
                                <TableColumn>ROLE NAME</TableColumn>
                                <TableColumn>ENTITY TYPE</TableColumn>
                                <TableColumn>PERMISSIONS</TableColumn>
                                <TableColumn>CREATED</TableColumn>
                                <TableColumn>ACTIONS</TableColumn>
                            </TableHeader>
                            <TableBody>
                                {roles.map((role) => (
                                    <TableRow key={role.id}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-bold">{role.name}</span>
                                                <span className="text-xs text-gray-500">{role.description}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                variant="flat"
                                                color={
                                                    role.entity_type === 'Admin' ? 'danger' :
                                                    role.entity_type === 'Editor' ? 'warning' : 'primary'
                                                }
                                                size="sm"
                                            >
                                                {role.entity_type}
                                            </Chip>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {renderRolePermissions(role)}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {formatDateTime(role.created_at)}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button
                                                    isIconOnly
                                                    size="sm"
                                                    variant="light"
                                                    onClick={() => handleEditClick(role)}
                                                >
                                                    <PencilIcon className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    isIconOnly
                                                    size="sm"
                                                    color="danger"
                                                    variant="light"
                                                    onClick={() => handleDeleteClick(role)}
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

            {renderCreateRoleModal()}
            {renderEditModal()}

            {/* Delete Confirmation Modal */}
            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader>Delete Role</ModalHeader>
                            <ModalBody>
                                Are you sure you want to delete the role &ldquo;{roleToDelete?.name}&rdquo;?
                                This action cannot be undone.
                            </ModalBody>
                            <ModalFooter>
                                <Button variant="light" onPress={onClose}>
                                    Cancel
                                </Button>
                                <Button 
                                    color="danger"
                                    onPress={handleDeleteRole}
                                    isLoading={isSubmitting}
                                >
                                    Delete Role
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    );
}

export default WithAdminAuth(RolesPage);