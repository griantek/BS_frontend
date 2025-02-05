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
    Checkbox,
    useDisclosure,
} from "@heroui/react";
import { PlusIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import { withSupAdminAuth } from '@/components/withSupAdminAuth';
import api, { Role, CreateRoleRequest } from '@/services/api';

function RolesPage() {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [roles, setRoles] = React.useState<Role[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [formData, setFormData] = React.useState<CreateRoleRequest>({
        name: '',
        description: '',
        permissions: {
            create: false,
            read: false,
            update: false,
            delete: false
        }
    });

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

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const handleCreateRole = async () => {
        try {
            setIsSubmitting(true);
            const response = await api.createRole(formData);
            setRoles([...roles, response.data]);
            toast.success('Role created successfully');
            onClose();
            // Reset form
            setFormData({
                name: '',
                description: '',
                permissions: {
                    create: false,
                    read: false,
                    update: false,
                    delete: false
                }
            });
        } catch (error: any) {
            toast.error(error.error || 'Failed to create role');
        } finally {
            setIsSubmitting(false);
        }
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
                                <TableColumn>DESCRIPTION</TableColumn>
                                <TableColumn>PERMISSIONS</TableColumn>
                                <TableColumn>CREATED</TableColumn>
                            </TableHeader>
                            <TableBody>
                                {roles.map((role) => (
                                    <TableRow key={role.id}>
                                        <TableCell>
                                            <span className="capitalize font-medium">
                                                {role.name}
                                            </span>
                                        </TableCell>
                                        <TableCell>{role.description}</TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                {Object.entries(role.permissions).map(([key, value]) => (
                                                    value && (
                                                        <Chip
                                                            key={key}
                                                            size="sm"
                                                            variant="flat"
                                                            color="primary"
                                                        >
                                                            {key}
                                                        </Chip>
                                                    )
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {formatDateTime(role.created_at)}
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
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">
                                Create New Role
                            </ModalHeader>
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
                                    <div className="space-y-3">
                                        <p className="text-sm font-medium">Permissions</p>
                                        {Object.keys(formData.permissions).map((permission) => (
                                            <Checkbox
                                                key={permission}
                                                isSelected={formData.permissions[permission as keyof typeof formData.permissions]}
                                                onValueChange={(isSelected) => setFormData({
                                                    ...formData,
                                                    permissions: {
                                                        ...formData.permissions,
                                                        [permission]: isSelected
                                                    }
                                                })}
                                            >
                                                {permission.charAt(0).toUpperCase() + permission.slice(1)}
                                            </Checkbox>
                                        ))}
                                    </div>
                                </div>
                            </ModalBody>
                            <ModalFooter>
                                <Button
                                    color="danger"
                                    variant="light"
                                    onPress={onClose}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    color="primary"
                                    onPress={handleCreateRole}
                                    isLoading={isSubmitting}
                                >
                                    Create Role
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    );
}

export default withSupAdminAuth(RolesPage);