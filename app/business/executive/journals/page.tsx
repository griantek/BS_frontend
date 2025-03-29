"use client";
import React, { useMemo, useState } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Input,
  Button,
  Card,
  CardHeader,
  CardBody,
  Chip,
  Tooltip,
  Pagination,
  Select,
  SelectItem,
} from "@heroui/react";
import { SearchIcon } from "@/components/icons";
import { withExecutiveAuth } from "@/components/withExecutiveAuth";
import api, { JournalDataWithExecutive } from "@/services/api";
import { toast } from "react-toastify";
import {
  ArrowPathIcon,
  XMarkIcon,
  FunnelIcon,
  MagnifyingGlassIcon
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import clsx from "clsx";

const JournalsExecutivePage = () => {
  const router = useRouter();
  const [journals, setJournals] = useState<JournalDataWithExecutive[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterValue, setFilterValue] = useState("");
  const [page, setPage] = useState(1);
  const [canClickRows, setCanClickRows] = useState(true);
  const [editorFilter, setEditorFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const rowsPerPage = 10;

  // Get unique editors from journal data
  const editors = useMemo(() => {
    const uniqueEditors = new Set<string>();
    journals.forEach((journal) => {
      if (journal.entities?.username) {
        uniqueEditors.add(journal.entities.username);
      }
    });
    return Array.from(uniqueEditors).sort();
  }, [journals]);

  // Fetch journals from API
  const fetchJournals = React.useCallback(async (silent = false) => {
    try {
      const user = api.getStoredUser();
      if (!user?.id) {
        throw new Error("User ID not found");
      }

      if (!silent) {
        setIsRefreshing(true);
      }

      const response = await api.getJournalDataByExecutive(user.id);

      if (response.success) {
        setJournals(response.data);
      }
    } catch (error) {
      if (!silent) {
        const errorMessage = api.handleError(error);
        toast.error(errorMessage.error || "Failed to load journals");
      } else {
        console.error("Background refresh error:", error);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Handle manual refresh
  const handleRefresh = () => {
    fetchJournals(false);
  };

  // Initial load effect
  React.useEffect(() => {
    fetchJournals(false);
  }, [fetchJournals]);

  // Clear all filters
  const clearFilters = () => {
    setFilterValue("");
    setEditorFilter("all");
    setStatusFilter("all");
  };

  // Columns for the table
  const columns = [
    { key: "id", label: "ID" },
    { key: "reg_id", label: "REG NUMBER" },
    { key: "client_name", label: "CLIENT NAME" },
    { key: "personal_email", label: "EMAIL" },
    { key: "editor", label: "ASSIGNED EDITOR" },
    { key: "journal_name", label: "JOURNAL" },
    { key: "status", label: "STATUS" },
    { key: "paper_title", label: "PAPER TITLE" },
  ];

  // Filter items based on search and filters
  const filteredItems = useMemo(() => {
    return journals.filter((journal) => {
      // Simple search across client name, email, and registration number
      if (filterValue) {
        const searchTerms = filterValue.toLowerCase();
        const matchesSearch =
          journal.client_name?.toLowerCase().includes(searchTerms) ||
          journal.personal_email?.toLowerCase().includes(searchTerms) ||
          journal.prospectus?.reg_id?.toLowerCase().includes(searchTerms);

        if (!matchesSearch) return false;
      }

      // Editor filter
      if (
        editorFilter !== "all" &&
        journal.entities?.username !== editorFilter
      ) {
        return false;
      }

      // Status filter
      if (statusFilter !== "all" && journal.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [journals, filterValue, editorFilter, statusFilter]);

  // Pagination
  const pages = Math.ceil(filteredItems.length / rowsPerPage);
  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredItems.slice(start, end);
  }, [page, filteredItems]);

  // Row click handler
  const handleRowClick = (journalId: number) => {
    if (canClickRows) {
      router.push(`/business/executive/journals/${journalId}`);
    }
  };

  // Show loading only when no data is available
  const showLoading = isLoading && journals.length === 0;

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Cell renderer
  const renderCell = (
    journal: JournalDataWithExecutive,
    key: string
  ): React.ReactNode => {
    switch (key) {
      case "id":
        return (
          <span className="text-default-500 font-mono text-xs font-medium bg-default-100 px-1.5 py-0.5 rounded">
            #{journal.id}
          </span>
        );
      case "reg_id":
        return (
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              {journal.prospectus?.reg_id || "-"}
            </span>
            <span className="text-xs text-default-400">
              {formatDate(journal.created_at)}
            </span>
          </div>
        );
      case "client_name":
        return (
          <span className="font-medium">{journal.client_name || "-"}</span>
        );
      case "requirement":
        return journal.requirement ? (
          <Tooltip content={journal.requirement} className="max-w-md">
            <span className="text-default-500 line-clamp-2">
              {journal.requirement.slice(0, 50)}...
            </span>
          </Tooltip>
        ) : (
          <span className="text-default-400">-</span>
        );
      case "editor":
        return (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              {journal.entities?.username?.charAt(0).toUpperCase() || "?"}
            </div>
            <span>{journal.entities?.username || "-"}</span>
          </div>
        );
      case "journal_name":
        return journal.journal_name ? (
          <Tooltip content={journal.journal_name}>
            <div className="flex flex-col">
              <span className="font-medium line-clamp-1">
                {journal.journal_name}
              </span>
              {journal.status_link && journal.status_link != 'https://dummyimage.com/16:9x1080/' ? (
                <span className="text-xs text-success">
                  Screenshot available
                </span>
              ) : (
                <span className="text-xs text-default-400">No screenshot</span>
              )}
            </div>
          </Tooltip>
        ) : (
          <span className="text-default-400">-</span>
        );
      case "status":
        return (
          <Chip
            className="capitalize"
            size="sm"
            color={
              journal.status === "approved"
                ? "success"
                : journal.status === "rejected"
                  ? "danger"
                  : journal.status === "under review"
                    ? "warning"
                    : journal.status === "submitted"
                      ? "primary"
                      : "default"
            }
            variant="flat"
          >
            {journal.status || "pending"}
          </Chip>
        );
      case "personal_email":
        return (
          <span className="text-default-600 underline decoration-dotted underline-offset-2">
            {journal.personal_email || "-"}
          </span>
        );
      case "paper_title":
        return journal.paper_title ? (
          <Tooltip content={journal.paper_title}>
            <span className="line-clamp-2 text-default-700">
              {journal.paper_title}
            </span>
          </Tooltip>
        ) : (
          <span className="text-default-400">-</span>
        );
      default:
        const value = journal[key as keyof JournalDataWithExecutive];
        return <span>{typeof value === "string" ? value : "-"}</span>;
    }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col gap-6">
        {/* Top section with title and filters - matches leads design */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-white dark:bg-default-50 p-5 rounded-lg shadow-sm">
          <div>
            <h1 className="text-2xl font-bold">Journal Submissions</h1>
            <p className="text-default-500 text-sm mt-1">
              View and track your journal publication progress
            </p>
          </div>
          <Button
            color="primary"
            startContent={<ArrowPathIcon className="h-4 w-4" />}
            onClick={handleRefresh}
            isLoading={isRefreshing}
            size="sm"
          >
            Refresh
          </Button>
        </div>

        {/* Filters section - matches leads design */}
        <Card className="p-0 shadow-md rounded-lg overflow-hidden mb-6">
          <div className="bg-default-50 dark:bg-default-100/5 p-4 border-b border-divider">
            <h2 className="text-lg font-semibold flex items-center text-foreground">
              <FunnelIcon className="h-5 w-5 mr-2 text-primary" />
              Search & Filters
            </h2>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-6 gap-4">
              <Input
                label="Search"
                placeholder="Search client name, email or registration..."
                labelPlacement="outside"
                startContent={
                  <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                }
                value={filterValue}
                onValueChange={setFilterValue}
                isClearable
                onClear={() => setFilterValue("")}
              />

              <Select
                label="Assigned Editor"
                placeholder="All Editors"
                labelPlacement="outside"
                selectedKeys={[editorFilter]}
                onChange={(e) => setEditorFilter(e.target.value)}
              >
                <SelectItem key="all" value="all">
                  All Editors
                </SelectItem>
                {
                  editors.map((editor) => (
                    <SelectItem key={editor} value={editor}>
                      {editor}
                    </SelectItem>
                  )) as any
                }
              </Select>

              <Select
                label="Status"
                placeholder="All Statuses"
                labelPlacement="outside"
                selectedKeys={[statusFilter]}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <SelectItem key="all" value="all">
                  All Statuses
                </SelectItem>
                <SelectItem key="pending" value="pending">
                  Pending
                </SelectItem>
                <SelectItem key="under review" value="under review">
                  Under Review
                </SelectItem>
                <SelectItem key="approved" value="approved">
                  Approved
                </SelectItem>
                <SelectItem key="rejected" value="rejected">
                  Rejected
                </SelectItem>
                <SelectItem key="submitted" value="submitted">
                  Submitted
                </SelectItem>
              </Select>
            </div>
          </div>
        </Card>
        {/* Active filters */}
        {(filterValue || editorFilter !== "all" || statusFilter !== "all") && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-default-500">Active filters:</span>
            <div className="flex flex-wrap gap-2">
              {filterValue && (
                <Chip
                  onClose={() => setFilterValue("")}
                  variant="flat"
                  size="sm"
                >
                  Search: {filterValue}
                </Chip>
              )}
              {editorFilter !== "all" && (
                <Chip
                  onClose={() => setEditorFilter("all")}
                  variant="flat"
                  size="sm"
                >
                  Editor: {editorFilter}
                </Chip>
              )}
              {statusFilter !== "all" && (
                <Chip
                  onClose={() => setStatusFilter("all")}
                  variant="flat"
                  size="sm"
                  color={
                    statusFilter === "approved"
                      ? "success"
                      : statusFilter === "rejected"
                        ? "danger"
                        : statusFilter === "under review"
                          ? "warning"
                          : statusFilter === "submitted"
                            ? "primary"
                            : "default"
                  }
                >
                  Status: {statusFilter}
                </Chip>
              )}
              <Button
                size="sm"
                variant="flat"
                color="default"
                startContent={<XMarkIcon className="h-4 w-4" />}
                onClick={clearFilters}
              >
                Clear All
              </Button>
            </div>
          </div>
        )}

        {/* Results count */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-default-500">
            {filteredItems.length} journals found
          </div>
        </div>

        {/* Table section - matches leads design */}
        <Card className="shadow-sm">
          {showLoading ? (
            <div className="p-12">
              <LoadingSpinner text="Loading journal submissions..." />
            </div>
          ) : (
            <Table
              aria-label="Journal submissions table"
              bottomContent={
                pages > 1 ? (
                  <div className="flex w-full justify-center py-3">
                    <Pagination
                      isCompact
                      showControls
                      showShadow
                      color="primary"
                      page={page}
                      total={pages}
                      onChange={setPage}
                    />
                  </div>
                ) : null
              }
              classNames={{
                wrapper: "min-h-[400px]",
                table: "min-w-[800px]",
                tr: "border-b border-default-100",
              }}
            >
              <TableHeader columns={columns}>
                {(column) => (
                  <TableColumn
                    key={column.key}
                    className={clsx(
                      "bg-default-50 text-default-700 font-medium",
                      column.key === "status" ? "text-center" : ""
                    )}
                  >
                    {column.label}
                  </TableColumn>
                )}
              </TableHeader>
              <TableBody
                items={items}
                emptyContent={
                  <div className="py-12 text-center">
                    <div className="text-default-400 text-3xl mb-4">😕</div>
                    <p className="text-default-500">
                      No journals found matching your criteria
                    </p>
                    <Button
                      className="mt-4"
                      size="sm"
                      variant="flat"
                      color="primary"
                      onClick={clearFilters}
                    >
                      Clear Filters
                    </Button>
                  </div>
                }
              >
                {(journal) => (
                  <TableRow
                    key={journal.id}
                    className={clsx(
                      canClickRows &&
                        "cursor-pointer hover:bg-default-50 dark:hover:bg-default-50/20 transition-colors",
                      !canClickRows && "cursor-default"
                    )}
                    onClick={() => handleRowClick(journal.id)}
                  >
                    {columns.map((column) => (
                      <TableCell
                        key={`${journal.id}-${column.key}`}
                        className={clsx(
                          "py-3",
                          column.key === "status" ? "text-center" : ""
                        )}
                      >
                        {renderCell(journal, column.key)}
                      </TableCell>
                    ))}
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
};

export default withExecutiveAuth(JournalsExecutivePage);
