'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody, CardHeader, Divider, Button, Input, Spinner, Chip, Textarea, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Progress, Tooltip } from "@nextui-org/react";
import { withClientAuth } from '@/components/withClientAuth';
import { Sidebar } from '@/components/sidebar';
import { 
  CloudArrowUpIcon, 
  ClipboardDocumentListIcon, 
  ArrowLeftIcon,
  ChevronDownIcon,
  ExclamationCircleIcon,
  CalendarIcon,
  DocumentTextIcon,
  ClockIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import api, { Registration } from "@/services/api";
import { motion } from "framer-motion";

const JournalSubmissionsPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [filteredRegistrations, setFilteredRegistrations] = useState<Registration[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showNewSubmission, setShowNewSubmission] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [newSubmission, setNewSubmission] = useState({
    journalName: '',
    paperTitle: '',
    abstract: '',
    keywords: '',
    selectedJournal: 'Select Journal'
  });

  // Simulated journal options
  const journalOptions = [
    "IEEE Transactions on Neural Networks",
    "Nature Communications",
    "Journal of Artificial Intelligence Research",
    "Science Advances",
    "Cell Reports"
  ];

  useEffect(() => {
    const fetchRegistrations = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get current user from storage
        const user = api.getStoredUser();
        if (!user || !user.id) {
          throw new Error("User information not found");
        }

        // Fetch registered registrations using the real API endpoint
        const response = await api.getClientRegisteredRegistration(user.id);

        if (response.success) {
          setRegistrations(response.data);
          setFilteredRegistrations(response.data);
        } else {
          throw new Error("Failed to fetch registered submissions");
        }
      } catch (error: any) {
        console.error("Error fetching registrations:", error);
        setError(error.message || "Failed to load registered submissions");
      } finally {
        setLoading(false);
      }
    };

    fetchRegistrations();
  }, []);

  useEffect(() => {
    // Apply filters whenever status or search changes
    let result = registrations;

    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter((reg) => {
        // Match status either from status field or any custom status field you might have
        return reg.status === statusFilter;
      });
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (reg) =>
          reg.prospectus?.client_name?.toLowerCase().includes(query) ||
          reg.prospectus?.reg_id?.toLowerCase().includes(query) ||
          reg.services?.toLowerCase().includes(query) ||
          reg.prospectus?.requirement?.toLowerCase().includes(query)
      );
    }

    setFilteredRegistrations(result);
  }, [statusFilter, searchQuery, registrations]);

  const getStatusColor = (status: string = "pending") => {
    switch(status) {
      case 'registered':
      case 'completed':
      case 'published':
        return 'success';
      case 'in progress':
      case 'drafting': 
        return 'primary';
      case 'under review':
      case 'submitted':
        return 'secondary';
      case 'revisions required':
      case 'rejected':
        return 'danger';
      case 'waiting for approval':
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string = "pending") => {
    // Capitalize the words in the status
    return status
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getProgressFromStatus = (status: string = "pending") => {
    const statusMap: { [key: string]: number } = {
      "pending": 10,
      "waiting for approval": 25,
      "registered": 50,
      "in progress": 75,
      "completed": 100,
    };

    return statusMap[status] || 0;
  };

  const handleViewDetails = (registrationId: number) => {
    router.push(`/business/clients/journals/details/${registrationId}`);
  };

  const handleUpload = () => {
    setIsUploading(true);
    // Simulate upload process
    setTimeout(() => {
      setIsUploading(false);
      setShowNewSubmission(false);
      // In a real app, this would actually submit to the backend
      setNewSubmission({
        journalName: '',
        paperTitle: '',
        abstract: '',
        keywords: '',
        selectedJournal: 'Select Journal'
      });
    }, 2000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewSubmission(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner size="lg" color="secondary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="shadow-md">
          <CardBody className="p-6 text-center">
            <ExclamationCircleIcon className="h-12 w-12 text-danger mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Error Loading Submissions</h2>
            <p className="text-default-500 mb-4">{error}</p>
            <Button color="primary" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex ml-16">
      <Sidebar />
      <div className="flex-1 p-6 pl-[var(--sidebar-width,4rem)] transition-all duration-300">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Journal Submissions</h1>
            <p className="text-default-500">Manage your academic paper submissions</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="light"
              startContent={<ArrowLeftIcon className="h-4 w-4" />}
              onClick={() => router.push('/business/clients/journals')}
            >
              Back to Journals
            </Button>
            <Button 
              color="primary" 
              onClick={() => setShowNewSubmission(true)}
              startContent={<CloudArrowUpIcon className="h-4 w-4" />}
            >
              New Submission
            </Button>
          </div>
        </div>

        {showNewSubmission ? (
          <Card className="mb-6">
            <CardHeader className="flex justify-between">
              <h2 className="text-lg font-semibold">New Journal Submission</h2>
              <Button 
                variant="light" 
                color="danger" 
                size="sm"
                onClick={() => setShowNewSubmission(false)}
              >
                Cancel
              </Button>
            </CardHeader>
            <Divider />
            <CardBody className="space-y-4">
              <div className="flex flex-col gap-2">
                <Dropdown>
                  <DropdownTrigger>
                    <Button 
                      variant="bordered" 
                      endContent={<ChevronDownIcon className="h-4 w-4" />}
                      className="w-full justify-between"
                    >
                      {newSubmission.selectedJournal}
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu 
                    aria-label="Journal Selection"
                    onAction={(key) => setNewSubmission({
                      ...newSubmission, 
                      selectedJournal: key.toString()
                    })}
                  >
                    {journalOptions.map((journal) => (
                      <DropdownItem key={journal}>{journal}</DropdownItem>
                    ))}
                  </DropdownMenu>
                </Dropdown>
                
                {newSubmission.selectedJournal === 'Select Journal' && (
                  <Input
                    label="Journal Name"
                    placeholder="Enter journal name if not in the list"
                    name="journalName"
                    value={newSubmission.journalName}
                    onChange={handleInputChange}
                  />
                )}
              </div>
              
              <Input
                label="Paper Title"
                placeholder="Enter the title of your paper"
                name="paperTitle"
                value={newSubmission.paperTitle}
                onChange={handleInputChange}
                isRequired
              />
              
              <Textarea
                label="Abstract"
                placeholder="Enter your paper abstract"
                name="abstract"
                value={newSubmission.abstract}
                onChange={handleInputChange}
                minRows={3}
                isRequired
              />
              
              <Input
                label="Keywords"
                placeholder="Enter keywords separated by commas"
                name="keywords"
                value={newSubmission.keywords}
                onChange={handleInputChange}
              />
              
              <div className="border border-dashed border-default-300 rounded-lg p-6 text-center">
                <CloudArrowUpIcon className="w-10 h-10 mx-auto text-default-400 mb-2" />
                <p className="text-default-600 mb-2">Drag &amp; drop your paper file here</p>
                <p className="text-xs text-default-400 mb-4">Supported formats: PDF, DOCX (max 20MB)</p>
                <Button color="primary" variant="flat">
                  Browse Files
                </Button>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  variant="flat" 
                  onClick={() => setShowNewSubmission(false)}
                >
                  Cancel
                </Button>
                <Button 
                  color="primary" 
                  onClick={handleUpload}
                  isLoading={isUploading}
                  spinner={<Spinner size="sm" />}
                  isDisabled={!newSubmission.paperTitle}
                >
                  {isUploading ? "Uploading..." : "Submit Paper"}
                </Button>
              </div>
            </CardBody>
          </Card>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="mb-6 shadow-md">
              <CardHeader className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center border-b">
                <h2 className="text-xl font-bold text-secondary">
                  Your Registered Submissions
                </h2>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    classNames={{
                      base: "max-w-full sm:max-w-[14rem]",
                      inputWrapper: "h-9",
                    }}
                    placeholder="Search submissions..."
                    startContent={
                      <MagnifyingGlassIcon className="h-4 w-4 text-default-400" />
                    }
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Dropdown>
                    <DropdownTrigger>
                      <Button
                        variant="flat"
                        endContent={<ChevronDownIcon className="h-4 w-4" />}
                      >
                        Status:{" "}
                        {statusFilter === "all"
                          ? "All"
                          : getStatusLabel(statusFilter)}
                      </Button>
                    </DropdownTrigger>
                    <DropdownMenu
                      aria-label="Filter by status"
                      onAction={(key) => setStatusFilter(key as string)}
                      selectedKeys={[statusFilter]}
                      selectionMode="single"
                    >
                      <DropdownItem key="all">All</DropdownItem>
                      <DropdownItem key="pending">Pending</DropdownItem>
                      <DropdownItem key="waiting for approval">Waiting For Approval</DropdownItem>
                      <DropdownItem key="registered">Registered</DropdownItem>
                      <DropdownItem key="in progress">In Progress</DropdownItem>
                      <DropdownItem key="completed">Completed</DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                </div>
              </CardHeader>
              <CardBody>
                {filteredRegistrations.length > 0 ? (
                  <div className="space-y-5">
                    {filteredRegistrations.map((registration) => {
                      // Get current status
                      const currentStatus = registration.status;
                      // Calculate progress percentage
                      const progressPercentage = getProgressFromStatus(currentStatus);
                      
                      // Calculate days since creation
                      const daysSinceCreated = Math.floor(
                        (new Date().getTime() - new Date(registration.created_at).getTime()) /
                          (1000 * 3600 * 24)
                      );

                      return (
                        <Card
                          key={registration.id}
                          className={`border-l-4 border-l-primary hover:shadow-lg transition-all duration-200`}
                        >
                          <CardBody className="p-5">
                            <div className="flex flex-col md:flex-row gap-6">
                              <div className="flex-grow">
                                {/* Client and Status Header */}
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3">
                                  <div>
                                    <h3 className="text-lg font-semibold text-primary-800 flex items-center gap-2">
                                      {registration.prospectus?.client_name}
                                    </h3>
                                    <div className="text-sm text-default-500 flex items-center mt-1">
                                      <span className="font-medium">ID:</span>{" "}
                                      {registration.prospectus?.reg_id} •
                                      <span>
                                        {` ${daysSinceCreated} days since registration`}
                                      </span>
                                    </div>
                                  </div>
                                  <Chip
                                    color={getStatusColor(currentStatus)}
                                    variant="flat"
                                    size="sm"
                                    className="self-start sm:self-auto"
                                  >
                                    {getStatusLabel(currentStatus)}
                                  </Chip>
                                </div>

                                {/* Project Requirements */}
                                <div className="mb-3 bg-default-50 p-3 rounded border border-default-200">
                                  <p className="font-medium text-sm text-default-700 mb-1">
                                    Project Requirements:
                                  </p>
                                  <p className="text-sm text-default-600 line-clamp-2">
                                    {registration.prospectus?.requirement}
                                  </p>
                                </div>

                                {/* Progress Bar */}
                                <div className="mb-3">
                                  <div className="flex justify-between text-xs mb-1">
                                    <span className="font-semibold">Progress</span>
                                    <span className="font-medium">
                                      {progressPercentage}%
                                    </span>
                                  </div>
                                  <Progress
                                    value={progressPercentage}
                                    color={getStatusColor(currentStatus)}
                                    size="sm"
                                    aria-label="Submission progress"
                                    className="h-2"
                                  />
                                </div>

                                {/* Service Details */}
                                <div className="text-sm font-medium mb-2">
                                  {registration.services}
                                </div>

                                {/* Info Icons Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-y-2 mt-3">
                                  <div className="flex items-center text-xs text-default-600">
                                    <Tooltip content="Acceptance Period">
                                      <div className="flex items-center gap-1">
                                        <ClockIcon className="h-3.5 w-3.5 text-default-400" />
                                        <span>{registration.accept_period}</span>
                                      </div>
                                    </Tooltip>
                                  </div>
                                  <div className="flex items-center text-xs text-default-600">
                                    <Tooltip content="Publication Period">
                                      <div className="flex items-center gap-1">
                                        <CalendarIcon className="h-3.5 w-3.5 text-default-400" />
                                        <span>{registration.pub_period}</span>
                                      </div>
                                    </Tooltip>
                                  </div>
                                  <div className="flex items-center text-xs text-default-600">
                                    <Tooltip content="Registration Date">
                                      <div className="flex items-center gap-1">
                                        <CalendarIcon className="h-3.5 w-3.5 text-default-400" />
                                        <span>
                                          {new Date(registration.created_at).toLocaleDateString()}
                                        </span>
                                      </div>
                                    </Tooltip>
                                  </div>
                                </div>
                              </div>

                              {/* Action Button */}
                              <div className="flex justify-end items-center">
                                <Button
                                  color="primary"
                                  onClick={() => handleViewDetails(registration.id)}
                                  className="min-w-[120px]"
                                  endContent={
                                    <DocumentTextIcon className="h-4 w-4" />
                                  }
                                  size="md"
                                >
                                  View Details
                                </Button>
                              </div>
                            </div>
                          </CardBody>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-default-50 rounded-lg">
                    <ClipboardDocumentListIcon className="h-16 w-16 text-default-300 mx-auto mb-4" />
                    <p className="text-default-600 text-lg mb-4">
                      No submissions found matching your filters.
                    </p>
                    {statusFilter !== "all" || searchQuery ? (
                      <Button
                        color="primary"
                        variant="flat"
                        onClick={() => {
                          setStatusFilter("all");
                          setSearchQuery("");
                        }}
                      >
                        Clear Filters
                      </Button>
                    ) : (
                      <p className="text-default-400 text-sm">
                        You don&apos;t have any registered submissions yet.
                      </p>
                    )}
                  </div>
                )}
              </CardBody>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default withClientAuth(JournalSubmissionsPage);
