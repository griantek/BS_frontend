'use client'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation';
import { Card, CardBody, CardHeader, Divider, Spinner, Progress, Button, Badge } from "@nextui-org/react";
import { toast } from 'react-toastify';
import { withClientAuth } from '@/components/withClientAuth';
import api from '@/services/api';
import { 
  NewspaperIcon,
  EnvelopeIcon, 
  PhoneIcon, 
  CalendarDaysIcon,
  DocumentTextIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  DocumentCheckIcon,
  DocumentDuplicateIcon,
  CurrencyDollarIcon,
  ArrowRightIcon
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

// Mock journal data for demonstration
const mockJournals = [
  {
    id: 1,
    title: "Advanced Machine Learning Techniques in Healthcare",
    status: "In Review",
    progress: 65,
    lastUpdated: "2023-10-12T14:30:00Z",
    type: "Paper Writing"
  },
  {
    id: 2,
    title: "Sustainable Energy Solutions for Urban Development",
    status: "Submitted",
    progress: 100,
    lastUpdated: "2023-11-05T09:15:00Z",
    type: "Paper Submission"
  }
];

// Mock quotation data
const mockQuotations = [
  {
    id: "Q-2023-001",
    title: "Journal Submission to IEEE",
    date: "2023-11-10T10:00:00Z",
    amount: 450,
    status: "Pending"
  }
];

const JournalDashboard = () => {
    const router = useRouter();
    const [client, setClient] = useState<ClientUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [recentJournals, setRecentJournals] = useState(mockJournals);
    const [recentQuotations, setRecentQuotations] = useState(mockQuotations);

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
        
        // Here you would fetch the actual journal data from your API
        // For example:
        // api.getClientJournals(userData.id).then(data => setRecentJournals(data));
        // api.getClientQuotations(userData.id).then(data => setRecentQuotations(data));
    }, [router]);

    const getStatusColor = (status: string) => {
        switch(status.toLowerCase()) {
            case 'in review':
                return 'warning';
            case 'submitted':
                return 'success';
            case 'rejected':
                return 'danger';
            case 'pending':
                return 'primary';
            default:
                return 'default';
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-0">Journal Dashboard</h1>
                <span className="text-xs sm:text-sm text-default-500">
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
            </div>
            
            {/* Welcome card with client info */}
            <Card className="mb-4 sm:mb-6">
                <CardHeader className="pb-0 pt-3 px-4 sm:px-6 flex-col items-start">
                    <h4 className="text-base sm:text-lg font-bold">Welcome Back!</h4>
                    <p className="text-default-500 text-sm">
                        {client?.prospectus?.client_name || client?.email}
                    </p>
                </CardHeader>
                <CardBody className="px-4 sm:px-6 py-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary-50 rounded-md">
                                <EnvelopeIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-xs text-default-400">Email</p>
                                <p className="font-medium text-sm sm:text-base truncate max-w-[180px] sm:max-w-none">{client?.email}</p>
                            </div>
                        </div>
                        
                        {client?.prospectus?.phone && (
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-success-50 rounded-md">
                                    <PhoneIcon className="h-4 w-4 sm:h-5 sm:w-5 text-success" />
                                </div>
                                <div>
                                    <p className="text-xs text-default-400">Phone</p>
                                    <p className="font-medium text-sm sm:text-base">{client?.prospectus?.phone}</p>
                                </div>
                            </div>
                        )}
                        
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-warning-50 rounded-md">
                                <CalendarDaysIcon className="h-4 w-4 sm:h-5 sm:w-5 text-warning" />
                            </div>
                            <div>
                                <p className="text-xs text-default-400">Registered</p>
                                <p className="font-medium text-sm sm:text-base">{new Date(client?.created_at || '').toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                </CardBody>
            </Card>
            
            {/* Journal Status Summary - Scrollable on small screens */}
            <div className="flex overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 sm:gap-4 mb-4 sm:mb-6 snap-x">
                <Card className="border-l-4 border-primary min-w-[240px] sm:min-w-0 mr-3 sm:mr-0 flex-shrink-0 snap-start">
                    <CardBody className="py-3 px-4 flex flex-row items-center justify-between">
                        <div>
                            <p className="text-default-500 text-xs sm:text-sm">Total Journals</p>
                            <h3 className="text-xl sm:text-2xl font-bold">{recentJournals.length}</h3>
                        </div>
                        <div className="bg-primary/10 p-2 sm:p-3 rounded-full">
                            <NewspaperIcon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                        </div>
                    </CardBody>
                </Card>

                <Card className="border-l-4 border-warning min-w-[240px] sm:min-w-0 mr-3 sm:mr-0 flex-shrink-0 snap-start">
                    <CardBody className="py-3 px-4 flex flex-row items-center justify-between">
                        <div>
                            <p className="text-default-500 text-xs sm:text-sm">In Progress</p>
                            <h3 className="text-xl sm:text-2xl font-bold">
                                {recentJournals.filter(j => j.status === 'In Review').length}
                            </h3>
                        </div>
                        <div className="bg-warning/10 p-2 sm:p-3 rounded-full">
                            <ClockIcon className="w-5 h-5 sm:w-6 sm:h-6 text-warning" />
                        </div>
                    </CardBody>
                </Card>

                <Card className="border-l-4 border-success min-w-[240px] sm:min-w-0 flex-shrink-0 snap-start">
                    <CardBody className="py-3 px-4 flex flex-row items-center justify-between">
                        <div>
                            <p className="text-default-500 text-xs sm:text-sm">Completed</p>
                            <h3 className="text-xl sm:text-2xl font-bold">
                                {recentJournals.filter(j => j.status === 'Submitted').length}
                            </h3>
                        </div>
                        <div className="bg-success/10 p-2 sm:p-3 rounded-full">
                            <DocumentCheckIcon className="w-5 h-5 sm:w-6 sm:h-6 text-success" />
                        </div>
                    </CardBody>
                </Card>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
                {/* Recent Journals Card */}
                <Card className="col-span-1 md:col-span-2">
                    <CardHeader className="flex justify-between items-center py-3 px-4">
                        <h2 className="text-lg font-semibold flex items-center">
                            <NewspaperIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-primary" />
                            Recent Journals
                        </h2>
                        <Button 
                            color="primary" 
                            variant="light" 
                            size="sm"
                            endContent={<ArrowRightIcon className="h-3 w-3 sm:h-4 sm:w-4" />}
                            onClick={() => router.push('/business/clients/journals')}
                            className="min-w-0 px-2 sm:px-3"
                        >
                            View All
                        </Button>
                    </CardHeader>
                    <Divider />
                    <CardBody className="py-3 px-4">
                        {recentJournals.length === 0 ? (
                            <div className="text-center py-6">
                                <DocumentDuplicateIcon className="h-8 w-8 sm:h-10 sm:w-10 mx-auto text-default-300 mb-2" />
                                <p className="text-default-500 text-sm">You don't have any journals yet</p>
                                <p className="text-xs mt-2 text-default-400">Contact your executive to initiate a journal submission</p>
                            </div>
                        ) : (
                            <div className="space-y-3 sm:space-y-4">
                                {recentJournals.map(journal => (
                                    <div 
                                        key={journal.id} 
                                        className="p-3 sm:p-4 border border-divider rounded-lg hover:bg-default-50 transition-colors cursor-pointer active:bg-default-100"
                                        onClick={() => router.push(`/business/clients/journals/${journal.id}`)}
                                    >
                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2">
                                            <div>
                                                <h4 className="font-medium text-sm sm:text-base text-foreground line-clamp-2">{journal.title}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                                                        journal.status === 'In Review' 
                                                        ? 'bg-warning-100 text-warning-700' 
                                                        : 'bg-success-100 text-success-700'
                                                    }`}>
                                                        {journal.status}
                                                    </span>
                                                    <span className="text-xs text-default-500">{journal.type}</span>
                                                </div>
                                            </div>
                                            <span className="text-xs text-default-400 mt-1 sm:mt-0">
                                                Updated: {formatDate(journal.lastUpdated)}
                                            </span>
                                        </div>
                                        <div className="mt-3">
                                            <div className="flex justify-between text-xs mb-1">
                                                <span>Progress</span>
                                                <span>{journal.progress}%</span>
                                            </div>
                                            <Progress 
                                                value={journal.progress} 
                                                color={getStatusColor(journal.status)}
                                                className="h-2"
                                                aria-label="Journal progress"
                                            />
                                        </div>
                                    </div>
                                ))}
                                
                                <Button 
                                    color="primary" 
                                    className="w-full py-2 sm:py-3 mt-2"
                                    onClick={() => router.push('/business/clients/journals')}
                                >
                                    View All Journals
                                </Button>
                            </div>
                        )}
                    </CardBody>
                </Card>
                
                {/* Quotations Card */}
                <Card>
                    <CardHeader className="py-3 px-4">
                        <h2 className="text-lg font-semibold flex items-center">
                            <DocumentTextIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-primary" />
                            Quotations
                        </h2>
                    </CardHeader>
                    <Divider />
                    <CardBody className="py-3 px-4">
                        {recentQuotations.length === 0 ? (
                            <div className="text-center py-6">
                                <CurrencyDollarIcon className="h-8 w-8 sm:h-10 sm:w-10 mx-auto text-default-300 mb-2" />
                                <p className="text-default-500 text-sm">No quotations available</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {recentQuotations.map(quote => (
                                    <div 
                                        key={quote.id} 
                                        className="p-3 border border-divider rounded-lg hover:bg-default-50 transition-colors cursor-pointer active:bg-default-100"
                                        onClick={() => router.push(`/business/clients/quotations/${quote.id}`)}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="font-medium text-sm line-clamp-1 mr-2">{quote.title}</h4>
                                            <span className={`text-xs px-1.5 py-0.5 rounded whitespace-nowrap ${
                                                quote.status === 'Pending' 
                                                ? 'bg-warning-100 text-warning-700' 
                                                : 'bg-success-100 text-success-700'
                                            }`}>
                                                {quote.status}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-xs text-default-500 mb-1">
                                            <span className="truncate mr-2">ID: {quote.id}</span>
                                            <span className="whitespace-nowrap">{formatDate(quote.date)}</span>
                                        </div>
                                        <div className="mt-2 text-sm font-semibold">
                                            ${quote.amount.toFixed(2)}
                                        </div>
                                    </div>
                                ))}
                                
                                <Button 
                                    color="primary" 
                                    variant="flat" 
                                    className="w-full py-2 mt-2"
                                    onClick={() => router.push('/business/clients/quotations')}
                                >
                                    View All Quotations
                                </Button>
                            </div>
                        )}
                    </CardBody>
                </Card>
            </div>
            
            {/* Support Card */}
            <Card>
                <CardHeader className="py-3 px-4">
                    <h2 className="text-lg font-semibold flex items-center">
                        <ChatBubbleLeftRightIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-primary" />
                        Journal Support
                    </h2>
                </CardHeader>
                <Divider />
                <CardBody className="py-3 px-4">
                    <p className="text-default-600 text-sm mb-4">
                        Need assistance with your journal submissions or have questions about our services?
                    </p>
                    <div className="bg-primary-50 p-3 sm:p-4 rounded-lg">
                        <h3 className="font-medium text-primary text-sm sm:text-base mb-2">Contact Journal Support</h3>
                        <div className="flex flex-col gap-1 text-xs sm:text-sm mb-3">
                            <p><span className="font-medium">Email:</span> journal-support@griantek.com</p>
                            <p><span className="font-medium">Phone:</span> +1 (800) 123-4567</p>
                            <p><span className="font-medium">Hours:</span> Monday - Friday, 9am - 5pm EST</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 mt-2">
                            <Button 
                                color="primary"
                                className="w-full py-2"
                                onClick={() => router.push('/business/clients/support')}
                            >
                                Contact Support
                            </Button>
                            <Button 
                                color="primary"
                                variant="flat"
                                className="w-full py-2"
                                onClick={() => window.location.href = 'tel:+18001234567'}
                            >
                                Call Now
                            </Button>
                        </div>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
};

export default withClientAuth(JournalDashboard);