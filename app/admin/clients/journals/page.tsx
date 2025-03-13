"use client";
import React from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Input,
  Card,
  CardHeader,
  CardBody,
  Chip,
  Tooltip,
  Pagination,
  Spinner,
} from "@heroui/react";
import { WithAdminAuth } from "@/components/withAdminAuth";
import api, { JournalData } from "@/services/api";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { currentUserHasPermission, PERMISSIONS, isSuperAdmin } from '@/utils/permissions';

const JournalsAdminPage = () => {
  const [journals, setJournals] = React.useState<JournalData[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [filterValue, setFilterValue] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [clickedRowId, setClickedRowId] = React.useState<number | null>(null);
  const [canClickRows, setCanClickRows] = React.useState(false);
  const [userIsSuperAdmin, setUserIsSuperAdmin] = React.useState(false);
  const rowsPerPage = 10;
  const router = useRouter();

  React.useEffect(() => {
    // Check permissions
    const userData = api.getStoredUser();
    setUserIsSuperAdmin(userData?.role?.entity_type === 'SupAdmin');
    
    if (userData?.role?.entity_type !== 'SupAdmin') {
      setCanClickRows(currentUserHasPermission(PERMISSIONS.CLICK_JOURNAL_ROWS_ADMIN));
    } else {
      setCanClickRows(true); // SuperAdmin can always click rows
    }

    const fetchJournals = async () => {
      try {
        setIsLoading(true);
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
    { key: "reg_id", label: "REG NUMBER" },
    { key: "client_name", label: "CLIENT NAME" },
    { key: "executive", label: "EXECUTIVE" },
    { key: "journal_name", label: "JOURNAL" },
    { key: "status", label: "STATUS" },
    { key: "paper_title", label: "PAPER TITLE" },
  ];

  const filteredItems = React.useMemo(() => {
    return journals.filter((journal) =>
      journal.client_name.toLowerCase().includes(filterValue.toLowerCase()) ||
      journal.journal_name.toLowerCase().includes(filterValue.toLowerCase()) ||
      (journal.prospectus.reg_id && journal.prospectus.reg_id.toLowerCase().includes(filterValue.toLowerCase()))
    );
  }, [journals, filterValue]);

  const pages = Math.ceil(filteredItems.length / rowsPerPage);
  const items = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredItems.slice(start, end);
  }, [page, filteredItems]);

  const handleRowClick = (journalId: number) => {
    if (userIsSuperAdmin || canClickRows) {
      console.log('Row clicked, navigating to:', `/admin/clients/journals/${journalId}`);
      setClickedRowId(journalId);
      
      setTimeout(() => {
        router.push(`/admin/clients/journals/${journalId}`);
      }, 100);
    }
  };

  const renderCell = (journal: JournalData, key: string): React.ReactNode => {
    switch(key) {
      case "id":
        return <span>{journal.id}</span>;
      case "reg_id":
        return <span>{journal.prospectus.reg_id}</span>;
      case "executive":
        return <span>{journal.entities.username}</span>;
      case "journal_name":
        return (
          <Tooltip content={journal.journal_name || ''}>
            <span>{journal.journal_name && journal.journal_name.length > 30 ? journal.journal_name.slice(0, 30) + '...' : journal.journal_name || 'N/A'}</span>
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
      case "paper_title":
        return (
          <Tooltip content={journal.paper_title || ''}>
            <span>{journal.paper_title && journal.paper_title.length > 40 ? journal.paper_title.slice(0, 40) + '...' : journal.paper_title || 'N/A'}</span>
          </Tooltip>
        );
      default:
        const value = journal[key as keyof JournalData];
        return <span>{value !== null && value !== undefined ? value.toString() : 'N/A'}</span>;
    }
  };

  return (
    <div className="w-full p-6">
      <Card>
        <CardHeader className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Journals Management</h1>
          <div className="flex-1 max-w-md ml-4">
            <Input
              isClearable
              placeholder="Search journals..."
              onChange={(e) => setFilterValue(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardBody>
          {isLoading ? (
            <div className="flex justify-center items-center h-[200px]">
              <Spinner size="lg" />
            </div>
          ) : (
            <Table 
              aria-label="Journals table"
              bottomContent={
                <div className="flex justify-center mt-4">
                  <Pagination
                    total={Math.ceil(filteredItems.length / rowsPerPage)}
                    page={page}
                    onChange={setPage}
                    showControls
                    showShadow
                    color="primary"
                  />
                </div>
              }
            >
              <TableHeader>
                {columns.map((column) => (
                  <TableColumn key={column.key}>
                    {column.label}
                  </TableColumn>
                ))}
              </TableHeader>
              <TableBody>
                {items.map((journal) => (
                  <TableRow 
                    key={journal.id}
                    className={`${(userIsSuperAdmin || canClickRows) ? "cursor-pointer hover:bg-default-100" : "cursor-default"}`}
                    onClick={() => handleRowClick(journal.id)}
                  >
                    {columns.map((column) => (
                      <TableCell key={`${journal.id}-${column.key}`}>
                        {renderCell(journal, column.key)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default WithAdminAuth(JournalsAdminPage, PERMISSIONS.SHOW_JOURNALS_TAB_ADMIN);
