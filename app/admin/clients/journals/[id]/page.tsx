"use client";
import React, { Suspense } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardBody,
  CardHeader,
  Chip,
  Spinner,
  Button,
  Divider,
} from "@heroui/react";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import api, { JournalData } from "@/services/api";
import { WithAdminAuth } from "@/components/withAdminAuth";
import { toast } from "react-toastify";
import Image from "next/image";

function JournalContent({ id }: { id: string }) {
  const router = useRouter();
  const [journal, setJournal] = React.useState<JournalData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const isMounted = React.useRef(true);

  React.useEffect(() => {
    // Mark component as mounted
    isMounted.current = true;

    const fetchJournal = async () => {
      try {
        setIsLoading(true);
        const response = await api.getJournalById(Number(id));
        
        // Check if component is still mounted before updating state
        if (!isMounted.current) return;
        
        if (response.success) {
          setJournal(response.data);
        } else {
          toast.error("Failed to load journal details");
        }
      } catch (error) {
        // Check if component is still mounted before updating state
        if (!isMounted.current) return;
        
        const errorMessage = api.handleError(error);
        toast.error(errorMessage.error || "Failed to load journal");
      } finally {
        // Final check for mounted state
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    };

    if (id) {
      fetchJournal();
    }
    
    // Clean up function to prevent state updates after unmount
    return () => {
      isMounted.current = false;
    };
  }, [id]);

  // Handle back button with history navigation to avoid redirect loops
  const handleBack = () => {
    try {
      router.back();
    } catch (e) {
      // Fallback if router.back() fails
      router.push('/admin/clients/journals');
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
    return (
      <div className="flex flex-col justify-center items-center h-[400px]">
        <p>Journal not found</p>
        <Button 
          className="mt-4"
          onClick={() => router.push('/admin/clients/journals')}
        >
          Return to Journals
        </Button>
      </div>
    );
  }

  // Helper component for displaying info fields
  const InfoField = ({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) => (
    <div className="space-y-1">
      <p className="text-sm text-gray-600">{label}</p>
      {children || <p className="font-medium">{value}</p>}
    </div>
  );

  return (
    <>
      {/* Back button */}
      <Button
        isIconOnly
        variant="light"
        className="fixed top-4 left-4 z-50"
        onPress={handleBack}
      >
        <ArrowLeftIcon className="h-5 w-5" />
      </Button>

      <div className="w-full p-6 space-y-6">
        {/* Header */}
        <Card className="w-full">
          <CardHeader className="flex justify-between items-center px-6 py-4">
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold">Journal Details</h1>
              <div className="text-small text-default-500 space-y-1">
                <p>ID: {journal.id}</p>
                <p>Prospectus ID: {journal.prospectus_id}</p>
                <p>REG ID: {journal.prospectus.reg_id}</p>
              </div>
            </div>
            <Chip
              color={
                journal.status === "approved"
                  ? "success"
                  : journal.status === "rejected"
                    ? "danger"
                    : journal.status === "under review"
                      ? "warning"
                      : "default"
              }
            >
              {journal.status}
            </Chip>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card className="w-full">
            <CardHeader>
              <p className="text-md font-semibold">Client Information</p>
            </CardHeader>
            <Divider />
            <CardBody className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <InfoField label="Client Name" value={journal.client_name} />
                <InfoField label="Email" value={journal.personal_email} />
                <InfoField label="Registration ID" value={journal.prospectus.reg_id} />
                <InfoField label="Executive" value={journal.entities.username} />
              </div>
            </CardBody>
          </Card>

          {/* Journal Information */}
          <Card className="w-full">
            <CardHeader>
              <p className="text-md font-semibold">Journal Information</p>
            </CardHeader>
            <Divider />
            <CardBody className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <InfoField label="Journal Name" value={journal.journal_name} />
                <InfoField label="Paper Title" value={journal.paper_title} />
                <InfoField label="Journal Link">
                  <a
                    href={journal.journal_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Visit Journal
                  </a>
                </InfoField>
                <InfoField label="Assigned Editor" value={journal.assigned_to} />
              </div>
            </CardBody>
          </Card>

          {/* Credentials */}
          <Card className="w-full md:col-span-2">
            <CardHeader>
              <p className="text-md font-semibold">Login Credentials</p>
            </CardHeader>
            <Divider />
            <CardBody>
              <div className="grid grid-cols-2 gap-4">
                <InfoField label="Username" value={journal.username} />
                <InfoField label="Password" value={journal.password} />
                <InfoField label="ORCID Username" value={journal.orcid_username1} />
                <InfoField label="ORCID Password" value={journal.password1} />
              </div>
            </CardBody>
          </Card>

          {/* Requirements */}
          <Card className="w-full md:col-span-2">
            <CardHeader>
              <p className="text-md font-semibold">Requirements</p>
            </CardHeader>
            <Divider />
            <CardBody>
              <p className="whitespace-pre-wrap">{journal.requirement}</p>
            </CardBody>
          </Card>

          {/* Status Screenshot */}
          {journal.status_link && (
            <Card className="w-full md:col-span-2">
              <CardHeader>
                <p className="text-md font-semibold">Journal Status Screenshot</p>
              </CardHeader>
              <Divider />
              <CardBody>
                <div className="flex justify-center">
                  <div className="relative w-full h-[600px]">
                    <Image
                      src={journal.status_link}
                      alt="Journal status screenshot"
                      fill
                      className="rounded-lg shadow-lg object-contain"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
                    />
                  </div>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

interface PageProps {
  params: Promise<{ id: string }>;
}

function JournalViewPage({ params }: PageProps) {
  const resolvedParams = React.use(params);
  
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-[400px]"><Spinner size="lg" /></div>}>
      <JournalContent id={resolvedParams.id} />
    </Suspense>
  );
}

export default WithAdminAuth(JournalViewPage);
