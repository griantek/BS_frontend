"use client";
import React, { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardBody, Button, Divider, Chip, Spinner } from "@nextui-org/react";
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import api from '@/services/api';
import { withEditorAuth } from '@/components/withEditorAuth';
import type { AssignedRegistration } from '@/services/api';
import { PageLoadingSpinner, LoadingSpinner } from "@/components/LoadingSpinner";

function AssignedViewContent({ regId }: { regId: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(true);
  const [registration, setRegistration] = React.useState<AssignedRegistration | null>(null);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Use the correct endpoint for assigned registrations
        const user = api.getStoredUser();
        if (!user?.id) return;
        
        const response = await api.getAssignedRegistrations(user.id);
        const assignedReg = response.data.find(reg => reg.id === parseInt(regId));
        
        if (!assignedReg) {
          throw new Error('Registration not found');
        }
        
        setRegistration(assignedReg);
      } catch (error) {
        console.error('Error fetching registration:', error);
        router.push('/business/editor/assigned');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [regId, router]);

  if (isLoading) return <LoadingSpinner text="Loading registration details..." />;
  if (!registration) return <div>No data found</div>;

  const formatDate = (date: string) => format(new Date(date), 'dd/MM/yyyy');

  return (
    <>
      <Button
        isIconOnly
        variant="light"
        className="fixed top-4 left-4 z-50"
        onClick={() => router.push('/business/editor/assigned')}
      >
        <ArrowLeftIcon className="h-5 w-5" />
      </Button>

      <div className="w-full p-6 space-y-6">
        {/* Header with status and actions */}
        <Card className="w-full">
          <CardHeader className="flex justify-between items-center px-6 py-4">
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold">Registration Details</h1>
              <p className="text-small text-default-500">ID: {registration.prospectus.reg_id}</p>
            </div>
            <div className="flex gap-3">
              <Button
                color="primary"
                variant="solid"
                onPress={() => router.push(`/business/editor/add/journal/${registration.id}`)}
              >
                Add Journal Details
              </Button>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Client Details */}
          <Card className="w-full">
            <CardHeader>
              <h2 className="text-xl font-bold">Client Information</h2>
            </CardHeader>
            <Divider />
            <CardBody className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <InfoField label="Client Name" value={registration.prospectus.client_name} />
                <InfoField label="Email" value={registration.prospectus.email} />
                <InfoField label="Registration ID" value={registration.prospectus.reg_id} />
                <InfoField label="Status">
                  <Chip
                    color={registration.status === 'registered' ? 'success' : 'warning'}
                    variant="flat"
                  >
                    {registration.status}
                  </Chip>
                </InfoField>
              </div>
            </CardBody>
          </Card>

          {/* Registration Details */}
          <Card className="w-full">
            <CardHeader>
              <h2 className="text-xl font-bold">Registration Details</h2>
            </CardHeader>
            <Divider />
            <CardBody className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <InfoField label="Registration Date" value={formatDate(registration.date)} />
                <InfoField label="Services" value={registration.services} />
                <InfoField label="Accept Period" value={registration.accept_period} />
                <InfoField label="Publication Period" value={registration.pub_period} />
                <InfoField label="Month/Year" value={`${registration.month}/${registration.year}`} />
              </div>
            </CardBody>
          </Card>

          {/* Financial Information */}
          <Card className="w-full md:col-span-2">
            <CardHeader>
              <h2 className="text-xl font-bold">Financial Overview</h2>
            </CardHeader>
            <Divider />
            <CardBody className="space-y-8">
              {/* Payment Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
                  <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                  <p className="text-2xl font-bold">₹{registration.total_amount.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-1">Inclusive of all charges</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
                  <p className="text-sm text-gray-600 mb-1">Initial Amount</p>
                  <p className="text-2xl font-bold">₹{registration.init_amount.toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
                  <p className="text-sm text-gray-600 mb-1">Acceptance Amount</p>
                  <p className="text-2xl font-bold">₹{registration.accept_amount.toLocaleString()}</p>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Requirements Section */}
          <Card className="w-full md:col-span-2">
            <CardHeader>
              <h2 className="text-xl font-bold">Requirements</h2>
            </CardHeader>
            <Divider />
            <CardBody>
              <p className="whitespace-pre-wrap">{registration.prospectus.requirement}</p>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}

// Helper component for displaying info fields
const InfoField = ({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) => (
  <div className="space-y-1">
    <p className="text-sm text-gray-600">{label}</p>
    {children || <p className="font-medium">{value}</p>}
  </div>
);

interface PageProps {
  params: Promise<{ id: string }>;
}

function AssignedViewPage({ params }: PageProps) {
  const resolvedParams = React.use(params);

  return (
    <Suspense fallback={<PageLoadingSpinner text="Loading registration details..." />}>
      <AssignedViewContent regId={resolvedParams.id} />
    </Suspense>
  );
}

// Wrap with HOC outside the component definition
export default withEditorAuth(AssignedViewPage);