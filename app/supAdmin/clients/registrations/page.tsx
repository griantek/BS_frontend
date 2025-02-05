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
import api, { ServerRegistration } from '@/services/api';

// Helper functions
const getBankInfo = (registration: ServerRegistration) => {
  const accountNumber = registration.bank_account?.account_number || '';
  const lastFourDigits = accountNumber.slice(-4);
  return {
    bank: registration.bank_account?.bank || 'N/A',
    accountNumber: accountNumber ? `****${lastFourDigits}` : 'N/A'
  };
};

const getTransactionInfo = (registration: ServerRegistration) => {
  return {
    type: registration.transaction?.transaction_type || 'N/A',
    amount: registration.transaction?.amount || 0
  };
};

function AmountTooltip({ 
  initial, 
  accepted, 
  discount, 
  total 
}: { 
  initial: number; 
  accepted: number; 
  discount: number; 
  total: number; 
}) {
  return (
    <div className="group relative">
      <div className="text-sm font-medium">₹{total.toLocaleString()}</div>
      <div className="absolute z-50 invisible group-hover:visible bg-content1 border border-divider rounded-lg shadow-lg p-3 w-48 -translate-y-full -translate-x-1/4 mt-1">
        <div className="space-y-2 text-sm">
          <div>Initial: ₹{initial.toLocaleString()}</div>
          <div>Accepted: ₹{accepted.toLocaleString()}</div>
          {discount > 0 && (
            <div className="text-success">Discount: -₹{discount.toLocaleString()}</div>
          )}
          <div className="border-t border-divider mt-2 pt-2 font-medium">
            Total: ₹{total.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}

function RegistrationsPage() {
    const [registrations, setRegistrations] = React.useState<ServerRegistration[]>([]);
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
                                <TableColumn>AMOUNT</TableColumn>
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
                                        <TableCell>
                                            <AmountTooltip
                                                initial={registration.init_amount}
                                                accepted={registration.accept_amount}
                                                discount={registration.discount}
                                                total={registration.total_amount}
                                            />
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
                                                <span className="font-medium text-default-600">
                                                    {getBankInfo(registration).bank}
                                                </span>
                                                <span className="text-xs text-default-400 font-mono">
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
