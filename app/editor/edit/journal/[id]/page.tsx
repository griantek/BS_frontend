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
    Spinner,
    Textarea,
    Divider,
} from "@heroui/react";
import { withEditorAuth } from '@/components/withEditorAuth';
import api, { JournalData, UpdateJournalRequest } from '@/services/api';
import { toast } from 'react-toastify';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const statusOptions = [
    'pending',
    'under review',
    'approved',
    'rejected',
    'submitted',
    'other'  // Add 'other' option
] as const;

function JournalEditContent({ id }: { id: string }) {
    const router = useRouter();
    const [journal, setJournal] = React.useState<JournalData | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [selectedStatus, setSelectedStatus] = React.useState<string>('');
    const [customStatus, setCustomStatus] = React.useState('');

    React.useEffect(() => {
        const fetchJournal = async () => {
            try {
                const response = await api.getJournalById(Number(id));
                if (response.success) {
                    setJournal(response.data);
                    // Check if current status is in statusOptions
                    if (statusOptions.includes(response.data.status as any)) {
                        setSelectedStatus(response.data.status);
                    } else {
                        setSelectedStatus('other');
                        setCustomStatus(response.data.status);
                    }
                }
            } catch (error) {
                const errorMessage = api.handleError(error);
                toast.error(errorMessage.error || 'Failed to load journal');
            } finally {
                setIsLoading(false);
            }
        };

        if (id) fetchJournal();
    }, [id]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!journal) return;

        setIsSubmitting(true);
        try {
            const formData = new FormData(e.currentTarget);
            
            // Determine final status value
            const finalStatus = selectedStatus === 'other' ? customStatus : selectedStatus;

            const updateData: UpdateJournalRequest = {
                status: finalStatus as UpdateJournalRequest['status'],
                journal_name: formData.get('journal_name') as string,
                journal_link: formData.get('journal_link') as string,
                paper_title: formData.get('paper_title') as string,
                username: formData.get('username') as string,
                password: formData.get('password') as string,
                orcid_username1: formData.get('orcid_username1') as string,
                password1: formData.get('password1') as string,
            };

            await api.updateJournal(journal.id, updateData);
            toast.success('Journal updated successfully');
            router.push(`/editor/view/journal/${journal.id}`);
        } catch (error) {
            const errorMessage = api.handleError(error);
            toast.error(errorMessage.error || 'Failed to update journal');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!journal) {
        return <div className="p-4">Journal not found</div>;
    }

    return (
        <>
            <Button
                isIconOnly
                variant="light"
                className="fixed top-4 left-4 z-50"
                onClick={() => router.push(`/editor/view/journal/${journal.id}`)}
            >
                <ArrowLeftIcon className="h-5 w-5" />
            </Button>

            <div className="w-full p-6">
                <Card>
                    <CardHeader>
                        <h1 className="text-2xl font-bold">Edit Journal</h1>
                    </CardHeader>
                    <CardBody>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Read-only fields */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Client Name"
                                    value={journal.client_name}
                                    isReadOnly
                                    isDisabled
                                />
                                <Input
                                    label="Personal Email"
                                    value={journal.personal_email}
                                    isReadOnly
                                    isDisabled
                                />
                                <Input
                                    label="Registration ID"
                                    value={journal.prospectus.reg_id}
                                    isReadOnly
                                    isDisabled
                                />
                                <Input
                                    label="Applied By"
                                    value={journal.executive.username}
                                    isReadOnly
                                    isDisabled
                                />
                            </div>

                            <Textarea
                                label="Requirement"
                                value={journal.requirement}
                                isReadOnly
                                isDisabled
                                className="min-h-[100px]"
                            />

                            <Divider/>

                            {/* Editable fields */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Replace the old status Select with new status section */}
                                <div className="col-span-2">
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-semibold">Status</h3>
                                        <div className="flex gap-4">
                                            <Select
                                                label="Status"
                                                defaultSelectedKeys={[selectedStatus]}
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
                                </div>

                                <Input
                                    label="Journal Name"
                                    name="journal_name"
                                    defaultValue={journal.journal_name}
                                    isRequired
                                />
                                
                                <Input
                                    label="Journal Link"
                                    name="journal_link"
                                    defaultValue={journal.journal_link}
                                    isRequired
                                />

                                <Input
                                    label="Paper Title"
                                    name="paper_title"
                                    defaultValue={journal.paper_title}
                                    isRequired
                                />

                                <Input
                                    label="Journal Username"
                                    name="username"
                                    defaultValue={journal.username}
                                    isRequired
                                />

                                <Input
                                    label="Journal Password"
                                    name="password"
                                    defaultValue={journal.password}
                                    isRequired
                                />

                                <Input
                                    label="ORCID Username"
                                    name="orcid_username1"
                                    defaultValue={journal.orcid_username1}
                                    isRequired
                                />

                                <Input
                                    label="ORCID Password"
                                    name="password1"
                                    defaultValue={journal.password1}
                                    isRequired
                                />
                            </div>

                            <div className="flex justify-end gap-3">
                                <Button
                                    variant="flat"
                                    color="danger"
                                    onClick={() => router.push(`/editor/view/journal/${journal.id}`)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    color="primary"
                                    type="submit"
                                    isLoading={isSubmitting}
                                >
                                    Save Changes
                                </Button>
                            </div>
                        </form>
                    </CardBody>
                </Card>
            </div>
        </>
    );
}

// Main component wrapper that handles the Promise params
function JournalEditPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = React.use(params);
    
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <JournalEditContent id={resolvedParams.id} />
        </Suspense>
    );
}

export default withEditorAuth(JournalEditPage);
