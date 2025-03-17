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
} from "@heroicons/react/24/outline";
import { format, parse, isValid } from "date-fns";
import api, { Lead } from "@/services/api";
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
      return lead.customer_remarks?.toLowerCase().includes("followup") || false;
    }).length;

    // For conversion rate calculation
    const converted = leadsData.filter((lead) => {
      return (
        lead.status === "converted" ||
        lead.customer_remarks?.toLowerCase().includes("converted") ||
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

    // Use main_subject instead of domain for filtering
    if (filterDomain && lead.main_subject !== filterDomain) {
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
        lead.requirements?.toLowerCase().includes(query) ||
        false ||
        lead.main_subject?.toLowerCase().includes(query) ||
        false ||
        lead.service?.toLowerCase().includes(query) ||
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
      </div>

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

        <Select
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
        </Select>

        {/* Add new filter for prospectus type */}
        <Select
          className="max-w-xs"
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

        <Button
          color="primary"
          className="sm:ml-auto"
          onClick={() => {
            // Will implement in the next phase
            console.log("Add lead clicked");
          }}
        >
          Add New Lead
        </Button>
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
                        : lead.domain || lead.main_subject || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate">
                        {lead.requirements || "-"}
                      </div>
                    </TableCell>
                    <TableCell>{lead.prospectus_type || "-"}</TableCell>
                    <TableCell>{lead.followup_date || "-"}</TableCell>
                    <TableCell>
                      <Badge
                        color={getBadgeColor(lead.customer_remarks || "-")}
                        variant="flat"
                      >
                        {lead.customer_remarks || "-"}
                      </Badge>
                    </TableCell>
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
