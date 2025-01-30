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
} from "@heroui/react";
import { toast } from 'react-toastify';
import api, { Executive } from '@/services/api';

const ExecutivesPage: React.FC = () => {
    const router = useRouter();
    const [executives, setExecutives] = React.useState<Executive[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

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
                    <Button color="primary">Add Executive</Button>
                </CardHeader>
                <CardBody>
                    <Table 
                        aria-label="Executives table"
                        classNames={{
                            wrapper: "min-h-[auto]",
                        }}
                    >
                        <TableHeader>
                            <TableColumn>USERNAME</TableColumn>
                            <TableColumn>EMAIL</TableColumn>
                            <TableColumn>ROLE</TableColumn>
                            <TableColumn>JOINED</TableColumn>
                            <TableColumn>ACTIONS</TableColumn>
                        </TableHeader>
                        <TableBody emptyContent="No executives found">
                            {executives.map((executive) => (
                                <TableRow key={executive.id}>
                                    <TableCell>{executive.username}</TableCell>
                                    <TableCell>{executive.email}</TableCell>
                                    <TableCell>
                                        <Chip
                                            size="sm"
                                            variant="flat"
                                            color={executive.role === 'manager' ? 'primary' : 'default'}
                                        >
                                            {executive.role}
                                        </Chip>
                                    </TableCell>
                                    <TableCell>{formatDate(executive.created_at)}</TableCell>
                                    <TableCell>
                                        <Button size="sm" color="primary" variant="light">
                                            Edit
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardBody>
            </Card>
        </div>
    );
};

export default withSupAdminAuth(ExecutivesPage);