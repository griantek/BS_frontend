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
import { RegistrationResponse, getBankInfo, getTransactionInfo } from './types';

function RegistrationsPage() {
    const [registrations, setRegistrations] = React.useState<RegistrationResponse[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchRegistrations = async () => {
            try {
                const response = await api.getAllRegistrations();
                // Transform the API response to match RegistrationResponse type
                const transformedRegistrations: RegistrationResponse[] = response.data.items.map(reg => ({
                    id: reg.id,
                    prospectus_id: reg.prospectus_id,
                    services: reg.services,
                    init_amount: reg.init_amount,
                    accept_amount: reg.accept_amount,
                    discount: reg.discount,
                    total_amount: reg.total_amount,
                    accept_period: reg.accept_period,
                    pub_period: reg.pub_period,
                    status: reg.status,
                    month: reg.month,
                    year: reg.year,
                    created_at: reg.created_at,
                    prospectus: {
                        id: reg.prospectus.id,
                        reg_id: reg.prospectus.reg_id,
                        client_name: reg.prospectus.client_name
                    },
                    bank_accounts: {  // Changed from bank_account to bank_accounts
                        bank: reg.bank_accounts?.bank || 'N/A',
                        account_number: reg.bank_accounts?.account_number || 'N/A'
                    },
                    transactions: {  // Changed from transaction to transactions
                        id: reg.transactions?.id || 0,
                        amount: reg.transactions?.amount || 0,
                        transaction_type: reg.transactions?.transaction_type || 'N/A'
                    }
                }));
                
                setRegistrations(transformedRegistrations);
            } catch (error) {
                console.error('Error fetching registrations:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRegistrations();
    }, []);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

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
                                <TableColumn>REG ID</TableColumn>
                                <TableColumn>CLIENT NAME</TableColumn>
                                <TableColumn>SERVICES</TableColumn>
                                <TableColumn>INITIAL</TableColumn>
                                <TableColumn>ACCEPTED</TableColumn>
                                <TableColumn>TOTAL</TableColumn>
                                <TableColumn>STATUS</TableColumn>
                                <TableColumn>BANK</TableColumn>
                                <TableColumn>PAYMENT</TableColumn>
                                <TableColumn>CREATED</TableColumn>
                            </TableHeader>
                            <TableBody>
                                {registrations.map((registration) => (
                                    <TableRow key={registration.id}>
                                        <TableCell>{registration.prospectus.reg_id}</TableCell>
                                        <TableCell>{registration.prospectus.client_name}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {registration.services.split(',').map((service, idx) => (
                                                    <Chip 
                                                        key={idx} 
                                                        size="sm" 
                                                        variant="flat"
                                                    >
                                                        {service.trim()}
                                                    </Chip>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell>₹{registration.init_amount.toLocaleString()}</TableCell>
                                        <TableCell>₹{registration.accept_amount.toLocaleString()}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">₹{registration.total_amount.toLocaleString()}</span>
                                                {registration.discount > 0 && (
                                                    <span className="text-xs text-success">
                                                        (-₹{registration.discount.toLocaleString()})
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                color={registration.status === 'registered' ? 'success' : 'warning'}
                                                size="sm"
                                                variant={registration.status === 'registered' ? 'flat' : 'dot'}
                                            >
                                                {registration.status}
                                            </Chip>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">
                                                    {getBankInfo(registration).bank}
                                                </span>
                                                <span className="text-xs text-default-400">
                                                    {getBankInfo(registration).accountNumber}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                size="sm"
                                                variant="flat"
                                                color="primary"
                                            >
                                                {getTransactionInfo(registration).type}
                                            </Chip>
                                        </TableCell>
                                        <TableCell>{formatDate(registration.created_at)}</TableCell>
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
