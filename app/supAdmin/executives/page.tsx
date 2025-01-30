'use client'
import React from 'react';
import { useRouter } from 'next/navigation';
import { checkAuth } from '@/utils/authCheck';
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
} from "@heroui/react";
import { toast } from 'react-toastify';
import api, { Executive } from '@/services/api';

const ExecutivesPage: React.FC = () => {
    const router = useRouter();
    const [executives, setExecutives] = React.useState<Executive[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        // Check authentication first
        if (!checkAuth(router, 'supAdmin')) {
            return;
        }

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
                            <TableColumn>NAME</TableColumn>
                            <TableColumn>EMAIL</TableColumn>
                            <TableColumn>STATUS</TableColumn>
                            <TableColumn>ACTIONS</TableColumn>
                        </TableHeader>
                        <TableBody emptyContent="No executives found">
                            {executives.map((executive) => (
                                <TableRow key={executive.id}>
                                    <TableCell>{executive.name}</TableCell>
                                    <TableCell>{executive.email}</TableCell>
                                    <TableCell>{executive.status}</TableCell>
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

export default ExecutivesPage;