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
  Chip
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
  CheckBadgeIcon
} from "@heroicons/react/24/outline";
import api, { DashboardData } from '@/services/api';

// Updated component for Admin Dashboard
function AdminDashboard() {
  const router = useRouter();
  
  // Single dashboard data state instead of multiple metrics
  const [dashboardData, setDashboardData] = React.useState<DashboardData | null>(null);
  
  // Loading and refreshing states
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetchDashboardData();
  }, []);

  // Fetch dashboard data using the new API function
  const fetchDashboardData = async (showRefreshAnimation = false) => {
    try {
      if (showRefreshAnimation) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      
      // Use the new combined API endpoint
      const response = await api.getDashboardData();
      setDashboardData(response.data);
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

  // Handle manual refresh
  const handleRefresh = () => {
    fetchDashboardData(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
      
      {/* Key Metrics Summary */}
      <Card className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 border-none shadow-sm">
        <CardBody>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* Total Entities */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <UserGroupIcon className="h-5 w-5 text-primary" />
                <span className="text-default-600 text-sm">Total Users</span>
              </div>
              {isLoading ? (
                <Skeleton className="h-8 w-20 rounded-lg" />
              ) : (
                <p className="text-2xl font-bold">{dashboardData?.entityCounts.total || 0}</p>
              )}
              <p className="text-xs text-default-500">
                Across all user types
              </p>
            </div>
            
            {/* Replace Content Items with Conversion Rate */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <ArrowTrendingUpIcon className="h-5 w-5 text-primary" />
                <span className="text-default-600 text-sm">Conversion Rate</span>
              </div>
              {isLoading ? (
                <Skeleton className="h-8 w-20 rounded-lg" />
              ) : (
                <p className="text-2xl font-bold">
                  {dashboardData && dashboardData.contentMetrics.leads > 0 ? 
                    `${Math.round((dashboardData.contentMetrics.registrations / dashboardData.contentMetrics.leads) * 100)}%` : 
                    "0%"}
                </p>
              )}
              <p className="text-xs text-default-500">
                Leads to registrations
              </p>
            </div>
            
            {/* Total Revenue */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <BanknotesIcon className="h-5 w-5 text-primary" />
                <span className="text-default-600 text-sm">Total Revenue</span>
              </div>
              {isLoading ? (
                <Skeleton className="h-8 w-28 rounded-lg" />
              ) : (
                <p className="text-2xl font-bold">
                  ₹{dashboardData?.financialMetrics.totalRevenue.toLocaleString() || 0}
                </p>
              )}
              <p className="text-xs text-default-500">
                From all transactions
              </p>
            </div>
            
            {/* Active Services */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <CircleStackIcon className="h-5 w-5 text-primary" />
                <span className="text-default-600 text-sm">Active Services</span>
              </div>
              {isLoading ? (
                <Skeleton className="h-8 w-20 rounded-lg" />
              ) : (
                <p className="text-2xl font-bold">{dashboardData?.serviceMetrics.total || 0}</p>
              )}
              <p className="text-xs text-default-500">
                Available to customers
              </p>
            </div>
          </div>
        </CardBody>
      </Card>
      
      {/* User Distribution and Financial Overview */}
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
                    <Skeleton className="h-2 w-full rounded-full" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm">Total Users</span>
                  <span className="font-semibold">{dashboardData?.entityCounts.total || 0}</span>
                </div>
                
                {/* Executive Users */}
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-primary"></div>
                      <span>Executives</span>
                    </div>
                    <span>
                      {dashboardData?.entityCounts.executive || 0} 
                      ({dashboardData && dashboardData.entityCounts.total > 0 
                        ? Math.round((dashboardData.entityCounts.executive / dashboardData.entityCounts.total) * 100) 
                        : 0}%)
                    </span>
                  </div>
                  <Progress 
                    value={dashboardData && dashboardData.entityCounts.total > 0 
                      ? (dashboardData.entityCounts.executive / dashboardData.entityCounts.total) * 100 
                      : 0} 
                    className="h-2 bg-primary" 
                  />
                </div>
                
                {/* Editor Users */}
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-success"></div>
                      <span>Editors</span>
                    </div>
                    <span>
                      {dashboardData?.entityCounts.editor || 0} 
                      ({dashboardData && dashboardData.entityCounts.total > 0 
                        ? Math.round((dashboardData.entityCounts.editor / dashboardData.entityCounts.total) * 100) 
                        : 0}%)
                    </span>
                  </div>
                  <Progress 
                    value={dashboardData && dashboardData.entityCounts.total > 0 
                      ? (dashboardData.entityCounts.editor / dashboardData.entityCounts.total) * 100 
                      : 0} 
                    className="h-2 bg-success" 
                  />
                </div>
                
                {/* Author Users */}
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-warning"></div>
                      <span>Authors</span>
                    </div>
                    <span>
                      {dashboardData?.entityCounts.author || 0} 
                      ({dashboardData && dashboardData.entityCounts.total > 0 
                        ? Math.round((dashboardData.entityCounts.author / dashboardData.entityCounts.total) * 100) 
                        : 0}%)
                    </span>
                  </div>
                  <Progress 
                    value={dashboardData && dashboardData.entityCounts.total > 0 
                      ? (dashboardData.entityCounts.author / dashboardData.entityCounts.total) * 100 
                      : 0} 
                    className="h-2 bg-warning" 
                  />
                </div>
                
                {/* Admin Users */}
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-danger"></div>
                      <span>Admins</span>
                    </div>
                    <span>
                      {dashboardData?.entityCounts.admin || 0} 
                      ({dashboardData && dashboardData.entityCounts.total > 0 
                        ? Math.round((dashboardData.entityCounts.admin / dashboardData.entityCounts.total) * 100) 
                        : 0}%)
                    </span>
                  </div>
                  <Progress 
                    value={dashboardData && dashboardData.entityCounts.total > 0 
                      ? (dashboardData.entityCounts.admin / dashboardData.entityCounts.total) * 100 
                      : 0} 
                    className="h-2 bg-danger" 
                  />
                </div>
                
                {/* Other Users */}
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-secondary"></div>
                      <span>Other</span>
                    </div>
                    <span>
                      {dashboardData?.entityCounts.other || 0} 
                      ({dashboardData && dashboardData.entityCounts.total > 0 
                        ? Math.round((dashboardData.entityCounts.other / dashboardData.entityCounts.total) * 100) 
                        : 0}%)
                    </span>
                  </div>
                  <Progress 
                    value={dashboardData && dashboardData.entityCounts.total > 0 
                      ? (dashboardData.entityCounts.other / dashboardData.entityCounts.total) * 100 
                      : 0} 
                    className="h-2 bg-secondary" 
                  />
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
        
        {/* Financial Overview */}
        <Card className="shadow-sm">
          <CardHeader className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Financial Overview</h3>
            <BanknotesIcon className="w-5 h-5 text-default-500" />
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
              <div className="space-y-6">
                {/* Total Revenue */}
                <div className="space-y-1">
                  <p className="text-sm text-default-500">Total Revenue Generated</p>
                  <h3 className="text-3xl font-bold">
                    ₹{dashboardData?.financialMetrics.totalRevenue.toLocaleString() || 0}
                  </h3>
                  <p className="text-xs flex items-center gap-1">
                    <ArrowTrendingUpIcon className="h-3 w-3 text-success" />
                    <span className="text-success">
                      From {dashboardData?.contentMetrics.registrations || 0} completed registrations
                    </span>
                  </p>
                </div>
                
                {/* Average Transaction Value */}
                <div className="space-y-1">
                  <p className="text-sm text-default-500">Average Transaction Value</p>
                  <h3 className="text-2xl font-bold">
                    ₹{Math.round(dashboardData?.financialMetrics.averageTransactionValue || 0).toLocaleString()}
                  </h3>
                  <p className="text-xs text-default-400">
                    Per transaction
                  </p>
                </div>
                
                {/* Recent Transactions Preview */}
                <div className="space-y-2">
                  <p className="text-sm text-default-500">Recent Transaction</p>
                  {dashboardData?.financialMetrics.recentTransactions && 
                   dashboardData.financialMetrics.recentTransactions.length > 0 ? (
                    <div className="flex justify-between items-center border-l-4 border-primary p-2 bg-primary-50 rounded-r-md">
                      <div>
                        <p className="font-medium">
                          ₹{dashboardData.financialMetrics.recentTransactions[0].amount.toLocaleString()}
                        </p>
                        <div className="flex items-center gap-2">
                          <Chip size="sm" variant="flat" color="primary">
                            {dashboardData.financialMetrics.recentTransactions[0].transaction_type}
                          </Chip>
                          <p className="text-xs text-default-400">
                            {formatDate(dashboardData.financialMetrics.recentTransactions[0].transaction_date)}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm">{dashboardData.financialMetrics.recentTransactions[0].entities.username}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-default-400 italic">No recent transactions</p>
                  )}
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
              onClick={() => router.push('/admin/finance/transactions')}
            >
              View Financial Reports
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      {/* Content Metrics */}
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
                          <span className="text-xl font-bold">{dashboardData?.contentMetrics.leads || 0}</span>
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
                          <span className="text-xl font-bold">{dashboardData?.contentMetrics.prospectus || 0}</span>
                          <span className="text-xs">
                            {dashboardData && dashboardData.contentMetrics.leads > 0 ? 
                              `(${Math.round((dashboardData.contentMetrics.prospectus / dashboardData.contentMetrics.leads) * 100)}% conversion)` : 
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
                          <span className="text-xl font-bold">{dashboardData?.contentMetrics.registrations || 0}</span>
                          <span className="text-xs">
                            {dashboardData && dashboardData.contentMetrics.prospectus > 0 ? 
                              `(${Math.round((dashboardData.contentMetrics.registrations / dashboardData.contentMetrics.prospectus) * 100)}% conversion)` : 
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
                          <span className="text-xl font-bold">{dashboardData?.contentMetrics.journals || 0}</span>
                          <span className="text-xs">
                            {dashboardData && dashboardData.contentMetrics.registrations > 0 ? 
                              `(${Math.round((dashboardData.contentMetrics.journals / dashboardData.contentMetrics.registrations) * 100)}% conversion)` : 
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

          {/* Keep existing detailed cards for metrics */}
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
                    <p className="text-2xl font-bold">{dashboardData?.contentMetrics.prospectus || 0}</p>
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
                    <p className="text-2xl font-bold">{dashboardData?.contentMetrics.registrations || 0}</p>
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
                    <p className="text-2xl font-bold">{dashboardData?.contentMetrics.journals || 0}</p>
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
                    <p className="text-2xl font-bold">{dashboardData?.contentMetrics.leads || 0}</p>
                    <p className="text-xs text-default-500 mt-1">Potential clients</p>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
          
          {/* Journal Status Chart */}
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
            ) : dashboardData?.journalMetrics ? (
              <div className="space-y-4">
                {Object.entries(dashboardData.journalMetrics.statusDistribution).map(([status, count]) => (
                  <div key={status} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize">{status.replace('_', ' ')}</span>
                      <span>
                        {count} 
                        ({dashboardData.journalMetrics.total > 0 
                          ? Math.round((count / dashboardData.journalMetrics.total) * 100) 
                          : 0}%)
                      </span>
                    </div>
                    <Progress 
                      value={dashboardData.journalMetrics.total > 0 
                        ? (count / dashboardData.journalMetrics.total) * 100 
                        : 0} 
                      className={`h-2 ${journalStatusColors[status as keyof typeof journalStatusColors]}`} 
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-default-500 py-4">No journal data available</p>
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
              ) : dashboardData?.recentActivities.recentExecutives.length ? (
                dashboardData.recentActivities.recentExecutives.map((entity) => (
                  <div key={entity.id} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{entity.username}</p>
                      <div className="flex items-center gap-2">
                        {entity.role_details && (
                          <Chip 
                            size="sm" 
                            variant="flat" 
                            color={
                              entity.role_details.entity_type?.toLowerCase().includes('executive') ? 'primary' :
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

        {/* Recent Services */}
        <Card className="shadow-sm">
          <CardHeader className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Recent Services</h3>
            <WrenchScrewdriverIcon className="w-5 h-5 text-default-500" />
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
              ) : dashboardData?.recentActivities.recentServices.length ? (
                dashboardData.recentActivities.recentServices.map((service) => (
                  <div key={service.id} className="flex justify-between items-center">
                    <p className="font-medium">{service.service_name}</p>
                    <Chip color="success" variant="flat">₹{service.fee.toLocaleString()}</Chip>
                  </div>
                ))
              ) : (
                <p className="text-center text-default-400">No services found</p>
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
              onClick={() => router.push('/admin/services')}
            >
              View All Services
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export default AdminDashboard;