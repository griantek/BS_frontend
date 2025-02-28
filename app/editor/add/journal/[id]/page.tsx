'use client';
import React, { Suspense } from 'react';
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
} from "@nextui-org/react";
import { withEditorAuth } from '@/components/withEditorAuth';
import api, { AssignedRegistration, CreateJournalRequest } from '@/services/api';
import { toast } from 'react-toastify';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { LoadingSpinner } from "@/components/LoadingSpinner";

const statusOptions = [
    'pending',
    'under review',
    'approved',
    'rejected',
    'submitted',
    'other'  // Add 'other' option
] as const;

function JournalAddContent({ registrationId }: { registrationId: string }) {
    const router = useRouter();
    const [registration, setRegistration] = React.useState<AssignedRegistration | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [selectedStatus, setSelectedStatus] = React.useState('pending');
    const [customStatus, setCustomStatus] = React.useState('');
    const [prospectusData, setProspectusData] = React.useState({
        personal_email: '',
        client_name: '',
        requirement: ''
    });

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const user = api.getStoredUser();
                if (!user?.id) return;

                // Fetch registration data
                const regResponse = await api.getAssignedRegistrations(user.id);
                const reg = regResponse.data.find(r => r.id === parseInt(registrationId));
                
                if (reg) {
                    setRegistration(reg);
                    
                    // Fetch additional prospectus data
                    const prospectusResponse = await api.getProspectusAssistData(reg.prospectus_id);
                    if (prospectusResponse.success) {
                        setProspectusData(prospectusResponse.data);
                    }
                } else {
                    toast.error('Registration not found');
                    router.push('/editor/assigned');
                }
            } catch (error) {
                const errorMessage = api.handleError(error);
                toast.error(errorMessage.error || 'Failed to load data');
                router.push('/editor/assigned');
            } finally {
                setIsLoading(false);
            }
        };

        if (registrationId) fetchData();
    }, [registrationId, router]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!registration) return;

        setIsSubmitting(true);
        try {
            const formData = new FormData(e.currentTarget);
            const user = api.getStoredUser();
            
            // Determine final status value
            const finalStatus = selectedStatus === 'other' ? customStatus : selectedStatus;
            
            const createData: CreateJournalRequest = {
                prospectus_id: registration.prospectus_id,
                client_name: formData.get('client_name') as string,
                requirement: formData.get('requirement') as string,
                personal_email: formData.get('personal_email') as string,
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
                router.push('/editor/journals');
            }
        } catch (error) {
            const errorMessage = api.handleError(error);
            toast.error(errorMessage.error || 'Failed to create journal');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return <LoadingSpinner text="Loading registration details..." />;
    }

    if (!registration) {
        return <div className="p-4">Registration not found</div>;
    }

    return (
        <>
            <Button
                isIconOnly
                variant="light"
                className="fixed top-4 left-4 z-50"
                onClick={() => router.push(`/editor/view/assigned/${registration.id}`)}
            >
                <ArrowLeftIcon className="h-5 w-5" />
            </Button>

            <div className="w-full p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Registration Details Card */}
                    <Card>
                        <CardHeader>
                            <h2 className="text-xl font-bold">Registration Details</h2>
                        </CardHeader>
                        <Divider />
                        <CardBody className="space-y-4">
                            <div className="grid gap-4">
                                <div>
                                    <h3 className="text-sm text-gray-500">Registration ID</h3>
                                    <p className="font-medium">{registration.prospectus.reg_id}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm text-gray-500">Client Name</h3>
                                    <p className="font-medium">{registration.prospectus.client_name}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm text-gray-500">Email</h3>
                                    <p className="font-medium">{registration.prospectus.email}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm text-gray-500">Services</h3>
                                    <p className="font-medium">{registration.services}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm text-gray-500">Requirement</h3>
                                    <p className="whitespace-pre-wrap">{registration.prospectus.requirement}</p>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    {/* Journal Creation Form */}
                    <Card>
                        <CardHeader>
                            <h2 className="text-xl font-bold">Add Journal Details</h2>
                        </CardHeader>
                        <Divider />
                        <CardBody>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold">Client Information</h3>
                                    <Input
                                        label="Client Name"
                                        name="client_name"
                                        defaultValue={prospectusData.client_name}
                                        isRequired
                                    />
                                    <Input
                                        label="Personal Email"
                                        name="personal_email"
                                        defaultValue={prospectusData.personal_email}
                                        isRequired
                                    />
                                    <Textarea
                                        label="Requirement"
                                        name="requirement"
                                        defaultValue={prospectusData.requirement}
                                        isRequired
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

                                {/* Existing credential fields */}
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
                                            isRequired
                                        />
                                        <Input
                                            label="ORCID Password"
                                            name="password1"
                                            type="password"
                                            isRequired
                                        />
                                    </div>
                                </div>

                                {/* Form buttons */}
                                <div className="flex justify-end gap-3">
                                    <Button
                                        variant="flat"
                                        color="danger"
                                        onClick={() => router.push(`/editor/view/assigned/${registration.id}`)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        color="primary"
                                        type="submit"
                                        isLoading={isSubmitting}
                                    >
                                        Add Journal Details
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
function JournalAddPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = React.use(params);
    
    return (
        <Suspense fallback={<LoadingSpinner text="Loading..." />}>
            <JournalAddContent registrationId={resolvedParams.id} />
        </Suspense>
    );
}

export default withEditorAuth(JournalAddPage);
