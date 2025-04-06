"use client";
import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardBody,
  CardHeader,
  Spinner,
  Button,
  Chip,
  Divider,
  Tooltip,
  Accordion,
  AccordionItem
} from "@heroui/react";
import { withEditorAuth } from "@/components/withEditorAuth";
import api, { JournalData } from "@/services/api";
import { toast } from "react-toastify";
import {
  ArrowLeftIcon,
  EyeIcon,
  DocumentTextIcon,
  ClockIcon,
  ArrowPathIcon,
  PencilIcon,
  TrashIcon,
  ArrowDownTrayIcon
} from "@heroicons/react/24/outline";
import { formatDistanceToNow } from "date-fns";
import { currentUserHasPermission, PERMISSIONS } from "@/utils/permissions";
import Image from "next/image";

function JournalByEmailContent({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [journals, setJournals] = useState<JournalData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [canEdit, setCanEdit] = useState(false);
  const [canUpdateScreenshot, setCanUpdateScreenshot] = useState(false);
  const [refreshingJournals, setRefreshingJournals] = useState<Record<number, boolean>>({});
  
  // Decode the email from URL parameter
  const email = decodeURIComponent(id);

  useEffect(() => {
    // Check permissions
    setCanEdit(currentUserHasPermission(PERMISSIONS.SHOW_EDIT_BUTTON_EDITOR));
    setCanUpdateScreenshot(currentUserHasPermission(PERMISSIONS.SHOW_UPDATE_SCREENSHOT_BUTTON));
    
    const fetchJournalsByEmail = async () => {
      try {
        setIsLoading(true);
        
        // Get current user
        const user = api.getStoredUser();
        if (!user?.id) {
          throw new Error("User ID not found");
        }
        
        // First get all journals by executive
        const response = await api.getJournalDataByExecutive(user.id);
        
        if (response.success) {
          // Filter journals by the specified email
          const emailJournals = response.data.filter(
            (journal: JournalData) => journal.personal_email === email
          );
          setJournals(emailJournals);
        } else {
          toast.error("Failed to load journals for this email");
        }
      } catch (error) {
        const errorMessage = api.handleError(error);
        toast.error(errorMessage.error || "Failed to load journals");
      } finally {
        setIsLoading(false);
      }
    };

    if (email) {
      fetchJournalsByEmail();
    }
  }, [email]);

  // Handle back navigation - go back to journals with the email tab selected
  const handleBack = () => {
    router.push("/business/executive/journals/byEmail");
  };

  // Navigate to the full journal view
  const handleViewJournal = (journalId: number) => {
    router.push(`/business/executive/view/journal/${journalId}`);
  };

  // Edit a journal
  const handleEditJournal = (journalId: number) => {
    router.push(`/business/executive/edit/journal/${journalId}`);
  };

  // Refresh status screenshot for a journal
  const handleRefreshStatus = async (journal: JournalData) => {
    if (!journal) return;

    // Update refreshing state for this specific journal
    setRefreshingJournals(prev => ({ ...prev, [journal.id]: true }));
    
    const toastId = toast.loading(
      "Starting status update. This may take a few minutes...",
      { autoClose: false }
    );

    try {
      const response = await api.triggerStatusUpload(journal.id);

      toast.dismiss(toastId);

      if (response.success && response.data.success) {
        toast.success("Status screenshot updated successfully");
        // Add a delay before refetching
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // Fetch updated journal data
        const journalResponse = await api.getJournalById(journal.id);
        if (journalResponse.success) {
          // Update this specific journal in the journals array
          setJournals(prev => 
            prev.map(j => j.id === journal.id ? journalResponse.data : j)
          );
        }
      } else {
        toast.error("Failed to update status screenshot");
      }
    } catch (error: any) {
      console.error("Error triggering status upload:", error);
      toast.dismiss(toastId);

      if (
        error.message.includes("background") ||
        error.message.includes("taking longer")
      ) {
        toast.info(
          error.message ||
            "The screenshot is being generated in the background. Please refresh in a few minutes."
        );
      } else {
        toast.error(error.message || "Failed to update status screenshot");
      }
    } finally {
      setRefreshingJournals(prev => ({ ...prev, [journal.id]: false }));
    }
  };

  // Add download screenshot function
  const handleDownloadScreenshot = (screenshotUrl: string, journalName: string) => {
    if (!screenshotUrl || screenshotUrl === 'https://dummyimage.com/16:9x1080/') {
      toast.error("No screenshot available to download");
      return;
    }
    
    // Create an anchor element to trigger download
    const a = document.createElement('a');
    a.href = screenshotUrl;
    a.download = `${journalName.replace(/\s+/g, '-').toLowerCase()}-screenshot.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Get status color based on journal status
  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "success";
      case "rejected":
        return "danger";
      case "under review":
        return "warning";
      default:
        return "default";
    }
  };

  // Format date for better readability
  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return "Invalid date";
    }
  };

  return (
    <>
      {/* Back button (top) */}
      <Button
        isIconOnly
        variant="light"
        className="fixed top-4 left-4 z-50"
        onClick={handleBack}
      >
        <ArrowLeftIcon className="h-5 w-5" />
      </Button>

      <div className="w-full p-6 space-y-6">
        <Card className="w-full">
          <CardHeader className="flex justify-between items-center px-6 py-4">
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold">Journals for Email</h1>
              <p className="text-small text-default-500">{email}</p>
            </div>
            <Chip size="lg" color="primary">{journals.length} Journals</Chip>
          </CardHeader>
        </Card>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner size="lg" />
          </div>
        ) : journals.length === 0 ? (
          <Card>
            <CardBody className="text-center py-10">
              <p className="text-gray-500">No journals found for this email</p>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-10">
            {journals.map(journal => (
              <Card key={journal.id} className="w-full">
                <CardHeader className="flex justify-between items-center px-6 py-4 bg-default-50">
                  <div className="flex items-center gap-2">
                    <DocumentTextIcon className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold">{journal.journal_name}</h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <Chip color={getStatusColor(journal.status)}>{journal.status}</Chip>
                    <div className="flex gap-2">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        color="primary"
                        onClick={() => handleViewJournal(journal.id)}
                      >
                        <EyeIcon className="h-4 w-4" />
                      </Button>
                      {canEdit && (
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onClick={() => handleEditJournal(journal.id)}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <Divider />
                
                <CardBody className="p-4">
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
                          <p className="font-medium">{journal.prospectus?.reg_id || "-"}</p>
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
                          <h3 className="text-sm text-gray-500">Applied By</h3>
                          <p className="font-medium">{journal.entities?.username || "-"}</p>
                        </div>
                        <div>
                          <h3 className="text-sm text-gray-500">Created</h3>
                          <div className="flex items-center gap-1">
                            <ClockIcon className="h-4 w-4 text-gray-400" />
                            <span>{formatDate(journal.created_at)}</span>
                          </div>
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
                        <div>
                          <h3 className="text-sm text-gray-500">Journal Name</h3>
                          <p className="font-medium">{journal.journal_name}</p>
                        </div>
                        <div>
                          <h3 className="text-sm text-gray-500">Paper Title</h3>
                          <p className="font-medium">{journal.paper_title}</p>
                        </div>
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
                      </CardBody>
                    </Card>
                  </div>

                  {/* Requirements Section */}
                  <Card className="w-full mt-6">
                    <CardHeader>
                      <p className="text-md font-semibold">Requirements</p>
                    </CardHeader>
                    <Divider />
                    <CardBody>
                      <p className="whitespace-pre-wrap">{journal.requirement}</p>
                    </CardBody>
                  </Card>

                  {/* Journal Screenshot Section */}
                  {canUpdateScreenshot && journal.journal_link && journal.username && journal.password && (
                    <Card className="w-full mt-6">
                      <CardHeader className="flex justify-between items-center">
                        <p className="text-md font-semibold">Journal Status Screenshot</p>
                        <div className="flex items-center gap-2">
                          {/* Download button */}
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onClick={() => handleDownloadScreenshot(
                                journal.status_link || '', 
                                `${journal.journal_name}-${journal.id}`
                            )}
                            isDisabled={!journal.status_link || journal.status_link === 'https://dummyimage.com/16:9x1080/'}
                          >
                            <ArrowDownTrayIcon className="h-5 w-5" />
                          </Button>
                          {/* Refresh button */}
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onClick={() => handleRefreshStatus(journal)}
                            isLoading={refreshingJournals[journal.id]}
                          >
                            <ArrowPathIcon
                              className={`h-5 w-5 ${refreshingJournals[journal.id] ? "animate-spin" : ""}`}
                            />
                          </Button>
                        </div>
                      </CardHeader>
                      <Divider />
                      <CardBody>
                        <div className="flex justify-center">
                          {journal.status_link && journal.status_link !== 'https://dummyimage.com/16:9x1080/' ? (
                            <div className="relative w-full h-[400px]">
                              <Image
                                src={`${journal.status_link}?t=${new Date().getTime()}`}
                                alt="Journal status screenshot"
                                fill
                                className="rounded-lg shadow-lg object-contain"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
                              />
                            </div>
                          ) : (
                            <div className="text-gray-500 p-4">No screenshot available. Click refresh to generate one.</div>
                          )}
                        </div>
                      </CardBody>
                    </Card>
                  )}
                </CardBody>
              </Card>
            ))}

            {/* Add back button at the bottom for easier navigation */}
            <div className="flex justify-center mt-8">
              <Button
                color="primary"
                variant="flat"
                startContent={<ArrowLeftIcon className="h-5 w-5" />}
                onClick={handleBack}
              >
                Back to Email List
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

interface PageProps {
  params: Promise<{ id: string }>;
}

function JournalByEmailPage({ params }: PageProps) {
  const resolvedParams = React.use(params);

  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen"><Spinner size="lg" /></div>}>
      <JournalByEmailContent id={resolvedParams.id} />
    </Suspense>
  );
}

export default withEditorAuth(JournalByEmailPage);
