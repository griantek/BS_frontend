'use client'
import React from 'react';
import { useRouter } from 'next/navigation';
import { withSupAdminAuth } from '@/components/withSupAdminAuth';
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
                    router.push('/supAdmin/login');
                    return;
                }

                const response = await api.getAllExecutives();
                setExecutives(response.data);
            } catch (error: any) {
                const errorMsg = error?.response?.data?.message || 'Failed to fetch executives';
                toast.error(errorMsg);
                if (error?.response?.status === 401) {
                    router.push('/supAdmin/login');
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchExecutives();
    }, [router]);

    const handleRowClick = async (executive: ExecutiveWithRoleName) => {
        setSelectedExecutive(executive);
        setEditForm({
            username: executive.username,
            email: executive.email,
            role: executive.role_details.name,
        });
        
        // Fetch roles when opening modal
        setIsLoadingRoles(true);
        try {
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

    const handleRoleChange = (value: string) => {
        setEditForm(prev => ({
            ...prev,
            role: value
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
            
            // Prepare update data
            const updateData: any = {
                username: editForm.username,
                email: editForm.email,
                role: editForm.role,
            };

            // Only include password if it's being changed
            if (editForm.password) {
                updateData.password = editForm.password;
            }

            // Update executive
            await api.axiosInstance.put(`/executive/${selectedExecutive.id}`, updateData);
            
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
        router.push('/supAdmin/users/executives/create_exec');
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
                    <Button 
                        color="primary"
                        onPress={handleAddExecutive}
                    >
                        Add Executive
                    </Button>
                </CardHeader>
                <CardBody>
                    <Table 
                        aria-label="Executives table"
                        selectionMode="none"
                        classNames={{
                            wrapper: "min-h-[auto]",
                            tr: "cursor-pointer hover:bg-default-100",
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
                                        <Chip
                                            size="sm"
                                            variant="flat"
                                            // Change color based on role name
                                            color={
                                                executive.role_details.name === 'Manager' ? 'primary' :
                                                executive.role_details.name === 'Administrator' ? 'warning' :
                                                'default'
                                            }
                                        >
                                            {/* Display the role name with proper capitalization */}
                                            {executive.role_details.name}
                                        </Chip>
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
                            <ModalHeader>Edit Executive</ModalHeader>
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
                                        name="role"
                                        selectedKeys={[editForm.role]}
                                        onChange={(e) => handleRoleChange(e.target.value)}
                                        isDisabled={isLoadingRoles}
                                    >
                                        {isLoadingRoles ? (
                                            <SelectItem key="loading" value="loading">
                                                Loading roles...
                                            </SelectItem>
                                        ) : (
                                            roles.map((role) => (
                                                <SelectItem key={role.id} value={role.name}>
                                                    {role.name}
                                                </SelectItem>
                                            ))
                                        )}
                                    </Select>
                                    <Divider />
                                    <div className="space-y-4">
                                        <p className="text-sm text-default-500">
                                            Leave password fields empty if you don't want to change the password
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
                                                    ? "Passwords don't match" 
                                                    : undefined
                                            }
                                        />
                                    </div>
                                </div>
                            </ModalBody>
                            <ModalFooter>
                                <Button variant="light" onPress={onClose}>
                                    Cancel
                                </Button>
                                <Button 
                                    color="primary" 
                                    onPress={handleSubmit}
                                    isLoading={isSubmitting}
                                >
                                    Save Changes
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    );
};

export default withSupAdminAuth(ExecutivesPage);