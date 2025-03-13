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

                const response = await api.getAllExecutives();
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
            const response = await api.getAllExecutives();
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
                                                    executive.role_details?.name.toLowerCase().includes('admin') ? 'danger' :
                                                    executive.role_details?.entity_type === 'Editor' ? 'warning' : 'primary'
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
                                    <Button 
                                        color="primary" 
                                        onPress={handleSubmit}
                                        isLoading={isSubmitting}
                                    >
                                        Save Changes
                                    </Button>
                                )}
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