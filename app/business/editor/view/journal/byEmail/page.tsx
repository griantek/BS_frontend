"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Spinner,
  Input,
  Chip,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination
} from "@heroui/react";
import { withEditorAuth } from "@/components/withEditorAuth";
import api, { JournalData } from "@/services/api";
import { toast } from "react-toastify";
import { EnvelopeIcon, MagnifyingGlassIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useDebounce } from '@/hooks/useDebounce';

function JournalsByEmailPage() {
  const router = useRouter();
  const pathname = usePathname();
  
  // State for loading and data
  const [loading, setLoading] = useState(true);
  const [emails, setEmails] = useState<string[]>([]);
  const [filteredEmails, setFilteredEmails] = useState<string[]>([]);
  const [emailCounts, setEmailCounts] = useState<Record<string, number>>({});
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useDebounce(searchQuery, 500);
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [totalEmails, setTotalEmails] = useState(0);
  const rowsPerPage = 10;
  
  // Determine if this component is being rendered directly or within tabs
  const isStandalone = pathname === '/business/editor/view/journal/byEmail';

  // Fetch journals data using the new simple API endpoint
  const fetchEmailsData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get the current user from stored auth
      const user = api.getStoredUser();
      if (!user?.id) {
        throw new Error("User ID not found");
      }
      
      // Use the new simple API function without pagination parameters
      const response = await api.getJournalDataByEditorSimple(user.id);
      
      if (response.success) {
        // Extract unique emails and count occurrences
        const emailMap: Record<string, number> = {};
        const journalsData = response.data;
        
        journalsData.forEach((journal: JournalData) => {
          if (journal.personal_email) {
            // Filter by search term if present
            if (!debouncedSearchQuery || 
                journal.personal_email.toLowerCase().includes(debouncedSearchQuery.toLowerCase())) {
              emailMap[journal.personal_email] = (emailMap[journal.personal_email] || 0) + 1;
            }
          }
        });
        
        const uniqueEmails = Object.keys(emailMap);
        setEmails(uniqueEmails);
        setFilteredEmails(uniqueEmails);
        setEmailCounts(emailMap);
        setTotalEmails(uniqueEmails.length);
      }
    } catch (error) {
      const errorMessage = api.handleError(error);
      toast.error(errorMessage.error || "Failed to load emails");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchQuery]);

  // Fetch data when component mounts or search changes
  useEffect(() => {
    fetchEmailsData();
  }, [fetchEmailsData]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1); // Reset to first page when search changes
  };

  const handleEmailClick = (email: string) => {
    // URL encode the email to handle special characters
    const encodedEmail = encodeURIComponent(email);
    router.push(`/business/editor/view/journal/byEmail/${encodedEmail}`);
  };

  // Calculate pagination on client side now
  const pages = Math.ceil(filteredEmails.length / rowsPerPage);
  const startIndex = (page - 1) * rowsPerPage;
  const paginatedEmails = filteredEmails.slice(startIndex, startIndex + rowsPerPage);

  // Remaining component code stays the same...
  return (
    <div className={isStandalone ? "p-6" : ""}>
      {isStandalone && (
        <Button
          isIconOnly
          variant="light"
          className="fixed top-4 left-4 z-50"
          onClick={() => router.push("/business/editor/journals")}
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </Button>
      )}

      <div className="w-full space-y-4">
        <div className="flex justify-between items-center">
          {isStandalone && <h1 className="text-2xl font-bold">Journals by Email</h1>}
          <Input
            startContent={<MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />}
            placeholder="Search emails..."
            value={searchQuery}
            onChange={handleSearch}
            className="max-w-md"
          />
        </div>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner size="lg" />
          </div>
        ) : filteredEmails.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No emails found
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableColumn>EMAIL</TableColumn>
                <TableColumn>JOURNALS COUNT</TableColumn>
                <TableColumn>ACTIONS</TableColumn>
              </TableHeader>
              <TableBody>
                {paginatedEmails.map((email) => (
                  <TableRow key={email}>
                    <TableCell className="flex items-center gap-2">
                      <EnvelopeIcon className="h-5 w-5 text-primary" />
                      {email}
                    </TableCell>
                    <TableCell>
                      <Chip size="sm" color="primary">
                        {emailCounts[email] || 0}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        color="primary"
                        onClick={() => handleEmailClick(email)}
                      >
                        View Journals
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {pages > 1 && (
              <div className="flex justify-center mt-4">
                <Pagination
                  total={pages}
                  page={page}
                  onChange={setPage}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default withEditorAuth(JournalsByEmailPage);
