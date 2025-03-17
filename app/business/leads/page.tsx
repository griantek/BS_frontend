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
import { Badge } from "@heroui/badge";
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
} from "@heroicons/react/24/outline";
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
    fetchLeads();
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

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const response = await api.getAllLeads();
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
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Leads Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center">
            <div className="bg-primary/10 p-3 rounded-full">
              <UsersIcon className="h-6 w-6 text-primary" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-default-500">
                Total Leads
              </p>
              <h3 className="text-xl font-bold">{stats.totalLeads}</h3>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="bg-success/10 p-3 rounded-full">
              <UserPlusIcon className="h-6 w-6 text-success" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-default-500">New Today</p>
              <h3 className="text-xl font-bold">{stats.newLeadsToday}</h3>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="bg-warning/10 p-3 rounded-full">
              <ClockIcon className="h-6 w-6 text-warning" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-default-500">
                Pending Follow-up
              </p>
              <h3 className="text-xl font-bold">{stats.pendingFollowup}</h3>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="bg-secondary/10 p-3 rounded-full">
              <FunnelIcon className="h-6 w-6 text-secondary" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-default-500">
                Conversion Rate
              </p>
              <h3 className="text-xl font-bold">{stats.conversionRate}%</h3>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="bg-warning/10 p-3 rounded-full">
              <BellAlertIcon className="h-6 w-6 text-warning" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-default-500">
                Today's Follow-ups
              </p>
              <h3 className="text-xl font-bold">{followupsLoading ? "..." : todayFollowups.length}</h3>
            </div>
          </div>
        </Card>
      </div>

      {/* Today's Follow-ups Section */}
      <Card className="p-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center">
            <BellAlertIcon className="h-5 w-5 mr-2 text-warning" />
            Today's Follow-ups
            {!followupsLoading && todayFollowups.length > 0 && (
              <Badge className="ml-2" color="warning" size="sm">
                {todayFollowups.length}
              </Badge>
            )}
          </h2>
          <Button 
            size="sm"
            color="primary"
            variant="flat"
            onClick={fetchTodayFollowups}
          >
            Refresh
          </Button>
        </div>

        {followupsLoading ? (
          <div className="flex justify-center items-center h-32">
            <Spinner size="lg" />
          </div>
        ) : followupsError ? (
          <div className="text-center text-danger">{followupsError}</div>
        ) : todayFollowups.length === 0 ? (
          <div className="text-center py-8 text-default-500">No follow-ups scheduled for today</div>
        ) : (
          <div className="overflow-x-auto">
            <Table aria-label="Today's follow-ups" isStriped>
              <TableHeader>
                <TableColumn>CLIENT NAME</TableColumn>
                <TableColumn>PHONE</TableColumn>
                <TableColumn>DOMAIN</TableColumn>
                <TableColumn>REQUIREMENT</TableColumn>
                <TableColumn>REMARKS</TableColumn>
                <TableColumn>ACTIONS</TableColumn>
              </TableHeader>
              <TableBody>
                {todayFollowups.map((followup) => (
                  <TableRow key={followup.id}>
                    <TableCell className="font-medium">{followup.client_name || "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <PhoneIcon className="h-4 w-4" />
                        {followup.phone_number || "-"}
                      </div>
                    </TableCell>
                    <TableCell>{followup.domain === "Nill" ? "-" : followup.domain || "-"}</TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate">
                        {followup.requirement || followup.detailed_requirement || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        color={getBadgeColor(followup.remarks || followup.remarks || "-")}
                        variant="flat"
                      >
                        {followup.remarks || followup.remarks || "-"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button 
                        size="sm" 
                        color="primary" 
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent event bubbling
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
      </Card>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <Input
          className="max-w-xs"
          placeholder="Search leads..."
          value={searchQuery}
          onChange={handleSearchChange}
        />

        <Select
          className="max-w-xs"
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

        {/* <Select
          className="max-w-xs"
          placeholder="Filter by subject"
          selectedKeys={filterDomain ? [filterDomain] : []}
          onChange={handleDomainChange}
        >
          <SelectItem key="" value="">
            All Subjects
          </SelectItem>
          {
            leadDomains.map((domain) => (
              <SelectItem key={domain} value={domain}>
                {domain}
              </SelectItem>
            )) as any
          }
        </Select> */}

        {/* Add new filter for prospectus type */}
        <Select
          className="max-w-xs"
          placeholder="Filter by prospectus type"
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

        {hasActiveFilters && (
          <Button 
            color="warning" 
            variant="flat"
            onClick={clearAllFilters}
            className="self-end"
            size="sm"
          >
            Clear Filters
          </Button>
        )}

        <Button
          color="primary"
          className="sm:ml-auto"
          onClick={() => {
            router.push("/business/leads/add");
          }}
        >
          Add New Lead
        </Button>
      </div>

      {/* All Leads - Add a header for clarity */}
      <div className="flex items-center mb-4">
        <h2 className="text-xl font-semibold">All Leads</h2>
      </div>

      {/* Leads Table */}
      <Card className="p-0" id="leads-table">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-64 text-danger">
            {error}
          </div>
        ) : (
          <>
            <Table aria-label="Leads table">
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
                {/* Removed SERVICE column */}
              </TableHeader>
              <TableBody emptyContent="No leads found">
                {items.map((lead) => (
                  <TableRow
                    key={lead.id}
                    className="cursor-pointer hover:bg-default-100"
                    onClick={() => handleLeadRowClick(lead.id)}
                  >
                    <TableCell>{formatDate(lead.date)}</TableCell>
                    <TableCell>{lead.lead_source || "N/A"}</TableCell>
                    <TableCell>{lead.client_name || "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <PhoneIcon className="h-4 w-4" />
                        {lead.phone_number || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      {lead.domain === "Nill"
                        ? "-"
                        : lead.domain || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate">
                        {lead.requirement || "-"}
                      </div>
                    </TableCell>
                    <TableCell>{lead.prospectus_type || "-"}</TableCell>
                    <TableCell>{lead.followup_date || "-"}</TableCell>
                    <TableCell>
                      <Badge
                        color={getBadgeColor(lead.remarks || "-")}
                        variant="flat"
                      >
                        {lead.remarks || "-"}
                      </Badge>
                    </TableCell>
                    {/* Removed service cell */}
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination Component */}
            {filteredLeads.length > 0 && (
              <div className="flex justify-center items-center py-4">
                <Pagination
                  total={pages}
                  page={page}
                  onChange={handlePageChange}
                  showControls={true}
                  variant="bordered"
                  size="lg"
                />
              </div>
            )}

            {/* Page info */}
            <div className="flex justify-between items-center px-4 py-2 text-sm text-default-500">
              <span>
                {filteredLeads.length === 0
                  ? "No results"
                  : `Showing ${(page - 1) * rowsPerPage + 1} to ${Math.min(page * rowsPerPage, filteredLeads.length)} of ${filteredLeads.length} leads`}
              </span>
              <span>
                Page {page} of {Math.max(1, pages)}
              </span>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

// Helper function to determine badge color based on status
const getBadgeColor = (
  status: string
): "default" | "primary" | "secondary" | "success" | "warning" | "danger" => {
  if (!status) return "default";

  const lowerStatus = status.toLowerCase();

  if (
    lowerStatus.includes("no reply") ||
    lowerStatus.includes("no response") ||
    lowerStatus.includes("not interested")
  ) {
    return "danger";
  }

  if (lowerStatus.includes("register") || lowerStatus.includes("confirmed")) {
    return "success";
  }

  if (lowerStatus.includes("paid") || lowerStatus.includes("payment")) {
    return "warning";
  }

  if (
    lowerStatus.includes("followup") ||
    lowerStatus.includes("follow up") ||
    lowerStatus.includes("pending")
  ) {
    return "primary";
  }

  return "default";
};

export default LeadsPage;
