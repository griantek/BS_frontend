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
// Remove Badge import
import { Select, SelectItem, SelectProps } from "@heroui/select";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Pagination } from "@heroui/pagination";
import {
  UsersIcon,
  PhoneIcon,
  UserPlusIcon,
  ClockIcon,
  FunnelIcon,
  BellAlertIcon,
  MagnifyingGlassIcon,
  ChevronRightIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";
import { AlertCircleIcon, CalendarDaysIcon } from "lucide-react";

import { format, parse, isValid } from "date-fns";
import api, { Lead, TodayFollowupResponse } from "@/services/api";
import { checkAuth } from "@/utils/authCheck";
import { useRouter } from "next/navigation";

const LeadsPage = () => {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterSource, setFilterSource] = useState<string>("");
  const [filterDomain, setFilterDomain] = useState<string>("");
  const [filterProspectusType, setFilterProspectusType] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [leadSources, setLeadSources] = useState<string[]>([]);
  const [leadDomains, setLeadDomains] = useState<string[]>([]);
  const [prospectusTypes, setProspectusTypes] = useState<string[]>([]);
  
  // Add state for today's follow-ups
  const [todayFollowups, setTodayFollowups] = useState<Lead[]>([]);
  const [followupsLoading, setFollowupsLoading] = useState(true);
  const [followupsError, setFollowupsError] = useState<string | null>(null);

  // Add pagination state
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  // Stats derived from leads data
  const [stats, setStats] = useState({
    totalLeads: 0,
    newLeadsToday: 0,
    pendingFollowup: 0,
    conversionRate: 0,
  });

  useEffect(() => {
    checkAuth(router, "leads");
    fetchUnapprovedLeads();
    fetchTodayFollowups();
  }, [router]);

  // Extract unique sources, domains, and prospectus types when leads data changes
  useEffect(() => {
    if (leads.length > 0) {
      // Fix the Set iteration issue by converting to Array right away
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

  const fetchUnapprovedLeads = async () => {
    try {
      setLoading(true);
      const response = await api.getAllUnapprovedLeads();
      if (response && response.data) {
        setLeads(response.data);
        calculateStats(response.data);
      }
    } catch (err) {
      console.error("Error fetching leads:", err);
      setError("Failed to load leads. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Add new function to fetch today's follow-up leads
  const fetchTodayFollowups = async () => {
    try {
      setFollowupsLoading(true);
      const response = await api.getTodayFollowupLeads();
      if (response && response.data && response.data) {
        // Ensure we're handling the nested data structure correctly
        setTodayFollowups(response.data);
      } else {
        // Set to empty array if data structure is different
        setTodayFollowups([]);
      }
    } catch (err) {
      console.error("Error fetching today's followups:", err);
      setFollowupsError("Failed to load today's followups. Please try again later.");
      setTodayFollowups([]); // Ensure we have an empty array on error
    } finally {
      setFollowupsLoading(false);
    }
  };

  const calculateStats = (leadsData: Lead[]) => {
    // Calculate total leads
    const total = leadsData.length;

    // Calculate new leads today
    const today = new Date();
    const todayString = today.toISOString().split("T")[0]; // Format: YYYY-MM-DD

    const newToday = leadsData.filter((lead) => {
      return lead.date === todayString;
    }).length;

    // Calculate pending follow-up leads
    const pending = leadsData.filter((lead) => {
      return lead.remarks?.toLowerCase().includes("followup") || false;
    }).length;

    // For conversion rate calculation
    const converted = leadsData.filter((lead) => {
      return (
        lead.status === "converted" ||
        lead.remarks?.toLowerCase().includes("converted") ||
        false
      );
    }).length;

    const rate = total > 0 ? Math.round((converted / total) * 100) : 0;

    setStats({
      totalLeads: total,
      newLeadsToday: newToday,
      pendingFollowup: pending,
      conversionRate: rate,
    });
  };

  // Filter leads based on selected filters and search query
  const filteredLeads = leads.filter((lead) => {
    let matches = true;

    if (filterSource && lead.lead_source !== filterSource) {
      matches = false;
    }

    // Use domain for filtering (removed service filter)
    if (filterDomain && lead.domain !== filterDomain) {
      matches = false;
    }

    // Add prospectus type filter
    if (filterProspectusType && lead.prospectus_type !== filterProspectusType) {
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

    // Scroll to top of table when changing pages
    const tableElement = document.getElementById("leads-table");
    if (tableElement) {
      tableElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Format date for display - improved to handle YYYY-MM-DD format
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

  // Handle select changes with proper typing
  const handleSourceChange: SelectProps["onChange"] = (e) => {
    setFilterSource(e.target.value);
    setPage(1); // Reset to first page when filter changes
  };

  const handleDomainChange: SelectProps["onChange"] = (e) => {
    setFilterDomain(e.target.value);
    setPage(1); // Reset to first page when filter changes
  };

  const handleProspectusTypeChange: SelectProps["onChange"] = (e) => {
    setFilterProspectusType(e.target.value);
    setPage(1); // Reset to first page when filter changes
  };

  // Reset pagination when search query changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1); // Reset to first page when search changes
  };

  // Handle row click to navigate to lead details
  const handleLeadRowClick = (leadId: number) => {
    router.push(`/business/leads/${leadId}`);
  };

  // Add a function to clear all filters
  const clearAllFilters = () => {
    setFilterSource("");
    setFilterDomain("");
    setFilterProspectusType("");
    setSearchQuery("");
    setPage(1);
  };

  // Check if any filters are applied
  const hasActiveFilters = filterSource !== "" || filterDomain !== "" || filterProspectusType !== "" || searchQuery !== "";

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section with gradient background */}
      <div className="bg-primary-500 dark:bg-primary-600 text-white">
        <div className="max-w-7xl mx-auto p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              <h1 className="text-3xl font-bold">Leads Dashboard</h1>
              <p className="mt-2 opacity-90">Manage and track all your leads in one place</p>
            </div>

            <Button
              color="default"
              className="mt-4 sm:mt-0 bg-white dark:bg-white/90 text-primary-600"
              startContent={<UserPlusIcon className="h-4 w-4" />}
              size="lg"
              onClick={() => {
                router.push("/business/leads/add");
              }}
            >
              Add New Lead
            </Button>
          </div>
        </div>
      </div>

      {/* Main content with negative margin for overlapping effect */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-8">
        {/* Stats Cards - with elevated appearance */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <Card className="p-5 shadow-md rounded-lg hover:shadow-lg transition-shadow bg-content1 overflow-hidden relative">
            <div className="flex items-center">
              <div className="bg-primary/10 p-3 rounded-full">
                <UsersIcon className="h-6 w-6 text-primary" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-foreground-400">
                  Total Leads
                </p>
                <h3 className="text-2xl font-bold text-foreground">{stats.totalLeads}</h3>
              </div>
            </div>
            <div className="absolute -right-3 -top-3 w-16 h-16 bg-primary/5 rounded-full"></div>
          </Card>

          <Card className="p-5 shadow-md rounded-lg hover:shadow-lg transition-shadow bg-content1 overflow-hidden relative">
            <div className="flex items-center">
              <div className="bg-success/10 p-3 rounded-full">
                <UserPlusIcon className="h-6 w-6 text-success" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-foreground-400">New Today</p>
                <h3 className="text-2xl font-bold text-foreground">{stats.newLeadsToday}</h3>
              </div>
            </div>
            <div className="absolute -right-3 -top-3 w-16 h-16 bg-success/5 rounded-full"></div>
          </Card>

          <Card className="p-5 shadow-md rounded-lg hover:shadow-lg transition-shadow bg-content1 overflow-hidden relative">
            <div className="flex items-center">
              <div className="bg-warning/10 p-3 rounded-full">
                <ClockIcon className="h-6 w-6 text-warning" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-foreground-400">
                  Pending Follow-up
                </p>
                <h3 className="text-2xl font-bold text-foreground">{stats.pendingFollowup}</h3>
              </div>
            </div>
            <div className="absolute -right-3 -top-3 w-16 h-16 bg-warning/5 rounded-full"></div>
          </Card>

          <Card className="p-5 shadow-md rounded-lg hover:shadow-lg transition-shadow bg-content1 overflow-hidden relative">
            <div className="flex items-center">
              <div className="bg-secondary/10 p-3 rounded-full">
                <FunnelIcon className="h-6 w-6 text-secondary" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-foreground-400">
                  Conversion Rate
                </p>
                <h3 className="text-2xl font-bold text-foreground">{stats.conversionRate}%</h3>
              </div>
            </div>
            <div className="absolute -right-3 -top-3 w-16 h-16 bg-secondary/5 rounded-full"></div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Today's Follow-ups Section - Left column, spans 2 columns */}
          <Card className="p-0 shadow-md rounded-lg overflow-hidden lg:col-span-2">
            <div className="bg-warning-50 dark:bg-warning-900/20 p-4 border-b border-warning-200 dark:border-warning-800">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold flex items-center text-warning-700 dark:text-warning-300">
                  <BellAlertIcon className="h-5 w-5 mr-2 text-warning" />
                  Today&apos;s Follow-ups
                  {/* Remove badge component here */}
                  {!followupsLoading && todayFollowups.length > 0 && (
                    <span className="ml-2 text-sm font-medium">({todayFollowups.length})</span>
                  )}
                </h2>
                <Button 
                  size="sm"
                  color="warning"
                  variant="flat"
                  onClick={fetchTodayFollowups}
                >
                  Refresh
                </Button>
              </div>
            </div>
            
            <div className="p-4">
              {followupsLoading ? (
                <div className="flex justify-center items-center h-32">
                  <Spinner size="lg" />
                </div>
              ) : followupsError ? (
                <div className="text-center text-danger">{followupsError}</div>
              ) : todayFollowups.length === 0 ? (
                <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  <BellAlertIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-lg font-medium">No follow-ups scheduled for today</p>
                  <p className="text-sm mt-1">When you schedule follow-ups for today, they&apos;ll appear here</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-default-200 dark:border-default-100/10">
                  <Table aria-label="Today's follow-ups" isStriped>
                    <TableHeader>
                      <TableColumn className="bg-default-50 dark:bg-default-50/5 text-foreground-500">CLIENT NAME</TableColumn>
                      <TableColumn className="bg-default-50 dark:bg-default-50/5 text-foreground-500">PHONE</TableColumn>
                      <TableColumn className="bg-default-50 dark:bg-default-50/5 text-foreground-500">DOMAIN</TableColumn>
                      <TableColumn className="bg-default-50 dark:bg-default-50/5 text-foreground-500">REMARKS</TableColumn>
                      <TableColumn className="bg-default-50 dark:bg-default-50/5 text-foreground-500">ACTIONS</TableColumn>
                    </TableHeader>
                    <TableBody>
                      {todayFollowups.slice(0, 5).map((followup) => (
                        <TableRow key={followup.id} className="hover:bg-gray-500">
                          <TableCell className="font-medium ">{followup.client_name || "-"}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <PhoneIcon className="h-4 w-4 text-gray-400" />
                              {followup.phone_number || "-"}
                            </div>
                          </TableCell>
                          <TableCell>{followup.domain === "Nill" ? "-" : followup.domain || "-"}</TableCell>
                          {/* Replace Badge with regular text */}
                          <TableCell>
                            <span className="text-sm">{followup.remarks || "-"}</span>
                          </TableCell>
                          <TableCell>
                            <Button 
                              size="sm" 
                              color="primary" 
                              endContent={<ChevronRightIcon className="h-4 w-4" />}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLeadRowClick(followup.id);
                              }}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              
              {todayFollowups.length > 5 && (
                <div className="mt-4 text-right">
                  <Button
                    size="sm"
                    variant="light"
                    color="primary"
                    endContent={<ChevronRightIcon className="h-4 w-4" />}
                  >
                    View All ({todayFollowups.length})
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Search and Filters - Right column */}
          <Card className="p-0 shadow-md rounded-lg overflow-hidden">
            <div className="bg-primary-50 dark:bg-primary-900/20 p-4 border-b border-primary-200 dark:border-primary-800">
              <h3 className="text-lg font-semibold text-primary-700 dark:text-primary-300 flex items-center">
                <MagnifyingGlassIcon className="h-5 w-5 mr-2 text-primary" />
                Search & Filters
              </h3>
            </div>

            <div className="p-4">
              <div className="space-y-4">
                <Input
                  label="Search leads"
                  startContent={<MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />}
                  placeholder="Name, phone, requirements..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="mb-2"
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
                  selectedKeys={filterProspectusType ? [filterProspectusType] : []}
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
              </div>

              {hasActiveFilters && (
                <div className="mt-4 pt-4 border-t border-divider">
                  <Button 
                    color="warning" 
                    variant="flat"
                    onClick={clearAllFilters}
                    size="sm"
                    endContent={<XMarkIcon className="h-4 w-4" />}
                    className="w-full"
                  >
                    Clear All Filters
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* All Leads Table Section with curved borders and subtle shadow */}
        <div className="mb-10 bg-content1 rounded-xl shadow-md overflow-hidden border border-divider">
          <div className="bg-default-50 dark:bg-default-100/5 p-6 border-b border-divider">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-semibold text-foreground">Unapproved Leads</h2>
                <p className="text-foreground-400 text-sm mt-1">
                  {filteredLeads.length === 0 ? "No results found" : 
                   `Showing ${(page - 1) * rowsPerPage + 1} to ${Math.min(page * rowsPerPage, filteredLeads.length)} of ${filteredLeads.length} leads`}
                </p>
              </div>
              <div className="bg-content1 px-4 py-2 rounded-full shadow-sm text-sm text-foreground font-medium">
                {filteredLeads.length} leads found
              </div>
            </div>
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
                    onClick={fetchUnapprovedLeads}
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
                      <TableColumn>DATE</TableColumn>
                      <TableColumn>LEAD SOURCE</TableColumn>
                      <TableColumn>CLIENT NAME</TableColumn>
                      <TableColumn>CONTACT</TableColumn>
                      <TableColumn>DOMAIN</TableColumn>
                      <TableColumn>REQUIREMENT</TableColumn>
                      <TableColumn>PROSPECT TYPE</TableColumn>
                      <TableColumn>FOLLOWUP DATE</TableColumn>
                      <TableColumn>REMARKS</TableColumn>
                    </TableHeader>
                    <TableBody emptyContent={
                      <div className="py-8">
                        <p className="text-center text-foreground-500 font-medium">No leads found</p>
                        <p className="text-center text-foreground-400 text-sm mt-1">Try changing your search or filter criteria</p>
                      </div>
                    }>
                      {items.map((lead) => (
                        <TableRow
                          key={lead.id}
                          className="cursor-pointer hover:bg-gray-500 transition-colors"
                          onClick={() => handleLeadRowClick(lead.id)}
                        >
                          <TableCell className="text-sm">{formatDate(lead.date)}</TableCell>
                          <TableCell className="text-sm">{lead.lead_source || "N/A"}</TableCell>
                          <TableCell className="font-medium ">{lead.client_name || "-"}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-sm">
                              <PhoneIcon className="h-4 w-4 text-gray-400" />
                              {lead.phone_number || "-"}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {lead.domain === "Nill"
                              ? "-"
                              : lead.domain || "-"}
                          </TableCell>
                          <TableCell className="text-sm">
                            <div className="max-w-xs truncate">
                              {lead.requirement || "-"}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{lead.prospectus_type || "-"}</TableCell>
                          <TableCell className="text-sm">
                            {lead.followup_date ? (
                              <div className="flex items-center gap-1">
                                <CalendarDaysIcon className="h-4 w-4 text-gray-400" />
                                {formatDate(lead.followup_date)}
                              </div>
                            ) : "-"}
                          </TableCell>
                          {/* Replace Badge with regular text */}
                          <TableCell className="text-sm">
                            {lead.remarks || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination Component */}
                {filteredLeads.length > 0 && (
                  <div className="px-6 py-4 bg-default-50 dark:bg-default-100/5 border-t border-divider">
                    <div className="flex justify-center">
                      <Pagination
                        total={pages}
                        page={page}
                        onChange={handlePageChange}
                        showControls={true}
                        variant="light"
                        size="lg"
                        className="overflow-visible"
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Remove or comment out badge-related helper functions that are no longer needed
// const getBadgeColor = (status: string): "default" | "primary" | "secondary" | "success" | "warning" | "danger" => {
//   ...
// };

// const getBadgeLabel = (remarks: string): string => {
//   ...
// };

export default LeadsPage;
