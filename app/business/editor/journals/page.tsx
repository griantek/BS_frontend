"use client";
import React from 'react';
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
} from "@heroui/react";
import { SearchIcon } from '@/components/icons';
import { withEditorAuth } from '@/components/withEditorAuth';
import api, { JournalData } from '@/services/api';
import { toast } from 'react-toastify';
import { EyeIcon, EyeSlashIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { currentUserHasPermission, PERMISSIONS } from '@/utils/permissions';
import { useJournalCache } from '@/hooks/useJournalCache';
import clsx from 'clsx';

const JournalsEditorPage = () => {
    const router = useRouter();
    const { cachedJournals, saveToCache, clearCache, isLoaded, shouldRefreshInBackground } = useJournalCache();
    const [journals, setJournals] = React.useState<JournalData[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isRefreshing, setIsRefreshing] = React.useState(false);
    const [filterValue, setFilterValue] = React.useState("");
    const [page, setPage] = React.useState(1);
    const [canClickRows, setCanClickRows] = React.useState(false);
    const rowsPerPage = 10;
    const isMounted = React.useRef(false);

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
            
            const response = await api.getJournalDataByEditor(user.id);
            
            if (response.success) {
                setJournals(response.data);
                saveToCache(response.data);
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
    }, [saveToCache]);

    // Handle manual refresh
    const handleRefresh = () => {
        fetchJournals(false);
    };

    // Initial load effect - run once
    React.useEffect(() => {
        setCanClickRows(currentUserHasPermission(PERMISSIONS.CLICK_JOURNAL_ROWS));
        
        if (isLoaded && !isMounted.current) {
            isMounted.current = true;
            
            if (cachedJournals && cachedJournals.length > 0) {
                // Immediately display cached data
                setJournals(cachedJournals);
                setIsLoading(false);
                
                // Check if we need to refresh in the background
                if (shouldRefreshInBackground()) {
                    setTimeout(() => {
                        fetchJournals(true); // Silent refresh
                    }, 1000);
                }
            } else {
                // No cache, load from API
                fetchJournals(false);
            }
        }
    }, [isLoaded, cachedJournals, fetchJournals, shouldRefreshInBackground]);

    // Columns for the table
    const columns = [
        { key: "id", label: "ID" },
        { key: "prospectus_id", label: "PID" },
        { key: "reg_id", label: "REG NUMBER" },
        { key: "client_name", label: "CLIENT NAME" },
        { key: "requirement", label: "REQUIREMENT" },
        { key: "personal_email", label: "EMAIL" },
        { key: "executive", label: "APPLIED EXECUTIVE" },
        { key: "journal_name", label: "JOURNAL" },
        { key: "status", label: "STATUS" },
        { key: "paper_title", label: "PAPER TITLE" },
    ];

    // Filter items based on search
    const filteredItems = React.useMemo(() => {
        return journals.filter((journal) =>
            journal.client_name?.toLowerCase().includes(filterValue.toLowerCase()) ||
            journal.journal_name?.toLowerCase().includes(filterValue.toLowerCase()) ||
            journal.prospectus?.reg_id?.toLowerCase().includes(filterValue.toLowerCase())
        );
    }, [journals, filterValue]);

    // Pagination
    const pages = Math.ceil(filteredItems.length / rowsPerPage);
    const items = React.useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        return filteredItems.slice(start, end);
    }, [page, filteredItems]);

    // Row click handler
    const handleRowClick = (journalId: number) => {
        if (canClickRows) {
            router.push(`/business/editor/view/journal/${journalId}`);
        }
    };

    // Show loading only when no data is available
    const showLoading = isLoading && journals.length === 0;

    // Cell renderer
    const renderCell = (journal: JournalData, key: string): React.ReactNode => {
        switch(key) {
            case "id":
                return <span>{journal.id}</span>;
            case "prospectus_id":
                return <span>{journal.prospectus?.id}</span>;
            case "reg_id":
                return <span>{journal.prospectus?.reg_id}</span>;
            case "requirement":
                return journal.requirement ? (
                    <Tooltip content={journal.requirement}>
                        <span>{journal.requirement.slice(0, 50)}...</span>
                    </Tooltip>
                ) : <span>-</span>;
            case "executive":
                return <span>{journal.entities?.username || '-'}</span>;
            case "journal_name":
                return journal.journal_name ? (
                    <Tooltip content={journal.journal_name}>
                        <span>{journal.journal_name.slice(0, 30)}...</span>
                    </Tooltip>
                ) : <span>-</span>;
            case "status":
                return (
                    <Chip
                        color={
                            journal.status === 'approved' ? 'success' :
                            journal.status === 'rejected' ? 'danger' :
                            journal.status === 'under review' ? 'warning' :
                            'default'
                        }
                        size="sm"
                    >
                        {journal.status}
                    </Chip>
                );
            case "personal_email":
                return <span>{journal.personal_email || '-'}</span>;
            case "paper_title":
                return journal.paper_title ? (
                    <Tooltip content={journal.paper_title}>
                        <span>{journal.paper_title.slice(0, 30)}...</span>
                    </Tooltip>
                ) : <span>-</span>;
            default:
                const value = journal[key as keyof JournalData];
                return <span>{typeof value === 'string' ? value : '-'}</span>;
        }
    };

    return (
        <div className="p-4">
            <Card>
                <CardHeader className="flex justify-between items-center px-6 py-4">
                    <h1 className="text-2xl font-bold">Journal Management</h1>
                    <div className="flex items-center gap-4">
                        <Button
                            isIconOnly
                            variant="light"
                            color="primary"
                            onClick={handleRefresh}
                            isLoading={isRefreshing}
                            className="min-w-10"
                            aria-label="Refresh data"
                        >
                            {!isRefreshing && <ArrowPathIcon className="h-5 w-5" />}
                        </Button>
                        <div className="flex-1 max-w-md ml-2">
                            <Input
                                isClearable
                                classNames={{
                                    base: "w-full",
                                    inputWrapper: "border-1",
                                }}
                                placeholder="Search journals..."
                                startContent={<SearchIcon />}
                                value={filterValue}
                                onClear={() => setFilterValue("")}
                                onValueChange={setFilterValue}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardBody>
                    {showLoading ? (
                        <LoadingSpinner text="Loading journals..." />
                    ) : (
                        <>
                            {isRefreshing && (
                                <div className="flex justify-center mb-2">
                                    <div className="text-xs text-default-500 flex items-center">
                                        <ArrowPathIcon className="h-3 w-3 animate-spin mr-1" />
                                        Refreshing data...
                                    </div>
                                </div>
                            )}
                            <Table
                                aria-label="Journals table"
                                bottomContent={
                                    pages > 1 ? (
                                        <div className="flex w-full justify-center">
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
                                }}
                            >
                                <TableHeader columns={columns}>
                                    {(column) => (
                                        <TableColumn key={column.key}>
                                            {column.label}
                                        </TableColumn>
                                    )}
                                </TableHeader>
                                <TableBody
                                    items={items}
                                    emptyContent="No journals found"
                                >
                                    {(journal) => (
                                        <TableRow 
                                            key={journal.id}
                                            className={clsx(
                                                canClickRows && "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors",
                                                !canClickRows && "cursor-default"
                                            )}
                                            onClick={() => handleRowClick(journal.id)}
                                        >
                                            {columns.map((column) => (
                                                <TableCell key={`${journal.id}-${column.key}`}>
                                                    {renderCell(journal, column.key)}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </>
                    )}
                </CardBody>
            </Card>
        </div>
    );
};

export default withEditorAuth(JournalsEditorPage, PERMISSIONS.SHOW_JOURNAL_TABLE);