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
import { withExecutiveAuth } from "@/components/withExecutiveAuth";
import api, { JournalData } from "@/services/api";
import { toast } from "react-toastify";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Image from "next/image";

function JournalContent({ id }: { id: string }) {
  const router = useRouter();
  const [journal, setJournal] = React.useState<JournalData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchJournal = async () => {
      try {
        const response = await api.getJournalById(Number(id));
        if (response.success) {
          setJournal(response.data);
        }
      } catch (error) {
        const errorMessage = api.handleError(error);
        toast.error(errorMessage.error || "Failed to load journal");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchJournal();
    }
  }, [id]);

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
      {/* Back button */}
      <Button
        isIconOnly
        variant="light"
        className="fixed top-4 left-4 z-50"
        onClick={() => router.push("/business/executive/journals")}
      >
        <ArrowLeftIcon className="h-5 w-5" />
      </Button>

      <div className="w-full p-6 space-y-6">
        {/* Header with actions */}
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
              <div>
                <h3 className="text-sm text-gray-500">Registration ID</h3>
                <p className="font-medium">{journal.prospectus.reg_id}</p>
              </div>
              <div>
                <h3 className="text-sm text-gray-500">Client Name</h3>
                <p className="font-medium">{journal.client_name}</p>
              </div>
              <div>
                <h3 className="text-sm text-gray-500">Email</h3>
                <p className="font-medium">{journal.personal_email}</p>
              </div>
              <div>
                <h3 className="text-sm text-gray-500">Assigned Editor</h3>
                <p className="font-medium">{journal.entities.username}</p>
              </div>
            </CardBody>
          </Card>

          {/* Journal Information */}
          <Card className="w-full">
            <CardHeader className="flex justify-between items-center">
              <p className="text-md font-semibold">Journal Information</p>
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
            <Divider />
            <CardBody className="space-y-4">
              <div>
                <h3 className="text-sm text-gray-500">Journal Name</h3>
                <p className="font-medium">{journal.journal_name}</p>
              </div>
              <div>
                <h3 className="text-sm text-gray-500">Paper Title</h3>
                <p className="font-medium">{journal.paper_title}</p>
              </div>
              {journal.journal_link && (
                <div>
                  <h3 className="text-sm text-gray-500">Journal Link</h3>
                  <a
                    href={journal.journal_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Visit Journal
                  </a>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Requirements Section - Full Width */}
          <Card className="w-full md:col-span-2">
            <CardHeader>
              <p className="text-md font-semibold">Requirements & Details</p>
            </CardHeader>
            <Divider />
            <CardBody>
              <h3 className="text-sm text-gray-500 mb-2">Requirement</h3>
              <p className="whitespace-pre-wrap">{journal.requirement}</p>
            </CardBody>
          </Card>
        </div>

        {/* Journal Screenshot Section */}
        {journal.journal_link &&  journal.status_link && (
          <Card className="w-full">
            <CardHeader>
              <p className="text-md font-semibold">Journal Status Screenshot</p>
            </CardHeader>
            <Divider />
            <CardBody>
              <div className="flex justify-center">
                <div className="relative w-full h-[600px]">
                  <Image
                    src={`${journal.status_link}?t=${new Date().getTime()}`}
                    alt="Journal status screenshot"
                    fill
                    className="rounded-lg shadow-lg object-contain"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
                    priority
                  />
                </div>
              </div>
            </CardBody>
          </Card>
        )}
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
    <Suspense fallback={<div>Loading...</div>}>
      <JournalContent id={resolvedParams.id} />
    </Suspense>
  );
}

export default withExecutiveAuth(JournalViewPage);
