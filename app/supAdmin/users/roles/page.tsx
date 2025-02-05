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
} from "@heroui/react";
import { withSupAdminAuth } from '@/components/withSupAdminAuth';
import api, { Role } from '@/services/api';

function RolesPage() {
    const [roles, setRoles] = React.useState<Role[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

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

    return (
        <div className="w-full p-6">
            <Card>
                <CardHeader>
                    <h1 className="text-2xl font-bold">Roles Management</h1>
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
        </div>
    );
}

export default withSupAdminAuth(RolesPage);