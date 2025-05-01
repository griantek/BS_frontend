"use client";
import React, { Suspense, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Card,
    CardBody,
    CardHeader,
    Button,
    Input,
    Select,
    SelectItem,
    Textarea,
    Divider,
    Spinner
} from "@nextui-org/react";
import { withEditorAuth } from '@/components/withEditorAuth';
import api, { CreateJournalRequest, JournalData } from '@/services/api';
import { toast } from 'react-toastify';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { LoadingSpinner, PageLoadingSpinner } from "@/components/LoadingSpinner";

const statusOptions = [
    'pending',
    'under review',
    'approved',
    'rejected',
    'submitted',
    'other'
] as const;

function AddJournalContent({ emailId }: { emailId: string }) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isPageNavigating, setIsPageNavigating] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState('pending');
    const [customStatus, setCustomStatus] = useState('');
    
    // Email and journal data
    const email = decodeURIComponent(emailId);
    const [existingJournals, setExistingJournals] = useState<JournalData[]>([]);
    const [prospectusData, setProspectusData] = useState({
        prospectus_id: 0,
        client_name: '',
        requirement: ''
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                // Fetch journal data for this email to get prospectus_id and other details
                const response = await api.getJournalDataByEmail(email);
                if (response.success && response.data.length > 0) {
                    setExistingJournals(response.data);
                    
                    // Use the first journal's data to extract common information
                    const firstJournal = response.data[0];
                    setProspectusData({
                        prospectus_id: firstJournal.prospectus_id,
                        client_name: firstJournal.client_name,
                        requirement: firstJournal.requirement
                    });
                } else {
                    toast.error('No journals found for this email');
                    goBack();
                }
            } catch (error) {
                const errorMessage = api.handleError(error);
                toast.error(errorMessage.error || 'Failed to load data');
                goBack();
            } finally {
                setIsLoading(false);
            }
        };

        if (email) fetchData();
    }, [email]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (prospectusData.prospectus_id === 0) {
            toast.error('Missing prospectus ID');
            return;
        }

        setIsSubmitting(true);
        try {
            const formData = new FormData(e.currentTarget);
            const user = api.getStoredUser();

            // Determine final status value
            const finalStatus = selectedStatus === 'other' ? customStatus : selectedStatus;
            
            const createData: CreateJournalRequest = {
                prospectus_id: prospectusData.prospectus_id,
                client_name: formData.get('client_name') as string,
                requirement: prospectusData.requirement,
                personal_email: email,
                assigned_to: user?.id || '',
                journal_name: formData.get('journal_name') as string,
                status: finalStatus,
                journal_link: formData.get('journal_link') as string,
                username: formData.get('username') as string,
                password: formData.get('password') as string,
                orcid_username1: formData.get('orcid_username1') as string,
                password1: formData.get('password1') as string,
                paper_title: formData.get('paper_title') as string,
            };

            const response = await api.createJournalData(createData);
            if (response.success) {
                toast.success('Journal details added successfully');
                
                // Show full page loading spinner before navigation
                setIsPageNavigating(true);
                router.push(`/business/editor/view/journal/byEmail/${emailId}`);
            }
        } catch (error) {
            const errorMessage = api.handleError(error);
            toast.error(errorMessage.error || 'Failed to create journal');
            setIsSubmitting(false);
        }
    };

    const goBack = () => {
        setIsPageNavigating(true);
        router.push(`/business/editor/view/journal/byEmail/${emailId}`);
    };

    if (isLoading) {
        return <LoadingSpinner text="Loading data..." />;
    }

    return (
        <>
            {isPageNavigating && <PageLoadingSpinner text="Redirecting..." />}
            
            <Button
                isIconOnly
                variant="light"
                className="fixed top-4 left-4 z-50"
                onClick={goBack}
            >
                <ArrowLeftIcon className="h-5 w-5" />
            </Button>

            <div className="w-full p-6">
                <div className="grid grid-cols-1 gap-6 mx-auto max-w-4xl">
                    <Card>
                        <CardHeader>
                            <h2 className="text-xl font-bold">Add Journal for {email}</h2>
                        </CardHeader>
                        <Divider />
                        <CardBody>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold">Client Information</h3>
                                    <Input
                                        label="Email"
                                        value={email}
                                        isReadOnly
                                        isDisabled
                                    />
                                    <Input
                                        label="Client Name"
                                        name="client_name"
                                        defaultValue={prospectusData.client_name}
                                        isRequired
                                    />
                                    <Textarea
                                        label="Requirement"
                                        value={prospectusData.requirement}
                                        isReadOnly
                                        isDisabled
                                        minRows={3}
                                    />
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold">Journal Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input
                                            label="Journal Name"
                                            name="journal_name"
                                            isRequired
                                        />
                                        <Input
                                            label="Paper Title"
                                            name="paper_title"
                                            isRequired
                                        />
                                    </div>
                                    <Input
                                        label="Journal Link"
                                        name="journal_link"
                                        isRequired
                                    />
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold">Status</h3>
                                    <div className="flex gap-4">
                                        <Select
                                            label="Status"
                                            defaultSelectedKeys={['pending']}
                                            onChange={(e) => setSelectedStatus(e.target.value)}
                                            className="flex-1"
                                        >
                                            {statusOptions.map((status) => (
                                                <SelectItem key={status} value={status}>
                                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                                </SelectItem>
                                            ))}
                                        </Select>
                                        {selectedStatus === 'other' && (
                                            <Input
                                                label="Custom Status"
                                                value={customStatus}
                                                onChange={(e) => setCustomStatus(e.target.value)}
                                                isRequired
                                                className="flex-1"
                                            />
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold">Journal Credentials</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input
                                            label="Username"
                                            name="username"
                                            isRequired
                                        />
                                        <Input
                                            label="Password"
                                            name="password"
                                            type="password"
                                            isRequired
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold">ORCID Credentials</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input
                                            label="ORCID Username"
                                            name="orcid_username1"
                                        />
                                        <Input
                                            label="ORCID Password"
                                            name="password1"
                                            type="password"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3">
                                    <Button
                                        variant="flat"
                                        color="danger"
                                        onClick={goBack}
                                        isDisabled={isSubmitting || isPageNavigating}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        color="primary"
                                        type="submit"
                                        isLoading={isSubmitting}
                                        disabled={isSubmitting || isPageNavigating}
                                    >
                                        {isSubmitting ? "Adding Journal..." : "Add Journal Details"}
                                    </Button>
                                </div>
                            </form>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </>
    );
}

// Main component wrapper that handles the Promise params
function AddJournalPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = React.use(params);
    
    return (
        <Suspense fallback={<LoadingSpinner text="Loading..." />}>
            <AddJournalContent emailId={resolvedParams.id} />
        </Suspense>
    );
}

export default withEditorAuth(AddJournalPage);
