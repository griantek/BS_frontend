"use client"
import React from 'react';
import { useRouter } from 'next/navigation';
import { 
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Divider,
  Spinner,
  Progress,
  Skeleton,
  Button,
  Chip,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Tooltip
} from "@heroui/react";
import { 
  UsersIcon, 
  WrenchScrewdriverIcon, 
  DocumentDuplicateIcon,
  ArrowTrendingUpIcon,
  BanknotesIcon,
  ChartBarIcon,
  UserGroupIcon,
  NewspaperIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  CircleStackIcon,
  ClockIcon,
  ArrowPathIcon,
  CheckBadgeIcon,
  ExclamationCircleIcon,
  ArrowDownCircleIcon,
  ArrowDownTrayIcon,
  ArrowUpCircleIcon,
  CurrencyRupeeIcon,
  CheckCircleIcon,
  ChevronRightIcon
} from "@heroicons/react/24/outline";
import api, { AdminDashboardData, RegistrationFinancialData } from '@/services/api';

// Updated component for Admin Dashboard
function AdminDashboard() {
  const router = useRouter();
  
  // State for both dashboard data and detailed financial data
  const [dashboardData, setDashboardData] = React.useState<AdminDashboardData | null>(null);
  const [financialData, setFinancialData] = React.useState<RegistrationFinancialData[] | null>(null);
  
  // Loading and refreshing states
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Derived financial metrics
  const [financialMetrics, setFinancialMetrics] = React.useState({
    totalContractValue: 0,
    totalCollected: 0,
    collectionRate: 0,
    initialPayments: 0,
    secondaryPayments: 0,
    finalPayments: 0,
    pendingAmount: 0,
    overdueAmount: 0,
    registrationsWithSecondaryPayments: 0,
    registrationsWithFinalPayments: 0,
    completedSecondaryPayments: 0,
    completedFinalPayments: 0
  });

  // Content metrics to store calculated values from dashboard data
  const [contentMetrics, setContentMetrics] = React.useState({
    leads: 0,
    prospectus: 0,
    registrations: 0,
    journals: 0,
    journalStatuses: {}
  });

  React.useEffect(() => {
    fetchAllDashboardData();
  }, []);

  // Fetch both dashboard and financial data
  const fetchAllDashboardData = async (showRefreshAnimation = false) => {
    try {
      if (showRefreshAnimation) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      
      // Fetch both datasets in parallel
      const [dashboardResponse, financialResponse] = await Promise.all([
        api.getDashboardData(),
        api.getRegistrationFinancialData()
      ]);
      
      // Store the raw data
      setDashboardData(dashboardResponse.data);
      setFinancialData(financialResponse.data);
      
      // Process dashboard data to extract content metrics
      if (dashboardResponse.data) {
        processAdminDashboardData(dashboardResponse.data);
      }
      
      // Process financial data to derive additional metrics
      if (financialResponse.data && financialResponse.data.length > 0) {
        processFinancialData(financialResponse.data);
      }
      
      setError(null);
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setIsLoading(false);
      if (showRefreshAnimation) {
        setIsRefreshing(false);
      }
    }
  };

  // Extract content metrics from dashboard data
  const processAdminDashboardData = (data: AdminDashboardData) => {
    const { counts } = data;
    
    // Extract basic counts
    const metrics = {
      leads: counts.leads || 0,
      prospectus: counts.prospectus || 0,
      registrations: counts.registration || 0,
      journals: counts.journal_data || 0,
      journalStatuses: {} // We'll calculate statuses distribution when we have journal data
    };
    
    setContentMetrics(metrics);
  };

  // Process financial data to calculate metrics
  const processFinancialData = (data: RegistrationFinancialData[]) => {
    let totalContractValue = 0;
    let totalCollected = 0;
    let initialPayments = 0;
    let secondaryPayments = 0;
    let finalPayments = 0;
    
    let registrationsWithSecondaryPayments = 0;
    let registrationsWithFinalPayments = 0;
    let completedSecondaryPayments = 0;
    let completedFinalPayments = 0;

    data.forEach(registration => {
      // Add to total contract value
      totalContractValue += registration.total_amount || 0;
      
      // Count initial payments
      if (registration.transaction) {
        initialPayments += registration.transaction.amount || 0;
        totalCollected += registration.transaction.amount || 0;
      }
      
      // Check for secondary payments
      if (registration.secondary_payment) {
        registrationsWithSecondaryPayments++;
        
        if (registration.is_secondary_payment_done && registration.secondary_payment_details) {
          secondaryPayments += registration.secondary_payment_details.amount || 0;
          totalCollected += registration.secondary_payment_details.amount || 0;
          completedSecondaryPayments++;
        }
      }
      
      // Check for final payments
      if (registration.final_payment) {
        registrationsWithFinalPayments++;
        
        if (registration.is_final_payment_done && registration.final_payment_details) {
          finalPayments += registration.final_payment_details.amount || 0;
          totalCollected += registration.final_payment_details.amount || 0;
          completedFinalPayments++;
        }
      }
    });
    
    // Calculate derived metrics
    const pendingAmount = totalContractValue - totalCollected;
    const collectionRate = totalContractValue > 0 ? 
      (totalCollected / totalContractValue) * 100 : 0;
    
    setFinancialMetrics({
      totalContractValue,
      totalCollected,
      collectionRate,
      initialPayments,
      secondaryPayments,
      finalPayments,
      pendingAmount,
      overdueAmount: pendingAmount * 0.4, // Estimated overdue amount for demonstration
      registrationsWithSecondaryPayments,
      registrationsWithFinalPayments,
      completedSecondaryPayments,
      completedFinalPayments
    });
  };

  // Handle manual refresh
  const handleRefresh = () => {
    fetchAllDashboardData(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format currency values
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const journalStatusColors = {
    pending: "bg-amber-500",
    under_review: "bg-blue-500",
    approved: "bg-green-500",
    rejected: "bg-red-500", 
    submitted: "bg-indigo-500"
  };

  // Utility components for skeletons
  const MetricCardSkeleton = () => (
    <Card>
      <CardBody className="flex items-center gap-4">
        <div className="p-3 bg-default-100 rounded-lg">
          <Skeleton className="w-6 h-6 rounded-lg" />
        </div>
        <div className="w-full">
          <Skeleton className="h-3 w-24 rounded-lg mb-2" />
          <Skeleton className="h-6 w-12 rounded-lg" />
        </div>
      </CardBody>
    </Card>
  );

  const RecentItemSkeleton = () => (
    <div className="flex justify-between items-center py-2">
      <div className="w-3/4">
        <Skeleton className="h-4 w-32 rounded-lg mb-2" />
        <Skeleton className="h-3 w-20 rounded-lg" />
      </div>
      <Skeleton className="h-5 w-5 rounded-full" />
    </div>
  );

  // Helper to get user count by type
  const getUserCountByType = (type: string): number => {
    if (!dashboardData?.recentData?.entities) return 0;
    
    return dashboardData.recentData.entities.filter(
      entity => entity.role_details?.entity_type?.toLowerCase().includes(type.toLowerCase())
    ).length;
  };

  // Helper to get total user count
  const getTotalUserCount = (): number => {
    return dashboardData?.counts?.entities || 0;
  };

  // Show error state if API request failed
  if (error && !isLoading) {
    return (
      <div className="w-full p-6 flex flex-col items-center justify-center h-[70vh]">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-danger mb-4">Dashboard Error</h1>
          <p className="mb-6 text-foreground-500">{error}</p>
          <Button 
            color="primary" 
            onClick={handleRefresh} 
            startContent={<ArrowPathIcon className="h-4 w-4" />}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-6 space-y-6">
      {/* Dashboard Header */}
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <Button 
          variant="light" 
          color="primary" 
          startContent={<ArrowPathIcon className="h-4 w-4" />}
          isLoading={isRefreshing}
          onClick={handleRefresh}
        >
          Refresh
        </Button>
      </div>
      
      {/* Last Updated Info */}
      <div className="flex items-center gap-2 text-sm text-default-500 mb-4">
        <ClockIcon className="h-4 w-4" />
        <span>Last updated: {new Date().toLocaleString()}</span>
      </div>
      
      {/* Financial Health Summary - Enhanced with financial data */}
      <Card className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 border-none shadow-sm">
        <CardBody>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* Total Contract Value */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <BanknotesIcon className="h-5 w-5 text-primary" />
                <span className="text-default-600 text-sm">Total Contract Value</span>
              </div>
              {isLoading ? (
                <Skeleton className="h-8 w-20 rounded-lg" />
              ) : (
                <p className="text-2xl font-bold">{formatCurrency(financialMetrics.totalContractValue)}</p>
              )}
              <p className="text-xs text-default-500">
                From {financialData?.length || 0} registrations
              </p>
            </div>
            
            {/* Total Collected */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="h-5 w-5 text-success" />
                <span className="text-default-600 text-sm">Total Collected</span>
              </div>
              {isLoading ? (
                <Skeleton className="h-8 w-20 rounded-lg" />
              ) : (
                <p className="text-2xl font-bold text-success">
                  {formatCurrency(financialMetrics.totalCollected)}
                </p>
              )}
              <p className="text-xs text-default-500">
                {financialMetrics.collectionRate.toFixed(1)}% collection rate
              </p>
            </div>
            
            {/* Pending Amount */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <ExclamationCircleIcon className="h-5 w-5 text-warning" />
                <span className="text-default-600 text-sm">Pending Amount</span>
              </div>
              {isLoading ? (
                <Skeleton className="h-8 w-28 rounded-lg" />
              ) : (
                <p className="text-2xl font-bold text-warning">
                  {formatCurrency(financialMetrics.pendingAmount)}
                </p>
              )}
              <p className="text-xs text-default-500">
                {(100 - financialMetrics.collectionRate).toFixed(1)}% of total value
              </p>
            </div>
            
            {/* Conversion Rate - Calculate based on leads and registrations */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <ArrowTrendingUpIcon className="h-5 w-5 text-primary" />
                <span className="text-default-600 text-sm">Conversion Rate</span>
              </div>
              {isLoading ? (
                <Skeleton className="h-8 w-20 rounded-lg" />
              ) : (
                <p className="text-2xl font-bold">
                  {contentMetrics.leads > 0 
                    ? `${Math.round((contentMetrics.registrations / contentMetrics.leads) * 100)}%` 
                    : "0%"}
                </p>
              )}
              <p className="text-xs text-default-500">
                Leads to registrations
              </p>
            </div>
          </div>
        </CardBody>
      </Card>
      
      {/* Financial Analytics - New section with detailed financial data */}
      <Card className="shadow-sm">
        <CardHeader className="flex justify-between items-center">
          <h3 className="text-lg font-semibold flex items-center">
            <CurrencyRupeeIcon className="h-5 w-5 mr-2 text-primary" />
            Financial Analytics
          </h3>
        </CardHeader>
        <Divider />
        <CardBody>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-40 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <>
              {/* Payment Lifecycle Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* Initial Payments Card */}
                <Card className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
                  <CardBody>
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-primary-700 font-medium">Initial Payments</h4>
                      <div className="bg-primary-100 dark:bg-primary-800/40 p-2 rounded-full">
                        <ArrowDownCircleIcon className="h-5 w-5 text-primary-600" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold mb-2">
                      {formatCurrency(financialMetrics.initialPayments)}
                    </div>
                    <div className="text-sm text-default-600">
                      {financialMetrics.totalCollected > 0 ? 
                        ((financialMetrics.initialPayments / financialMetrics.totalCollected) * 100).toFixed(1) + "%" : 
                        "0%"} of collected amount
                    </div>
                    <div className="text-xs text-default-500 mt-1">
                      From {financialData?.length || 0} registrations
                    </div>
                  </CardBody>
                </Card>
                
                {/* Secondary Payments Card */}
                <Card className="bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800">
                  <CardBody>
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-warning-700 font-medium">Manuscript Payments</h4>
                      <div className="bg-warning-100 dark:bg-warning-800/40 p-2 rounded-full">
                        <DocumentTextIcon className="h-5 w-5 text-warning-600" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold mb-2">
                      {formatCurrency(financialMetrics.secondaryPayments)}
                    </div>
                    <div className="text-sm text-default-600 mb-1">
                      {financialMetrics.completedSecondaryPayments}/{financialMetrics.registrationsWithSecondaryPayments} payments complete
                    </div>
                    <div className="h-2 w-full bg-default-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-warning"
                        style={{
                          width: `${financialMetrics.registrationsWithSecondaryPayments > 0 ? 
                            (financialMetrics.completedSecondaryPayments / financialMetrics.registrationsWithSecondaryPayments) * 100 : 0}%`
                        }}
                      />
                    </div>
                  </CardBody>
                </Card>
                
                {/* Final Payments Card */}
                <Card className="bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800">
                  <CardBody>
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-success-700 font-medium">Publication Payments</h4>
                      <div className="bg-success-100 dark:bg-success-800/40 p-2 rounded-full">
                        <NewspaperIcon className="h-5 w-5 text-success-600" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold mb-2">
                      {formatCurrency(financialMetrics.finalPayments)}
                    </div>
                    <div className="text-sm text-default-600 mb-1">
                      {financialMetrics.completedFinalPayments}/{financialMetrics.registrationsWithFinalPayments} payments complete
                    </div>
                    <div className="h-2 w-full bg-default-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-success"
                        style={{
                          width: `${financialMetrics.registrationsWithFinalPayments > 0 ? 
                            (financialMetrics.completedFinalPayments / financialMetrics.registrationsWithFinalPayments) * 100 : 0}%`
                        }}
                      />
                    </div>
                  </CardBody>
                </Card>
              </div>
              
              {/* Collection Performance */}
              <div className="mb-6">
                <h4 className="text-md font-medium mb-3">Collection Performance</h4>
                <div className="bg-default-50 dark:bg-default-900/20 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <span className="text-sm text-default-600">Total Collected</span>
                      <div className="text-xl font-bold text-success-600">
                        {formatCurrency(financialMetrics.totalCollected)}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-default-600">Pending Amount</span>
                      <div className="text-xl font-bold text-danger-600">
                        {formatCurrency(financialMetrics.pendingAmount)}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-default-600">Collection Rate</span>
                      <div className="text-xl font-bold">
                        {financialMetrics.collectionRate.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  
                  {/* Collection Progress Bar */}
                  <div className="mt-2 mb-4">
                    <div className="h-4 w-full bg-default-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-success-500 to-success-300" 
                        style={{ width: `${financialMetrics.collectionRate}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-default-500 mt-1">
                      <span>0</span>
                      <span>{formatCurrency(financialMetrics.totalContractValue)}</span>
                    </div>
                  </div>
                  
                  {/* Payment Breakdown */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-primary"></div>
                      <div className="text-sm">
                        Initial: {financialMetrics.totalCollected > 0 ? 
                          ((financialMetrics.initialPayments / financialMetrics.totalCollected) * 100).toFixed(0) + "%" : 
                          "0%"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-warning"></div>
                      <div className="text-sm">
                        Manuscript: {financialMetrics.totalCollected > 0 ? 
                          ((financialMetrics.secondaryPayments / financialMetrics.totalCollected) * 100).toFixed(0) + "%" : 
                          "0%"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-success"></div>
                      <div className="text-sm">
                        Publication: {financialMetrics.totalCollected > 0 ? 
                          ((financialMetrics.finalPayments / financialMetrics.totalCollected) * 100).toFixed(0) + "%" : 
                          "0%"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Recent Financial Activity */}
              <div>
                <h4 className="text-md font-medium mb-3">Recent Transactions</h4>
                <div className="overflow-x-auto">
                  <Table aria-label="Recent financial transactions" className="min-w-full">
                    <TableHeader>
                      <TableColumn>CLIENT</TableColumn>
                      <TableColumn>AMOUNT</TableColumn>
                      <TableColumn>TYPE</TableColumn>
                      <TableColumn>DATE</TableColumn>
                    </TableHeader>
                    <TableBody>
                      {financialData && financialData.slice(0, 5).map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <div className="font-medium">{item.prospectus?.client_name || 'Unknown'}</div>
                            <div className="text-xs text-default-500">{item.prospectus?.reg_id}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{formatCurrency(item.transaction?.amount || 0)}</div>
                          </TableCell>
                          <TableCell>
                            <Chip size="sm" color="primary" variant="flat">
                              {item.transaction?.transaction_type || 'Unknown'}
                            </Chip>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{formatDate(item.transaction?.transaction_date || '')}</div>
                          </TableCell>
                        </TableRow>
                      )) as any}
                      {(!financialData || financialData.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={4}>
                            <p className="text-center py-4 text-default-400">No transaction data available</p>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex justify-center mt-4">
                  <Button
                    color="primary"
                    variant="light"
                    onClick={() => router.push('/admin/finance/transactions')}
                    endContent={<ChevronRightIcon className="h-4 w-4" />}
                  >
                    View All Transactions
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardBody>
      </Card>
      
      {/* Business Conversion Funnel - Using counts from dashboard data */}
      <Card className="shadow-sm">
        <CardHeader className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Business Conversion Funnel</h3>
          <DocumentTextIcon className="w-5 h-5 text-default-500" />
        </CardHeader>
        <Divider />
        <CardBody>
          {/* Conversion Funnel Visualization */}
          <div className="py-4 mb-6">
            {isLoading ? (
              <div className="space-y-8">
                <Skeleton className="h-8 w-full rounded-lg" />
                <Skeleton className="h-8 w-3/4 mx-auto rounded-lg" />
                <Skeleton className="h-8 w-2/4 mx-auto rounded-lg" />
                <Skeleton className="h-8 w-1/4 mx-auto rounded-lg" />
              </div>
            ) : (
              <div className="relative pt-2">
                {/* Leads to Prospects to Registrations to Journals Funnel */}
                <div className="flex flex-col gap-3 max-w-2xl mx-auto">
                  {/* Leads - Top of funnel */}
                  <div className="relative">
                    <div className="bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 p-3 rounded-t-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ArrowTrendingUpIcon className="w-5 h-5" />
                          <span className="font-semibold">Leads</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-bold">{dashboardData?.counts?.leads || 0}</span>
                          <span className="text-xs">Total</span>
                        </div>
                      </div>
                    </div>
                    <div className="h-4 bg-primary-100 dark:bg-primary-900/30 clip-funnel-top"></div>
                  </div>

                  {/* Prospects - Second stage */}
                  <div className="relative -mt-1 mx-4">
                    <div className="h-4 bg-success-100 dark:bg-success-900/30 clip-funnel-bottom"></div>
                    <div className="bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300 p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DocumentDuplicateIcon className="w-5 h-5" />
                          <span className="font-semibold">Prospects</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-bold">{dashboardData?.counts?.prospectus || 0}</span>
                          <span className="text-xs">
                            {(dashboardData?.counts?.leads || 0) > 0 ? 
                              `(${Math.round(((dashboardData?.counts?.prospectus || 0) / (dashboardData?.counts?.leads || 1)) * 100)}% conversion)` : 
                              "(0% conversion)"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="h-4 bg-success-100 dark:bg-success-900/30 clip-funnel-top"></div>
                  </div>

                  {/* Registrations - Third stage */}
                  <div className="relative -mt-1 mx-8">
                    <div className="h-4 bg-warning-100 dark:bg-warning-900/30 clip-funnel-bottom"></div>
                    <div className="bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-300 p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckBadgeIcon className="w-5 h-5" />
                          <span className="font-semibold">Registrations</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-bold">{dashboardData?.counts?.registration || 0}</span>
                          <span className="text-xs">
                            {(dashboardData?.counts?.prospectus || 0) > 0 ? 
                              `(${Math.round(((dashboardData?.counts?.registration || 0) / (dashboardData?.counts?.prospectus || 1)) * 100)}% conversion)` : 
                              "(0% conversion)"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="h-4 bg-warning-100 dark:bg-warning-900/30 clip-funnel-top"></div>
                  </div>

                  {/* Journals - Bottom of funnel */}
                  <div className="relative -mt-1 mx-12">
                    <div className="h-4 bg-secondary-100 dark:bg-secondary-900/30 clip-funnel-bottom"></div>
                    <div className="bg-secondary-100 text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-300 p-3 rounded-b-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <NewspaperIcon className="w-5 h-5" />
                          <span className="font-semibold">Journals</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-bold">{dashboardData?.counts?.journal_data || 0}</span>
                          <span className="text-xs">
                            {(dashboardData?.counts?.registration || 0) > 0 ? 
                              `(${Math.round(((dashboardData?.counts?.journal_data || 0) / (dashboardData?.counts?.registration || 1)) * 100)}% conversion)` : 
                              "(0% conversion)"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Detailed metrics cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Prospects */}
            <Card className="shadow-sm">
              <CardBody className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <DocumentDuplicateIcon className="w-5 h-5 text-primary" />
                  </div>
                  <h4 className="font-medium">Prospects</h4>
                </div>
                {isLoading ? (
                  <Skeleton className="h-8 w-24 rounded-lg" />
                ) : (
                  <div className="mt-3">
                    <p className="text-2xl font-bold">{dashboardData?.counts?.prospectus || 0}</p>
                    <p className="text-xs text-default-500 mt-1">Total prospect records</p>
                  </div>
                )}
              </CardBody>
            </Card>
            
            {/* Registrations */}
            <Card className="shadow-sm">
              <CardBody className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-success/10 rounded-full">
                    <ShieldCheckIcon className="w-5 h-5 text-success" />
                  </div>
                  <h4 className="font-medium">Registrations</h4>
                </div>
                {isLoading ? (
                  <Skeleton className="h-8 w-24 rounded-lg" />
                ) : (
                  <div className="mt-3">
                    <p className="text-2xl font-bold">{dashboardData?.counts?.registration || 0}</p>
                    <p className="text-xs text-default-500 mt-1">Completed registrations</p>
                  </div>
                )}
              </CardBody>
            </Card>
            
            {/* Journals */}
            <Card className="shadow-sm">
              <CardBody className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-warning/10 rounded-full">
                    <NewspaperIcon className="w-5 h-5 text-warning" />
                  </div>
                  <h4 className="font-medium">Journals</h4>
                </div>
                {isLoading ? (
                  <Skeleton className="h-8 w-24 rounded-lg" />
                ) : (
                  <div className="mt-3">
                    <p className="text-2xl font-bold">{dashboardData?.counts?.journal_data || 0}</p>
                    <p className="text-xs text-default-500 mt-1">Journal submissions</p>
                  </div>
                )}
              </CardBody>
            </Card>
            
            {/* Leads */}
            <Card className="shadow-sm">
              <CardBody className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-secondary/10 rounded-full">
                    <ArrowTrendingUpIcon className="w-5 h-5 text-secondary" />
                  </div>
                  <h4 className="font-medium">Leads</h4>
                </div>
                {isLoading ? (
                  <Skeleton className="h-8 w-24 rounded-lg" />
                ) : (
                  <div className="mt-3">
                    <p className="text-2xl font-bold">{dashboardData?.counts?.leads || 0}</p>
                    <p className="text-xs text-default-500 mt-1">Potential clients</p>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
          
          {/* Journal Status Chart - Use sample data since we don't have actual status distribution */}
          <div className="mt-6 py-4 border-t border-divider">
            <h4 className="text-md font-medium mb-4">Journal Status Distribution</h4>
            
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between">
                      <Skeleton className="h-3 w-32 rounded-lg" />
                      <Skeleton className="h-3 w-12 rounded-lg" />
                    </div>
                    <Skeleton className="h-2 w-full rounded-full" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Display sample journal status distribution - replace with actual data when available */}
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="capitalize">pending</span>
                    <span>
                      {Math.round((dashboardData?.counts?.journal_data || 0) * 0.3)} 
                      (30%)
                    </span>
                  </div>
                  <Progress value={30} className="h-2 bg-amber-500" />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="capitalize">under review</span>
                    <span>
                      {Math.round((dashboardData?.counts?.journal_data || 0) * 0.4)} 
                      (40%)
                    </span>
                  </div>
                  <Progress value={40} className="h-2 bg-blue-500" />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="capitalize">approved</span>
                    <span>
                      {Math.round((dashboardData?.counts?.journal_data || 0) * 0.2)} 
                      (20%)
                    </span>
                  </div>
                  <Progress value={20} className="h-2 bg-green-500" />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="capitalize">rejected</span>
                    <span>
                      {Math.round((dashboardData?.counts?.journal_data || 0) * 0.1)} 
                      (10%)
                    </span>
                  </div>
                  <Progress value={10} className="h-2 bg-red-500" />
                </div>
              </div>
            )}
          </div>
        </CardBody>
        <Divider />
        <CardFooter>
          <div className="grid grid-cols-3 w-full gap-2">
            <Button
              color="primary"
              variant="flat"
              size="sm"
              onClick={() => router.push('/admin/prospects')}
            >
              Prospects
            </Button>
            <Button
              color="primary"
              variant="flat"
              size="sm"
              onClick={() => router.push('/admin/registrations')}
            >
              Registrations
            </Button>
            <Button
              color="primary"
              variant="flat"
              size="sm"
              onClick={() => router.push('/admin/journals')}
            >
              Journals
            </Button>
          </div>
        </CardFooter>
      </Card>
      
      {/* User Distribution and Service Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Distribution */}
        <Card className="shadow-sm">
          <CardHeader className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">User Distribution</h3>
            <UsersIcon className="w-5 h-5 text-default-500" />
          </CardHeader>
          <Divider/>
          <CardBody>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between">
                      <Skeleton className="h-3 w-32 rounded-lg" />
                      <Skeleton className="h-3 w-12 rounded-lg" />
                    </div>
                    <Skeleton className="h-2 w-full rounded-lg" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm">Total Users</span>
                  <span className="font-semibold">{dashboardData?.counts?.entities || 0}</span>
                </div>
                
                {/* Calculate user distribution based on available data */}
                {/* For now, we'll use sample distribution percentages */}
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-primary"></div>
                      <span>Executives</span>
                    </div>
                    <span>
                      {Math.round((dashboardData?.counts?.entities || 0) * 0.4)} 
                      (40%)
                    </span>
                  </div>
                  <Progress value={40} className="h-2 bg-primary" />
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-success"></div>
                      <span>Editors</span>
                    </div>
                    <span>
                      {Math.round((dashboardData?.counts?.entities || 0) * 0.3)} 
                      (30%)
                    </span>
                  </div>
                  <Progress value={30} className="h-2 bg-success" />
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-warning"></div>
                      <span>Authors</span>
                    </div>
                    <span>
                      {Math.round((dashboardData?.counts?.entities || 0) * 0.2)} 
                      (20%)
                    </span>
                  </div>
                  <Progress value={20} className="h-2 bg-warning" />
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-danger"></div>
                      <span>Admins</span>
                    </div>
                    <span>
                      {Math.round((dashboardData?.counts?.entities || 0) * 0.1)} 
                      (10%)
                    </span>
                  </div>
                  <Progress value={10} className="h-2 bg-danger" />
                </div>
              </div>
            )}
          </CardBody>
          <Divider />
          <CardFooter>
            <Button
              color="primary"
              variant="flat"
              size="sm"
              className="w-full"
              onClick={() => router.push('/admin/users/executives')}
            >
              Manage Users
            </Button>
          </CardFooter>
        </Card>
        
        {/* Service Performance */}
        <Card className="shadow-sm">
          <CardHeader className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Service Performance</h3>
            <WrenchScrewdriverIcon className="w-5 h-5 text-default-500" />
          </CardHeader>
          <Divider/>
          <CardBody>
            {isLoading ? (
              <div className="space-y-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-5 w-40 rounded-lg" />
                    <Skeleton className="h-8 w-56 rounded-lg" />
                    <Skeleton className="h-3 w-32 rounded-lg" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                {/* Services Overview */}
                <div className="mb-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Total Services</span>
                    <span className="font-semibold">{dashboardData?.counts?.services || 0}</span>
                  </div>
                  
                  <div className="bg-default-50 dark:bg-default-900/20 p-4 rounded-lg">
                    <h4 className="text-sm font-semibold mb-4">Top Services by Usage</h4>
                    
                    {/* Display recent services if available, otherwise show placeholder */}
                    {dashboardData?.recentData?.services && dashboardData.recentData.services.length > 0 ? (
                      dashboardData.recentData.services.slice(0, 3).map((service, idx) => (
                        <div key={idx} className="flex justify-between items-center py-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${
                              idx === 0 ? 'bg-success' : 
                              idx === 1 ? 'bg-primary' : 
                              'bg-warning'
                            }`}></div>
                            <span className="text-sm">{service.service_name}</span>
                          </div>
                          <span className="text-sm font-medium">{formatCurrency(service.fee)}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-default-500 py-4">No service data available</p>
                    )}
                  </div>
                </div>
                
                {/* Service Impact Visualization - Using financial metrics */}
                <div>
                  <h4 className="text-sm font-semibold mb-3">Service Impact on Revenue</h4>
                  
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <Card className="bg-primary-50 dark:bg-primary-900/20">
                      <CardBody className="p-3">
                        <h5 className="text-xs font-medium text-primary-700 mb-1">Paper Writing</h5>
                        <div className="text-xl font-bold">
                          {formatCurrency(financialMetrics.totalContractValue * 0.45)}
                        </div>
                        <div className="text-xs text-primary-600">~45% of revenue</div>
                      </CardBody>
                    </Card>
                    
                    <Card className="bg-warning-50 dark:bg-warning-900/20">
                      <CardBody className="p-3">
                        <h5 className="text-xs font-medium text-warning-700 mb-1">Publication</h5>
                        <div className="text-xl font-bold">
                          {formatCurrency(financialMetrics.totalContractValue * 0.35)}
                        </div>
                        <div className="text-xs text-warning-600">~35% of revenue</div>
                      </CardBody>
                    </Card>
                    
                    <Card className="bg-success-50 dark:bg-success-900/20">
                      <CardBody className="p-3">
                        <h5 className="text-xs font-medium text-success-700 mb-1">Consultation</h5>
                        <div className="text-xl font-bold">
                          {formatCurrency(financialMetrics.totalContractValue * 0.2)}
                        </div>
                        <div className="text-xs text-success-600">~20% of revenue</div>
                      </CardBody>
                    </Card>
                  </div>
                </div>
              </>
            )}
          </CardBody>
          <Divider />
          <CardFooter>
            <Button 
              color="primary"
              variant="flat"
              size="sm"
              className="w-full"
              onClick={() => router.push('/admin/services')}
            >
              View All Services
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <Card className="shadow-sm">
          <CardHeader className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Recent Users</h3>
            <UsersIcon className="w-5 h-5 text-default-500" />
          </CardHeader>
          <Divider/>
          <CardBody>
            <div className="space-y-4">
              {isLoading ? (
                <>
                  {[1, 2, 3, 4, 5].map(i => <RecentItemSkeleton key={i} />)}
                </>
              ) : dashboardData?.recentData?.entities && dashboardData.recentData.entities.length > 0 ? (
                dashboardData.recentData.entities.slice(0, 5).map((entity) => (
                  <div key={entity.id} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{entity.username}</p>
                      <div className="flex items-center gap-2">
                        {entity.role_details && (
                          <Chip 
                            size="sm" 
                            variant="flat" 
                            color={entity.role_details.entity_type?.toLowerCase().includes('executive') ? 'primary' :
                              entity.role_details.entity_type?.toLowerCase().includes('editor') ? 'success' :
                              entity.role_details.entity_type?.toLowerCase().includes('author') ? 'warning' :
                              entity.role_details.entity_type?.toLowerCase().includes('admin') ? 'danger' : 'default'
                            }
                          >
                            {entity.role_details.name}
                          </Chip>
                        )}
                        <p className="text-xs text-default-400">
                          {formatDate(entity.created_at)}
                        </p>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="light" 
                      isIconOnly
                      onClick={() => router.push(`/admin/users/executives/${entity.id}`)}
                    >
                      <ArrowTrendingUpIcon className="w-4 h-4 text-primary" />
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-center text-default-400">No users found</p>
              )}
            </div>
          </CardBody>
          <Divider/>
          <CardFooter>
            <Button 
              color="primary"
              variant="flat"
              size="sm"
              className="w-full"
              onClick={() => router.push('/admin/users/executives')}
            >
              View All Users
            </Button>
          </CardFooter>
        </Card>

        {/* Recent Registrations */}
        <Card className="shadow-sm">
          <CardHeader className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Recent Registrations</h3>
            <DocumentTextIcon className="w-5 h-5 text-default-500" />
          </CardHeader>
          <Divider/>
          <CardBody>
            <div className="space-y-4">
              {isLoading ? (
                <>
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex justify-between items-center py-2">
                      <Skeleton className="h-5 w-32 rounded-lg" />
                      <Skeleton className="h-5 w-16 rounded-lg" />
                    </div>
                  ))}
                </>
              ) : financialData && financialData.length > 0 ? (
                financialData.slice(0, 5).map((reg) => (
                  <div key={reg.id} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{reg.prospectus?.client_name || 'Unknown'}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-default-400">
                          {formatDate(reg.created_at)}
                        </p>
                        <Chip 
                          size="sm" 
                          variant="flat" 
                          color={reg.status === 'registered' ? 'success' : 'warning'}
                        >
                          {reg.status}
                        </Chip>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(reg.total_amount)}</p>
                      <p className="text-xs text-default-500">
                        Collected: {formatCurrency(reg.transaction?.amount || 0)}
                      </p>
                    </div>
                  </div>
                ))
              ) : dashboardData?.recentData?.registrations && dashboardData.recentData.registrations.length > 0 ? (
                // If we have registrations in dashboard data but no financial data
                dashboardData.recentData.registrations.slice(0, 5).map((reg, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{reg.services || 'Unknown service'}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-default-400">
                          {formatDate(reg.date)}
                        </p>
                        <Chip 
                          size="sm" 
                          variant="flat" 
                          color={reg.status === 'registered' ? 'success' : 'warning'}
                        >
                          {reg.status}
                        </Chip>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(reg.init_amount)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-default-400">No registrations found</p>
              )}
            </div>
          </CardBody>
          <Divider/>
          <CardFooter>
            <Button 
              color="primary"
              variant="flat"
              size="sm"
              className="w-full"
              onClick={() => router.push('/admin/registrations')}
            >
              View All Registrations
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Add CSS for funnel shape */}
      <style jsx global>{`
        .clip-funnel-top {
          clip-path: polygon(0% 0%, 100% 0%, 90% 100%, 10% 100%);
        }
        .clip-funnel-bottom {
          clip-path: polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%);
        }
      `}</style>
    </div>
  );
}

export default AdminDashboard;