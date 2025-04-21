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
  Tooltip,
  Input,
} from "@heroui/react";
import { withExecutiveAuth } from "@/components/withExecutiveAuth";
import api, { JournalData } from "@/services/api";
import { toast } from "react-toastify";
import { 
  ArrowLeftIcon,
  EyeIcon,
  EyeSlashIcon,
  ClipboardIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon, // Added for refresh functionality
} from "@heroicons/react/24/outline";
import Image from "next/image";

function JournalContent({ id }: { id: string }) {
  const router = useRouter();
  const [journal, setJournal] = React.useState<JournalData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showOrcidPassword, setShowOrcidPassword] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false); // Added for refresh functionality

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

  // Added refresh functionality from editor view
  const handleRefreshStatus = async () => {
    if (!journal) return;

    setIsRefreshing(true);
    const toastId = toast.loading(
      "Starting status update. This may take a few minutes...",
      {
        autoClose: false,
      }
    );

    try {
      const response = await api.triggerStatusUpload(journal.id);

      toast.dismiss(toastId);

      if (response.success && response.data.success) {
        toast.success("Status screenshot updated successfully");
        await new Promise((resolve) => setTimeout(resolve, 3000));

        const journalResponse = await api.getJournalById(Number(id));
        if (journalResponse.success) {
          setJournal(journalResponse.data);
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
      setIsRefreshing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const handleDownloadScreenshot = () => {
    if (!journal?.status_link || journal.status_link === "https://dummyimage.com/16:9x1080/") {
      toast.error("No screenshot available to download");
      return;
    }

    const a = document.createElement("a");
    a.href = journal.status_link;
    a.download = `${journal.journal_name.replace(/\s+/g, "-").toLowerCase()}-screenshot.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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
  
  const getStatusColor = (status: string) => {
    const lowerStatus = status.toLowerCase();
    if (
      lowerStatus.includes("submit") ||
      lowerStatus === "pending" ||
      lowerStatus === "draft" ||
      lowerStatus === "hold"
    )
      return "primary";
    if (
      lowerStatus.includes("review") ||
      lowerStatus.includes("consider") ||
      lowerStatus.includes("editor") ||
      lowerStatus.includes("revision") ||
      lowerStatus.includes("need")
    )
      return "warning";
    if (lowerStatus.includes("approve") || lowerStatus.includes("success")) return "success";
    if (
      lowerStatus.includes("reject") ||
      lowerStatus.includes("decline") ||
      lowerStatus.includes("denied") ||
      lowerStatus.includes("withdrawn") ||
      lowerStatus.includes("removed")
    )
      return "danger";
    return "default";
  };

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

        {/* Status Card */}
        <Card className="w-full">
          <CardHeader>
            <h2 className="text-lg font-bold">Status</h2>
          </CardHeader>
          <Divider />
          <CardBody>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Current Status:</span>
              <Chip color={getStatusColor(journal.status)} size="md">
                {journal.status}
              </Chip>
            </div>
          </CardBody>
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
                <div className="flex items-center gap-2">
                  <p className="font-medium">{journal.personal_email}</p>
                  <Button 
                    isIconOnly 
                    size="sm" 
                    variant="light" 
                    onClick={() => copyToClipboard(journal.personal_email)}
                  >
                    <ClipboardIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div>
                <h3 className="text-sm text-gray-500">Assigned Editor</h3>
                <p className="font-medium">{journal.entities.username}</p>
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
              {/* <div>
                <h3 className="text-sm text-gray-500">Journal Link</h3>
                <div className="flex items-center gap-2">
                  <a
                    href={journal.journal_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Visit Journal
                  </a>
                  <Button 
                    isIconOnly 
                    size="sm" 
                    variant="light" 
                    onClick={() => copyToClipboard(journal.journal_link)}
                  >
                    <ClipboardIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div> */}
            </CardBody>
          </Card>

          {/* Journal Credentials Card */}
          {/* <Card className="w-full">
            <CardHeader>
              <p className="text-md font-semibold">Journal Credentials</p>
            </CardHeader>
            <Divider />
            <CardBody className="space-y-4">
              {journal.username ? (
                <>
                  <div>
                    <h3 className="text-sm text-gray-500">Username</h3>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{journal.username}</p>
                      <Button 
                        isIconOnly 
                        size="sm" 
                        variant="light" 
                        onClick={() => copyToClipboard(journal.username)}
                      >
                        <ClipboardIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm text-gray-500">Password</h3>
                    <div className="flex items-center gap-2">
                      <Input
                        value={journal.password}
                        type={showPassword ? "text" : "password"}
                        readOnly
                        className="max-w-xs"
                        endContent={
                          <button type="button" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? (
                              <EyeSlashIcon className="h-4 w-4 text-default-400" />
                            ) : (
                              <EyeIcon className="h-4 w-4 text-default-400" />
                            )}
                          </button>
                        }
                      />
                      <Button 
                        isIconOnly 
                        size="sm" 
                        variant="light" 
                        onClick={() => copyToClipboard(journal.password)}
                      >
                        <ClipboardIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-default-400">No journal credentials available</p>
              )}
            </CardBody>
          </Card> */}

          {/* ORCID Credentials Card */}
          {/* <Card className="w-full">
            <CardHeader>
              <p className="text-md font-semibold">ORCID Credentials</p>
            </CardHeader>
            <Divider />
            <CardBody className="space-y-4">
              {journal.orcid_username1 ? (
                <>
                  <div>
                    <h3 className="text-sm text-gray-500">ORCID Username</h3>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{journal.orcid_username1}</p>
                      <Button 
                        isIconOnly 
                        size="sm" 
                        variant="light" 
                        onClick={() => copyToClipboard(journal.orcid_username1)}
                      >
                        <ClipboardIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm text-gray-500">ORCID Password</h3>
                    <div className="flex items-center gap-2">
                      <Input
                        value={journal.password1 || ''}
                        type={showOrcidPassword ? "text" : "password"}
                        readOnly
                        className="max-w-xs"
                        endContent={
                          <button type="button" onClick={() => setShowOrcidPassword(!showOrcidPassword)}>
                            {showOrcidPassword ? (
                              <EyeSlashIcon className="h-4 w-4 text-default-400" />
                            ) : (
                              <EyeIcon className="h-4 w-4 text-default-400" />
                            )}
                          </button>
                        }
                      />
                      <Button 
                        isIconOnly 
                        size="sm" 
                        variant="light" 
                        onClick={() => copyToClipboard(journal.password1 || '')}
                      >
                        <ClipboardIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-default-400">No ORCID credentials available</p>
              )}
            </CardBody>
          </Card> */}

          {/* Requirements Section */}
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

        {/* Journal Screenshot Section - Modified to include refresh button */}
        {journal.status_link && (
          <Card className="w-full">
            <CardHeader className="flex justify-between items-center">
              <p className="text-md font-semibold">Journal Status Screenshot</p>
              <div className="flex items-center gap-2">
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  onPress={handleDownloadScreenshot}
                  isDisabled={!journal.status_link || journal.status_link === "https://dummyimage.com/16:9x1080/"}
                >
                  <ArrowDownTrayIcon className="h-5 w-5" />
                </Button>
                {/* Added refresh button */}
                {journal.journal_link && journal.username && journal.password && (
                  <Tooltip content="Refresh screenshot">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={handleRefreshStatus}
                      isLoading={isRefreshing}
                    >
                      <ArrowPathIcon
                        className={`h-5 w-5 ${isRefreshing ? "animate-spin" : ""}`}
                      />
                    </Button>
                  </Tooltip>
                )}
              </div>
            </CardHeader>
            <Divider />
            <CardBody>
              <div className="flex justify-center">
                {journal.status_link !== "https://dummyimage.com/16:9x1080/" ? (
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
                ) : (
                  <div className="text-center py-12">
                    <div className="text-gray-500 mb-4">No screenshot available</div>
                    {/* Added Generate Screenshot button when no screenshot is present */}
                    {journal.journal_link && journal.username && journal.password && (
                      <Button
                        color="primary"
                        variant="flat"
                        startContent={<ArrowPathIcon className="h-5 w-5" />}
                        onPress={handleRefreshStatus}
                        isLoading={isRefreshing}
                      >
                        Generate Screenshot
                      </Button>
                    )}
                  </div>
                )}
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
