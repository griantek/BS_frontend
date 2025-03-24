"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@heroui/card";
import { Spinner } from "@heroui/spinner";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Select, SelectItem, SelectProps } from "@heroui/select";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Pagination } from "@heroui/pagination";
import {
  PhoneIcon,
  BellAlertIcon,
  MagnifyingGlassIcon,
  ChevronRightIcon,
  XMarkIcon,
  CheckIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { AlertCircleIcon, CalendarDaysIcon } from "lucide-react";
import { format, parse, isValid, isAfter, isBefore, isPast } from "date-fns";
import api, { Lead } from "@/services/api";
import { useRouter } from "next/navigation";
// Import the appropriate auth HOC
import { withExecutiveAuth } from "@/components/withExecutiveAuth";

const FollowupsPage = () => {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterDomain, setFilterDomain] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("pending"); // Default to pending
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [domains, setDomains] = useState<string[]>([]);
  
  // Add pagination state
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchFollowups();
  }, [router]);

  // Extract unique filter options when leads data changes
  useEffect(() => {
    if (leads.length > 0) {
      const domainsSet = new Set<string>();

      leads.forEach((lead) => {
        if (lead.domain) domainsSet.add(lead.domain);
      });

      setDomains(Array.from(domainsSet));
    }
  }, [leads]);

  const fetchFollowups = async () => {
    try {
      setLoading(true);
      // Using getAllLeads for now - ideally would have a dedicated endpoint for followups
      const response = await api.getAllLeads();
      if (response && response.data) {
        // Filter to only include leads with followup_date
        const followupLeads = response.data.filter(lead => lead.followup_date);
        setLeads(followupLeads);
        setTotalCount(followupLeads.length);
      }
    } catch (err) {
      console.error("Error fetching followups:", err);
      setError("Failed to load followups. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return "N/A";

    try {
      // For YYYY-MM-DD format (e.g., "2024-10-12")
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const parsedDate = parse(dateString, "yyyy-MM-dd", new Date());
        if (isValid(parsedDate)) {
          return format(parsedDate, "MMM dd, yyyy");
        }
      }

      // For ISO date strings
      const date = new Date(dateString);
      if (isValid(date)) {
        return format(date, "MMM dd, yyyy");
      }

      return dateString; // Return original if parsing fails
    } catch (e) {
      console.error("Date parsing error:", e);
      return dateString; // Return original on error
    }
  };

  // Determine follow-up status based on date
  const getFollowupStatus = (followupDate: string | undefined | null): 'upcoming' | 'today' | 'overdue' => {
    if (!followupDate) return 'upcoming';
    
    try {
      const parsedDate = parse(followupDate, 'yyyy-MM-dd', new Date());
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Normalize today's date

      if (isAfter(parsedDate, today)) return 'upcoming';
      if (isBefore(parsedDate, today)) return 'overdue';
      return 'today';
    } catch {
      return 'upcoming';
    }
  };

  // Filter leads based on selected filters and search query
  const filteredLeads = leads.filter((lead) => {
    let matches = true;

    if (filterDomain && lead.domain !== filterDomain) {
      matches = false;
    }

    // Filter by followup status (pending/completed)
    if (filterStatus && lead.followup_status !== filterStatus) {
      matches = false;
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const searchMatches =
        lead.client_name?.toLowerCase().includes(query) ||
        false ||
        lead.phone_number?.includes(query) ||
        false ||
        lead.requirement?.toLowerCase().includes(query) ||
        false ||
        lead.domain?.toLowerCase().includes(query) ||
        false;

      if (!searchMatches) {
        matches = false;
      }
    }

    return matches;
  });

  // Sort leads by followup date (oldest first)
  const sortedLeads = filteredLeads.sort((a, b) => {
    if (!a.followup_date) return 1; // null dates go to end
    if (!b.followup_date) return -1;
    return a.followup_date.localeCompare(b.followup_date);
  });

  // Calculate pagination values
  const pages = Math.ceil(sortedLeads.length / rowsPerPage);
  const items = sortedLeads.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handle select changes with proper typing
  const handleDomainChange: SelectProps["onChange"] = (e) => {
    setFilterDomain(e.target.value);
    setPage(1);
  };

  const handleStatusChange: SelectProps["onChange"] = (e) => {
    setFilterStatus(e.target.value);
    setPage(1);
  };

  const handleRowsPerPageChange: SelectProps["onChange"] = (e) => {
    setRowsPerPage(Number(e.target.value));
    setPage(1);
  };

  // Reset pagination when search query changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  // Handle row click to navigate to lead details - use the executive path
  const handleLeadRowClick = (leadId: number) => {
    router.push(`/business/executive/leads/${leadId}`);
  };

  // Mark as completed function
  const markAsCompleted = async (leadId: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click when clicking the button
    
    try {
      const lead = leads.find(l => l.id === leadId);
      if (!lead) return;
      
      await api.updateLeadStatus(leadId, {
        followup_status: 'converted',
        remarks: lead.remarks
      });
      
      // Refresh the leads data
      fetchFollowups();
    } catch (err) {
      console.error('Error updating followup status:', err);
    }
  };

  // Add a function to clear all filters
  const clearAllFilters = () => {
    setFilterDomain("");
    setFilterStatus("pending"); // Reset to default pending
    setSearchQuery("");
    setPage(1);
  };

  // Check if any filters are applied
  const hasActiveFilters =
    filterDomain !== "" ||
    filterStatus !== "pending" ||
    searchQuery !== "";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary-500 dark:bg-primary-600 text-white">
        <div className="max-w-7xl mx-auto p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              <h1 className="text-3xl font-bold">Follow-ups</h1>
              <p className="mt-2 opacity-90">
                Manage and track all scheduled follow-ups
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex gap-2">
              {/* Header buttons if needed */}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6">
        {/* Filters Panel */}
        <Card className="p-0 shadow-md rounded-lg overflow-hidden mb-6">
          <div className="bg-default-50 dark:bg-default-100/5 p-4 border-b border-divider">
            <h2 className="text-lg font-semibold flex items-center text-foreground">
              <BellAlertIcon className="h-5 w-5 mr-2 text-warning" />
              Follow-up Filters
            </h2>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Search"
                startContent={
                  <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                }
                placeholder="Name, phone, requirements..."
                value={searchQuery}
                onChange={handleSearchChange}
              />

              <Select
                label="Domain"
                placeholder="Filter by domain"
                selectedKeys={filterDomain ? [filterDomain] : []}
                onChange={handleDomainChange}
              >
                <SelectItem key="" value="">
                  All Domains
                </SelectItem>
                {
                  domains.map((domain) => (
                    <SelectItem key={domain} value={domain}>
                      {domain}
                    </SelectItem>
                  )) as any
                }
              </Select>

              <Select
                label="Follow-up Status"
                placeholder="Filter by status"
                selectedKeys={[filterStatus]}
                onChange={handleStatusChange}
              >
                <SelectItem key="pending" value="pending">
                  Pending
                </SelectItem>
                <SelectItem key="completed" value="completed">
                  Completed
                </SelectItem>
                <SelectItem key="" value="">
                  All Statuses
                </SelectItem>
              </Select>
            </div>

            {hasActiveFilters && (
              <div className="mt-4 pt-3 border-t border-divider flex items-center justify-between">
                <div className="text-sm text-foreground-500">
                  <span className="font-medium">{filteredLeads.length}</span>{" "}
                  follow-ups found
                </div>
                <Button
                  color="warning"
                  variant="flat"
                  onClick={clearAllFilters}
                  size="sm"
                  endContent={<XMarkIcon className="h-4 w-4" />}
                >
                  Reset Filters
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Follow-up Table Section */}
        <Card className="p-0 shadow-md rounded-lg overflow-hidden mb-6">
          <div className="bg-default-50 dark:bg-default-100/5 p-4 border-b border-divider flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Follow-up Schedule
              </h2>
              <p className="text-foreground-400 text-sm mt-1">
                {filteredLeads.length === 0
                  ? "No follow-ups found"
                  : `Showing ${(page - 1) * rowsPerPage + 1} to ${Math.min(page * rowsPerPage, filteredLeads.length)} of ${filteredLeads.length} follow-ups`}
              </p>
            </div>
            <Button
              size="sm"
              color="primary"
              variant="flat"
              onClick={fetchFollowups}
              isDisabled={loading}
            >
              Refresh
            </Button>
          </div>

          {/* Follow-ups Table */}
          <div className="overflow-hidden" id="followups-table">
            {loading ? (
              <div className="flex flex-col justify-center items-center py-16 bg-content1">
                <Spinner size="lg" color="primary" />
                <p className="mt-4 text-foreground-400">Loading follow-ups...</p>
              </div>
            ) : error ? (
              <div className="flex justify-center items-center py-16 bg-content1 text-danger">
                <div className="text-center">
                  <AlertCircleIcon className="h-12 w-12 mx-auto mb-2" />
                  <p className="font-medium">{error}</p>
                  <Button
                    color="danger"
                    variant="flat"
                    className="mt-4"
                    onClick={fetchFollowups}
                  >
                    Retry
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table
                    aria-label="Follow-ups table"
                    classNames={{
                      th: "bg-default-50 dark:bg-default-100/5 text-foreground-500",
                    }}
                  >
                    <TableHeader>
                      <TableColumn>FOLLOW-UP DATE</TableColumn>
                      <TableColumn>CLIENT NAME</TableColumn>
                      <TableColumn>PHONE</TableColumn>
                      <TableColumn>DOMAIN</TableColumn>
                      <TableColumn>REMARKS</TableColumn>
                      <TableColumn>STATUS</TableColumn>
                      <TableColumn>ACTIONS</TableColumn>
                    </TableHeader>
                    <TableBody
                      emptyContent={
                        <div className="py-12">
                          <p className="text-center text-foreground-500 font-medium">
                            No follow-ups found
                          </p>
                          <p className="text-center text-foreground-400 text-sm mt-1">
                            Try changing your search or filter criteria
                          </p>
                        </div>
                      }
                    >
                      {items.map((lead) => {
                        const followupStatus = getFollowupStatus(lead.followup_date);
                        
                        return (
                          <TableRow
                            key={lead.id}
                            className="hover:bg-default-100 dark:hover:bg-default-50/10 transition-colors cursor-pointer"
                            onClick={() => handleLeadRowClick(lead.id)}
                          >
                            <TableCell>
                              <div className={`flex items-center gap-2 ${
                                followupStatus === 'overdue' 
                                  ? 'text-danger' 
                                  : followupStatus === 'today' 
                                    ? 'text-warning'
                                    : ''
                              }`}>
                                <CalendarDaysIcon className="h-4 w-4" />
                                {formatDate(lead.followup_date)}
                                {followupStatus === 'today' && (
                                  <span className="bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-300 text-xs px-2 py-0.5 rounded">
                                    Today
                                  </span>
                                )}
                                {followupStatus === 'overdue' && (
                                  <span className="bg-danger-100 text-danger-800 dark:bg-danger-900/30 dark:text-danger-300 text-xs px-2 py-0.5 rounded">
                                    Overdue
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              {lead.client_name || "-"}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 text-sm">
                                <PhoneIcon className="h-4 w-4 text-gray-400" />
                                {lead.phone_number || "-"}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">
                              {lead.domain === "Nill" ? "-" : lead.domain || "-"}
                            </TableCell>
                            <TableCell className="text-sm">
                              <div className="max-w-xs truncate">
                                {lead.remarks || "-"}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div
                                className={`px-2 py-1 rounded-full text-xs inline-block
                              ${
                                lead.followup_status === "pending"
                                  ? "bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-300"
                                  : lead.followup_status === "completed"
                                    ? "bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-300"
                                    : "bg-default-100 text-default-800 dark:bg-default-900/30 dark:text-default-300"
                              }`}
                              >
                                {lead.followup_status || "none"}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {lead.followup_status === 'pending' && (
                                  <Button
                                    size="sm"
                                    color="success"
                                    variant="flat"
                                    startContent={<CheckIcon className="h-4 w-4" />}
                                    onClick={(e) => markAsCompleted(lead.id, e)}
                                    className="min-w-0"
                                  >
                                    Mark Complete
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  color="primary"
                                  variant="light"
                                  endContent={<ChevronRightIcon className="h-4 w-4" />}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleLeadRowClick(lead.id);
                                  }}
                                  className="min-w-0"
                                >
                                  View
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {filteredLeads.length > 0 && (
                  <div className="px-6 py-4 bg-default-50 dark:bg-default-100/5 border-t border-divider">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="text-sm text-foreground-500">
                          Rows per page:
                        </div>
                        <Select
                          size="sm"
                          selectedKeys={[rowsPerPage.toString()]}
                          onChange={handleRowsPerPageChange}
                          className="w-20"
                        >
                          <SelectItem key="10" value="10">10</SelectItem>
                          <SelectItem key="20" value="20">20</SelectItem>
                          <SelectItem key="50" value="50">50</SelectItem>
                          <SelectItem key="100" value="100">100</SelectItem>
                        </Select>
                      </div>
                      
                      <Pagination
                        total={pages}
                        page={page}
                        onChange={handlePageChange}
                        showControls={true}
                        variant="light"
                        size="sm"
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

// Export with auth HOC wrapper - may need to update for executive role
export default withExecutiveAuth(FollowupsPage);
