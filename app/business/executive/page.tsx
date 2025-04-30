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
  ChevronRightIcon,
  ExclamationTriangleIcon
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

// Add helper function to calculate balance amount (similar to registration view page)
const calculateBalanceAmount = (totalAmount: number, paidAmount: number = 0): number => {
  return Math.max(0, totalAmount - paidAmount);
};

function BusinessDashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(true);
  const [dashboardData, setDashboardData] = React.useState({
    totalProspects: 0,
    totalRegistrations: 0,
    pendingRegistrations: 0,
    completedRegistrations: 0,
    totalRevenue: 0,
    unpaidAmount: 0, // Renamed from pendingAmount
    todayRevenue: 0,
    // Add new metrics for secondary and final payments
    secondaryPaymentsTotal: 0,
    secondaryPaymentsCompleted: 0,
    secondaryPaymentsPending: 0,
    secondaryPaymentsAmount: 0,
    finalPaymentsTotal: 0,
    finalPaymentsCompleted: 0,
    finalPaymentsPending: 0,
    finalPaymentsAmount: 0,
    totalPaidAmount: 0, // Total of all payment types
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
      
      // Calculate total revenue from completed registrations
      const totalRevenue = completedRegs.reduce((sum, reg) => sum + reg.total_amount, 0);
      
      // Initialize payment metrics
      let totalPaidAmount = 0;
      let secondaryPaymentsTotal = 0;
      let secondaryPaymentsCompleted = 0;
      let secondaryPaymentsPending = 0;
      let secondaryPaymentsAmount = 0;
      let finalPaymentsTotal = 0;
      let finalPaymentsCompleted = 0;
      let finalPaymentsPending = 0;
      let finalPaymentsAmount = 0;
      
      // Calculate total paid amount from all transactions and payment types
      registrations.forEach(reg => {
        // Initial payment
        if (reg.transactions && reg.transactions.amount) {
          totalPaidAmount += reg.transactions.amount;
        }
        
        // Count registrations requiring secondary payments (manuscript payments)
        // Check if registration involves paper writing (which requires secondary payment)
        const requirement = reg.prospectus?.leads?.requirement?.toLowerCase() || 
                           reg.prospectus?.requirement?.toLowerCase() || '';
        const isPaperWriting = requirement.includes('paper writing');
        
        if (isPaperWriting && reg.author_status === 'completed') {
          secondaryPaymentsTotal++;
          
          if (reg.is_secondary_payment_done) {
            secondaryPaymentsCompleted++;
            // If there's a secondary transaction, add the amount
            if (reg.secondary_transaction && reg.secondary_transaction.amount) {
              secondaryPaymentsAmount += reg.secondary_transaction.amount;
              totalPaidAmount += reg.secondary_transaction.amount;
            }
          } else {
            secondaryPaymentsPending++;
          }
        }
        
        // Count registrations requiring final payments (publication payments)
        // Check if registration involves publication (which requires final payment)
        const isPublication = requirement.includes('publication');
        
        if (isPublication && reg.journal_added) {
          finalPaymentsTotal++;
          
          if (reg.is_final_payment_done) {
            finalPaymentsCompleted++;
            // If there's a final transaction, add the amount
            if (reg.final_transaction && reg.final_transaction.amount) {
              finalPaymentsAmount += reg.final_transaction.amount;
              totalPaidAmount += reg.final_transaction.amount;
            }
          } else {
            finalPaymentsPending++;
          }
        }
      });
      
      // Calculate unpaid amount as difference between total registration amount and total paid amount
      const totalRegistrationAmount = registrations.reduce((sum, reg) => sum + reg.total_amount, 0);
      const unpaidAmount = Math.max(0, totalRegistrationAmount - totalPaidAmount);
      
      // Calculate today's revenue from completed registrations with today's date
      const today = new Date();
      let todayRevenue = 0;
      
      completedRegs.forEach(reg => {
        // Check if registration/transaction was completed today
        if (reg.registration_date && isToday(parseISO(reg.registration_date))) {
          todayRevenue += reg.total_amount;
        }
      });

      setDashboardData({
        totalProspects: prospects.length,
        totalRegistrations: registrations.length,
        pendingRegistrations: pendingRegs.length,
        completedRegistrations: completedRegs.length,
        totalRevenue: totalRevenue,
        unpaidAmount: unpaidAmount,
        todayRevenue: todayRevenue,
        // Add new secondary and final payment metrics
        secondaryPaymentsTotal,
        secondaryPaymentsCompleted,
        secondaryPaymentsPending,
        secondaryPaymentsAmount,
        finalPaymentsTotal,
        finalPaymentsCompleted,
        finalPaymentsPending,
        finalPaymentsAmount,
        totalPaidAmount,
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
            {/* {hasAddProspectPermission && (
              <Button 
                color="primary" 
                onClick={() => router.push('/business/executive/add_prospect')}
                startContent={<PlusIcon className="h-5 w-5" />}
              >
                Add Prospect
              </Button>
            )} */}
            <Button 
              color="primary" 
              onClick={() => router.push('/business/executive/leads/add')}
              startContent={<PlusIcon className="h-4 w-4" />}
            >
              Add New Lead
            </Button>
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

        {/* Change from Total Revenue to Total Collected */}
        <Card className="border-l-4 border-success">
          <CardBody className="flex flex-row items-center justify-between">
            <div>
              <p className="text-default-500 text-sm">Total Collected</p>
              <h3 className="text-2xl font-bold">{formatCurrency(dashboardData.totalPaidAmount)}</h3>
              <p className="text-xs text-success mt-1">Today: {formatCurrency(dashboardData.todayRevenue)}</p>
            </div>
            <div className="bg-success/10 p-3 rounded-full">
              <CurrencyRupeeIcon className="w-6 h-6 text-success" />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Add a new row for more financial insights - especially unpaid amounts */}
      {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="border-l-4 border-primary">
          <CardBody className="flex flex-row items-center justify-between">
            <div>
              <p className="text-default-500 text-sm">Initial Payments</p>
              <h3 className="text-xl font-bold">
                {formatCurrency(dashboardData.totalPaidAmount - dashboardData.secondaryPaymentsAmount - dashboardData.finalPaymentsAmount)}
              </h3>
            </div>
            <div className="bg-primary/10 p-3 rounded-full">
              <DocumentTextIcon className="w-6 h-6 text-primary" />
            </div>
          </CardBody>
        </Card>
        
        <Card className="border-l-4 border-secondary">
          <CardBody className="flex flex-row items-center justify-between">
            <div>
              <p className="text-default-500 text-sm">Manuscript Payments</p>
              <h3 className="text-xl font-bold">
                {formatCurrency(dashboardData.secondaryPaymentsAmount)}
              </h3>
            </div>
            <div className="bg-secondary/10 p-3 rounded-full">
              <DocumentDuplicateIcon className="w-6 h-6 text-secondary" />
            </div>
          </CardBody>
        </Card>
        
        <Card className="border-l-4 border-indigo-500">
          <CardBody className="flex flex-row items-center justify-between">
            <div>
              <p className="text-default-500 text-sm">Publication Payments</p>
              <h3 className="text-xl font-bold">
                {formatCurrency(dashboardData.finalPaymentsAmount)}
              </h3>
            </div>
            <div className="bg-indigo-500/10 p-3 rounded-full">
              <DocumentDuplicateIcon className="w-6 h-6 text-indigo-500" />
            </div>
          </CardBody>
        </Card>
      </div> */}

      {/* Add a Due Amounts Card */}
      <div className="mb-6">
        <Card className="border-l-4 border-danger">
          <CardBody className="flex flex-row items-center justify-between">
            <div className="flex flex-grow">
              <div className="flex-grow">
                <p className="text-default-500 text-sm">Outstanding Amount</p>
                <h3 className="text-2xl font-bold text-danger">{formatCurrency(dashboardData.unpaidAmount)}</h3>
              </div>
              
              <div className="flex flex-col items-end">
                <div className="flex items-center">
                  <p className="text-xs text-default-500 mr-2">Total Value:</p>
                  <p className="text-sm font-medium">{formatCurrency(dashboardData.totalRevenue)}</p>
                </div>
                <div className="flex items-center">
                  <p className="text-xs text-default-500 mr-2">Collected:</p>
                  <p className="text-sm font-medium text-success">{formatCurrency(dashboardData.totalPaidAmount)}</p>
                </div>
                <div className="flex items-center">
                  <p className="text-xs text-default-500 mr-2">Due:</p>
                  <p className="text-sm font-medium text-danger">{formatCurrency(dashboardData.unpaidAmount)}</p>
                </div>
              </div>
            </div>
            <div className="bg-danger/10 p-3 rounded-full ml-4">
              <ExclamationTriangleIcon className="w-6 h-6 text-danger" />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Update the Payment Insights card - focus on collected amounts and outstanding */}
      <div className="mb-6">
        <Card className="shadow-sm">
          <CardHeader className="flex justify-between items-center border-b border-divider pb-2">
            <div>
              <h3 className="text-lg font-semibold flex items-center">
                <CurrencyRupeeIcon className="h-5 w-5 mr-2 text-success" />
                Payment Insights
              </h3>
              <p className="text-default-500 text-sm">Detailed payment breakdown</p>
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Initial Payments */}
              <div className="p-4 bg-default-50 rounded-lg">
                <h4 className="font-medium text-primary-600 mb-3">Initial Payments</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Total Collected:</span>
                    <span className="font-semibold">{formatCurrency(dashboardData.totalPaidAmount - dashboardData.secondaryPaymentsAmount - dashboardData.finalPaymentsAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Registrations:</span>
                    <span className="font-semibold">{dashboardData.completedRegistrations}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Pending Registrations:</span>
                    <span className="font-semibold">{dashboardData.pendingRegistrations}</span>
                  </div>
                </div>
              </div>
              
              {/* Secondary Payments (Manuscript) */}
              <div className="p-4 bg-default-50 rounded-lg">
                <h4 className="font-medium text-secondary-600 mb-3">Manuscript Payments</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Total Collected:</span>
                    <span className="font-semibold text-success">{formatCurrency(dashboardData.secondaryPaymentsAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Completed Payments:</span>
                    <span className="font-semibold">{dashboardData.secondaryPaymentsCompleted}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Pending Payments:</span>
                    <span className="font-semibold text-warning">{dashboardData.secondaryPaymentsPending}</span>
                  </div>
                </div>
              </div>
              
              {/* Final Payments (Publication) */}
              <div className="p-4 bg-default-50 rounded-lg">
                <h4 className="font-medium text-indigo-600 mb-3">Publication Payments</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Total Collected:</span>
                    <span className="font-semibold text-success">{formatCurrency(dashboardData.finalPaymentsAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Completed Payments:</span>
                    <span className="font-semibold">{dashboardData.finalPaymentsCompleted}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Pending Payments:</span>
                    <span className="font-semibold text-warning">{dashboardData.finalPaymentsPending}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Payment Summary Row - More prominent display of collected vs outstanding */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Collected Amount Summary */}
              <div className="bg-success-50 dark:bg-success-900/20 p-4 rounded-xl border border-success-200 dark:border-success-800">
                <h3 className="text-lg font-semibold text-success-700 dark:text-success-400 mb-3">Total Collected Amount</h3>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-3xl font-bold text-success-600 dark:text-success-400">
                      {formatCurrency(dashboardData.totalPaidAmount)}
                    </div>
                    <div className="text-sm text-success-600 dark:text-success-400 mt-1">
                      Today: {formatCurrency(dashboardData.todayRevenue)}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between gap-4">
                      <span className="text-sm">Initial:</span>
                      <span className="text-sm font-medium">
                        {formatCurrency(dashboardData.totalPaidAmount - dashboardData.secondaryPaymentsAmount - dashboardData.finalPaymentsAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-sm">Manuscript:</span>
                      <span className="text-sm font-medium">
                        {formatCurrency(dashboardData.secondaryPaymentsAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-sm">Publication:</span>
                      <span className="text-sm font-medium">
                        {formatCurrency(dashboardData.finalPaymentsAmount)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Outstanding Amount Summary */}
              <div className="bg-danger-50 dark:bg-danger-900/20 p-4 rounded-xl border border-danger-200 dark:border-danger-800">
                <h3 className="text-lg font-semibold text-danger-700 dark:text-danger-400 mb-3">Outstanding Amount</h3>
                <div className="flex justify-between items-center">
                  <div className="text-3xl font-bold text-danger-600 dark:text-danger-400">
                    {formatCurrency(dashboardData.unpaidAmount)}
                  </div>
                  <div className="text-right">
                    <div className="text-sm">
                      <span className="text-default-600">Total Value: </span>
                      <span className="font-medium">{formatCurrency(dashboardData.totalRevenue)}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-default-600">Collection Rate: </span>
                      <span className="font-medium">
                        {dashboardData.totalRevenue > 0 
                          ? Math.round((dashboardData.totalPaidAmount / dashboardData.totalRevenue) * 100) 
                          : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-divider flex justify-center">
              <Button
                color="primary"
                variant="light"
                onClick={() => router.push('/business/executive/records/registration')}
                endContent={<ChevronRightIcon className="h-4 w-4" />}
              >
                View All Registrations
              </Button>
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
        </CardBody>
      </Card>
    </div>
  );
}

export default withExecutiveAuth(BusinessDashboard);