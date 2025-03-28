"use client";
import React, { useEffect, useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Spinner,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Input,
  Chip,
  Progress,
  Tooltip,
} from "@heroui/react";
import withAuthorAuth from "@/components/withAuthorAuth";
import api, { AssignedRegistration } from "@/services/api";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ChevronDownIcon,
  MagnifyingGlassIcon,
  ExclamationCircleIcon,
  CalendarIcon,
  PhoneIcon,
  DocumentTextIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

function AuthorTasks() {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<AssignedRegistration[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<AssignedRegistration[]>(
    []
  );
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get current user from storage
        const user = api.getStoredUser();
        if (!user || !user.id) {
          throw new Error("User information not found");
        }

        // Fetch assignments using the real API endpoint
        const response = await api.getAssignedRegistrationsAuthor(user.id);

        if (response.success) {
          setTasks(response.data);
          setFilteredTasks(response.data);
        } else {
          throw new Error("Failed to fetch assigned tasks");
        }
      } catch (error: any) {
        console.error("Error fetching tasks:", error);
        setError(error.message || "Failed to load assigned tasks");
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  useEffect(() => {
    // Apply filters whenever status or search changes
    let result = tasks;

    // Apply status filter
    if (statusFilter !== "all") {
      // Filter by author_status if available, otherwise by status
      result = result.filter((task) => {
        if (statusFilter === "not started") {
          return !task.author_status; // No author_status means not started
        }
        return (
          task.author_status === statusFilter || task.status === statusFilter
        );
      });
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (task) =>
          task.prospectus.client_name.toLowerCase().includes(query) ||
          task.prospectus.requirement.toLowerCase().includes(query) ||
          task.services.toLowerCase().includes(query) ||
          task.prospectus.reg_id.toLowerCase().includes(query)
      );
    }

    setFilteredTasks(result);
  }, [statusFilter, searchQuery, tasks]);

  const handleViewTask = (taskId: number) => {
    router.push(`/business/author/tasks/${taskId}`);
  };

  // Function to get status color for chips
  const getStatusColor = (status: string = "not started") => {
    switch (status) {
      case "completed":
      case "published":
      case "accepted":
        return "success";
      case "in progress":
      case "drafting":
      case "revised":
        return "primary";
      case "under review":
      case "submitted":
      case "finalized":
        return "secondary";
      case "revisions required":
      case "rejected":
        return "danger";
      case "idea stage":
      case "not started":
        return "warning";
      default:
        return "default";
    }
  };

  // Function to format status for display
  const getStatusLabel = (status: string = "not started") => {
    // Just capitalize the words in the status
    return status
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Enhanced function to calculate progress percentage based on status
  const getProgressFromStatus = (status: string = "not started") => {
    const statusMap: { [key: string]: number } = {
      "not started": 0,
      "idea stage": 15,
      drafting: 30,
      "in progress": 50,
      "under review": 70,
      "revisions required": 80,
      revised: 90,
      finalized: 95,
      submitted: 98,
      completed: 100,
      rejected: 100,
    };

    return statusMap[status] || 0;
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
            <h2 className="text-xl font-bold mb-2">Error Loading Tasks</h2>
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
    <div className="container mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="mb-6 shadow-md">
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center border-b">
            <h1 className="text-2xl font-bold text-secondary">
              Assigned Tasks
            </h1>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                classNames={{
                  base: "max-w-full sm:max-w-[14rem]",
                  inputWrapper: "h-9",
                }}
                placeholder="Search tasks..."
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
                  <DropdownItem key="not started">Not Started</DropdownItem>
                  <DropdownItem key="idea stage">Idea Stage</DropdownItem>
                  <DropdownItem key="drafting">Drafting</DropdownItem>
                  <DropdownItem key="in progress">In Progress</DropdownItem>
                  <DropdownItem key="under review">Under Review</DropdownItem>
                  <DropdownItem key="revisions required">
                    Revisions Required
                  </DropdownItem>
                  <DropdownItem key="revised">Revised</DropdownItem>
                  <DropdownItem key="finalized">Finalized</DropdownItem>
                  <DropdownItem key="submitted">Submitted</DropdownItem>
                  <DropdownItem key="completed">Completed</DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </div>
          </CardHeader>
          <CardBody>
            {filteredTasks.length > 0 ? (
              <div className="space-y-5">
                {filteredTasks.map((task) => {
                  // Get current status with fallback
                  const currentStatus = task.author_status || "not started";
                  // Calculate progress percentage
                  const progressPercentage =
                    getProgressFromStatus(currentStatus);
                  // Determine if task is urgent (example logic)
                  const isUrgent = currentStatus === "revisions required";

                  // Calculate days - use different logic based on completion status
                  let daysSinceCreated;
                  if (currentStatus === "completed") {
                    // For completed tasks: days between creation and completion
                    daysSinceCreated = Math.floor(
                      (new Date(task.updated_at).getTime() -
                        new Date(task.created_at).getTime()) /
                        (1000 * 3600 * 24)
                    );
                  } else {
                    // For ongoing tasks: days between creation and current date
                    daysSinceCreated = Math.floor(
                      (new Date().getTime() -
                        new Date(task.created_at).getTime()) /
                        (1000 * 3600 * 24)
                    );
                  }

                  return (
                    <Card
                      key={task.id}
                      className={`border-l-4 ${isUrgent ? "border-l-danger" : "border-l-primary"} hover:shadow-lg transition-all duration-200`}
                    >
                      <CardBody className="p-5">
                        <div className="flex flex-col md:flex-row gap-6">
                          <div className="flex-grow">
                            {/* Client and Status Header */}
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3">
                              <div>
                                <h3 className="text-lg font-semibold text-primary-800 flex items-center gap-2">
                                  {task.prospectus.client_name}
                                  {isUrgent && (
                                    <Tooltip content="This task requires immediate attention">
                                      <span className="text-danger text-xs font-bold px-2 py-0.5 bg-danger/10 rounded-full">
                                        URGENT
                                      </span>
                                    </Tooltip>
                                  )}
                                </h3>
                                <div className="text-sm text-default-500 flex items-center mt-1">
                                  <span className="font-medium">ID:</span>{" "}
                                  {task.prospectus.reg_id} •
                                  <span>
                                    {currentStatus === "completed"
                                      ? ` Completed in ${daysSinceCreated} days`
                                      : ` ${daysSinceCreated} days in progress`}
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
                                {task.prospectus.requirement}
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
                                aria-label="Task progress"
                                className="h-2"
                              />
                            </div>

                            {/* Service Details */}
                            <div className="text-sm font-medium mb-2">
                              {task.services}
                            </div>

                            {/* Info Icons Grid - Remove currency/financial information */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-y-2 mt-3">
                              <div className="flex items-center text-xs text-default-600">
                                <Tooltip content="Client Contact">
                                  <div className="flex items-center gap-1">
                                    <PhoneIcon className="h-3.5 w-3.5 text-default-400" />
                                    <span className="truncate">
                                      {task.prospectus.phone}
                                    </span>
                                  </div>
                                </Tooltip>
                              </div>
                              <div className="flex items-center text-xs text-default-600">
                                <Tooltip content="Publication Period">
                                  <div className="flex items-center gap-1">
                                    <ClockIcon className="h-3.5 w-3.5 text-default-400" />
                                    <span>{task.pub_period}</span>
                                  </div>
                                </Tooltip>
                              </div>
                              <div className="flex items-center text-xs text-default-600">
                                <Tooltip content="Created Date">
                                  <div className="flex items-center gap-1">
                                    <CalendarIcon className="h-3.5 w-3.5 text-default-400" />
                                    <span>
                                      {new Date(task.date).toLocaleDateString()}
                                    </span>
                                  </div>
                                </Tooltip>
                              </div>
                            </div>
                          </div>

                          {/* Action Button */}
                          <div className="flex justify-end items-center">
                            <Button
                              color={
                                currentStatus === "completed"
                                  ? "secondary"
                                  : "primary"
                              }
                              onClick={() => handleViewTask(task.id)}
                              className="min-w-[120px]"
                              endContent={
                                <DocumentTextIcon className="h-4 w-4" />
                              }
                              size="md"
                            >
                              {currentStatus === "completed"
                                ? "View Details"
                                : "Manage Task"}
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
                <DocumentTextIcon className="h-16 w-16 text-default-300 mx-auto mb-4" />
                <p className="text-default-600 text-lg mb-4">
                  No tasks found matching your filters.
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
                    You don't have any assigned tasks yet.
                  </p>
                )}
              </div>
            )}
          </CardBody>
        </Card>
      </motion.div>
    </div>
  );
}

export default withAuthorAuth(AuthorTasks);
