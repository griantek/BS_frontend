"use client"
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
import {PERMISSIONS } from '@/utils/permissions';
// Update the RoleFormData interface
interface RoleFormData {
  name: string;
  description: string;
  entity_type: string;
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
    const [selectedEntityType, setSelectedEntityType] = React.useState<string>('');
    const [selectedPermissions, setSelectedPermissions] = React.useState<number[]>([]);
    const [previousEntityType, setPreviousEntityType] = React.useState<string>('');
    const [isSuperAdmin, setIsSuperAdmin] = React.useState(false);
    
    React.useEffect(() => {
        const checkUserRole = () => {
            try {
                const userData = api.getStoredUser();
                const isSuperAdminUser = userData?.role?.entity_type === 'SupAdmin';
                setIsSuperAdmin(isSuperAdminUser);
            } catch (error) {
                console.error('Error checking user role:', error);
                setIsSuperAdmin(false);
            }
        };
        
        checkUserRole();
    }, []);

    const entityTypes = React.useMemo(() => {
        if (isSuperAdmin) {
            return ['Admin', 'Editor', 'Executive'] as const;
        }
        return ['Editor', 'Executive'] as const;
    }, [isSuperAdmin]);

    const fetchRoles = async () => {
        try {
            setIsLoading(true);
            const response = await api.getAllRoles();
            setRoles(response.data);
        } catch (error) {
            console.error('Error fetching roles:', error);
            toast.error('Failed to load roles');
        } finally {
            setIsLoading(false);
        }
    };

    React.useEffect(() => {
        fetchRoles();
    }, []);

    React.useEffect(() => {
        if (!selectedEntityType) return;

        const fetchPermissions = async () => {
            try {
                const response = await api.getPermissionsByEntityType(selectedEntityType);
                setAvailablePermissions(response.data);
            } catch (error) {
                console.error('Error fetching permissions:', error);
                toast.error('Failed to load permissions');
            }
        };

        fetchPermissions();
    }, [selectedEntityType]);

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

