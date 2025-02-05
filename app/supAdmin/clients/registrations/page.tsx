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
} from "@heroui/react";
import { withSupAdminAuth } from '@/components/withSupAdminAuth';
import api, { Registration } from '@/services/api';

function RegistrationsPage() {
    const [registrations, setRegistrations] = React.useState<Registration[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchRegistrations = async () => {
            try {
                const response = await api.getAllRegistrations();
                setRegistrations(response.data.items);
            } catch (error) {
                console.error('Error fetching registrations:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRegistrations();
    }, []);

    return (
        <div className="w-full p-6">
            <Card>
                <CardHeader className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">Registrations Management</h1>
                </CardHeader>
                <CardBody>
                    {isLoading ? (
                        <div className="flex justify-center items-center h-[200px]">
                            <Spinner size="lg" />
                        </div>
                    ) : (
                        <Table aria-label="Registrations table">
                            <TableHeader>
                                <TableColumn>CLIENT NAME</TableColumn>
                                <TableColumn>SERVICES</TableColumn>
                                <TableColumn>AMOUNT</TableColumn>
                                <TableColumn>STATUS</TableColumn>
                                <TableColumn>PERIOD</TableColumn>
                                <TableColumn>BANK</TableColumn>
                            </TableHeader>
                            <TableBody>
                                {registrations.map((registration) => (
                                    <TableRow key={registration.id}>
                                        <TableCell>
                                            {registration.prospectus.client_name}
                                        </TableCell>
                                        <TableCell>{registration.services}</TableCell>
                                        <TableCell>
                                            ₹{registration.total_amount.toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                color={registration.status === 'registered' ? 'success' : 'warning'}
                                                size="sm"
                                            >
                                                {registration.status}
                                            </Chip>
                                        </TableCell>
                                        <TableCell>
                                            {registration.accept_period}
                                        </TableCell>
                                        <TableCell>
                                            {registration.bank_accounts.bank}
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

export default withSupAdminAuth(RegistrationsPage);
