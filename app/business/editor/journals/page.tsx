"use client";
import React, { useState, useCallback } from 'react';
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
  Spinner,
} from "@heroui/react";
import { SearchIcon } from '@/components/icons';
import { withEditorAuth } from '@/components/withEditorAuth';
import api, { JournalData, PaginatedJournalResponse } from '@/services/api';
import { toast } from 'react-toastify';
import { 
  ArrowPathIcon, 
  FunnelIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { currentUserHasPermission, PERMISSIONS } from '@/utils/permissions';
import clsx from 'clsx';
import { useDebounce } from '@/hooks/useDebounce';

const JournalsEditorPage = () => {
    const router = useRouter();
    // State for journals and pagination
    const [journals, setJournals] = useState<JournalData[]>([]);
    const [pagination, setPagination] = useState({
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
      hasMore: false
    });
    
    // State for loading and filters
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [filterValue, setFilterValue] = useState("");
    const [debouncedFilterValue, setDebouncedFilterValue] = useDebounce(filterValue, 500);
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [executiveFilter, setExecutiveFilter] = useState<string>("all");
    const [canClickRows, setCanClickRows] = useState(false);
    
    // State for sorting
    const [sortBy, setSortBy] = useState<string>("created_at");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

    // Executives fetched separately for the filter dropdown
    const [executives, setExecutives] = useState<string[]>([]);
    const [isLoadingExecs, setIsLoadingExecs] = useState(true);

    // Fetch journals from API
    const fetchJournals = useCallback(async (silent = false) => {
        try {
            const user = api.getStoredUser();
            if (!user?.id) {
                throw new Error("User ID not found");
            }
            
            if (!silent) {
                setIsRefreshing(true);
            }
            
            // Use the new paginated API
            const response = await api.getJournalDataByEditor(user.id, {
                page: pagination.page,
                limit: pagination.limit,
                status: statusFilter !== "all" ? statusFilter : undefined,
                sortBy,
                sortOrder,
                searchTerm: debouncedFilterValue,
            });
            
            if (response.success) {
                setJournals(response.data);
                setPagination(response.pagination);
            }
        } catch (error) {
            if (!silent) {
                const errorMessage = api.handleError(error);
                toast.error(errorMessage.error || 'Failed to load journals');
            } else {
                console.error('Background refresh error:', error);
            }
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [debouncedFilterValue, pagination.limit, pagination.page, sortBy, sortOrder, statusFilter]);

    // Fetch executives for filter dropdown
    const fetchExecutives = useCallback(async () => {
        try {
            setIsLoadingExecs(true);
            const response = await api.getAllExecutives();
            if (response.success) {
                const executiveNames = response.data.map(exec => exec.username);
                setExecutives(executiveNames);
            }
        } catch (error) {
            console.error('Error fetching executives:', error);
        } finally {
            setIsLoadingExecs(false);
        }
    }, []);

    // Handle manual refresh
    const handleRefresh = () => {
        fetchJournals(false);
    };

    // Initial load effect
    React.useEffect(() => {
        setCanClickRows(currentUserHasPermission(PERMISSIONS.CLICK_JOURNAL_ROWS));
        fetchExecutives();
        // We don't need to fetch journals here, it will be triggered by the pagination effect
    }, [fetchExecutives]);

    // Effect for when search or filters change
    React.useEffect(() => {
        // Reset to first page when filters change
        setPagination(prev => ({ ...prev, page: 1 }));
    }, [debouncedFilterValue, statusFilter, executiveFilter, sortBy, sortOrder]);

    // Effect to fetch data when pagination changes
    React.useEffect(() => {
        fetchJournals();
    }, [fetchJournals, pagination.page, debouncedFilterValue, statusFilter, sortBy, sortOrder]);

    // Clear all filters
    const clearFilters = () => {
        setFilterValue("");
        setStatusFilter("all");
        setExecutiveFilter("all");
        setSortBy("created_at");
        setSortOrder("desc");
    };

    // Handle page change
    const handlePageChange = (newPage: number) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    };

    // Handle sort change
    const handleSortChange = (column: string) => {
        if (sortBy === column) {
            // Toggle sort order
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            // Set new sort column and default to ascending
            setSortBy(column);
            setSortOrder("asc");
        }
    };

    // Columns for the table
    const columns = [
        { key: "id", label: "ID", sortable: true },
        { key: "reg_id", label: "REG NUMBER", sortable: true },
        { key: "client_name", label: "CLIENT NAME", sortable: true },
        { key: "personal_email", label: "EMAIL", sortable: false },
        { key: "executive", label: "APPLIED EXECUTIVE", sortable: false },
        { key: "journal_name", label: "JOURNAL", sortable: true },
        { key: "status", label: "STATUS", sortable: true },
        { key: "paper_title", label: "PAPER TITLE", sortable: false },
        { key: "created_at", label: "CREATED", sortable: true },
    ];

    // Row click handler
    const handleRowClick = (journalId: number) => {
        if (canClickRows) {
            router.push(`/business/editor/view/journal/${journalId}`);
        }
    };

    // Format date for display
    const formatDate = (dateString: string) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric'
        });
    };

    // Cell renderer
    const renderCell = (journal: JournalData, key: string): React.ReactNode => {
        switch(key) {
            case "id":
                return <span className="text-default-500 font-mono text-xs font-medium bg-default-100 px-1.5 py-0.5 rounded">#{journal.id}</span>;
            case "reg_id":
                return (
                    <div className="flex flex-col">
                        <span className="text-sm font-medium">{journal.prospectus?.reg_id || "-"}</span>
                    </div>
                );
            case "client_name":
                return <span className="font-medium">{journal.client_name || "-"}</span>;
            case "executive":
                return (
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            {journal.entities?.username?.charAt(0).toUpperCase() || "?"}
                        </div>
                        <span>{journal.entities?.username || '-'}</span>
                    </div>
                );
            case "journal_name":
                return journal.journal_name ? (
                    <Tooltip content={journal.journal_name}>
                        <div className="flex flex-col">
                            <span className="font-medium line-clamp-1">{journal.journal_name}</span>
                            {journal.journal_link && journal.status_link != 'https://dummyimage.com/16:9x1080/' ? (
                                <span className="text-xs text-success">Screenshot available</span>
                            ) : journal.journal_link && journal.username && journal.password && journal.status_link == "https://dummyimage.com/16:9x1080/" ? (
                                <span className="text-xs text-warning">No screenshot loaded</span>
                            ):(
                                <span className="text-xs text-danger">No screenshot</span>
                            )}
                        </div>
                    </Tooltip>
                ) : <span className="text-default-400">-</span>;
            case "status":
                return (
                    <Chip
                        className="capitalize"
                        size="sm"
                        color={
                            journal.status === 'approved' ? 'success' :
                            journal.status === 'rejected' ? 'danger' :
                            journal.status === 'under review' ? 'warning' :
                            journal.status === 'submitted' ? 'primary' :
                            'default'
                        }
                        variant="flat"
                    >
                        {journal.status || "pending"}
                    </Chip>
                );
            case "personal_email":
                return (
                    <span className="text-default-600 underline decoration-dotted underline-offset-2">
                        {journal.personal_email || '-'}
                    </span>
                );
            case "paper_title":
                return journal.paper_title ? (
                    <Tooltip content={journal.paper_title}>
                        <span className="line-clamp-2 text-default-700">
                            {journal.paper_title}
                        </span>
                    </Tooltip>
                ) : <span className="text-default-400">-</span>;
            case "created_at":
                return <span className="text-xs text-default-400">{formatDate(journal.created_at)}</span>;
            default:
                const value = journal[key as keyof JournalData];
                return <span>{typeof value === 'string' ? value : '-'}</span>;
        }
    };

    // Render sort icon
    const renderSortIcon = (column: string) => {
        if (sortBy !== column) return null;
        
        return sortOrder === 'asc' 
            ? <ArrowUpIcon className="h-3 w-3 inline ml-1" />
            : <ArrowDownIcon className="h-3 w-3 inline ml-1" />;
    };

    return (
        <div className="p-4 md:p-6">
            <div className="flex flex-col gap-6">
                {/* Top section with title and filters */}
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-white dark:bg-default-50 p-5 rounded-lg shadow-sm">
                    <div>
                        <h1 className="text-2xl font-bold">Journal Management</h1>
                        <p className="text-default-500 text-sm mt-1">
                            View and manage all journal submissions
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

                {/* Filters section */}
                <Card className="p-0 shadow-md rounded-lg overflow-hidden mb-6">
                    <div className="bg-default-50 dark:bg-default-100/5 p-4 border-b border-divider">
                        <h2 className="text-lg font-semibold flex items-center text-foreground">
                            <FunnelIcon className="h-5 w-5 mr-2 text-primary" />
                            Search & Filters
                        </h2>
                    </div>

                    <div className="p-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Input
                                label="Search"
                                placeholder="Search by client, journal, or title..."
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
                                label="Applied Executive"
                                placeholder={isLoadingExecs ? "Loading..." : "All Executives"}
                                labelPlacement="outside"
                                selectedKeys={[executiveFilter]}
                                onChange={(e) => setExecutiveFilter(e.target.value)}
                                isDisabled={isLoadingExecs}
                            >
                                <SelectItem key="all" value="all">
                                    All Executives
                                </SelectItem>
                                {executives.map((executive) => (
                                    <SelectItem key={executive} value={executive}>
                                        {executive}
                                    </SelectItem>
                                )) as any}
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

                            <div className="flex items-end">
                                <Button
                                    size="md"
                                    color="default"
                                    variant="flat"
                                    startContent={<XMarkIcon className="h-4 w-4" />}
                                    onClick={clearFilters}
                                    className="w-full"
                                >
                                    Clear Filters
                                </Button>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Active filters */}
                {(filterValue || statusFilter !== "all" || executiveFilter !== "all" || sortBy !== "created_at") && (
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
                            {executiveFilter !== "all" && (
                                <Chip
                                    onClose={() => setExecutiveFilter("all")}
                                    variant="flat"
                                    size="sm"
                                >
                                    Executive: {executiveFilter}
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
                            {sortBy !== "created_at" && (
                                <Chip
                                    onClose={() => {
                                        setSortBy("created_at");
                                        setSortOrder("desc");
                                    }}
                                    variant="flat"
                                    size="sm"
                                >
                                    Sort: {sortBy} ({sortOrder})
                                </Chip>
                            )}
                        </div>
                    </div>
                )}

                {/* Results count */}
                <div className="flex justify-between items-center">
                    <div className="text-sm text-default-500">
                        {pagination.total} total journals | Page {pagination.page} of {pagination.totalPages}
                    </div>
                </div>

                {/* Table section */}
                <Card className="shadow-sm">
                    {isLoading ? (
                        <div className="p-12">
                            <LoadingSpinner text="Loading journals..." />
                        </div>
                    ) : (
                        <Table
                            aria-label="Journals table"
                            bottomContent={
                                pagination.totalPages > 1 ? (
                                    <div className="flex w-full justify-center py-3">
                                        <Pagination
                                            isCompact
                                            showControls
                                            showShadow
                                            color="primary"
                                            page={pagination.page}
                                            total={pagination.totalPages}
                                            onChange={handlePageChange}
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
                                            column.key === "status" ? "text-center" : "",
                                            column.sortable && "cursor-pointer hover:bg-default-100"
                                        )}
                                        onClick={() => column.sortable && handleSortChange(column.key)}
                                    >
                                        {column.label}
                                        {column.sortable && renderSortIcon(column.key)}
                                    </TableColumn>
                                )}
                            </TableHeader>
                            <TableBody
                                items={journals}
                                emptyContent={
                                    isRefreshing ? (
                                        <div className="py-12 text-center">
                                            <Spinner size="sm" color="primary" />
                                            <p className="text-default-500 mt-2">
                                                Refreshing data...
                                            </p>
                                        </div>
                                    ) : (
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
                                    )
                                }
                                loadingContent={<LoadingSpinner />}
                                loadingState={isRefreshing ? "loading" : "idle"}
                            >
                                {(journal) => (
                                    <TableRow
                                        key={journal.id}
                                        className={clsx(
                                            "transition-colors",
                                            canClickRows 
                                                ? "cursor-pointer hover:bg-primary-50/30 dark:hover:bg-primary-900/20 border-l-2 hover:border-l-primary" 
                                                : "cursor-default hover:bg-default-100/50 dark:hover:bg-default-50/10",
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

export default withEditorAuth(JournalsEditorPage, PERMISSIONS.SHOW_JOURNAL_TABLE);