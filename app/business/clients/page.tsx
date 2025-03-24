'use client'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation';
import { Card, CardBody, CardHeader, Button, Divider } from "@nextui-org/react";
import { toast } from 'react-toastify';

interface ClientUser {
    id: string;
    email: string;
    username?: string;
    created_at: string;
}

const DashboardPage = () => {
    const router = useRouter();
    const [client, setClient] = useState<ClientUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check if user is logged in
        const token = localStorage.getItem('token');
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        const userRole = localStorage.getItem('userRole');
        
        if (!token || isLoggedIn !== 'true' || userRole !== 'clients') {
            toast.error('Please login to access your dashboard');
            router.push('/business/clients/login');
            return;
        }

        // Get client data
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const userData = JSON.parse(userStr);
                setClient(userData);
            } catch (error) {
                console.error('Error parsing user data:', error);
                toast.error('Error loading your profile');
            }
        }
        
        setIsLoading(false);
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userRole');
        
        toast.success('Logged out successfully');
        router.push('/business/clients/login');
    };

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
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
                    <p className="text-default-500">{client?.email}</p>
                </CardHeader>
                <CardBody>
                    <p>Your client ID: {client?.id}</p>
                    <p>Account created: {new Date(client?.created_at || '').toLocaleDateString()}</p>
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

export default DashboardPage