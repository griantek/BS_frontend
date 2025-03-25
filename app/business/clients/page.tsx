'use client'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation';
import { Card, CardBody, CardHeader, Button, Divider, Spinner } from "@nextui-org/react";
import { toast } from 'react-toastify';
import { withClientAuth } from '@/components/withClientAuth';
import api from '@/services/api';

interface ClientUser {
    id: string;
    email: string;
    username?: string;
    created_at: string;
    prospectus_id?: number;
    prospectus?: {
        id: number;
        email: string;
        phone: string;
        client_name: string;
    };
}

const DashboardPage = () => {
    const router = useRouter();
    const [client, setClient] = useState<ClientUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Get client data from localStorage (already validated by withClientAuth)
        const userData = api.getStoredUser();
        
        if (userData) {
            setClient(userData);
        } else {
            // This should not happen because withClientAuth would redirect,
            // but as a fallback:
            toast.error('Could not retrieve your profile');
            router.push('/business/clients/login');
        }
        
        setIsLoading(false);
    }, [router]);

    const handleLogout = () => {
        api.clearStoredAuth();
        toast.success('Logged out successfully');
        router.push('/business/clients/login');
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl md:text-3xl font-bold">Client Dashboard</h1>
                <Button color="danger" variant="light" onClick={handleLogout}>
                    Logout
                </Button>
            </div>
            
            <Card className="mb-6">
                <CardHeader className="pb-0 pt-4 px-4 flex-col items-start">
                    <h4 className="text-lg font-bold">Welcome Back!</h4>
                    <p className="text-default-500">
                        {client?.prospectus?.client_name || client?.email}
                    </p>
                </CardHeader>
                <CardBody>
                    <div className="space-y-2">
                        <p><span className="font-medium">Client ID:</span> {client?.id}</p>
                        <p><span className="font-medium">Email:</span> {client?.email}</p>
                        {client?.prospectus?.phone && (
                            <p><span className="font-medium">Phone:</span> {client?.prospectus?.phone}</p>
                        )}
                        <p><span className="font-medium">Account created:</span> {new Date(client?.created_at || '').toLocaleDateString()}</p>
                    </div>
                </CardBody>
            </Card>
            
            <Divider className="my-6" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader>
                        <h2 className="text-xl font-semibold">Your Projects</h2>
                    </CardHeader>
                    <CardBody>
                        <p className="text-default-500">Your project information will appear here</p>
                    </CardBody>
                </Card>
                
                <Card>
                    <CardHeader>
                        <h2 className="text-xl font-semibold">Support</h2>
                    </CardHeader>
                    <CardBody>
                        <p className="text-default-500">Need help? Contact your assigned executive.</p>
                    </CardBody>
                </Card>
            </div>
        </div>
    )
}

export default withClientAuth(DashboardPage);