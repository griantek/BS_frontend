'use client';
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
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from "@/components/LoadingSpinner";

const JournalsEditorPage = () => {
    const [journals, setJournals] = React.useState<JournalData[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [filterValue, setFilterValue] = React.useState("");
    const [page, setPage] = React.useState(1);
    const [showPassword, setShowPassword] = React.useState<{ [key: number]: boolean }>({});
    const rowsPerPage = 10;
    const router = useRouter();

    React.useEffect(() => {
        const fetchJournals = async () => {
            try {
                const response = await api.getAllJournalData();
                if (response.success) {
                    setJournals(response.data);
                }
            } catch (error) {
                const errorMessage = api.handleError(error);
                toast.error(errorMessage.error || 'Failed to load journals');
            } finally {
                setIsLoading(false);
            }
        };

        fetchJournals();
    }, []);

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
        { key: "journal_link", label: "LINK" },
        { key: "paper_title", label: "PAPER TITLE" },
    ];

    const filteredItems = React.useMemo(() => {
        return journals.filter((journal) =>
            journal.client_name.toLowerCase().includes(filterValue.toLowerCase()) ||
            journal.journal_name.toLowerCase().includes(filterValue.toLowerCase()) ||
            journal.prospectus.reg_id.toLowerCase().includes(filterValue.toLowerCase())
        );
    }, [journals, filterValue]);

    const pages = Math.ceil(filteredItems.length / rowsPerPage);
    const items = React.useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        return filteredItems.slice(start, end);
    }, [page, filteredItems]);

    const handlePasswordToggle = (e: React.MouseEvent, id: number) => {
        e.preventDefault();
        e.stopPropagation();
        setShowPassword(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const renderCell = (journal: JournalData, key: string): React.ReactNode => {
        switch(key) {
            case "id":
                return <span>{journal.id}</span>;
            case "prospectus_id":
                return <span>{journal.prospectus.id}</span>;
            case "reg_id":
                return <span>{journal.prospectus.reg_id}</span>;
            case "requirement":
                return (
                    <Tooltip content={journal.requirement}>
                        <span>{journal.requirement.slice(0, 50)}...</span>
                    </Tooltip>
                );
            case "executive":
                return <span>{journal.executive.username}</span>;
            case "journal_name":
                return (
                    <Tooltip content={journal.journal_name}>
                        <span>{journal.journal_name.slice(0, 30)}...</span>
                    </Tooltip>
                );
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
            case "journal_link":
                return (
                    <Tooltip content={journal.journal_link}>
                        <Button
                            size="sm"
                            variant="light"
                            color="primary"
                            as="a"
                            href={journal.journal_link}
                            target="_blank"
                        >
                            Visit
                        </Button>
                    </Tooltip>
                );
            case "credentials":
                return (
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span> {journal.username}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span>{journal.password}</span>
                            {/* <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                onClick={(e) => handlePasswordToggle(e, journal.id)}
                            >
                                {showPassword[journal.id] ? (
                                    <EyeSlashIcon className="h-4 w-4" />
                                ) : (
                                    <EyeIcon className="h-4 w-4" />
                                )}
                            </Button> */}
                        </div>
                    </div>
                );
            default:
                return <span>{journal[key as keyof JournalData]?.toString()}</span>;
        }
    };

    return (
        <div className="p-4">
            <Card>
                <CardHeader className="flex justify-between items-center px-6 py-4">
                    <h1 className="text-2xl font-bold">Journal Management</h1>
                    <div className="flex-1 max-w-md ml-4">
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
                </CardHeader>
                <CardBody>
                    {isLoading ? (
                        <LoadingSpinner text="Loading journals..." />
                    ) : (
                        <Table
                            aria-label="Journals table"
                            bottomContent={
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
                                        className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                        onClick={() => router.push(`/editor/view/journal/${journal.id}`)}
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
                    )}
                </CardBody>
            </Card>
        </div>
    );
};

export default withEditorAuth(JournalsEditorPage);