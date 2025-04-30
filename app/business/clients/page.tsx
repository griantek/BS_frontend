'use client'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation';
import { Card, CardBody, CardHeader, Divider, Spinner, Progress, Button, Badge } from "@nextui-org/react";
import { toast } from 'react-toastify';
import { withClientAuth } from '@/components/withClientAuth';
import api, { Registration } from '@/services/api';
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
  ArrowRightIcon,
  ClipboardDocumentListIcon
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

const JournalDashboard = () => {
    const router = useRouter();
    const [client, setClient] = useState<ClientUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [registrations, setRegistrations] = useState<Registration[]>([]);
    const [pendingQuotations, setPendingQuotations] = useState<Registration[]>([]);

    useEffect(() => {
        const fetchClientData = async () => {
            try {
                setIsLoading(true);
                
                // Get client data from localStorage
                const userData = api.getStoredUser();
                
                if (!userData || !userData.id) {
                    toast.error('Could not retrieve your profile');
                    router.push('/business/clients/login');
                    return;
                }
                
                setClient(userData);
                
                // Fetch client registrations (journals)
                const registrationsResponse = await api.getClientRegistration(userData.id);
                if (registrationsResponse.success) {
                    setRegistrations(registrationsResponse.data);
                }
                
                // Fetch pending quotations
                const quotationsResponse = await api.getClientPendingRegistration(userData.id);
                if (quotationsResponse.success) {
                    setPendingQuotations(quotationsResponse.data);
                }
            } catch (error) {
                console.error('Error fetching client data:', error);
                toast.error('Failed to load your dashboard data');
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchClientData();
    }, [router]);

    const getStatusColor = (status: string) => {
        switch(status.toLowerCase()) {
            case 'in progress':
            case 'drafting':
                return 'warning';
            case 'registered':
            case 'completed':
            case 'submitted':
            case 'published':
                return 'success';
            case 'rejected':
                return 'danger';
            case 'pending':
            case 'waiting for approval':
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

    // Calculate progress percentage based on status
    const getProgressFromStatus = (status: string = "pending") => {
        const statusMap: { [key: string]: number } = {
            "pending": 10,
            "waiting for approval": 25,
            "registered": 50,
            "in progress": 75,
            "completed": 100,
        };

        return statusMap[status.toLowerCase()] || 0;
    };

    // Count journals by status
    const countJournalsByStatus = (status: string) => {
        return registrations.filter(reg => 
            reg.status.toLowerCase() === status.toLowerCase()
        ).length;
    };

    // Determine if a registration is "in progress"
    const isInProgress = (status: string) => {
        return ["in progress", "drafting"].includes(status.toLowerCase());
    };

    // Determine if a registration is "completed"
    const isCompleted = (status: string) => {
        return ["completed", "published", "registered"].includes(status.toLowerCase());
    };
    
    // Determine if a registration is in quotation phase
    const isQuotationPhase = (status: string) => {
        return ["pending", "waiting for approval"].includes(status.toLowerCase());
    };

    // Get latest registrations, limited to 2 for display
    const getLatestRegistrations = () => {
        return [...registrations]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 2);
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
                            <h3 className="text-xl sm:text-2xl font-bold">{registrations.length}</h3>
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
                                {registrations.filter(reg => isInProgress(reg.status)).length}
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
                                {registrations.filter(reg => isCompleted(reg.status)).length}
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
                        {registrations.length === 0 ? (
                            <div className="text-center py-6">
                                <DocumentDuplicateIcon className="h-8 w-8 sm:h-10 sm:w-10 mx-auto text-default-300 mb-2" />
                                <p className="text-default-500 text-sm">You don&apos;t have any journals yet</p>
                                <p className="text-xs mt-2 text-default-400">Contact your executive to initiate a journal submission</p>
                            </div>
                        ) : (
                            <div className="space-y-3 sm:space-y-4">
                                {getLatestRegistrations().map(journal => {
                                    // Calculate progress based on status
                                    const progress = getProgressFromStatus(journal.status);
                                    const inQuotationPhase = isQuotationPhase(journal.status);
                                    
                                    return (
                                        <div 
                                            key={journal.id} 
                                            className="p-3 sm:p-4 border border-divider rounded-lg hover:bg-default-50 transition-colors cursor-pointer active:bg-default-100"
                                            onClick={() => router.push(inQuotationPhase 
                                                ? `/business/clients/journals/quotations/${journal.id}` 
                                                : `/business/clients/journals/details/${journal.id}`)}
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    router.push(inQuotationPhase 
                                                        ? `/business/clients/journals/quotations/${journal.id}` 
                                                        : `/business/clients/journals/details/${journal.id}`);
                                                }
                                            }}
                                        >
                                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2">
                                                <div>
                                                    <h4 className="font-medium text-sm sm:text-base text-foreground line-clamp-2">
                                                        {journal.prospectus?.requirement || journal.services}
                                                    </h4>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className={`text-xs px-1.5 py-0.5 rounded bg-${getStatusColor(journal.status)}-100 text-${getStatusColor(journal.status)}-700`}>
                                                            {journal.status.charAt(0).toUpperCase() + journal.status.slice(1)}
                                                        </span>
                                                        <span className="text-xs text-default-500">{journal.services}</span>
                                                    </div>
                                                </div>
                                                <span className="text-xs text-default-400 mt-1 sm:mt-0">
                                                    Updated: {formatDate(journal.updated_at || journal.created_at)}
                                                </span>
                                            </div>
                                            
                                            {inQuotationPhase ? (
                                                <div className="mt-3 flex">
                                                    <Button 
                                                        color="primary" 
                                                        variant="flat"
                                                        className="ml-auto"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            router.push(`/business/clients/journals/quotations/${journal.id}`);
                                                        }}
                                                        endContent={<CurrencyDollarIcon className="h-3 w-3" />}
                                                    >
                                                        {journal.status.toLowerCase() === "pending" 
                                                            ? "View Quotation" 
                                                            : "View Payment Status"}
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="mt-3">
                                                    <div className="flex justify-between text-xs mb-1">
                                                        <span>Progress</span>
                                                        <span>{progress}%</span>
                                                    </div>
                                                    <Progress 
                                                        value={progress} 
                                                        color={getStatusColor(journal.status)}
                                                        className="h-2"
                                                        aria-label="Journal progress"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                                
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
                            Pending Quotations
                        </h2>
                    </CardHeader>
                    <Divider />
                    <CardBody className="py-3 px-4">
                        {pendingQuotations.length === 0 ? (
                            <div className="text-center py-6">
                                <CurrencyDollarIcon className="h-8 w-8 sm:h-10 sm:w-10 mx-auto text-default-300 mb-2" />
                                <p className="text-default-500 text-sm">No pending quotations</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {pendingQuotations.slice(0, 2).map(quote => (
                                    <div 
                                        key={quote.id} 
                                        className="p-3 border border-divider rounded-lg hover:bg-default-50 transition-colors cursor-pointer active:bg-default-100"
                                        onClick={() => router.push(`/business/clients/journals/quotations/${quote.id}`)}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                router.push(`/business/clients/journals/quotations/${quote.id}`);
                                            }
                                        }}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="font-medium text-sm line-clamp-1 mr-2">{quote.services}</h4>
                                            <span className="text-xs px-1.5 py-0.5 rounded whitespace-nowrap bg-warning-100 text-warning-700">
                                                {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-xs text-default-500 mb-1">
                                            <span className="truncate mr-2">ID: {quote.id}</span>
                                            <span className="whitespace-nowrap">{formatDate(quote.created_at)}</span>
                                        </div>
                                        <div className="mt-2 text-sm font-semibold">
                                            ₹{quote.total_amount.toFixed(2)}
                                        </div>
                                    </div>
                                ))}
                                
                                <Button 
                                    color="primary" 
                                    variant="flat" 
                                    className="w-full py-2 mt-2"
                                    onClick={() => router.push('/business/clients/journals/quotations')}
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
                            <p><span className="font-medium">Hours:</span> Monday - Friday, 9am - 5pm IST</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 mt-2">
                            <Button 
                                color="primary"
                                className="w-full py-2"
                                onClick={() => router.push('/business/clients/journals')}
                            >
                                View My Journals
                            </Button>
                            <Button 
                                color="primary"
                                variant="flat"
                                className="w-full py-2"
                                onClick={() => window.location.href = 'mailto:journal-support@griantek.com'}
                            >
                                Email Support
                            </Button>
                        </div>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
};

export default withClientAuth(JournalDashboard);