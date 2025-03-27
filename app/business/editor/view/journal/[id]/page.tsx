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
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/react";
import { withEditorAuth } from "@/components/withEditorAuth";
import api, { JournalData } from "@/services/api";
import { toast } from "react-toastify";
import {
  ArrowLeftIcon,
  TrashIcon,
  PencilIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import { currentUserHasPermission, PERMISSIONS } from "@/utils/permissions";

function JournalContent({ id }: { id: string }) {
  const router = useRouter();
  const [journal, setJournal] = React.useState<JournalData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // Add permission state variables
  const [canEdit, setCanEdit] = React.useState(false);
  const [canDelete, setCanDelete] = React.useState(false);
  const [canUpdateScreenshot, setCanUpdateScreenshot] = React.useState(false);

  React.useEffect(() => {
    // Check permissions
    setCanEdit(currentUserHasPermission(PERMISSIONS.SHOW_EDIT_BUTTON_EDITOR));
    setCanDelete(currentUserHasPermission(PERMISSIONS.SHOW_DELETE_BUTTON_EDITOR));
    setCanUpdateScreenshot(currentUserHasPermission(PERMISSIONS.SHOW_UPDATE_SCREENSHOT_BUTTON));
    
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

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await api.deleteJournal(Number(id));
      toast.success("Journal deleted successfully");
      router.push("/business/editor/journals");
    } catch (error) {
      const errorMessage = api.handleError(error);
      toast.error(errorMessage.error || "Failed to delete journal");
    } finally {
      setIsDeleting(false);
      onClose();
    }
  };

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
        // Add a delay before refetching
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
        onClick={() => router.push("/business/editor/journals")}
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
            <div className="flex gap-3">
              {canEdit && (
                <Button
                  color="primary"
                  variant="flat"
                  startContent={<PencilIcon className="h-5 w-5" />}
                  onPress={() =>
                    router.push(`/business/editor/edit/journal/${journal.id}`)
                  }
                >
                  Edit Details
                </Button>
              )}
              {canDelete && (
                <Button
                  color="danger"
                  variant="flat"
                  startContent={<TrashIcon className="h-5 w-5" />}
                  onPress={onOpen}
                >
                  Delete
                </Button>
              )}
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
                <h3 className="text-sm text-gray-500">Applied By</h3>
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
              {/* <div>
                <h3 className="text-sm text-gray-500">Login Credentials</h3>
                <p className="font-medium">Username: {journal.username}</p>
                <p className="font-medium">Password: {journal.password}</p>
              </div> */}
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
        {canUpdateScreenshot && journal.journal_link && journal.username && journal.password ? (
          <Card className="w-full">
            <CardHeader className="flex justify-between items-center">
              <p className="text-md font-semibold">Journal Status Screenshot</p>
              {canUpdateScreenshot && journal.journal_link && journal.username && journal.password && (
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
              )}
            </CardHeader>
            <Divider />
            <CardBody>
              <div className="flex justify-center">
                {journal.status_link ? (
                  <div className="relative w-full h-[600px]">
                    <Image
                      src={`${journal.status_link}?t=${new Date().getTime()}`}
                      alt="Click on the refresh button to load the image"
                      fill
                      className="rounded-lg shadow-lg object-contain"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
                      priority
                    />
                  </div>
                ) : (
                  <div className="text-gray-500">No screenshot available</div>
                )}
              </div>
            </CardBody>
          </Card>
        ) : (
          <Card className="w-full">
            <CardBody>
              <div className="flex justify-center">
                <div className="text-gray-500">No screenshot available</div>
              </div>
            </CardBody>
          </Card>
        )}
        {/* Delete Confirmation Modal */}
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalContent>
            <ModalHeader>Confirm Delete</ModalHeader>
            <ModalBody>
              Are you sure you want to delete this journal? This action cannot
              be undone.
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose} isDisabled={isDeleting}>
                Cancel
              </Button>
              <Button
                color="danger"
                onPress={handleDelete}
                isLoading={isDeleting}
              >
                Delete
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
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

export default withEditorAuth(JournalViewPage);
