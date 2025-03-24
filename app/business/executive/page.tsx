"use client"
import React from 'react';
import { useRouter } from 'next/navigation';
import { checkAuth } from '@/utils/authCheck';
import {
  Card,
  CardHeader,
  CardBody,
  Button,
} from "@heroui/react";
import { 
  PlusIcon, 
  DocumentTextIcon,
  CurrencyRupeeIcon,
  ClockIcon,
  DocumentDuplicateIcon,
  TableCellsIcon,
  UserGroupIcon,
  BellAlertIcon,
  PhoneIcon,
  CalendarDaysIcon,
  ArrowPathIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import api from '@/services/api';
import { withExecutiveAuth } from '@/components/withExecutiveAuth';
import type { Prospectus, Registration, Lead } from '@/services/api';
import { Spinner } from "@nextui-org/react";
import { format, isToday, isPast, parseISO } from 'date-fns';
import { 
  PERMISSIONS,
  hasPermission, 
  hasRecordsAccess,
  UserWithPermissions,
  currentUserHasPermission
} from '@/utils/permissions';

function BusinessDashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(true);
  const [dashboardData, setDashboardData] = React.useState({
    totalProspects: 0,
    totalRegistrations: 0,
    pendingRegistrations: 0,
    completedRegistrations: 0,
    totalRevenue: 0,
    pendingAmount: 0,
  });
  
  // Add lead-related state
  const [leadsData, setLeadsData] = React.useState({
    totalLeads: 0,
    pendingFollowups: 0,
    todayFollowups: 0,
    overdueFollowups: 0,
    newLeadsToday: 0,
    convertedLeads: 0
  });
  
  const [recentLeads, setRecentLeads] = React.useState<Lead[]>([]);
  const [todayFollowups, setTodayFollowups] = React.useState<Lead[]>([]);
  const [leadsLoading, setLeadsLoading] = React.useState(true);
  
  const [userData, setUserData] = React.useState<UserWithPermissions | null>(null);
  const [hasAddProspectPermission, setHasAddProspectPermission] = React.useState(false);
  const [hasAnyRecordsPermission, setHasAnyRecordsPermission] = React.useState(false);
  const [hasDashboardPermission, setHasDashboardPermission] = React.useState(false);

  React.useEffect(() => {
    if (!checkAuth(router)) return;
    
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) return;
    
    const userDataParsed = JSON.parse(userStr);
    setUserData(userDataParsed);

    // Check dashboard permission immediately
    const dashboardPermission = hasPermission(
      userDataParsed, 
      PERMISSIONS.VIEW_DASHBOARD_EXECUTIVE
    );
    setHasDashboardPermission(dashboardPermission);

    // If no dashboard permission but has records access, redirect to records
    if (!dashboardPermission) {
      const recordsAccess = hasRecordsAccess(userDataParsed);
      if (recordsAccess) {
        router.replace('/business/executive/records');
        return;
      }
    }
    
    // Fetch both prospectus and leads data
    fetchDashboardData(userDataParsed.id);
    fetchLeadsData();
    
  }, [router]);

  const fetchDashboardData = async (userId: string) => {
    try {
      setIsLoading(true);
      const [prospectsResponse, registrationsResponse] = await Promise.all([
        api.getProspectusByClientId(userId),
        api.getRegistrationsByExecutive(userId)
      ]);
      
      const prospects = prospectsResponse.data || [];
      const registrations = registrationsResponse.data || [];
      
      // Calculate dashboard metrics
      const pendingRegs = registrations.filter(reg => reg.status === 'pending');
      const completedRegs = registrations.filter(reg => reg.status === 'registered');
      const totalRevenue = completedRegs.reduce((sum, reg) => sum + reg.total_amount, 0);
      const pendingAmount = pendingRegs.reduce((sum, reg) => sum + reg.total_amount, 0);

      setDashboardData({
        totalProspects: prospects.length,
        totalRegistrations: registrations.length,
        pendingRegistrations: pendingRegs.length,
        completedRegistrations: completedRegs.length,
        totalRevenue: totalRevenue,
        pendingAmount: pendingAmount,
      });

      // Check permissions using our utility
      setHasAddProspectPermission(
        hasPermission(userData, PERMISSIONS.SHOW_ADD_PROSPECT)
      );
      setHasAnyRecordsPermission(
        hasRecordsAccess(userData)
      );
      
    } catch (error) {
      console.error('Error fetching prospectus data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch leads data for the dashboard
  const fetchLeadsData = async () => {
    try {
      setLeadsLoading(true);
      
      // Fetch all leads and today's followups in parallel
      const [leadsResponse, followupsResponse] = await Promise.all([
        api.getAllLeads(),
        api.getTodayFollowupLeads()
      ]);
      
      const leads = leadsResponse.data || [];
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      
      // Calculate leads metrics
      const pendingFollowups = leads.filter(lead => lead.followup_status === 'pending').length;
      const todayFollowups = leads.filter(lead => {
        if (!lead.followup_date) return false;
        return lead.followup_date === today && lead.followup_status === 'pending';
      }).length;
      
      // Find overdue followups
      const overdueFollowups = leads.filter(lead => {
        if (!lead.followup_date || lead.followup_status !== 'pending') return false;
        return lead.followup_date < today;
      }).length;
      
      // Find new leads today
      const newLeadsToday = leads.filter(lead => lead.date === today).length;
      
      // Find converted leads (where status is completed or converted)
      const convertedLeads = leads.filter(lead => 
        lead.followup_status === 'completed' || 
        lead.followup_status === 'converted'
      ).length;
      
      setLeadsData({
        totalLeads: leads.length,
        pendingFollowups,
        todayFollowups,
        overdueFollowups,
        newLeadsToday,
        convertedLeads
      });
      
      // Set the recent leads (last 5 leads)
      setRecentLeads(leads.slice(0, 5));
      
      // Set today's followups from the dedicated endpoint
      if (followupsResponse && followupsResponse.data) {
        const todayFollowupsData = followupsResponse.data.slice(0, 3); // Top 3 followups for today
        setTodayFollowups(todayFollowupsData);
      }
      
    } catch (error) {
      console.error('Error fetching leads data:', error);
      toast.error('Failed to load leads data');
    } finally {
      setLeadsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return `₹${value.toLocaleString('en-IN')}`;
  };

  const getFormattedDate = () => {
    return format(new Date(), "EEEE, MMMM d, yyyy");
  };

  // Format date for display
  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return "N/A";

    try {
      // For ISO date strings
      const date = new Date(dateString);
      return format(date, "MMM dd, yyyy");
    } catch (e) {
      console.error("Date parsing error:", e);
      return dateString; // Return original on error
    }
  };

  const goToLeadsManagement = () => {
    router.push('/business/executive/leads/all');
  };

  const goToProspects = () => {
    router.push('/business/executive/records');
  };

  if (isLoading || leadsLoading) {
    return (
      <div className="flex justify-center items-center h-[400px]">
        <Spinner size="lg" label="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="w-full p-6">
      <Card className="mb-6">
        <CardHeader className="flex justify-between items-center px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold">Business Executive Dashboard</h1>
            <p className="text-default-500 text-sm">{getFormattedDate()}</p>
          </div>
          <div className="flex gap-2">
            {hasAnyRecordsPermission && (
              <Button 
                color="secondary"
                onClick={() => router.push('/business/executive/records')}
                startContent={<TableCellsIcon className="h-5 w-5" />}
              >
                View Records
              </Button>
            )}
            {hasAddProspectPermission && (
              <Button 
                color="primary" 
                onClick={() => router.push('/business/executive/add_prospect')}
                startContent={<PlusIcon className="h-5 w-5" />}
              >
                Add Prospect
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Leads & Prospects Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="border-l-4 border-primary">
          <CardBody className="flex flex-row items-center justify-between">
            <div>
              <p className="text-default-500 text-sm">Total Leads</p>
              <h3 className="text-2xl font-bold">{leadsData.totalLeads}</h3>
            </div>
            <div className="bg-primary/10 p-3 rounded-full">
              <TableCellsIcon className="w-6 h-6 text-primary" />
            </div>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-success">
          <CardBody className="flex flex-row items-center justify-between">
            <div>
              <p className="text-default-500 text-sm">Total Prospects</p>
              <h3 className="text-2xl font-bold">{dashboardData.totalProspects}</h3>
            </div>
            <div className="bg-success/10 p-3 rounded-full">
              <UserGroupIcon className="w-6 h-6 text-success" />
            </div>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-warning">
          <CardBody className="flex flex-row items-center justify-between">
            <div>
              <p className="text-default-500 text-sm">Pending Follow-ups</p>
              <h3 className="text-2xl font-bold">{leadsData.pendingFollowups}</h3>
            </div>
            <div className="bg-warning/10 p-3 rounded-full">
              <BellAlertIcon className="w-6 h-6 text-warning" />
            </div>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-danger">
          <CardBody className="flex flex-row items-center justify-between">
            <div>
              <p className="text-default-500 text-sm">Revenue</p>
              <h3 className="text-2xl font-bold">{formatCurrency(dashboardData.totalRevenue)}</h3>
            </div>
            <div className="bg-danger/10 p-3 rounded-full">
              <CurrencyRupeeIcon className="w-6 h-6 text-danger" />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Leads and Follow-ups Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Today's Follow-ups Card */}
        <Card className="shadow-sm">
          <CardHeader className="flex justify-between items-center border-b border-divider pb-2">
            <div>
              <h3 className="text-lg font-semibold flex items-center">
                <BellAlertIcon className="h-5 w-5 mr-2 text-warning" />
                Today's Follow-ups
              </h3>
              <p className="text-default-500 text-sm">
                {todayFollowups.length === 0 ? "No follow-ups scheduled for today" : 
                 `${todayFollowups.length} follow-ups need attention today`}
              </p>
            </div>
            <Button 
              size="sm" 
              color="warning" 
              variant="light"
              onClick={() => router.push('/business/executive/leads/followup')}
              endContent={<ChevronRightIcon className="h-4 w-4" />}
            >
              View All
            </Button>
          </CardHeader>
          <CardBody className="py-3">
            {todayFollowups.length === 0 ? (
              <div className="text-center py-6 text-default-400">
                <ClockIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No follow-ups scheduled for today</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayFollowups.map((followup) => (
                  <div 
                    key={followup.id} 
                    className="p-3 bg-default-50 rounded-lg hover:bg-default-100 transition-colors cursor-pointer"
                    onClick={() => router.push(`/business/executive/leads/${followup.id}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        router.push(`/business/executive/leads/${followup.id}`);
                      }
                    }}
                  >
                    <div className="flex justify-between mb-1">
                      <h4 className="font-medium">{followup.client_name}</h4>
                      <div className="flex items-center text-sm text-warning">
                        <CalendarDaysIcon className="h-4 w-4 mr-1" /> 
                        Today
                      </div>
                    </div>
                    <div className="text-sm flex items-center gap-2 mb-1">
                      <PhoneIcon className="h-4 w-4 text-default-400" />
                      {followup.phone_number || "No phone number"}
                    </div>
                    <p className="text-sm text-default-600 line-clamp-1">
                      {followup.remarks || "No remarks"}
                    </p>
                  </div>
                ))}

                <Button 
                  color="warning" 
                  variant="flat" 
                  className="w-full mt-2"
                  onClick={() => router.push('/business/executive/leads/followup')}
                >
                  Manage All Follow-ups
                </Button>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Quick Stats */}
        <Card className="shadow-sm">
          <CardHeader className="flex justify-between items-center border-b border-divider pb-2">
            <div>
              <h3 className="text-lg font-semibold">Leads & Prospects Stats</h3>
              <p className="text-default-500 text-sm">Activity overview</p>
            </div>
            <Button
              size="sm"
              variant="light"
              startContent={<ArrowPathIcon className="h-4 w-4" />}
              onClick={() => {
                fetchDashboardData(userData?.id || '');
                fetchLeadsData();
              }}
            >
              Refresh
            </Button>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-primary-50/50 p-4 rounded-lg">
                <h4 className="font-medium text-primary-600 mb-2">Leads Activity</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Leads:</span>
                    <span className="font-semibold">{leadsData.totalLeads}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>New Today:</span>
                    <span className="font-semibold">{leadsData.newLeadsToday}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Follow-ups (Pending):</span>
                    <span className="font-semibold">{leadsData.pendingFollowups}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Follow-ups (Today):</span>
                    <span className="font-semibold">{leadsData.todayFollowups}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Overdue Follow-ups:</span>
                    <span className="font-semibold text-danger">{leadsData.overdueFollowups}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Converted Leads:</span>
                    <span className="font-semibold text-success">{leadsData.convertedLeads}</span>
                  </div>
                </div>

                <Button 
                  color="primary" 
                  variant="flat" 
                  className="w-full mt-3"
                  onClick={goToLeadsManagement}
                >
                  Manage Leads
                </Button>
              </div>

              <div className="bg-success-50/50 p-4 rounded-lg">
                <h4 className="font-medium text-success-600 mb-2">Prospects & Revenue</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Prospects:</span>
                    <span className="font-semibold">{dashboardData.totalProspects}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Registrations:</span>
                    <span className="font-semibold">{dashboardData.totalRegistrations}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pending Registrations:</span>
                    <span className="font-semibold">{dashboardData.pendingRegistrations}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Completed Registrations:</span>
                    <span className="font-semibold">{dashboardData.completedRegistrations}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Revenue:</span>
                    <span className="font-semibold">{formatCurrency(dashboardData.totalRevenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pending Amount:</span>
                    <span className="font-semibold">{formatCurrency(dashboardData.pendingAmount)}</span>
                  </div>
                </div>

                <Button 
                  color="success" 
                  variant="flat" 
                  className="w-full mt-3"
                  onClick={goToProspects}
                >
                  View Prospects
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Recent Leads */}
      <Card className="mb-6">
        <CardHeader className="flex justify-between items-center border-b border-divider pb-2">
          <div>
            <h3 className="text-lg font-semibold">Recent Leads</h3>
            <p className="text-default-500 text-sm">Latest leads added to the system</p>
          </div>
          <Button
            size="sm"
            color="primary"
            variant="light"
            onClick={() => router.push('/business/executive/leads/all')}
            endContent={<ChevronRightIcon className="h-4 w-4" />}
          >
            View All
          </Button>
        </CardHeader>
        <CardBody className="overflow-hidden">
          {recentLeads.length === 0 ? (
            <div className="text-center py-6 text-default-400">
              <TableCellsIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No leads found</p>
            </div>
          ) : (
            <div className="divide-y divide-divider">
              {recentLeads.map(lead => (
                <div 
                  key={lead.id}
                  className="py-3 px-1 flex justify-between items-center hover:bg-default-50 cursor-pointer"
                  onClick={() => router.push(`/business/executive/leads/${lead.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      router.push(`/business/executive/leads/${lead.id}`);
                    }
                  }}
                >
                  <div>
                    <h4 className="font-medium">{lead.client_name}</h4>
                    <div className="flex items-center gap-4 text-sm text-default-500 mt-1">
                      <span className="flex items-center gap-1">
                        <PhoneIcon className="h-3 w-3" /> {lead.phone_number || "N/A"}
                      </span>
                      <span>{lead.domain || "No domain"}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-default-500">{formatDate(lead.date)}</div>
                    <div className="mt-1">
                      {lead.followup_date && (
                        <div className="text-xs px-2 py-0.5 rounded bg-warning-100 text-warning-700 inline-block">
                          Followup: {formatDate(lead.followup_date)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 pt-4 border-t border-divider flex justify-center">
            <Button 
              color="primary" 
              onClick={() => router.push('/business/executive/leads/add')}
              startContent={<PlusIcon className="h-4 w-4" />}
            >
              Add New Lead
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

export default withExecutiveAuth(BusinessDashboard);