            await api.createRole(roleData);
            await fetchRoles();
            toast.success('Role created successfully');
            onClose();
            resetFormData();
        } catch (error: any) {
            toast.error(error.error || 'Failed to create role');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditClick = async (role: Role) => {
        try {
            setEditingRole(role);
            setFormData({
                name: role.name,
                description: role.description,
                entity_type: role.entity_type
            });
            
            setSelectedEntityType(role.entity_type);
            
            const response = await api.getPermissionsByEntityType(role.entity_type);
            setAvailablePermissions(response.data);
            
            setSelectedPermissions(role.permissions.map(p => p.id));
            
            setIsEditModalOpen(true);
        } catch (error) {
            console.error('Error fetching permissions:', error);
            toast.error('Failed to load permissions');
        }
    };

    const handleUpdateRole = async () => {
        if (!editingRole) return;
        try {
            setIsSubmitting(true);
            const updateData: CreateRoleRequest = {
                name: formData.name,
                description: formData.description,
                permissions: selectedPermissions,
                entity_type: selectedEntityType
            };
            
            await api.updateRole(editingRole.id, updateData);
            await fetchRoles();
            toast.success('Role updated successfully');
            setIsEditModalOpen(false);
            resetFormData();
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
            await fetchRoles();
            toast.success('Role deleted successfully');
            setIsDeleteModalOpen(false);
        } catch (error: any) {
            toast.error(error.error || 'Failed to delete role');
        } finally {
            setIsSubmitting(false);
            setRoleToDelete(null);
        }
    };

    const renderRolePermissions = (role: Role) => {
        return role.permissions?.map((permission) => (
            <Chip
                key={permission.id}
                size="sm"
                variant="flat"
                className="max-w-[200px] truncate"
            >
                {permission.description || permission.name}
            </Chip>
        ));
    };

    const resetFormData = () => {
        setFormData({ 
            name: '', 
            description: '', 
            entity_type: '' 
        });
        setSelectedEntityType('');
        setSelectedPermissions([]);
        setAvailablePermissions([]);
    };

    const handleCreateClick = () => {
        resetFormData();
        onOpen();
    };

    const handleCreateModalClose = () => {
        resetFormData();
        onClose();
    };

    const handleEditModalClose = () => {
        resetFormData();
        setIsEditModalOpen(false);
    };

    const renderSelect = (
        value: string, 
        onChange: (value: string) => void, 
        disabled?: boolean
    ) => (
        <Select
            label="Entity Type"
            placeholder="Select entity type"
            selectedKeys={value ? new Set([value]) : new Set()}
            onChange={(e) => onChange(e.target.value)}
            isDisabled={disabled}
            isRequired
        >
            {entityTypes.map((type) => (
                <SelectItem key={type} value={type}>
                    {type}
                </SelectItem>
            ))}
        </Select>
    );

    const handleEntityTypeChange = async (newEntityType: string) => {
        if (previousEntityType !== newEntityType) {
            setSelectedPermissions([]);
        }
        
        setPreviousEntityType(newEntityType);
        setSelectedEntityType(newEntityType as typeof entityTypes[number]);
        
        try {
            const response = await api.getPermissionsByEntityType(newEntityType as typeof entityTypes[number]);
            setAvailablePermissions(response.data);
        } catch (error) {
            console.error('Error fetching permissions:', error);
            toast.error('Failed to load permissions');
        }
    };

    // Fix the canModifyRole function to correctly handle SuperAdmin permissions
    const canModifyRole = (role: Role) => {
        // SuperAdmin can modify any role except other SupAdmin roles
        if (isSuperAdmin) {
            return role.entity_type !== 'SupAdmin';
        }
        
        // Regular admins can't modify SupAdmin or Admin roles
        return role.entity_type !== 'SupAdmin' && role.entity_type !== 'Admin';
    };

    const renderCreateRoleModal = () => (
        <Modal isOpen={isOpen} onClose={handleCreateModalClose} size="lg">
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
                                    selectedKeys={selectedEntityType ? [selectedEntityType] : []}
                                    onChange={(e) => handleEntityTypeChange(e.target.value)}
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
                            <Button variant="light" onPress={handleCreateModalClose}>
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

    const renderEditModal = () => (
        <Modal isOpen={isEditModalOpen} onClose={handleEditModalClose}>
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
                                    selectedKeys={selectedEntityType ? [selectedEntityType] : []}
                                    onChange={(e) => handleEntityTypeChange(e.target.value)}
                                    isRequired
                                    isDisabled={editingRole?.entity_type === 'Admin' && !isSuperAdmin}
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
                                                    {permission.description || permission.name}
                                                </Chip>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="light" onPress={handleEditModalClose}>
                                Cancel
                            </Button>
                            <Button 
                                color="danger"
                                variant="flat"
                                onPress={() => {
                                    onClose();
                                    handleDeleteClick(editingRole!);
                                }}
                            >
                                Delete Role
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

    return (
        <div className="w-full p-6">
            <Card>
                <CardHeader className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">Roles Management</h1>
                    <Button
                        color="primary"
                        endContent={<PlusIcon className="w-4 h-4" />}
                        onClick={handleCreateClick}  // Changed from onOpen to handleCreateClick
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
                                    <TableRow 
                                        key={role.id} 
                                        className={
                                            role.entity_type === 'SupAdmin' ? "bg-rose-50 dark:bg-rose-900/20" :
                                            role.entity_type === 'Admin' ? "bg-blue-50 dark:bg-blue-900/20" : 
                                            ""
                                        }
                                    >
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className={`text-bold ${
                                                    role.entity_type === 'SupAdmin' ? "font-bold text-danger" : 
                                                    role.entity_type === 'Admin' ? "font-semibold text-primary" : 
                                                    ""
                                                }`}>
                                                    {role.name}
                                                </span>
                                                <span className="text-xs text-gray-500">{role.description}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                variant={
                                                    role.entity_type === 'SupAdmin' || role.entity_type === 'Admin' ? "solid" : "flat"
                                                }
                                                color={
                                                    role.entity_type === 'Admin' ? 'primary' :
                                                    role.entity_type === 'Editor' ? 'warning' : 
                                                    role.entity_type === 'Executive' ? 'success' :
                                                    role.entity_type === 'SupAdmin' ? 'danger' : 
                                                    'default'
                                                }
                                                size="sm"
                                            >
                                                {role.entity_type === 'SupAdmin' ? "Super Admin" : role.entity_type}
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
                                                    isDisabled={!canModifyRole(role)}
                                                    className={!canModifyRole(role) ? "opacity-50 cursor-not-allowed" : ""}
                                                >
                                                    <PencilIcon className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    isIconOnly
                                                    size="sm"
                                                    color="danger"
                                                    variant="light"
                                                    onClick={() => handleDeleteClick(role)}
                                                    isDisabled={!canModifyRole(role)}
                                                    className={!canModifyRole(role) ? "opacity-50 cursor-not-allowed" : ""}
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

// Update the export to use the SHOW_ROLES permission
export default WithAdminAuth(RolesPage, PERMISSIONS.SHOW_ROLES);