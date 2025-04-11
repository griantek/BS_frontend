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
  UsersIcon,
  PhoneIcon,
  UserPlusIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ChevronRightIcon,
  XMarkIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { AlertCircleIcon, CalendarDaysIcon } from "lucide-react";
import { format, parse, isValid } from "date-fns";
import api, { Lead } from "@/services/api";
import { useRouter } from "next/navigation";
import { withExecutiveAuth } from "@/components/withExecutiveAuth";

const AllLeadsPage = () => {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterSource, setFilterSource] = useState<string>("");
  const [filterDomain, setFilterDomain] = useState<string>("");
  const [filterProspectusType, setFilterProspectusType] = useState<string>("");
  const [filterFollowupStatus, setFilterFollowupStatus] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [leadSources, setLeadSources] = useState<string[]>([]);
  const [leadDomains, setLeadDomains] = useState<string[]>([]);
  const [prospectusTypes, setProspectusTypes] = useState<string[]>([]);

  // Add pagination state
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [totalCount, setTotalCount] = useState(0);

  // Add new state to track which lead is being viewed
  const [viewingLeadId, setViewingLeadId] = useState<number | null>(null);

  useEffect(() => {
    fetchLeads();
  }, [router, page, rowsPerPage]);

  // Extract unique filter options when leads data changes
  useEffect(() => {
    if (leads.length > 0) {
      const sourcesSet = new Set<string>();
      const domainsSet = new Set<string>();
      const prospectusTypesSet = new Set<string>();

      leads.forEach((lead) => {
        if (lead.lead_source) sourcesSet.add(lead.lead_source);
        if (lead.domain) domainsSet.add(lead.domain);
        if (lead.prospectus_type) prospectusTypesSet.add(lead.prospectus_type);
      });

      setLeadSources(Array.from(sourcesSet));
      setLeadDomains(Array.from(domainsSet));
      setProspectusTypes(Array.from(prospectusTypesSet));
    }
  }, [leads]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const response = await api.getAllLeads();
      if (response && response.data) {
        setLeads(response.data);
        setTotalCount(response.data.length);
      }
    } catch (err) {
      console.error("Error fetching leads:", err);
      setError("Failed to load leads. Please try again later.");
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

  // Filter leads based on selected filters and search query
  const filteredLeads = leads.filter((lead) => {
    let matches = true;

    if (filterSource && lead.lead_source !== filterSource) {
      matches = false;
    }

    if (filterDomain && lead.domain !== filterDomain) {
      matches = false;
    }

    if (filterProspectusType && lead.prospectus_type !== filterProspectusType) {
      matches = false;
    }

    if (filterFollowupStatus && lead.followup_status !== filterFollowupStatus) {
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

  // Calculate pagination values
  const pages = Math.ceil(filteredLeads.length / rowsPerPage);
  const items = filteredLeads.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handle select changes with proper typing
  const handleSourceChange: SelectProps["onChange"] = (e) => {
    setFilterSource(e.target.value);
    setPage(1);
  };

  const handleDomainChange: SelectProps["onChange"] = (e) => {
    setFilterDomain(e.target.value);
    setPage(1);
  };

  const handleProspectusTypeChange: SelectProps["onChange"] = (e) => {
    setFilterProspectusType(e.target.value);
    setPage(1);
  };

  const handleFollowupStatusChange: SelectProps["onChange"] = (e) => {
    setFilterFollowupStatus(e.target.value);
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

  // Handle row click to navigate to lead details - use correct executive path
  const handleLeadRowClick = (leadId: number) => {
    setViewingLeadId(leadId);
    router.push(`/business/executive/leads/${leadId}`);
  };

  // Add a function to clear all filters
  const clearAllFilters = () => {
    setFilterSource("");
    setFilterDomain("");
    setFilterProspectusType("");
    setFilterFollowupStatus("");
    setSearchQuery("");
    setPage(1);
  };

  // Check if any filters are applied
  const hasActiveFilters =
    filterSource !== "" ||
    filterDomain !== "" ||
    filterProspectusType !== "" ||
    filterFollowupStatus !== "" ||
    searchQuery !== "";

  // Handle export to CSV (mock functionality)
  const exportToCSV = () => {
    // This would normally generate and download a CSV
    alert("Export functionality will be implemented here");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary-500 dark:bg-primary-600 text-white">
        <div className="max-w-7xl mx-auto p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              <h1 className="text-3xl font-bold">Lead Management</h1>
              <p className="mt-2 opacity-90">
                View and manage all leads in the system
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex gap-2">
              <Button
                color="default"
                className="bg-white dark:bg-white/90 text-primary-600"
                startContent={<UserPlusIcon className="h-4 w-4" />}
                size="md"
                onClick={() => {
                  router.push("/business/executive/leads/add");
                }}
              >
                Add New Lead
              </Button>
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
              <FunnelIcon className="h-5 w-5 mr-2 text-primary" />
              Search & Filters
            </h2>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <Input
                label="Search leads"
                startContent={
                  <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                }
                placeholder="Name, phone, requirements..."
                value={searchQuery}
                onChange={handleSearchChange}
              />

              <Select
                label="Lead Source"
                placeholder="Filter by source"
                selectedKeys={filterSource ? [filterSource] : []}
                onChange={handleSourceChange}
              >
                <SelectItem key="" value="">
                  All Sources
                </SelectItem>
                {
                  leadSources.map((source) => (
                    <SelectItem key={source} value={source}>
                      {source}
                    </SelectItem>
                  )) as any
                }
              </Select>

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
                  leadDomains.map((domain) => (
                    <SelectItem key={domain} value={domain}>
                      {domain}
                    </SelectItem>
                  )) as any
                }
              </Select>

              <Select
                label="Prospect Type"
                placeholder="Filter by type"
                selectedKeys={
                  filterProspectusType ? [filterProspectusType] : []
                }
                onChange={handleProspectusTypeChange}
              >
                <SelectItem key="" value="">
                  All Types
                </SelectItem>
                {
                  prospectusTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  )) as any
                }
              </Select>

              <Select
                label="Followup Status"
                placeholder="Filter by followup status"
                selectedKeys={
                  filterFollowupStatus ? [filterFollowupStatus] : []
                }
                onChange={handleFollowupStatusChange}
              >
                <SelectItem key="" value="">
                  All Statuses
                </SelectItem>
                <SelectItem key="pending" value="pending">
                  Pending
                </SelectItem>
                <SelectItem key="completed" value="completed">
                  Completed
                </SelectItem>
                <SelectItem key="overdue" value="overdue">
                  Overdue
                </SelectItem>
              </Select>

              <Select
                label="Rows per page"
                selectedKeys={[rowsPerPage.toString()]}
                onChange={handleRowsPerPageChange}
              >
                <SelectItem key="10" value="10">
                  10
                </SelectItem>
                <SelectItem key="20" value="20">
                  20
                </SelectItem>
                <SelectItem key="50" value="50">
                  50
                </SelectItem>
                <SelectItem key="100" value="100">
                  100
                </SelectItem>
              </Select>
            </div>

            {hasActiveFilters && (
              <div className="mt-4 pt-3 border-t border-divider flex items-center justify-between">
                <div className="text-sm text-foreground-500">
                  <span className="font-medium">{filteredLeads.length}</span>{" "}
                  results found
                </div>
                <Button
                  color="warning"
                  variant="flat"
                  onClick={clearAllFilters}
                  size="sm"
                  endContent={<XMarkIcon className="h-4 w-4" />}
                >
                  Clear All Filters
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Leads Table Section */}
        <Card className="p-0 shadow-md rounded-lg overflow-hidden mb-6">
          <div className="bg-default-50 dark:bg-default-100/5 p-4 border-b border-divider flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                All Leads
              </h2>
              <p className="text-foreground-400 text-sm mt-1">
                {filteredLeads.length === 0
                  ? "No results found"
                  : `Showing ${(page - 1) * rowsPerPage + 1} to ${Math.min(page * rowsPerPage, filteredLeads.length)} of ${filteredLeads.length} leads`}
              </p>
            </div>
            <Button
              color="primary"
              variant="light"
              startContent={<ArrowPathIcon className="h-4 w-4" />}
              onClick={fetchLeads}
              isDisabled={loading}
            >
              Refresh
            </Button>
          </div>

          {/* Leads Table */}
          <div className="overflow-hidden" id="leads-table">
            {loading ? (
              <div className="flex flex-col justify-center items-center py-16 bg-content1">
                <Spinner size="lg" color="primary" />
                <p className="mt-4 text-foreground-400">Loading leads...</p>
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
                    onClick={fetchLeads}
                  >
                    Retry
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table
                    aria-label="Leads table"
                    classNames={{
                      th: "bg-default-50 dark:bg-default-100/5 text-foreground-500",
                    }}
                  >
                    <TableHeader>
                      <TableColumn>ID</TableColumn>
                      <TableColumn>DATE</TableColumn>
                      <TableColumn>LEAD SOURCE</TableColumn>
                      <TableColumn>CLIENT NAME</TableColumn>
                      <TableColumn>CONTACT</TableColumn>
                      <TableColumn>DOMAIN</TableColumn>
                      <TableColumn>REQUIREMENT</TableColumn>
                      <TableColumn>PROSPECT TYPE</TableColumn>
                      <TableColumn>FOLLOWUP DATE</TableColumn>
                      <TableColumn>STATUS</TableColumn>
                      <TableColumn>ACTIONS</TableColumn>
                    </TableHeader>
                    <TableBody
                      emptyContent={
                        <div className="py-12">
                          <p className="text-center text-foreground-500 font-medium">
                            No leads found
                          </p>
                          <p className="text-center text-foreground-400 text-sm mt-1">
                            Try changing your search or filter criteria
                          </p>
                        </div>
                      }
                    >
                      {items.map((lead) => (
                        <TableRow
                          key={lead.id}
                          className="hover:bg-default-100 dark:hover:bg-default-50/10 transition-colors"
                        >
                          <TableCell className="text-xs font-mono">
                            {lead.id}
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatDate(lead.date)}
                          </TableCell>
                          <TableCell className="text-sm">
                            {lead.lead_source || "N/A"}
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
                              {lead.requirement || "-"}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {lead.prospectus_type || "-"}
                          </TableCell>
                          <TableCell className="text-sm">
                            {lead.followup_date ? (
                              <div className="flex items-center gap-1">
                                <CalendarDaysIcon className="h-4 w-4 text-gray-400" />
                                {formatDate(lead.followup_date)}
                              </div>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>
                            <div
                              className={`px-2 py-1 rounded-full text-xs inline-block
                            ${
                              lead.followup_status === "converted"
                                ? "bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-300"
                                : "bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-300"
                            }`}
                            >
                              {lead.followup_status === "converted"
                                ? "Converted"
                                : "Pending"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              color="primary"
                              variant="light"
                              endContent={
                                viewingLeadId === lead.id ? (
                                  <Spinner size="sm" color="primary" />
                                ) : (
                                  <ChevronRightIcon className="h-4 w-4" />
                                )
                              }
                              isLoading={viewingLeadId === lead.id}
                              isDisabled={viewingLeadId === lead.id}
                              onClick={() => handleLeadRowClick(lead.id)}
                            >
                              {viewingLeadId === lead.id ? "Loading..." : "View"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {filteredLeads.length > 0 && (
                  <div className="px-6 py-4 bg-default-50 dark:bg-default-100/5 border-t border-divider">
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-foreground-500">
                        Total: {filteredLeads.length} leads
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

// Export with auth HOC wrapper - update to use executive auth if needed
export default withExecutiveAuth(AllLeadsPage);
