'use client'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation';
import { Card, CardBody, CardHeader, Divider, Spinner } from "@nextui-org/react";
import { toast } from 'react-toastify';
import { withClientAuth } from '@/components/withClientAuth';
import api from '@/services/api';
import { 
  ClipboardDocumentListIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  CalendarDaysIcon,
  DocumentIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';

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

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl md:text-3xl font-bold">Client Dashboard</h1>
                <span className="text-default-500">
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
            </div>
            
            {/* Welcome card with client info */}
            <Card className="mb-6">
                <CardHeader className="pb-0 pt-4 px-6 flex-col items-start">
                    <h4 className="text-lg font-bold">Welcome Back!</h4>
                    <p className="text-default-500">
                        {client?.prospectus?.client_name || client?.email}
                    </p>
                </CardHeader>
                <CardBody className="px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary-50 rounded-md">
                                <EnvelopeIcon className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-xs text-default-400">Email</p>
                                <p className="font-medium">{client?.email}</p>
                            </div>
                        </div>
                        
                        {client?.prospectus?.phone && (
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-success-50 rounded-md">
                                    <PhoneIcon className="h-5 w-5 text-success" />
                                </div>
                                <div>
                                    <p className="text-xs text-default-400">Phone</p>
                                    <p className="font-medium">{client?.prospectus?.phone}</p>
                                </div>
                            </div>
                        )}
                        
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-warning-50 rounded-md">
                                <CalendarDaysIcon className="h-5 w-5 text-warning" />
                            </div>
                            <div>
                                <p className="text-xs text-default-400">Joined</p>
                                <p className="font-medium">{new Date(client?.created_at || '').toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                </CardBody>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <Card className="col-span-2">
                    <CardHeader>
                        <h2 className="text-xl font-semibold flex items-center">
                            <DocumentIcon className="h-5 w-5 mr-2 text-primary" />
                            Your Projects
                        </h2>
                    </CardHeader>
                    <Divider />
                    <CardBody>
                        <div className="text-center py-8">
                            <ClipboardDocumentListIcon className="h-10 w-10 mx-auto text-default-300 mb-2" />
                            <p className="text-default-500">Your active projects will appear here</p>
                            <p className="text-xs mt-2 text-default-400">Contact your executive to add new projects</p>
                        </div>
                    </CardBody>
                </Card>
                
                <Card>
                    <CardHeader>
                        <h2 className="text-xl font-semibold flex items-center">
                            <ClockIcon className="h-5 w-5 mr-2 text-primary" />
                            Recent Activity
                        </h2>
                    </CardHeader>
                    <Divider />
                    <CardBody>
                        <div className="text-center py-8">
                            <ClockIcon className="h-10 w-10 mx-auto text-default-300 mb-2" />
                            <p className="text-default-500">No recent activity</p>
                        </div>
                    </CardBody>
                </Card>
            </div>
            
            <Card>
                <CardHeader>
                    <h2 className="text-xl font-semibold flex items-center">
                        <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2 text-primary" />
                        Support & Help
                    </h2>
                </CardHeader>
                <Divider />
                <CardBody>
                    <p className="text-default-600 mb-4">
                        Need assistance with your projects or have questions about our services?
                    </p>
                    <div className="bg-primary-50 p-4 rounded-lg">
                        <h3 className="font-medium text-primary mb-2">Contact Support</h3>
                        <p className="text-sm mb-2">Our team is available to help you with any questions or concerns</p>
                        <div className="flex flex-col gap-1 text-sm">
                            <p><span className="font-medium">Email:</span> support@griantek.com</p>
                            <p><span className="font-medium">Phone:</span> +1 (800) 123-4567</p>
                            <p><span className="font-medium">Hours:</span> Monday - Friday, 9am - 5pm EST</p>
                        </div>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
};

export default withClientAuth(DashboardPage);