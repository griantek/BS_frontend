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
import api, { type Prospectus } from '@/services/api';

function ProspectsPage() {
    const [prospects, setProspects] = React.useState<Prospectus[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchProspects = async () => {
            try {
                const response = await api.getAllProspectus();
                // Check if response is wrapped in an ApiResponse structure
                console.log('Prospects response:', response.data);
                setProspects(Array.isArray(response) ? response : response.data);
            } catch (error) {
                console.error('Error fetching prospects:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProspects();
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
                    <h1 className="text-2xl font-bold">Prospects Management</h1>
                </CardHeader>
                <CardBody>
                    {isLoading ? (
                        <div className="flex justify-center items-center h-[200px]">
                            <Spinner size="lg" />
                        </div>
                    ) : (
                        <Table aria-label="Prospects table">
                            <TableHeader>
                                <TableColumn>REG ID</TableColumn>
                                <TableColumn>CLIENT NAME</TableColumn>
                                <TableColumn>PHONE</TableColumn>
                                <TableColumn>EMAIL</TableColumn>
                                <TableColumn>STATE</TableColumn>
                                <TableColumn>DEPARTMENT</TableColumn>
                                <TableColumn>CREATED</TableColumn>
                            </TableHeader>
                            <TableBody>
                                {prospects.map((prospect) => (
                                    <TableRow key={prospect.id}>
                                        <TableCell>{prospect.reg_id}</TableCell>
                                        <TableCell>{prospect.client_name}</TableCell>
                                        <TableCell>{prospect.phone}</TableCell>
                                        <TableCell>{prospect.email}</TableCell>
                                        <TableCell>{prospect.state}</TableCell>
                                        <TableCell>{prospect.department}</TableCell>
                                        <TableCell>
                                            {formatDate(prospect.created_at)}
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

export default withSupAdminAuth(ProspectsPage);
