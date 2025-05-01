"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Breadcrumbs,
  BreadcrumbItem,
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Input,
  Chip,
  Pagination,
  Select,
  SelectItem,
  SelectProps,
  Tabs,
  Tab,
  Spinner,
} from "@heroui/react";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { toast } from "react-toastify";
import api, { RegistrationFinancialData, JournalData } from "@/services/api";

const RecordsPage = () => {
  // Get tab from URL query parameter
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const tabParam = searchParams.get('tab');

  // State for the active tab - initialize from URL param if available
  const [activeTab, setActiveTab] = useState(tabParam === "prospects" || tabParam === "leads" || tabParam === "journals" ? tabParam : "registrations");

  // Data states
  const [allData, setAllData] = useState<RegistrationFinancialData[]>([]);
  const [registrations, setRegistrations] = useState<RegistrationFinancialData[]>([]);
  const [prospects, setProspects] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [journals, setJournals] = useState<JournalData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination states for each tab
  const [registrationPage, setRegistrationPage] = useState(1);
  const [prospectPage, setProspectPage] = useState(1);
  const [leadPage, setLeadPage] = useState(1);
  const [journalPage, setJournalPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Search states for each tab
  const [registrationSearch, setRegistrationSearch] = useState("");
  const [prospectSearch, setProspectSearch] = useState("");
  const [leadSearch, setLeadSearch] = useState("");
  const [journalSearch, setJournalSearch] = useState("");

  // Filter states for registrations
  const [filterStatus, setFilterStatus] = useState("");
  const [filterService, setFilterService] = useState("");
  const [filterPaymentStatus, setFilterPaymentStatus] = useState("");

  // Filter states for prospects
  const [filterDepartment, setFilterDepartment] = useState("");
  const [filterState, setFilterState] = useState("");

  // Filter states for leads
  const [filterLeadSource, setFilterLeadSource] = useState("");
  const [filterProspectType, setFilterProspectType] = useState("");
  const [filterFollowupStatus, setFilterFollowupStatus] = useState("");

  // Filter states for journals
  const [filterJournalStatus, setFilterJournalStatus] = useState("");
  const [filterJournalName, setFilterJournalName] = useState("");

  // Filter options
  const [statuses, setStatuses] = useState<string[]>([]);
  const [services, setServices] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [leadSources, setLeadSources] = useState<string[]>([]);
  const [prospectTypes, setProspectTypes] = useState<string[]>([]);
  const [journalStatuses, setJournalStatuses] = useState<string[]>([]);
  const [journalNames, setJournalNames] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  // Extract filter options when data changes
  useEffect(() => {
    if (allData.length > 0) {
      setRegistrations(allData);

      const statusesSet = new Set<string>();
      const servicesSet = new Set<string>();
      const departmentsSet = new Set<string>();
      const statesSet = new Set<string>();
      const leadSourcesSet = new Set<string>();
      const prospectTypesSet = new Set<string>();

      allData.forEach((item) => {
        if (item.status) statusesSet.add(item.status);

        if (item.services) {
          const serviceList = item.services.split(",").map(s => s.trim());
          serviceList.forEach(service => {
            if (service) servicesSet.add(service);
          });
        }

        if (item.prospectus?.department) departmentsSet.add(item.prospectus.department);
        if (item.prospectus?.state) statesSet.add(item.prospectus.state);
      });

      leads.forEach(lead => {
        if (lead.lead_source) leadSourcesSet.add(lead.lead_source);
        if (lead.prospectus_type) prospectTypesSet.add(lead.prospectus_type);
        if (lead.state) statesSet.add(lead.state);
      });

      prospects.forEach(prospect => {
        if (prospect.department) departmentsSet.add(prospect.department);
        if (prospect.state) statesSet.add(prospect.state);
      });

      setStatuses(Array.from(statusesSet));
      setServices(Array.from(servicesSet));
      setDepartments(Array.from(departmentsSet));
      setStates(Array.from(statesSet));
      setLeadSources(Array.from(leadSourcesSet));
      setProspectTypes(Array.from(prospectTypesSet));
    }
  }, [allData, leads, prospects]);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      const response = await api.getRegistrationFinancialData();
      setAllData(response.data);

      const leadsResponse = await api.getAllLeads();
      if (leadsResponse && leadsResponse.data) {
        const uniqueLeads = Array.from(
          new Map(leadsResponse.data.map(item => [item.id, item])).values()
        );
        setLeads(uniqueLeads);
      }

      const prospectsResponse = await api.getAllProspectusWithoutPageNumber();
      if (prospectsResponse?.success && Array.isArray(prospectsResponse.data)) {
        const uniqueProspects = Array.from(
          new Map(prospectsResponse.data.map(item => [item.id, item])).values()
        );
        setProspects(uniqueProspects);
      }

      const journalsResponse = await api.getAllJournalData();
      if (journalsResponse && journalsResponse.success) {
        setJournals(journalsResponse.data);

        const statusesSet = new Set<string>();
        const namesSet = new Set<string>();

        journalsResponse.data.forEach(journal => {
          if (journal.status) statusesSet.add(journal.status);
          if (journal.journal_name) namesSet.add(journal.journal_name);
        });

        setJournalStatuses(Array.from(statusesSet));
        setJournalNames(Array.from(namesSet));
      }

      setError(null);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to load data. Please try again.");
      toast.error("Failed to load records data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchData();
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy');
    } catch {
      return dateString || "N/A";
    }
  };

  const filteredRegistrations = React.useMemo(() => {
    if (!Array.isArray(registrations)) return [];

    return registrations.filter((reg) => {
      let matches = true;

      if (filterStatus && reg.status !== filterStatus) {
        matches = false;
      }

      if (filterService && !(reg.services && reg.services.includes(filterService))) {
        matches = false;
      }

      if (filterPaymentStatus) {
        const totalCollected =
          (reg.transaction?.amount || 0) +
          (reg.secondary_payment_details?.amount || 0) +
          (reg.final_payment_details?.amount || 0);

        if (filterPaymentStatus === "fully_paid" && totalCollected < reg.total_amount) {
          matches = false;
        } else if (filterPaymentStatus === "partially_paid" && (totalCollected >= reg.total_amount || totalCollected === 0)) {
          matches = false;
        } else if (filterPaymentStatus === "pending" && reg.transaction?.amount > 0) {
          matches = false;
        }
      }

      if (registrationSearch) {
        const query = registrationSearch.toLowerCase();
        const clientName = reg.prospectus?.client_name?.toLowerCase() || '';
        const regId = reg.prospectus?.reg_id?.toLowerCase() || '';
        const requirement = reg.prospectus?.requirement?.toLowerCase() || '';

        const searchMatches =
          clientName.includes(query) ||
          regId.includes(query) ||
          requirement.includes(query) ||
          false;

        if (!searchMatches) {
          matches = false;
        }
      }

      return matches;
    });
  }, [registrations, filterStatus, filterService, filterPaymentStatus, registrationSearch]);

  const filteredProspects = React.useMemo(() => {
    if (!Array.isArray(prospects)) return [];

    return prospects.filter((prospect) => {
      let matches = true;

      if (filterDepartment && prospect.department !== filterDepartment) {
        matches = false;
      }

      if (filterState && prospect.state !== filterState) {
        matches = false;
      }

      if (prospectSearch) {
        const query = prospectSearch.toLowerCase();
        const searchMatches =
          prospect.client_name?.toLowerCase().includes(query) ||
          prospect.email?.toLowerCase().includes(query) ||
          prospect.reg_id?.toLowerCase().includes(query) ||
          prospect.phone?.includes(query) ||
          prospect.requirement?.toLowerCase().includes(query) ||
          false;

        if (!searchMatches) {
          matches = false;
        }
      }

      return matches;
    });
  }, [prospects, filterDepartment, filterState, prospectSearch]);

  const filteredLeads = React.useMemo(() => {
    if (!Array.isArray(leads)) return [];

    return leads.filter((lead) => {
      let matches = true;

      if (filterLeadSource && lead.lead_source !== filterLeadSource) {
        matches = false;
      }

      if (filterProspectType && lead.prospectus_type !== filterProspectType) {
        matches = false;
      }

      if (filterFollowupStatus && lead.followup_status !== filterFollowupStatus) {
        matches = false;
      }

      if (leadSearch) {
        const query = leadSearch.toLowerCase();
        const searchMatches =
          lead.client_name?.toLowerCase().includes(query) ||
          lead.phone_number?.includes(query) ||
          lead.requirement?.toLowerCase().includes(query) ||
          lead.detailed_requirement?.toLowerCase().includes(query) ||
          false;

        if (!searchMatches) {
          matches = false;
        }
      }

      return matches;
    });
  }, [leads, filterLeadSource, filterProspectType, filterFollowupStatus, leadSearch]);

  const filteredJournals = React.useMemo(() => {
    if (!Array.isArray(journals)) return [];

    return journals.filter((journal) => {
      let matches = true;

      if (filterJournalStatus && journal.status !== filterJournalStatus) {
        matches = false;
      }

      if (filterJournalName && journal.journal_name !== filterJournalName) {
        matches = false;
      }

      if (journalSearch) {
        const query = journalSearch.toLowerCase();
        const searchMatches =
          journal.client_name?.toLowerCase().includes(query) ||
          journal.journal_name?.toLowerCase().includes(query) ||
          journal.paper_title?.toLowerCase().includes(query) ||
          journal.prospectus?.reg_id?.toLowerCase().includes(query) ||
          false;

        if (!searchMatches) {
          matches = false;
        }
      }

      return matches;
    });
  }, [journals, filterJournalStatus, filterJournalName, journalSearch]);

  const registrationPages = Math.ceil(filteredRegistrations.length / rowsPerPage);
  const prospectPages = Math.ceil(filteredProspects.length / rowsPerPage);
  const leadPages = Math.ceil(filteredLeads.length / rowsPerPage);
  const journalPages = Math.ceil(filteredJournals.length / rowsPerPage);

  const registrationItems = React.useMemo(() => {
    const start = (registrationPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredRegistrations.slice(start, end);
  }, [registrationPage, rowsPerPage, filteredRegistrations]);

  const prospectItems = React.useMemo(() => {
    const start = (prospectPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredProspects.slice(start, end);
  }, [prospectPage, rowsPerPage, filteredProspects]);

  const leadItems = React.useMemo(() => {
    const start = (leadPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredLeads.slice(start, end);
  }, [leadPage, rowsPerPage, filteredLeads]);

  const journalItems = React.useMemo(() => {
    const start = (journalPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredJournals.slice(start, end);
  }, [journalPage, rowsPerPage, filteredJournals]);

  const handleStatusChange: SelectProps["onChange"] = (e) => {
    setFilterStatus(e.target.value);
    setRegistrationPage(1);
  };

  const handleServiceChange: SelectProps["onChange"] = (e) => {
    setFilterService(e.target.value);
    setRegistrationPage(1);
  };

  const handlePaymentStatusChange: SelectProps["onChange"] = (e) => {
    setFilterPaymentStatus(e.target.value);
    setRegistrationPage(1);
  };

  const handleDepartmentChange: SelectProps["onChange"] = (e) => {
    setFilterDepartment(e.target.value);
    setProspectPage(1);
  };

  const handleStateChange: SelectProps["onChange"] = (e) => {
    setFilterState(e.target.value);
    setProspectPage(1);
  };

  const handleLeadSourceChange: SelectProps["onChange"] = (e) => {
    setFilterLeadSource(e.target.value);
    setLeadPage(1);
  };

  const handleProspectTypeChange: SelectProps["onChange"] = (e) => {
    setFilterProspectType(e.target.value);
    setLeadPage(1);
  };

  const handleFollowupStatusChange: SelectProps["onChange"] = (e) => {
    setFilterFollowupStatus(e.target.value);
    setLeadPage(1);
  };

  const handleJournalStatusChange: SelectProps["onChange"] = (e) => {
    setFilterJournalStatus(e.target.value);
    setJournalPage(1);
  };

  const handleJournalNameChange: SelectProps["onChange"] = (e) => {
    setFilterJournalName(e.target.value);
    setJournalPage(1);
  };

  const handleRowsPerPageChange: SelectProps["onChange"] = (e) => {
    setRowsPerPage(Number(e.target.value));
    setRegistrationPage(1);
    setProspectPage(1);
    setLeadPage(1);
    setJournalPage(1);
  };

  const handleRegistrationSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRegistrationSearch(e.target.value);
    setRegistrationPage(1);
  };

  const handleProspectSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProspectSearch(e.target.value);
    setProspectPage(1);
  };

  const handleLeadSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLeadSearch(e.target.value);
    setLeadPage(1);
  };

  const handleJournalSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setJournalSearch(e.target.value);
    setJournalPage(1);
  };

  const clearRegistrationFilters = () => {
    setFilterStatus("");
    setFilterService("");
    setFilterPaymentStatus("");
    setRegistrationSearch("");
    setRegistrationPage(1);
  };

  const clearProspectFilters = () => {
    setFilterDepartment("");
    setFilterState("");
    setProspectSearch("");
    setProspectPage(1);
  };

  const clearLeadFilters = () => {
    setFilterLeadSource("");
    setFilterProspectType("");
    setFilterFollowupStatus("");
    setLeadSearch("");
    setLeadPage(1);
  };

  const clearJournalFilters = () => {
    setFilterJournalStatus("");
    setFilterJournalName("");
    setJournalSearch("");
    setJournalPage(1);
  };

  const hasActiveRegistrationFilters =
    filterStatus !== "" ||
    filterService !== "" ||
    filterPaymentStatus !== "" ||
    registrationSearch !== "";

  const hasActiveProspectFilters =
    filterDepartment !== "" ||
    filterState !== "" ||
    prospectSearch !== "";

  const hasActiveLeadFilters =
    filterLeadSource !== "" ||
    filterProspectType !== "" ||
    filterFollowupStatus !== "" ||
    leadSearch !== "";

  const hasActiveJournalFilters =
    filterJournalStatus !== "" ||
    filterJournalName !== "" ||
    journalSearch !== "";

  const registrationColumns = [
    { key: "sl_no", label: "S.NO." },
    { key: "date", label: "DATE" },
    { key: "reg_id", label: "REG ID" },
    { key: "client", label: "CLIENT" },
    { key: "services", label: "SERVICES" },
    { key: "amount", label: "TOTAL AMOUNT" },
    { key: "collected", label: "COLLECTED" },
    { key: "status", label: "STATUS" },
  ];

  const prospectColumns = [
    { key: "sl_no", label: "S.NO." },
    { key: "date", label: "DATE" },
    { key: "reg_id", label: "REG ID" },
    { key: "client_name", label: "CLIENT NAME" },
    { key: "email", label: "EMAIL" },
    { key: "phone", label: "PHONE" },
    { key: "department", label: "DEPARTMENT" },
    { key: "state", label: "STATE" },
  ];

  const leadColumns = [
    { key: "sl_no", label: "S.NO." },
    { key: "date", label: "DATE" },
    { key: "client_name", label: "CLIENT NAME" },
    { key: "phone", label: "CONTACT" },
    { key: "lead_source", label: "LEAD SOURCE" },
    { key: "domain", label: "DOMAIN" },
    { key: "requirement", label: "REQUIREMENT" },
    { key: "followup_date", label: "FOLLOWUP DATE" },
    { key: "status", label: "STATUS" },
  ];

  const journalColumns = [
    { key: "sl_no", label: "S.NO." },
    { key: "client_name", label: "CLIENT NAME" },
    { key: "personal_email", label: "PERSONAL EMAIL" },
    { key: "journal_name", label: "JOURNAL" },
    { key: "paper_title", label: "PAPER TITLE" },
    { key: "executive", label: "EXECUTIVE" },
    { key: "status", label: "STATUS" },
  ];

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  // Add useEffect to handle URL parameter changes
  useEffect(() => {
    // Update active tab when URL parameter changes
    if (tabParam === "prospects" || tabParam === "leads" || tabParam === "journals" || tabParam === "registrations") {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  if (error) {
    return (
      <div className="w-full p-6">
        <Card>
          <CardBody className="flex flex-col items-center justify-center py-12">
            <h1 className="text-xl font-bold mb-4">Error Loading Records</h1>
            <p className="text-default-500 mb-6">{error}</p>
            <Button color="primary" onClick={handleRefresh}>
              Try Again
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full p-6">
      <Card className="mb-6">
        <CardHeader className="flex flex-col sm:flex-row sm:justify-between sm:items-center px-6 py-4 gap-4">
          <div>
            <Breadcrumbs size="sm" className="pb-2">
              <BreadcrumbItem href="/admin">Dashboard</BreadcrumbItem>
              <BreadcrumbItem>Records</BreadcrumbItem>
            </Breadcrumbs>
            <h1 className="text-2xl font-bold">Records Management</h1>
          </div>
          <Button
            color="primary"
            variant="light"
            startContent={<ArrowPathIcon className="h-4 w-4" />}
            onClick={handleRefresh}
            isLoading={isLoading}
          >
            Refresh Data
          </Button>
        </CardHeader>
      </Card>

      <Tabs
        aria-label="Records options"
        selectedKey={activeTab}
        onSelectionChange={(key) => setActiveTab(key as string)}
        className="mb-6"
      >
        <Tab key="registrations" title="Registrations">
          {/* Registrations Filter Panel */}
          <Card className="p-0 shadow-md rounded-lg overflow-hidden mb-6">
            <div className="bg-default-50 dark:bg-default-100/5 p-4 border-b border-divider">
              <h2 className="text-lg font-semibold flex items-center text-foreground">
                <FunnelIcon className="h-5 w-5 mr-2 text-primary" />
                Filter Registrations
              </h2>
            </div>

            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Input
                  label="Search"
                  startContent={
                    <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                  }
                  placeholder="Client name, reg ID, requirement..."
                  value={registrationSearch}
                  onChange={handleRegistrationSearchChange}
                />

                <Select
                  label="Status"
                  placeholder="Filter by status"
                  selectedKeys={filterStatus ? [filterStatus] : []}
                  onChange={handleStatusChange}
                >
                  <SelectItem key="" value="">
                    All Statuses
                  </SelectItem>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  )) as any}
                </Select>

                <Select
                  label="Service"
                  placeholder="Filter by service"
                  selectedKeys={filterService ? [filterService] : []}
                  onChange={handleServiceChange}
                >
                  <SelectItem key="" value="">
                    All Services
                  </SelectItem>
                  {services.map((service) => (
                    <SelectItem key={service} value={service}>
                      {service}
                    </SelectItem>
                  )) as any}
                </Select>

                <Select
                  label="Payment Status"
                  placeholder="Filter by payment"
                  selectedKeys={filterPaymentStatus ? [filterPaymentStatus] : []}
                  onChange={handlePaymentStatusChange}
                >
                  <SelectItem key="" value="">All Payment Statuses</SelectItem>
                  <SelectItem key="fully_paid" value="fully_paid">Fully Paid</SelectItem>
                  <SelectItem key="partially_paid" value="partially_paid">Partially Paid</SelectItem>
                  <SelectItem key="pending" value="pending">Payment Pending</SelectItem>
                </Select>

                <Select
                  label="Rows per page"
                  selectedKeys={[rowsPerPage.toString()]}
                  onChange={handleRowsPerPageChange}
                >
                  <SelectItem key="10" value="10">10</SelectItem>
                  <SelectItem key="20" value="20">20</SelectItem>
                  <SelectItem key="50" value="50">50</SelectItem>
                  <SelectItem key="100" value="100">100</SelectItem>
                </Select>
              </div>

              {hasActiveRegistrationFilters && (
                <div className="mt-4 pt-3 border-t border-divider flex items-center justify-between">
                  <div className="text-sm text-foreground-500">
                    <span className="font-medium">{filteredRegistrations.length}</span>{" "}
                    registrations found
                  </div>
                  <Button
                    color="warning"
                    variant="flat"
                    onClick={clearRegistrationFilters}
                    size="sm"
                    endContent={<XMarkIcon className="h-4 w-4" />}
                  >
                    Clear All Filters
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Registrations Table */}
          <Card>
            <CardHeader className="flex justify-between items-center px-6 py-4">
              <div>
                <h2 className="text-xl font-semibold">Registrations</h2>
                <p className="text-foreground-400 text-sm mt-1">
                  {filteredRegistrations.length === 0
                    ? "No registrations found"
                    : `Showing ${(registrationPage - 1) * rowsPerPage + 1} to ${Math.min(registrationPage * rowsPerPage, filteredRegistrations.length)} of ${filteredRegistrations.length} registrations`}
                </p>
              </div>
            </CardHeader>
            <CardBody>
              {isLoading ? (
                <div className="flex justify-center items-center h-[400px]">
                  <Spinner size="lg" label="Loading registrations..." />
                </div>
              ) : (
                <Table
                  aria-label="Registrations table"
                  bottomContent={
                    <div className="flex w-full justify-center">
                      <Pagination
                        isCompact
                        showControls
                        showShadow
                        color="primary"
                        page={registrationPage}
                        total={registrationPages}
                        onChange={setRegistrationPage}
                      />
                    </div>
                  }
                  className="min-h-[400px]"
                >
                  <TableHeader>
                    {registrationColumns.map((column) => (
                      <TableColumn key={column.key}>
                        {column.label}
                      </TableColumn>
                    ))}
                  </TableHeader>
                  <TableBody
                    items={registrationItems.map((item, index) => ({
                      ...item,
                      rowNumber: (registrationPage - 1) * rowsPerPage + index + 1
                    }))}
                    emptyContent="No registrations found"
                  >
                    {(registration) => (
                      <TableRow key={registration.id}>
                        <TableCell>{registration.rowNumber}</TableCell>
                        <TableCell>{formatDate(registration.created_at)}</TableCell>
                        <TableCell>{registration.prospectus?.reg_id || "N/A"}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{registration.prospectus?.client_name || "N/A"}</div>
                            <div className="text-sm text-gray-500">{registration.prospectus?.department || "N/A"}</div>
                          </div>
                        </TableCell>
                        <TableCell>{registration.services || "N/A"}</TableCell>
                        <TableCell>{formatCurrency(registration.total_amount || 0)}</TableCell>
                        <TableCell>
                          {formatCurrency(
                            (registration.transaction?.amount || 0) +
                            (registration.secondary_payment_details?.amount || 0) +
                            (registration.final_payment_details?.amount || 0)
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            color={
                              registration.status === 'registered' ? 'success' :
                              registration.status === 'waiting for approval' ? 'danger' :
                              'warning'
                            }
                            variant="flat"
                          >
                            {registration.status || "N/A"}
                          </Chip>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardBody>
          </Card>
        </Tab>

        <Tab key="prospects" title="Prospects">
          {/* Prospects Filter Panel */}
          <Card className="p-0 shadow-md rounded-lg overflow-hidden mb-6">
            <div className="bg-default-50 dark:bg-default-100/5 p-4 border-b border-divider">
              <h2 className="text-lg font-semibold flex items-center text-foreground">
                <FunnelIcon className="h-5 w-5 mr-2 text-primary" />
                Filter Prospects
              </h2>
            </div>

            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Input
                  label="Search"
                  startContent={
                    <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                  }
                  placeholder="Name, email, reg ID, phone..."
                  value={prospectSearch}
                  onChange={handleProspectSearchChange}
                />

                <Select
                  label="Department"
                  placeholder="Filter by department"
                  selectedKeys={filterDepartment ? [filterDepartment] : []}
                  onChange={handleDepartmentChange}
                >
                  <SelectItem key="" value="">
                    All Departments
                  </SelectItem>
                  {departments.map((department) => (
                    <SelectItem key={department} value={department}>
                      {department}
                    </SelectItem>
                  )) as any}
                </Select>

                <Select
                  label="State"
                  placeholder="Filter by state"
                  selectedKeys={filterState ? [filterState] : []}
                  onChange={handleStateChange}
                >
                  <SelectItem key="" value="">
                    All States
                  </SelectItem>
                  {states.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  )) as any}
                </Select>

                <Select
                  label="Rows per page"
                  selectedKeys={[rowsPerPage.toString()]}
                  onChange={handleRowsPerPageChange}
                >
                  <SelectItem key="10" value="10">10</SelectItem>
                  <SelectItem key="20" value="20">20</SelectItem>
                  <SelectItem key="50" value="50">50</SelectItem>
                  <SelectItem key="100" value="100">100</SelectItem>
                </Select>
              </div>

              {hasActiveProspectFilters && (
                <div className="mt-4 pt-3 border-t border-divider flex items-center justify-between">
                  <div className="text-sm text-foreground-500">
                    <span className="font-medium">{filteredProspects.length}</span>{" "}
                    prospects found
                  </div>
                  <Button
                    color="warning"
                    variant="flat"
                    onClick={clearProspectFilters}
                    size="sm"
                    endContent={<XMarkIcon className="h-4 w-4" />}
                  >
                    Clear All Filters
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Prospects Table */}
          <Card>
            <CardHeader className="flex justify-between items-center px-6 py-4">
              <div>
                <h2 className="text-xl font-semibold">Prospects</h2>
                <p className="text-foreground-400 text-sm mt-1">
                  {filteredProspects.length === 0
                    ? "No prospects found"
                    : `Showing ${(prospectPage - 1) * rowsPerPage + 1} to ${Math.min(prospectPage * rowsPerPage, filteredProspects.length)} of ${filteredProspects.length} prospects`}
                </p>
              </div>
            </CardHeader>
            <CardBody>
              {isLoading ? (
                <div className="flex justify-center items-center h-[400px]">
                  <Spinner size="lg" label="Loading prospects..." />
                </div>
              ) : (
                <Table
                  aria-label="Prospects table"
                  bottomContent={
                    <div className="flex w-full justify-center">
                      <Pagination
                        isCompact
                        showControls
                        showShadow
                        color="primary"
                        page={prospectPage}
                        total={prospectPages}
                        onChange={setProspectPage}
                      />
                    </div>
                  }
                  className="min-h-[400px]"
                >
                  <TableHeader>
                    {prospectColumns.map((column) => (
                      <TableColumn key={column.key}>
                        {column.label}
                      </TableColumn>
                    ))}
                  </TableHeader>
                  <TableBody
                    items={prospectItems.map((item, index) => ({
                      ...item,
                      rowNumber: (prospectPage - 1) * rowsPerPage + index + 1
                    }))}
                    emptyContent="No prospects found"
                  >
                    {(prospect) => (
                      <TableRow key={prospect.id}>
                        <TableCell>{prospect.rowNumber}</TableCell>
                        <TableCell>{formatDate(prospect.date || prospect.created_at)}</TableCell>
                        <TableCell>{prospect.reg_id || "N/A"}</TableCell>
                        <TableCell>{prospect.client_name || "N/A"}</TableCell>
                        <TableCell>{prospect.email || "N/A"}</TableCell>
                        <TableCell>{prospect.phone || "N/A"}</TableCell>
                        <TableCell>{prospect.department || "N/A"}</TableCell>
                        <TableCell>{prospect.state || "N/A"}</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardBody>
          </Card>
        </Tab>

        <Tab key="leads" title="Leads">
          {/* Leads Filter Panel */}
          <Card className="p-0 shadow-md rounded-lg overflow-hidden mb-6">
            <div className="bg-default-50 dark:bg-default-100/5 p-4 border-b border-divider">
              <h2 className="text-lg font-semibold flex items-center text-foreground">
                <FunnelIcon className="h-5 w-5 mr-2 text-primary" />
                Filter Leads
              </h2>
            </div>

            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Input
                  label="Search"
                  startContent={
                    <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                  }
                  placeholder="Name, phone, requirement..."
                  value={leadSearch}
                  onChange={handleLeadSearchChange}
                />

                <Select
                  label="Lead Source"
                  placeholder="Filter by source"
                  selectedKeys={filterLeadSource ? [filterLeadSource] : []}
                  onChange={handleLeadSourceChange}
                >
                  <SelectItem key="" value="">
                    All Sources
                  </SelectItem>
                  {leadSources.map((source) => (
                    <SelectItem key={source} value={source}>
                      {source}
                    </SelectItem>
                  )) as any}
                </Select>

                <Select
                  label="Prospect Type"
                  placeholder="Filter by type"
                  selectedKeys={filterProspectType ? [filterProspectType] : []}
                  onChange={handleProspectTypeChange}
                >
                  <SelectItem key="" value="">
                    All Types
                  </SelectItem>
                  {prospectTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  )) as any}
                </Select>

                <Select
                  label="Followup Status"
                  placeholder="Filter by status"
                  selectedKeys={filterFollowupStatus ? [filterFollowupStatus] : []}
                  onChange={handleFollowupStatusChange}
                >
                  <SelectItem key="" value="">All Statuses</SelectItem>
                  <SelectItem key="pending" value="pending">Pending</SelectItem>
                  <SelectItem key="completed" value="completed">Completed</SelectItem>
                  <SelectItem key="converted" value="converted">Converted</SelectItem>
                </Select>

                <Select
                  label="Rows per page"
                  selectedKeys={[rowsPerPage.toString()]}
                  onChange={handleRowsPerPageChange}
                >
                  <SelectItem key="10" value="10">10</SelectItem>
                  <SelectItem key="20" value="20">20</SelectItem>
                  <SelectItem key="50" value="50">50</SelectItem>
                  <SelectItem key="100" value="100">100</SelectItem>
                </Select>
              </div>

              {hasActiveLeadFilters && (
                <div className="mt-4 pt-3 border-t border-divider flex items-center justify-between">
                  <div className="text-sm text-foreground-500">
                    <span className="font-medium">{filteredLeads.length}</span>{" "}
                    leads found
                  </div>
                  <Button
                    color="warning"
                    variant="flat"
                    onClick={clearLeadFilters}
                    size="sm"
                    endContent={<XMarkIcon className="h-4 w-4" />}
                  >
                    Clear All Filters
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Leads Table */}
          <Card>
            <CardHeader className="flex justify-between items-center px-6 py-4">
              <div>
                <h2 className="text-xl font-semibold">Leads</h2>
                <p className="text-foreground-400 text-sm mt-1">
                  {filteredLeads.length === 0
                    ? "No leads found"
                    : `Showing ${(leadPage - 1) * rowsPerPage + 1} to ${Math.min(leadPage * rowsPerPage, filteredLeads.length)} of ${filteredLeads.length} leads`}
                </p>
              </div>
            </CardHeader>
            <CardBody>
              {isLoading ? (
                <div className="flex justify-center items-center h-[400px]">
                  <Spinner size="lg" label="Loading leads..." />
                </div>
              ) : (
                <Table
                  aria-label="Leads table"
                  bottomContent={
                    <div className="flex w-full justify-center">
                      <Pagination
                        isCompact
                        showControls
                        showShadow
                        color="primary"
                        page={leadPage}
                        total={leadPages}
                        onChange={setLeadPage}
                      />
                    </div>
                  }
                  className="min-h-[400px]"
                >
                  <TableHeader>
                    {leadColumns.map((column) => (
                      <TableColumn key={column.key}>
                        {column.label}
                      </TableColumn>
                    ))}
                  </TableHeader>
                  <TableBody
                    items={leadItems.map((item, index) => ({
                      ...item,
                      rowNumber: (leadPage - 1) * rowsPerPage + index + 1
                    }))}
                    emptyContent="No leads found"
                  >
                    {(lead) => (
                      <TableRow key={lead.id}>
                        <TableCell>{lead.rowNumber}</TableCell>
                        <TableCell>{formatDate(lead.date || lead.created_at)}</TableCell>
                        <TableCell>{lead.client_name || "N/A"}</TableCell>
                        <TableCell>{lead.phone_number || "N/A"}</TableCell>
                        <TableCell>{lead.lead_source || "N/A"}</TableCell>
                        <TableCell>{lead.domain || "N/A"}</TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate">
                            {lead.requirement || lead.detailed_requirement || "N/A"}
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(lead.followup_date)}</TableCell>
                        <TableCell>
                          <Chip
                            color={
                              lead.followup_status === 'converted' ? 'success' :
                              lead.followup_status === 'completed' ? 'primary' :
                              'warning'
                            }
                            variant="flat"
                          >
                            {lead.followup_status || "Pending"}
                          </Chip>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardBody>
          </Card>
        </Tab>

        <Tab key="journals" title="Journals">
          {/* Journals Filter Panel */}
          <Card className="p-0 shadow-md rounded-lg overflow-hidden mb-6">
            <div className="bg-default-50 dark:bg-default-100/5 p-4 border-b border-divider">
              <h2 className="text-lg font-semibold flex items-center text-foreground">
                <FunnelIcon className="h-5 w-5 mr-2 text-primary" />
                Filter Journals
              </h2>
            </div>

            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Input
                  label="Search"
                  startContent={
                    <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                  }
                  placeholder="Name, journal, paper title, reg ID..."
                  value={journalSearch}
                  onChange={handleJournalSearchChange}
                />

                <Select
                  label="Status"
                  placeholder="Filter by status"
                  selectedKeys={filterJournalStatus ? [filterJournalStatus] : []}
                  onChange={handleJournalStatusChange}
                >
                  <SelectItem key="" value="">
                    All Statuses
                  </SelectItem>
                  {journalStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  )) as any}
                </Select>

                <Select
                  label="Journal"
                  placeholder="Filter by journal"
                  selectedKeys={filterJournalName ? [filterJournalName] : []}
                  onChange={handleJournalNameChange}
                >
                  <SelectItem key="" value="">
                    All Journals
                  </SelectItem>
                  {journalNames.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  )) as any}
                </Select>

                <Select
                  label="Rows per page"
                  selectedKeys={[rowsPerPage.toString()]}
                  onChange={handleRowsPerPageChange}
                >
                  <SelectItem key="10" value="10">10</SelectItem>
                  <SelectItem key="20" value="20">20</SelectItem>
                  <SelectItem key="50" value="50">50</SelectItem>
                  <SelectItem key="100" value="100">100</SelectItem>
                </Select>
              </div>

              {hasActiveJournalFilters && (
                <div className="mt-4 pt-3 border-t border-divider flex items-center justify-between">
                  <div className="text-sm text-foreground-500">
                    <span className="font-medium">{filteredJournals.length}</span>{" "}
                    journals found
                  </div>
                  <Button
                    color="warning"
                    variant="flat"
                    onClick={clearJournalFilters}
                    size="sm"
                    endContent={<XMarkIcon className="h-4 w-4" />}
                  >
                    Clear All Filters
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Journals Table */}
          <Card>
            <CardHeader className="flex justify-between items-center px-6 py-4">
              <div>
                <h2 className="text-xl font-semibold">Journals</h2>
                <p className="text-foreground-400 text-sm mt-1">
                  {filteredJournals.length === 0
                    ? "No journals found"
                    : `Showing ${(journalPage - 1) * rowsPerPage + 1} to ${Math.min(journalPage * rowsPerPage, filteredJournals.length)} of ${filteredJournals.length} journals`}
                </p>
              </div>
            </CardHeader>
            <CardBody>
              {isLoading ? (
                <div className="flex justify-center items-center h-[400px]">
                  <Spinner size="lg" label="Loading journals..." />
                </div>
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
                        page={journalPage}
                        total={journalPages}
                        onChange={setJournalPage}
                      />
                    </div>
                  }
                  className="min-h-[400px]"
                >
                  <TableHeader>
                    {journalColumns.map((column) => (
                      <TableColumn key={column.key}>
                        {column.label}
                      </TableColumn>
                    ))}
                  </TableHeader>
                  <TableBody
                    items={journalItems.map((item, index) => ({
                      ...item,
                      rowNumber: (journalPage - 1) * rowsPerPage + index + 1
                    }))}
                    emptyContent="No journals found"
                  >
                    {(journal) => (
                      <TableRow key={journal.id}>
                        <TableCell>{journal.rowNumber}</TableCell>
                        <TableCell>{journal.client_name || "-"}</TableCell>
                        <TableCell>{journal.personal_email || "-"}</TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate">
                            {journal.journal_name || "-"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate">
                            {journal.paper_title || "-"}
                          </div>
                        </TableCell>
                        <TableCell>{journal.entities?.username || "-"}</TableCell>
                        <TableCell>
                          <Chip
                            color={
                              journal.status === 'approved' ? 'success' :
                              journal.status === 'rejected' ? 'danger' :
                              journal.status === 'under review' ? 'warning' :
                              'default'
                            }
                            variant="flat"
                          >
                            {journal.status || "-"}
                          </Chip>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardBody>
          </Card>
        </Tab>
      </Tabs>
    </div>
  );
};

export default RecordsPage;
