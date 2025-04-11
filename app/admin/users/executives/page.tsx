"use client"
import React from 'react';
import { useRouter } from 'next/navigation';
import { WithAdminAuth } from '@/components/withAdminAuth';
import {
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Card,
    CardHeader,
    CardBody,
    Button,
    Spinner,
    Chip,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Input,
    useDisclosure,
    Divider,
    Select,
    SelectItem
} from "@heroui/react";
import { toast } from 'react-toastify';
import api, { Executive,ExecutiveWithRoleName, Role } from '@/services/api';
import { currentUserHasPermission, PERMISSIONS } from '@/utils/permissions';

interface EditExecutiveForm {
    username: string;
    email: string;
    role: string;
    password?: string;
    confirmPassword?: string;
}

const ExecutivesPage: React.FC = () => {
    const router = useRouter();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const { isOpen: isDeleteModalOpen, onOpen: onDeleteModalOpen, onClose: onDeleteModalClose } = useDisclosure();
    const [executives, setExecutives] = React.useState<ExecutiveWithRoleName[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [selectedExecutive, setSelectedExecutive] = React.useState<ExecutiveWithRoleName | null>(null);
    const [editForm, setEditForm] = React.useState<EditExecutiveForm>({
        username: '',
        email: '',
        role: '',
    });
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [roles, setRoles] = React.useState<Role[]>([]);
    const [isLoadingRoles, setIsLoadingRoles] = React.useState(false);
    const [selectedRole, setSelectedRole] = React.useState(new Set<string>([]));
    const [canViewExecDetails, setCanViewExecDetails] = React.useState(true);
    const [canUpdateUsers, setCanUpdateUsers] = React.useState(true);
    const [canAddExecutive, setCanAddExecutive] = React.useState(true);
    const [isSuperAdmin, setIsSuperAdmin] = React.useState(false);
    const [selectedRolePermissions, setSelectedRolePermissions] = React.useState<any[]>([]);
    const [isDeleting, setIsDeleting] = React.useState(false);

    const formatDate = (dateString: string) => {
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

    React.useEffect(() => {
        const fetchExecutives = async () => {
            try {
                const token = api.getStoredToken();
                if (!token) {
                    toast.error('Please login again');
                    router.push('/admin/login');
                    return;
                }

                const response = await api.getAllEntities();
                setExecutives(response.data);
            } catch (error: any) {
                const errorMsg = error?.response?.data?.message || 'Failed to fetch executives';
                toast.error(errorMsg);
                if (error?.response?.status === 401) {
                    router.push('/admin/login');
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchExecutives();
    }, [router]);

    React.useEffect(() => {
        // Check if user is SuperAdmin (implicit all permissions)
        const userData = api.getStoredUser();
        const isSuperAdminUser = userData?.role?.entity_type === 'SupAdmin';
        setIsSuperAdmin(isSuperAdminUser);
        
        // For non-SuperAdmin users, check specific permissions
        if (!isSuperAdminUser) {
            setCanViewExecDetails(currentUserHasPermission(PERMISSIONS.VIEW_EXECUTIVE_DETAILS));
            setCanUpdateUsers(currentUserHasPermission(PERMISSIONS.UPDATE_USERS));
            setCanAddExecutive(currentUserHasPermission(PERMISSIONS.SHOW_ADD_EXECUTIVE_BUTTON));
        }
    }, []);

    const handleRowClick = async (executive: ExecutiveWithRoleName) => {
        // Only allow opening the details modal if they have permission
        if (!isSuperAdmin && !canViewExecDetails) {
            return;
        }
        
        setSelectedExecutive(executive);
        setEditForm({
            username: executive.username,
            email: executive.email,
            role: executive.role_details.id.toString(), // Use role ID instead of name
        });
        setSelectedRole(new Set([executive.role_details.id.toString()]));
        
        try {
            setIsLoadingRoles(true);
            const rolesResponse = await api.getAllRoles();
            setRoles(rolesResponse.data);
            
            // Find the selected role to get its permissions
            const selectedRole = rolesResponse.data.find(
                r => r.id.toString() === executive.role_details.id.toString()
            );
            setSelectedRolePermissions(selectedRole?.permissions || []);
        } catch (error) {
            toast.error('Failed to load roles');
            console.error('Error loading roles:', error);
        } finally {
            setIsLoadingRoles(false);
        }
        
        onOpen();
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEditForm(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleRoleChange = (keys: any) => {
        const selectedKey = Array.from(keys)[0] as string;
        setSelectedRole(new Set([selectedKey]));
        setEditForm(prev => ({
            ...prev,
            role: selectedKey
        }));
        
        // Update permissions display when role changes
        const selectedRole = roles.find(r => r.id.toString() === selectedKey);
        setSelectedRolePermissions(selectedRole?.permissions || []);
    };

    const handleSubmit = async () => {
        if (!selectedExecutive) return;

        // Validate password match if password is being changed
        if (editForm.password && editForm.password !== editForm.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        try {
            setIsSubmitting(true);
            
            const updateData = {
                username: editForm.username,
                email: editForm.email,
                role: editForm.role, // This will be the role ID
                ...(editForm.password ? { password: editForm.password } : {})
            };

            await api.axiosInstance.put(`/entity/${selectedExecutive.id}`, updateData);
            
            // Refresh executives list
            const response = await api.getAllEntities();
            setExecutives(response.data);
            
            toast.success('Executive updated successfully');
            onClose();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update executive');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddExecutive = () => {
        router.push('/admin/users/executives/create_exec');
    };

    const handleDeleteExecutive = async () => {
        if (!selectedExecutive) return;
        
        try {
            setIsDeleting(true);
            
            // Use the API service method instead of directly calling axios
            await api.deleteEntity(selectedExecutive.id);
            
            // Refresh the executives list
            const response = await api.getAllEntities();
            setExecutives(response.data);
            
            toast.success(`${selectedExecutive.username} has been deleted successfully`);
            
            // Close both modals
            onDeleteModalClose();
            onClose();
        } catch (error: any) {
            const errorMsg = error?.response?.data?.message || 'Failed to delete executive';
            toast.error(errorMsg);
            console.error('Error deleting executive:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    const renderSelectValue = (role: Role) => {
        return role.name; // Only show role name when selected
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-[50vh]">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="w-full p-6">
            <Card>
                <CardHeader className="flex justify-between items-center px-6 py-4">
                    <h1 className="text-2xl font-bold">Executives Management</h1>
                    {(isSuperAdmin || canAddExecutive) && (
                        <Button 
                            color="primary"
                            onPress={handleAddExecutive}
                        >
                            Add Executive
                        </Button>
                    )}
                </CardHeader>
                <CardBody>
                    <Table 
                        aria-label="Executives table"
                        selectionMode="none"
                        classNames={{
                            wrapper: "min-h-[auto]",
                            tr: isSuperAdmin || canViewExecDetails 
                                ? "cursor-pointer hover:bg-default-100" 
                                : "cursor-default",
                        }}
                    >
                        <TableHeader>
                            <TableColumn>USERNAME</TableColumn>
                            <TableColumn>EMAIL</TableColumn>
                            <TableColumn>ROLE</TableColumn>
                            <TableColumn>JOINED</TableColumn>
                        </TableHeader>
                        <TableBody emptyContent="No executives found">
                            {executives.map((executive) => (
                                <TableRow 
                                    key={executive.id} 
                                    onClick={() => handleRowClick(executive)}
                                >
                                    <TableCell>{executive.username}</TableCell>
                                    <TableCell>{executive.email}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <Chip
                                                variant="flat"
                                                color={
                                                    executive.role_details?.entity_type === 'SupAdmin' ? 'danger' :
                                                    executive.role_details?.entity_type === 'Admin' ? 'primary' :
                                                    executive.role_details?.entity_type === 'Editor' ? 'warning' : 
                                                    executive.role_details?.entity_type === 'Executive' ? 'success' : 
                                                    executive.role_details?.entity_type === 'Author' ? 'secondary' :
                                                    'default'  
                                                }
                                                size="sm"
                                            >
                                                {executive.role_details?.name} ({executive.role_details?.entity_type})
                                            </Chip>
                                        </div>
                                    </TableCell>
                                    <TableCell>{formatDate(executive.created_at)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardBody>
            </Card>

            {/* Edit Executive Modal */}
            <Modal 
                isOpen={isOpen} 
                onClose={onClose}
                size="2xl"
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader>Executive Details</ModalHeader>
                            <ModalBody>
                                <div className="space-y-4">
                                    <Input
                                        label="Username"
                                        name="username"
                                        value={editForm.username}
                                        onChange={handleInputChange}
                                    />
                                    <Input
                                        type="email"
                                        label="Email"
                                        name="email"
                                        value={editForm.email}
                                        onChange={handleInputChange}
                                    />
                                    <Select 
                                        label="Role"
                                        selectedKeys={selectedRole}
                                        onSelectionChange={handleRoleChange}
                                        isDisabled={isLoadingRoles}
                                        // Add this prop for custom selected value display
                                        classNames={{
                                            value: "truncate"
                                        }}
                                        renderValue={(items) => {
                                            const foundRole = roles.find(role => role.id.toString() === Array.from(selectedRole)[0]);
                                            return foundRole ? renderSelectValue(foundRole) : null;
                                        }}
                                    >
                                        {isLoadingRoles ? (
                                            <SelectItem key="loading" value="loading">
                                                Loading roles...
                                            </SelectItem>
                                        ) : (
                                            roles.map((role) => (
                                                <SelectItem 
                                                    key={role.id.toString()}
                                                    value={role.id.toString()}
                                                >
                                                    {/* Show both name and entity_type in dropdown list */}
                                                    {role.name} ({role.entity_type})
                                                </SelectItem>
                                            ))
                                        )}
                                    </Select>
                                    
                                    {/* Display role permissions */}
                                    <div className="mt-4">
                                        <p className="text-sm font-medium mb-2">Role Permissions:</p>
                                        
                                        {isLoadingRoles ? (
                                            <div className="flex justify-center py-2">
                                                <Spinner size="sm" />
                                            </div>
                                        ) : selectedRolePermissions.length > 0 ? (
                                            <div className="flex flex-wrap gap-1 p-2 border rounded-md bg-default-50">
                                                {selectedRolePermissions.map(permission => (
                                                    <Chip 
                                                        key={permission.id} 
                                                        size="sm" 
                                                        variant="flat"
                                                        className="max-w-[200px] truncate"
                                                    >
                                                        {permission.description || permission.name}
                                                    </Chip>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center p-3 border rounded-md bg-default-50 text-default-500">
                                                No permissions assigned to this role
                                            </div>
                                        )}
                                    </div>
                                    
                                    <Divider />
                                    <div className="space-y-4">
                                        <p className="text-sm text-default-500">
                                            Leave password fields empty if you don&apos;t want to change the password
                                        </p>
                                        <Input
                                            type="password"
                                            label="New Password"
                                            name="password"
                                            value={editForm.password || ''}
                                            onChange={handleInputChange}
                                        />
                                        <Input
                                            type="password"
                                            label="Confirm New Password"
                                            name="confirmPassword"
                                            value={editForm.confirmPassword || ''}
                                            onChange={handleInputChange}
                                            isInvalid={editForm.password !== editForm.confirmPassword}
                                            errorMessage={
                                                editForm.password !== editForm.confirmPassword 
                                                    ? "Passwords don&apos;t match" 
                                                    : undefined
                                            }
                                        />
                                    </div>
                                </div>
                            </ModalBody>
                            <ModalFooter>
                                <Button variant="light" onPress={onClose}>
                                    Close
                                </Button>
                                {(isSuperAdmin || canUpdateUsers) && (
                                    <>
                                        <Button 
                                            color="danger" 
                                            variant="flat"
                                            onPress={onDeleteModalOpen}
                                        >
                                            Delete Executive
                                        </Button>
                                        <Button 
                                            color="primary" 
                                            onPress={handleSubmit}
                                            isLoading={isSubmitting}
                                        >
                                            Save Changes
                                        </Button>
                                    </>
                                )}
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={onDeleteModalClose}
                size="md"
            >
                <ModalContent>
                    {(closeDeleteModal) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1 text-danger">
                                <span className="text-2xl">⚠️ Confirm Account Removal</span>
                            </ModalHeader>
                            <ModalBody>
                                <p className="mb-4">
                                    You're about to remove <strong>{selectedExecutive?.username}</strong> ({selectedExecutive?.role_details?.entity_type}) from the system.
                                </p>
                                
                                <p className="font-medium mb-2">Please note:</p>
                                
                                <ul className="list-disc pl-6 space-y-2 mb-4">
                                    <li>This account will no longer be able to access the platform or its features.</li>
                                    <li>Any tasks, messages, or responsibilities linked to this account will be unassigned or paused.</li>
                                    <li>The account will no longer appear in user lists or assignment options.</li>
                                </ul>
                                
                                <p className="text-danger-600 italic">
                                    We recommend proceeding only if you're certain this account is no longer needed.
                                </p>
                                
                                <p className="font-medium mt-4">
                                    Would you like to continue?
                                </p>
                            </ModalBody>
                            <ModalFooter>
                                <Button 
                                    variant="light" 
                                    onPress={onDeleteModalClose}
                                    isDisabled={isDeleting}
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    color="danger" 
                                    onPress={handleDeleteExecutive}
                                    isLoading={isDeleting}
                                >
                                    Delete
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    );
};

// Add permission requirement to the HOC
export default WithAdminAuth(ExecutivesPage, PERMISSIONS.SHOW_EXECUTIVES_TAB);