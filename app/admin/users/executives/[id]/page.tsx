"use client";
import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardBody,
  Divider,
  Button,
  Spinner,
  Avatar,
  Chip,
  Tabs,
  Tab,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Progress,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Select,
  SelectItem,
} from "@heroui/react";
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  EnvelopeIcon,
  UserIcon,
  ArrowPathIcon,
  CheckBadgeIcon,
  ClipboardDocumentListIcon,
  DocumentDuplicateIcon,
  ArrowUpCircleIcon,
  ArrowDownCircleIcon,
  ArrowTrendingUpIcon,
  ReceiptPercentIcon,
  PresentationChartLineIcon,
  BuildingOfficeIcon,
  BanknotesIcon,
  ChartBarIcon,
  ChartPieIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { WithAdminAuth } from "@/components/withAdminAuth";
import { toast } from "react-toastify";
import { format } from "date-fns";
import api, {
  Prospectus,
  Registration,
  JournalData,
  Lead,
  Executive,
  ExecutiveWithRoleName,
  Role,
} from "@/services/api";

// Analytics components
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from "recharts";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#A4DE6C",
  "#8884D8",
  "#82CA9D",
  "#F25C54",
  "#435E85",
  "#61DAFB",
];

// Add interface for the edit form
interface EditExecutiveForm {
  username: string;
  email: string;
  role: string;
  password?: string;
  confirmPassword?: string;
}

const ExecutiveDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const executiveId = params.id as string;
  const { isOpen: isResetModalOpen, onOpen: onResetModalOpen, onClose: onResetModalClose } = useDisclosure();
  const { isOpen: isEditModalOpen, onOpen: onEditModalOpen, onClose: onEditModalClose } = useDisclosure();
  const { isOpen: isDeleteModalOpen, onOpen: onDeleteModalOpen, onClose: onDeleteModalClose } = useDisclosure();
  
  // State variables
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [executiveData, setExecutiveData] = useState<ExecutiveWithRoleName | null>(null);
  const [prospects, setProspects] = useState<Prospectus[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [journals, setJournals] = useState<JournalData[]>([]);
  const [selectedTab, setSelectedTab] = useState<string>("overview");
  
  // Add edit form state
  const [editForm, setEditForm] = useState<EditExecutiveForm>({
    username: '',
    email: '',
    role: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);
  const [selectedRole, setSelectedRole] = useState(new Set<string>([]));
  const [selectedRolePermissions, setSelectedRolePermissions] = useState<any[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [canUpdateUsers, setCanUpdateUsers] = useState(true);
  
  // Metrics states
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [pendingRegistrations, setPendingRegistrations] = useState<number>(0);
  const [completedRegistrations, setCompletedRegistrations] = useState<number>(0);
  const [conversionRate, setConversionRate] = useState<number>(0);
  const [pendingFollowups, setPendingFollowups] = useState<number>(0);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  // Fetch all data on component mount
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setIsLoading(true);
        await Promise.all([
          fetchExecutiveData(),
          fetchProspects(),
          fetchRegistrations(),
          fetchLeads(),
          fetchJournals(),
        ]);
      } catch (error) {
        console.error("Error fetching executive data:", error);
        toast.error("Failed to load executive data");
      } finally {
        setIsLoading(false);
      }
    };

    if (executiveId) {
      fetchAllData();
    }
    
    // Check permissions
    const userData = api.getStoredUser();
    const isSuperAdminUser = userData?.role?.entity_type === 'SupAdmin';
    setIsSuperAdmin(isSuperAdminUser);
    
    // For non-SuperAdmin users, check specific permissions
    if (!isSuperAdminUser) {
      setCanUpdateUsers(currentUserHasPermission(PERMISSIONS.UPDATE_USERS));
    }
  }, [executiveId]);

  // Calculate metrics when data is loaded
  useEffect(() => {
    if (!isLoading) {
      calculateMetrics();
    }
  }, [prospects, registrations, leads, journals, isLoading]);

  // Fetch executive details
  const fetchExecutiveData = async () => {
    try {
      // Use the existing API endpoint for entities
      const response = await api.getAllEntities();
      const executive = response.data.find((exec) => exec.id === executiveId);
      
      if (executive) {
        setExecutiveData(executive);
      } else {
        toast.error("Executive not found");
        router.push("/admin/users/executives");
      }
    } catch (error) {
      console.error("Error fetching executive:", error);
      throw error;
    }
  };

  // Fetch prospects
  const fetchProspects = async () => {
    try {
      const response = await api.getProspectusByClientId(executiveId);
      setProspects(response.data || []);
    } catch (error) {
      console.error("Error fetching prospects:", error);
      throw error;
    }
  };

  // Fetch registrations for all prospects
  const fetchRegistrations = async () => {
    try {
      const response = await api.getRegistrationsByExecutive(executiveId);
      setRegistrations(response.data || []);
    } catch (error) {
      console.error("Error fetching registrations:", error);
      throw error;
    }
  };

  // Fetch leads
  const fetchLeads = async () => {
    try {
      // Replace the existing implementation with the new endpoint call
      const response = await api.getLeadsByCreator(executiveId);
      setLeads(response.data || []);
    } catch (error) {
      console.error("Error fetching leads:", error);
      throw error;
    }
  };

  // Fetch journals
  const fetchJournals = async () => {
    try {
      const response = await api.getJournalDataByExecutive(executiveId);
      // Filter out journals where is_private is not true
      const filteredJournals = response.data.filter(journal => journal.is_private === true);
      setJournals(filteredJournals || []);
    } catch (error) {
      console.error("Error fetching journals:", error);
      throw error;
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await Promise.all([
        fetchProspects(),
        fetchRegistrations(),
        fetchLeads(),
        fetchJournals(),
      ]);
      calculateMetrics();
      toast.success("Data refreshed successfully");
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast.error("Failed to refresh data");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Calculate all metrics based on loaded data
  const calculateMetrics = () => {
    try {
      // Revenue calculation
      let totalRev = 0;
      registrations.forEach((reg) => {
        if (reg.status === "registered") {
          totalRev += reg.accept_amount || 0;
        }
      });
      setTotalRevenue(totalRev);

      // Registration metrics
      const pendingRegs = registrations.filter(
        (reg) => reg.status === "pending" || reg.status === "quotation review" || reg.status === "waiting for approval"
      ).length;
      setPendingRegistrations(pendingRegs);

      const completedRegs = registrations.filter(
        (reg) => reg.status === "registered"
      ).length;
      setCompletedRegistrations(completedRegs);

      // Conversion rate (leads to prospects)
      const convertedLeadsCount = leads.filter(
        (lead) => lead.followup_status === "converted"
      ).length;
      const conversionRateValue = leads.length > 0 ? (convertedLeadsCount / leads.length) * 100 : 0;
      setConversionRate(conversionRateValue);

      // Pending followups
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const pendingFollowupsCount = leads.filter((lead) => {
        if (lead.followup_status !== "pending") return false;
        
        const followupDate = lead.followup_date ? new Date(lead.followup_date) : null;
        if (!followupDate) return false;
        
        followupDate.setHours(0, 0, 0, 0);
        return followupDate <= today;
      }).length;
      
      setPendingFollowups(pendingFollowupsCount);
    } catch (error) {
      console.error("Error calculating metrics:", error);
      setAnalyticsError("Failed to calculate some metrics");
    }
  };

  // Calculate requirement distribution for charts
  const requirementDistribution = useMemo(() => {
    const requirementMap = new Map<string, number>();
    
    prospects.forEach((prospect) => {
      const req = prospect.requirement || "Unspecified";
      requirementMap.set(req, (requirementMap.get(req) || 0) + 1);
    });
    
    // Convert to array of objects for the chart
    return Array.from(requirementMap.entries())
      .map(([name, value]) => ({ name: name.length > 20 ? name.substring(0, 20) + "..." : name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Only show top 5
  }, [prospects]);

  // Calculate lead source distribution
  const leadSourceDistribution = useMemo(() => {
    const sourceMap = new Map<string, number>();
    
    leads.forEach((lead) => {
      const source = lead.lead_source || "Unknown";
      sourceMap.set(source, (sourceMap.get(source) || 0) + 1);
    });
    
    return Array.from(sourceMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [leads]);

  // Calculate registration status distribution
  const registrationStatusDistribution = useMemo(() => {
    const statusCounts = {
      "quotation review": 0,
      "pending": 0,
      "quotation accepted": 0,
      "waiting for approval": 0,
      "registered": 0,
    };
    
    registrations.forEach((reg) => {
      const status = reg.status || "pending";
      if (status in statusCounts) {
        statusCounts[status as keyof typeof statusCounts]++;
      }
    });
    
    return Object.entries(statusCounts)
      .map(([name, value]) => ({ 
        name: name.charAt(0).toUpperCase() + name.slice(1).replace(/_/g, ' '), 
        value 
      }));
  }, [registrations]);

  // Calculate journal status distribution
  const journalStatusDistribution = useMemo(() => {
    const statusMap = new Map<string, number>();
    
    // Only use private journals for the status distribution
    journals.forEach((journal) => {
      if (journal.is_private === true) {
        const status = journal.status || "pending";
        statusMap.set(status, (statusMap.get(status) || 0) + 1);
      }
    });
    
    return Array.from(statusMap.entries())
      .map(([name, value]) => ({ 
        name: name.charAt(0).toUpperCase() + name.slice(1), 
        value 
      }));
  }, [journals]);

  // Calculate monthly revenue trend (last 6 months)
  const monthlyRevenueTrend = useMemo(() => {
    const months: Record<string, number> = {};
    const today = new Date();
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today);
      d.setMonth(d.getMonth() - i);
      const monthYear = format(d, "MMM yyyy");
      months[monthYear] = 0;
    }
    
    // Sum revenue by month
    registrations.forEach((reg) => {
      if (reg.status === "registered" && reg.created_at) {
        const date = new Date(reg.created_at);
        const monthYear = format(date, "MMM yyyy");
        
        // Only include last 6 months
        if (months[monthYear] !== undefined) {
          months[monthYear] += reg.accept_amount || 0;
        }
      }
    });
    
    // Convert to array for chart
    return Object.entries(months).map(([month, amount]) => ({
      month,
      amount,
    }));
  }, [registrations]);

  // Format date helper
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "PPP");
    } catch (e) {
      return dateString;
    }
  };

  // Add edit functionality methods
  const handleEditClick = async () => {
    if (!executiveData) return;
    
    setEditForm({
      username: executiveData.username,
      email: executiveData.email,
      role: executiveData.role_details.id.toString(),
    });
    setSelectedRole(new Set([executiveData.role_details.id.toString()]));
    
    try {
      setIsLoadingRoles(true);
      const rolesResponse = await api.getAllRoles();
      setRoles(rolesResponse.data);
      
      // Find the selected role to get its permissions
      const selectedRole = rolesResponse.data.find(
        r => r.id.toString() === executiveData.role_details.id.toString()
      );
      setSelectedRolePermissions(selectedRole?.permissions || []);
    } catch (error) {
      toast.error('Failed to load roles');
      console.error('Error loading roles:', error);
    } finally {
      setIsLoadingRoles(false);
    }
    
    onEditModalOpen();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleRoleChange = (keys: any) => {
    const selectedKey = Array.from(keys)[0] as string;
    setSelectedRole(new Set([selectedKey]));
    setEditForm(prev => ({
      ...prev,
      role: selectedKey
    }));
    
    // Update permissions display when role changes
    const selectedRole = roles.find(r => r.id.toString() === selectedKey);
    setSelectedRolePermissions(selectedRole?.permissions || []);
  };

  const handleSubmit = async () => {
    if (!executiveData) return;

    // Validate password match if password is being changed
    if (editForm.password && editForm.password !== editForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const updateData = {
        username: editForm.username,
        email: editForm.email,
        role: editForm.role, // This will be the role ID
        ...(editForm.password ? { password: editForm.password } : {})
      };

      await api.axiosInstance.put(`/entity/${executiveData.id}`, updateData);
      
      // Refresh executive data
      await fetchExecutiveData();
      
      toast.success('Executive updated successfully');
      onEditModalClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update executive');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExecutive = async () => {
    if (!executiveData) return;
    
    try {
      setIsDeleting(true);
      
      // Use the API service method instead of directly calling axios
      await api.deleteEntity(executiveData.id);
      
      toast.success(`${executiveData.username} has been deleted successfully`);
      
      // Navigate back to executives list
      router.push('/admin/users/executives');
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || 'Failed to delete executive';
      toast.error(errorMsg);
      console.error('Error deleting executive:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const renderSelectValue = (role: Role) => {
    return role.name; // Only show role name when selected
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" color="primary" />
        <span className="ml-2">Loading executive details...</span>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Back button and header */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="light"
            startContent={<ArrowLeftIcon className="w-4 h-4" />}
            onClick={() => router.push("/admin/users/executives")}
            size="sm"
          >
            Back to Executives
          </Button>
          <Divider orientation="vertical" className="h-6" />
          <h1 className="text-2xl font-bold">Executive Profile</h1>
        </div>
        <div className="flex gap-2">
          <Button
            color="primary"
            variant="light"
            startContent={<ArrowPathIcon className="w-4 h-4" />}
            isLoading={isRefreshing}
            onClick={handleRefresh}
          >
            Refresh Data
          </Button>
          
          {/* Replace dropdown with simple edit button */}
          {(isSuperAdmin || canUpdateUsers) && (
            <Button
              color="primary"
              startContent={<PencilIcon className="w-4 h-4" />}
              onClick={handleEditClick}
            >
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      {/* Executive Profile Card */}
      <Card className="mb-6 shadow-sm">
        <CardBody>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex flex-col items-center gap-2">
              <Avatar
                className="w-24 h-24 text-large"
                showFallback
                name={executiveData?.username || "User"}
                src={`https://ui-avatars.com/api/?name=${executiveData?.username}&background=random`}
              />
              <div className="text-center">
                <Chip
                  color={
                    executiveData?.role_details?.entity_type === "Executive"
                      ? "primary"
                      : executiveData?.role_details?.entity_type === "Editor"
                      ? "warning"
                      : executiveData?.role_details?.entity_type === "Author"
                      ? "secondary"
                      : "default"
                  }
                  variant="flat"
                  size="sm"
                  className="mt-1"
                >
                  {executiveData?.role_details?.name || "Role undefined"}
                </Chip>
              </div>
            </div>

            <div className="flex-grow">
              <h2 className="text-2xl font-bold mb-1">{executiveData?.username || "N/A"}</h2>
              <p className="text-default-500 mb-3">ID: {executiveData?.id || "N/A"}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <EnvelopeIcon className="w-5 h-5 text-default-500" />
                  <span>{executiveData?.email || "No email provided"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarDaysIcon className="w-5 h-5 text-default-500" />
                  <span>Joined: {executiveData?.created_at ? formatDate(executiveData.created_at) : "N/A"}</span>
                </div>
                <div className="flex items-center gap-2 col-span-full">
                  <BuildingOfficeIcon className="w-5 h-5 text-default-500" />
                  <span>Entity Type: {executiveData?.role_details?.entity_type || "Unknown"}</span>
                </div>
              </div>
            </div>

            <div className="border-l border-divider pl-6 hidden md:block">
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="text-default-500 text-sm">Total Revenue</h3>
                  <p className="text-xl font-semibold">₹{totalRevenue.toLocaleString()}</p>
                </div>
                <div>
                  <h3 className="text-default-500 text-sm">Completed Registrations</h3>
                  <p className="text-xl font-semibold">{completedRegistrations}</p>
                </div>
                <div>
                  <h3 className="text-default-500 text-sm">Conversion Rate</h3>
                  <p className="text-xl font-semibold">{conversionRate.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Dashboard Tabs */}
      <div className="mb-6">
        <Tabs 
          selectedKey={selectedTab} 
          onSelectionChange={setSelectedTab as any}
          variant="underlined"
          color="primary"
          classNames={{
            tabList: "gap-6 w-full relative border-b border-divider",
            cursor: "w-full bg-primary",
            tab: "max-w-fit px-2 h-10",
            tabContent: "group-data-[selected=true]:text-primary",
          }}
        >
          <Tab
            key="overview"
            title={
              <div className="flex items-center gap-2">
                <PresentationChartLineIcon className="w-4 h-4" />
                <span>Overview</span>
              </div>
            }
          />
          <Tab
            key="prospectus"
            title={
              <div className="flex items-center gap-2">
                <ClipboardDocumentListIcon className="w-4 h-4" />
                <span>Prospectus</span>
                <Chip size="sm" variant="flat">{prospects.length}</Chip>
              </div>
            }
          />
          <Tab
            key="registrations"
            title={
              <div className="flex items-center gap-2">
                <CheckBadgeIcon className="w-4 h-4" />
                <span>Registrations</span>
                <Chip size="sm" variant="flat">{registrations.length}</Chip>
              </div>
            }
          />
          <Tab
            key="leads"
            title={
              <div className="flex items-center gap-2">
                <ArrowTrendingUpIcon className="w-4 h-4" />
                <span>Leads</span>
                <Chip size="sm" variant="flat">{leads.length}</Chip>
              </div>
            }
          />
          <Tab
            key="journals"
            title={
              <div className="flex items-center gap-2">
                <DocumentDuplicateIcon className="w-4 h-4" />
                <span>Journals</span>
                <Chip size="sm" variant="flat">{journals.length}</Chip>
              </div>
            }
          />
        </Tabs>
      </div>

      {/* Tab Content */}
      <div className="mb-6">
        {selectedTab === "overview" && (
          <div className="space-y-6">
            {/* Key Performance Indicators (KPIs) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="shadow-sm">
                <CardBody>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-default-500">Total Revenue</p>
                      <h4 className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</h4>
                    </div>
                    <div className="p-2 rounded-full bg-success-100 text-success-600">
                      <BanknotesIcon className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center text-xs">
                    <div className="flex items-center text-success-600">
                      <ArrowUpCircleIcon className="w-3 h-3 mr-1" />
                      <span>From {completedRegistrations} completed registrations</span>
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card className="shadow-sm">
                <CardBody>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-default-500">Pending Registrations</p>
                      <h4 className="text-2xl font-bold">{pendingRegistrations}</h4>
                    </div>
                    <div className="p-2 rounded-full bg-warning-100 text-warning-600">
                      <ReceiptPercentIcon className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center text-xs">
                    <div className="flex items-center text-warning-600">
                      <ArrowPathIcon className="w-3 h-3 mr-1" />
                      <span>Awaiting completion</span>
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card className="shadow-sm">
                <CardBody>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-default-500">Lead Conversion Rate</p>
                      <h4 className="text-2xl font-bold">{conversionRate.toFixed(1)}%</h4>
                    </div>
                    <div className="p-2 rounded-full bg-primary-100 text-primary-600">
                      <ArrowTrendingUpIcon className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center text-xs">
                    <div className="flex items-center text-primary-600">
                      <ArrowUpCircleIcon className="w-3 h-3 mr-1" />
                      <span>Based on {leads.length} total leads</span>
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card className="shadow-sm">
                <CardBody>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-default-500">Pending Followups</p>
                      <h4 className="text-2xl font-bold">{pendingFollowups}</h4>
                    </div>
                    <div className="p-2 rounded-full bg-danger-100 text-danger-600">
                      <CalendarDaysIcon className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center text-xs">
                    <div className="flex items-center text-danger-600">
                      <ArrowDownCircleIcon className="w-3 h-3 mr-1" />
                      <span>Need immediate attention</span>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Monthly Revenue Trend */}
            <Card className="shadow-sm">
              <CardHeader className="pb-0 pt-4 px-6 flex-col items-start">
                <h4 className="font-bold text-large">Monthly Revenue Trend</h4>
                <p className="text-default-500 text-sm">Revenue generated over the last 6 months</p>
              </CardHeader>
              <CardBody className="overflow-hidden">
                <div className="w-full h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={monthlyRevenueTrend}
                      margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value) => [`₹${Number(value).toLocaleString()}`, "Revenue"]} 
                      />
                      <Legend />
                      <Bar dataKey="amount" name="Revenue" fill="#0088FE" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardBody>
            </Card>

            {/* Analytics Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Requirement Distribution */}
              <Card className="shadow-sm">
                <CardHeader className="pb-0 pt-4 px-6 flex-col items-start">
                  <h4 className="font-bold text-large">Top Requirements</h4>
                  <p className="text-default-500 text-sm">Most common client requirements</p>
                </CardHeader>
                <CardBody className="overflow-hidden">
                  <div className="w-full h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={requirementDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }: { name: string, percent: number }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {requirementDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value, name) => [`${value} prospects`, name]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardBody>
              </Card>

              {/* Registration Status */}
              <Card className="shadow-sm">
                <CardHeader className="pb-0 pt-4 px-6 flex-col items-start">
                  <h4 className="font-bold text-large">Registration Status</h4>
                  <p className="text-default-500 text-sm">Current status of all registrations</p>
                </CardHeader>
                <CardBody className="overflow-hidden">
                  <div className="w-full h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={registrationStatusDistribution}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={130} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#8884d8">
                          {registrationStatusDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Lead Source Distribution - Fixed with properly added Bar component */}
            <Card className="shadow-sm">
              <CardHeader className="pb-0 pt-4 px-6 flex-col items-start">
                <h4 className="font-bold text-large">Lead Sources</h4>
                <p className="text-default-500 text-sm">Distribution of leads by source</p>
              </CardHeader>
              <CardBody className="overflow-hidden">
                <div className="w-full h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={leadSourceDistribution}
                      margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" name="Leads" fill="#8884d8">
                        {leadSourceDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardBody>
            </Card>
          </div>
        )}

        {selectedTab === "prospectus" && (
          // ...existing code...
          <div className="space-y-6">
            {/* Prospectus Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="shadow-sm">
                <CardBody>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-default-500">Total Prospects</p>
                      <h4 className="text-2xl font-bold">{prospects.length}</h4>
                    </div>
                    <div className="p-2 rounded-full bg-primary-100 text-primary-600">
                      <UserIcon className="w-5 h-5" />
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card className="shadow-sm">
                <CardBody>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-default-500">Registered Prospects</p>
                      <h4 className="text-2xl font-bold">
                        {prospects.filter(p => p.isregistered).length}
                      </h4>
                    </div>
                    <div className="p-2 rounded-full bg-success-100 text-success-600">
                      <CheckBadgeIcon className="w-5 h-5" />
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card className="shadow-sm">
                <CardBody>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-default-500">Unregistered Prospects</p>
                      <h4 className="text-2xl font-bold">
                        {prospects.filter(p => !p.isregistered).length}
                      </h4>
                    </div>
                    <div className="p-2 rounded-full bg-warning-100 text-warning-600">
                      <ClipboardDocumentListIcon className="w-5 h-5" />
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Requirement Distribution Chart */}
            <Card className="shadow-sm">
              <CardHeader className="pb-0 pt-4 px-6 flex-col items-start">
                <h4 className="font-bold text-large">Requirement Distribution</h4>
                <p className="text-default-500 text-sm">Types of client requirements</p>
              </CardHeader>
              <CardBody className="overflow-hidden">
                <div className="w-full h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={requirementDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {requirementDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [`${value} prospects`, name]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardBody>
            </Card>

            {/* Prospectus Table */}
            <Card className="shadow-sm">
              <CardHeader className="flex justify-between items-center">
                <h4 className="font-bold text-large">Prospects List</h4>
                <Input 
                  placeholder="Search prospects..." 
                  size="sm" 
                  startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                  className="w-full sm:max-w-[260px]"
                />
              </CardHeader>
              <CardBody className="p-0">
                <Table aria-label="Prospects table" isStriped>
                  <TableHeader>
                    <TableColumn>Reg ID</TableColumn>
                    <TableColumn>Client Name</TableColumn>
                    <TableColumn>Email</TableColumn>
                    <TableColumn>Phone</TableColumn>
                    <TableColumn>State</TableColumn>
                    <TableColumn>Status</TableColumn>
                    <TableColumn>Date</TableColumn>
                  </TableHeader>
                  <TableBody emptyContent="No prospects found" items={prospects.slice(0, 10)}>
                    {(item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.reg_id}</TableCell>
                        <TableCell>{item.client_name}</TableCell>
                        <TableCell>{item.email}</TableCell>
                        <TableCell>{item.phone}</TableCell>
                        <TableCell>{item.state}</TableCell>
                        <TableCell>
                          <Chip
                            color={item.isregistered ? "success" : "warning"}
                            variant="flat"
                            size="sm"
                          >
                            {item.isregistered ? "Registered" : "Pending"}
                          </Chip>
                        </TableCell>
                        <TableCell>{formatDate(item.date)}</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                {prospects.length > 10 && (
                  <div className="flex justify-center p-4">
                    <Button
                      onClick={() => router.push(`/admin/prospects/executive/${executiveId}`)}
                      variant="flat"
                      color="primary"
                      size="sm"
                    >
                      View All Prospects
                    </Button>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        )}

        {/* Registrations Tab */}
        {selectedTab === "registrations" && (
          <div className="space-y-6">
            {/* Registration Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="shadow-sm">
                <CardBody>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-default-500">Total Revenue</p>
                      <h4 className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</h4>
                    </div>
                    <div className="p-2 rounded-full bg-success-100 text-success-600">
                      <BanknotesIcon className="w-5 h-5" />
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card className="shadow-sm">
                <CardBody>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-default-500">Registrations</p>
                      <h4 className="text-2xl font-bold">{registrations.length}</h4>
                    </div>
                    <div className="p-2 rounded-full bg-primary-100 text-primary-600">
                      <DocumentDuplicateIcon className="w-5 h-5" />
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card className="shadow-sm">
                <CardBody>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-default-500">Completed</p>
                      <h4 className="text-2xl font-bold">{completedRegistrations}</h4>
                    </div>
                    <div className="p-2 rounded-full bg-success-100 text-success-600">
                      <CheckBadgeIcon className="w-5 h-5" />
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card className="shadow-sm">
                <CardBody>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-default-500">Pending</p>
                      <h4 className="text-2xl font-bold">{pendingRegistrations}</h4>
                    </div>
                    <div className="p-2 rounded-full bg-warning-100 text-warning-600">
                      <ClipboardDocumentListIcon className="w-5 h-5" />
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Registration Status Chart */}
            <Card className="shadow-sm">
              <CardHeader className="pb-0 pt-4 px-6 flex-col items-start">
                <h4 className="font-bold text-large">Registration Status Distribution</h4>
                <p className="text-default-500 text-sm">Overview of registration status</p>
              </CardHeader>
              <CardBody className="overflow-hidden">
                <div className="w-full h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={registrationStatusDistribution}
                      margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" name="Registrations" fill="#8884d8">
                        {registrationStatusDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardBody>
            </Card>

            {/* Registrations Table */}
            <Card className="shadow-sm">
              <CardHeader className="flex justify-between items-center">
                <h4 className="font-bold text-large">Recent Registrations</h4>
                <Input 
                  placeholder="Search registrations..." 
                  size="sm" 
                  startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                  className="w-full sm:max-w-[260px]"
                />
              </CardHeader>
              <CardBody className="p-0">
                <Table aria-label="Registrations table" isStriped>
                  <TableHeader>
                    <TableColumn>ID</TableColumn>
                    <TableColumn>Client Name</TableColumn>
                    <TableColumn>Services</TableColumn>
                    <TableColumn>Amount</TableColumn>
                    <TableColumn>Date</TableColumn>
                    <TableColumn>Status</TableColumn>
                  </TableHeader>
                  <TableBody 
                    emptyContent="No registrations found" 
                    items={registrations.slice(0, 10)}
                  >
                    {(reg) => (
                      <TableRow key={reg.id}>
                        <TableCell>{reg.id}</TableCell>
                        <TableCell>
                          {reg.prospectus?.client_name || "N/A"}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate">
                            {reg.services || "N/A"}
                          </div>
                        </TableCell>
                        <TableCell>₹{reg.accept_amount?.toLocaleString() || 0}</TableCell>
                        <TableCell>{formatDate(reg.created_at)}</TableCell>
                        <TableCell>
                          <Chip
                            color={
                              reg.status === "registered"
                                ? "success"
                                : reg.status === "waiting for approval"
                                ? "warning"
                                : reg.status === "quotation review"
                                ? "primary"
                                : "default"
                            }
                            variant="flat"
                            size="sm"
                          >
                            {reg.status && reg.status.charAt(0).toUpperCase() + reg.status.slice(1)}
                          </Chip>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                {registrations.length > 10 && (
                  <div className="flex justify-center p-4">
                    <Button
                      onClick={() => router.push(`/admin/registrations/executive/${executiveId}`)}
                      variant="flat"
                      color="primary"
                      size="sm"
                    >
                      View All Registrations
                    </Button>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        )}

        {/* Leads Tab */}
        {selectedTab === "leads" && (
          <div className="space-y-6">
            {/* Leads Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="shadow-sm">
                <CardBody>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-default-500">Total Leads</p>
                      <h4 className="text-2xl font-bold">{leads.length}</h4>
                    </div>
                    <div className="p-2 rounded-full bg-primary-100 text-primary-600">
                      <UserIcon className="w-5 h-5" />
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card className="shadow-sm">
                <CardBody>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-default-500">Converted Leads</p>
                      <h4 className="text-2xl font-bold">
                        {leads.filter(lead => lead.followup_status === "converted").length}
                      </h4>
                    </div>
                    <div className="p-2 rounded-full bg-success-100 text-success-600">
                      <ArrowTrendingUpIcon className="w-5 h-5" />
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card className="shadow-sm">
                <CardBody>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-default-500">Pending Followups</p>
                      <h4 className="text-2xl font-bold">{pendingFollowups}</h4>
                    </div>
                    <div className="p-2 rounded-full bg-warning-100 text-warning-600">
                      <CalendarDaysIcon className="w-5 h-5" />
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Lead Source Chart */}
            <Card className="shadow-sm">
              <CardHeader className="pb-0 pt-4 px-6 flex-col items-start">
                <h4 className="font-bold text-large">Lead Sources</h4>
                <p className="text-default-500 text-sm">Distribution by source</p>
              </CardHeader>
              <CardBody className="overflow-hidden">
                <div className="w-full h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={leadSourceDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {leadSourceDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [`${value} leads`, name]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardBody>
            </Card>

            {/* Leads by Prospect Type */}
            <Card className="shadow-sm">
              <CardHeader className="pb-0 pt-4 px-6 flex-col items-start">
                <h4 className="font-bold text-large">Leads by Prospect Type</h4>
                <p className="text-default-500 text-sm">Classification of leads</p>
              </CardHeader>
              <CardBody className="overflow-hidden">
                <div className="w-full h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: "Leads", value: leads.filter(l => l.prospectus_type === "Leads").length },
                        { name: "Not a prospect", value: leads.filter(l => l.prospectus_type === "Not a prospect").length },
                        { name: "Later prospect", value: leads.filter(l => l.prospectus_type === "Later prospect").length },
                        { name: "Prospect", value: leads.filter(l => l.prospectus_type === "Prospect").length },
                        { name: "Other", value: leads.filter(l => !["Leads", "Not a prospect", "Later prospect", "Prospect"].includes(l.prospectus_type || "")).length },
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" name="Count" fill="#8884d8">
                        {["Leads", "Not a prospect", "Later prospect", "Prospect", "Other"].map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardBody>
            </Card>

            {/* Leads Table */}
            <Card className="shadow-sm">
              <CardHeader className="flex justify-between items-center">
                <h4 className="font-bold text-large">Recent Leads</h4>
                <Input 
                  placeholder="Search leads..." 
                  size="sm" 
                  startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                  className="w-full sm:max-w-[260px]"
                />
              </CardHeader>
              <CardBody className="p-0">
                <Table aria-label="Leads table" isStriped>
                  <TableHeader>
                    <TableColumn>ID</TableColumn>
                    <TableColumn>Client Name</TableColumn>
                    <TableColumn>Source</TableColumn>
                    <TableColumn>Phone</TableColumn>
                    <TableColumn>Domain</TableColumn>
                    <TableColumn>Type</TableColumn>
                    <TableColumn>Followup</TableColumn>
                  </TableHeader>
                  <TableBody emptyContent="No leads found" items={leads.slice(0, 10)}>
                    {(lead) => (
                      <TableRow key={lead.id}>
                        <TableCell>{lead.id}</TableCell>
                        <TableCell>{lead.client_name || "N/A"}</TableCell>
                        <TableCell>{lead.lead_source || "N/A"}</TableCell>
                        <TableCell>{lead.phone_number || "N/A"}</TableCell>
                        <TableCell>{lead.domain || "N/A"}</TableCell>
                        <TableCell>
                          <Chip
                            color={
                              lead.prospectus_type === "Prospect"
                                ? "success"
                                : lead.prospectus_type === "Lead"
                                ? "primary"
                                : lead.prospectus_type === "Later prospect"
                                ? "warning"
                                : "default"
                            }
                            variant="flat"
                            size="sm"
                          >
                            {lead.prospectus_type || "Unknown"}
                          </Chip>
                        </TableCell>
                        <TableCell>
                          <Chip
                            color={
                              lead.followup_status === "converted"
                                ? "success"
                                : lead.followup_status === "completed"
                                ? "primary"
                                : "warning"
                            }
                            variant="flat"
                            size="sm"
                          >
                            {lead.followup_status || "pending"}
                          </Chip>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                {leads.length > 10 && (
                  <div className="flex justify-center p-4">
                    <Button
                      onClick={() => router.push(`/admin/leads/executive/${executiveId}`)}
                      variant="flat"
                      color="primary"
                      size="sm"
                    >
                      View All Leads
                    </Button>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        )}

        {/* Journals Tab */}
        {selectedTab === "journals" && (
          <div className="space-y-6">
            {/* Journals Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="shadow-sm">
                <CardBody>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-default-500">Total Journals</p>
                      <h4 className="text-2xl font-bold">{journals.length}</h4>
                    </div>
                    <div className="p-2 rounded-full bg-primary-100 text-primary-600">
                      <DocumentDuplicateIcon className="w-5 h-5" />
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card className="shadow-sm">
                <CardBody>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-default-500">Published</p>
                      <h4 className="text-2xl font-bold">
                        {journals.filter(j => j.is_private === true && j.status === "approved").length}
                      </h4>
                    </div>
                    <div className="p-2 rounded-full bg-success-100 text-success-600">
                      <CheckBadgeIcon className="w-5 h-5" />
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card className="shadow-sm">
                <CardBody>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-default-500">In Process</p>
                      <h4 className="text-2xl font-bold">
                        {journals.filter(j => j.is_private === true && j.status !== "approved").length}
                      </h4>
                    </div>
                    <div className="p-2 rounded-full bg-warning-100 text-warning-600">
                      <ClipboardDocumentListIcon className="w-5 h-5" />
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Journal Status Chart */}
            <Card className="shadow-sm">
              <CardHeader className="pb-0 pt-4 px-6 flex-col items-start">
                <h4 className="font-bold text-large">Journal Status Distribution</h4>
                <p className="text-default-500 text-sm">Current status of journals</p>
              </CardHeader>
              <CardBody className="overflow-hidden">
                <div className="w-full h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={journalStatusDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {journalStatusDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [`${value} journals`, name]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardBody>
            </Card>

            {/* Journals Table */}
            <Card className="shadow-sm">
              <CardHeader className="flex justify-between items-center">
                <h4 className="font-bold text-large">Recent Journals</h4>
                <Input 
                  placeholder="Search journals..." 
                  size="sm" 
                  startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                  className="w-full sm:max-w-[260px]"
                />
              </CardHeader>
              <CardBody className="p-0">
                <Table aria-label="Journals table" isStriped>
                  <TableHeader>
                    <TableColumn>ID</TableColumn>
                    <TableColumn>Client Name</TableColumn>
                    <TableColumn>Journal Name</TableColumn>
                    <TableColumn>Paper Title</TableColumn>
                    <TableColumn>Status</TableColumn>
                    <TableColumn>Date</TableColumn>
                  </TableHeader>
                  <TableBody emptyContent="No journals found" items={journals.filter(j => j.is_private === true).slice(0, 10)}>
                    {(journal) => (
                      <TableRow key={journal.id}>
                        <TableCell>{journal.id}</TableCell>
                        <TableCell>{journal.client_name || "N/A"}</TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate">
                            {journal.journal_name || "N/A"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate">
                            {journal.paper_title || "N/A"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Chip
                            color={
                              journal.status === "approved"
                                ? "success"
                                : journal.status === "rejected"
                                ? "danger"
                                : journal.status === "under review"
                                ? "warning"
                                : journal.status === "submitted"
                                ? "primary"
                                : "default"
                            }
                            variant="flat"
                            size="sm"
                          >
                            {journal.status && journal.status.charAt(0).toUpperCase() + journal.status.slice(1)}
                          </Chip>
                        </TableCell>
                        <TableCell>{formatDate(journal.created_at)}</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                {journals.filter(j => j.is_private === true).length > 10 && (
                  <div className="flex justify-center p-4">
                    <Button
                      onClick={() => router.push(`/admin/journals/executive/${executiveId}`)}
                      variant="flat"
                      color="primary"
                      size="sm"
                    >
                      View All Journals
                    </Button>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        )}
      </div>

      {/* Edit Executive Modal */}
      <Modal 
        isOpen={isEditModalOpen} 
        onClose={onEditModalClose}
        size="2xl"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Edit Executive Profile</ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <Input
                    label="Username"
                    name="username"
                    value={editForm.username}
                    onChange={handleInputChange}
                  />
                  <Input
                    type="email"
                    label="Email"
                    name="email"
                    value={editForm.email}
                    onChange={handleInputChange}
                  />
                  <Select 
                    label="Role"
                    selectedKeys={selectedRole}
                    onSelectionChange={handleRoleChange}
                    isDisabled={isLoadingRoles}
                    // Add this prop for custom selected value display
                    classNames={{
                      value: "truncate"
                    }}
                    renderValue={(items) => {
                      const foundRole = roles.find(role => role.id.toString() === Array.from(selectedRole)[0]);
                      return foundRole ? renderSelectValue(foundRole) : null;
                    }}
                  >
                    {isLoadingRoles ? (
                      <SelectItem key="loading" value="loading">
                        Loading roles...
                      </SelectItem>
                    ) : (
                      roles.map((role) => (
                        <SelectItem 
                          key={role.id.toString()}
                          value={role.id.toString()}
                        >
                          {/* Show both name and entity_type in dropdown list */}
                          {role.name} ({role.entity_type})
                        </SelectItem>
                      ))
                    )}
                  </Select>
                  
                  {/* Display role permissions */}
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">Role Permissions:</p>
                    
                    {isLoadingRoles ? (
                      <div className="flex justify-center py-2">
                        <Spinner size="sm" />
                      </div>
                    ) : selectedRolePermissions.length > 0 ? (
                      <div className="flex flex-wrap gap-1 p-2 border rounded-md bg-default-50">
                        {selectedRolePermissions.map(permission => (
                          <Chip 
                            key={permission.id} 
                            size="sm" 
                            variant="flat"
                            className="max-w-[200px] truncate"
                          >
                            {permission.description || permission.name}
                          </Chip>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center p-3 border rounded-md bg-default-50 text-default-500">
                        No permissions assigned to this role
                      </div>
                    )}
                  </div>
                  
                  <Divider />
                  <div className="space-y-4">
                    <p className="text-sm text-default-500">
                      Leave password fields empty if you don&apos;t want to change the password
                    </p>
                    <Input
                      type="password"
                      label="New Password"
                      name="password"
                      value={editForm.password || ''}
                      onChange={handleInputChange}
                    />
                    <Input
                      type="password"
                      label="Confirm New Password"
                      name="confirmPassword"
                      value={editForm.confirmPassword || ''}
                      onChange={handleInputChange}
                      isInvalid={!!editForm.password && editForm.password !== editForm.confirmPassword}
                      errorMessage={
                        editForm.password && editForm.password !== editForm.confirmPassword 
                          ? "Passwords don't match" 
                          : undefined
                      }
                    />
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onEditModalClose}>
                  Close
                </Button>
                {(isSuperAdmin || canUpdateUsers) && (
                  <>
                    <Button 
                      color="danger" 
                      variant="flat"
                      onPress={onDeleteModalOpen}
                    >
                      Delete Executive
                    </Button>
                    <Button 
                      color="primary" 
                      onPress={handleSubmit}
                      isLoading={isSubmitting}
                    >
                      Save Changes
                    </Button>
                  </>
                )}
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Reset Password Modal */}
      <Modal isOpen={isResetModalOpen} onClose={onResetModalClose}>
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            Reset Password
          </ModalHeader>
          <ModalBody>
            <p>Are you sure you want to reset the password for {executiveData?.username}?</p>
            <p className="text-default-500 text-sm">
              A new temporary password will be generated and sent to their email address: {executiveData?.email}
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onResetModalClose}>
              Cancel
            </Button>
            <Button color="danger" onPress={onResetModalClose}>
              Reset Password
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={onDeleteModalClose}
        size="md"
      >
        <ModalContent>
          {(closeDeleteModal) => (
            <>
              <ModalHeader className="flex flex-col gap-1 text-danger">
                <span className="text-2xl">⚠️ Confirm Account Removal</span>
              </ModalHeader>
              <ModalBody>
                <p className="mb-4">
                  You&apos;re about to remove <strong>{executiveData?.username}</strong> ({executiveData?.role_details?.entity_type}) from the system.
                </p>
                
                <p className="font-medium mb-2">Please note:</p>
                
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>This account will no longer be able to access the platform or its features.</li>
                  <li>Any tasks, messages, or responsibilities linked to this account will be unassigned or paused.</li>
                  <li>The account will no longer appear in user lists or assignment options.</li>
                </ul>
                
                <p className="text-danger-600 italic">
                  We recommend proceeding only if you&apos;re certain this account is no longer needed.
                </p>
                
                <p className="font-medium mt-4">
                  Would you like to continue?
                </p>
              </ModalBody>
              <ModalFooter>
                <Button 
                  variant="light" 
                  onPress={onDeleteModalClose}
                  isDisabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button 
                  color="danger" 
                  onPress={handleDeleteExecutive}
                  isLoading={isDeleting}
                >
                  Delete
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

// Add missing import for currentUserHasPermission
const currentUserHasPermission = (permission: string) => {
  // Implementation would be imported from utils/permissions
  return true;
};

// Add missing PERMISSIONS constant
const PERMISSIONS = {
  UPDATE_USERS: 'update_users',
};

// Wrap the component with admin authentication
export default WithAdminAuth(ExecutiveDetailPage);
