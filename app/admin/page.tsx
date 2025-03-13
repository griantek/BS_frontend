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
  Skeleton
} from "@heroui/react";
import { 
  UsersIcon, 
  WrenchScrewdriverIcon, 
  DocumentDuplicateIcon,
  ArrowTrendingUpIcon,
  BanknotesIcon,
  ChartBarIcon
} from "@heroicons/react/24/outline";
import api from '@/services/api';

interface DashboardMetrics {
  executivesCount: number;
  servicesCount: number;
  prospectsCount: number;
  registrationsCount: number;
  journalsCount: number;
  totalRevenue: number;
  recentExecutives: Array<{id: string; username: string; created_at: string}>;
  recentServices: Array<{id: number; service_name: string; fee: number}>;
  recentTransactions: Array<{id: number; transaction_type: string; amount: number; transaction_date: string; entities: {username: string}}>;
  journalsByStatus: {
    pending: number;
    under_review: number;
    approved: number;
    rejected: number;
    submitted: number;
  };
}

// Loading state interface to track individual data components
interface LoadingState {
  executives: boolean;
  services: boolean;
  transactions: boolean;
  registrations: boolean;
  journals: boolean;
  prospects: boolean;
}

function AdminDashboard() {
  const router = useRouter();
  const [metrics, setMetrics] = React.useState<DashboardMetrics>({
    executivesCount: 0,
    servicesCount: 0,
    prospectsCount: 0,
    registrationsCount: 0,
    journalsCount: 0,
    totalRevenue: 0,
    recentExecutives: [],
    recentServices: [],
    recentTransactions: [],
    journalsByStatus: {
      pending: 0,
      under_review: 0,
      approved: 0,
      rejected: 0,
      submitted: 0
    }
  });
  
  // Replace single loading state with granular loading states
  const [loadingState, setLoadingState] = React.useState<LoadingState>({
    executives: true,
    services: true,
    transactions: true,
    registrations: true,
    journals: true,
    prospects: true
  });

  React.useEffect(() => {
    const fetchDashboardData = async () => {
      // Start all requests in parallel
      const executivesPromise = api.getAllExecutives()
        .then(res => {
          setMetrics(prev => ({
            ...prev,
            executivesCount: res.data.length,
            recentExecutives: res.data.slice(0, 5)
          }));
          setLoadingState(prev => ({ ...prev, executives: false }));
          return res;
        })
        .catch(error => {
          console.error('Error fetching executives:', error);
          setLoadingState(prev => ({ ...prev, executives: false }));
          return { data: [] };
        });

      const servicesPromise = api.getAllServices()
        .then(res => {
          setMetrics(prev => ({
            ...prev,
            servicesCount: res.data.length,
            recentServices: res.data.slice(0, 5)
          }));
          setLoadingState(prev => ({ ...prev, services: false }));
          return res;
        })
        .catch(error => {
          console.error('Error fetching services:', error);
          setLoadingState(prev => ({ ...prev, services: false }));
          return { data: [] };
        });

      const transactionsPromise = api.getAllTransactions()
        .then(res => {
          // Calculate total revenue from transactions
          const totalRevenue = res.data.reduce((sum, transaction) => sum + transaction.amount, 0);
          
          setMetrics(prev => ({
            ...prev,
            totalRevenue,
            recentTransactions: res.data.slice(0, 5)
          }));
          setLoadingState(prev => ({ ...prev, transactions: false }));
          return res;
        })
        .catch(error => {
          console.error('Error fetching transactions:', error);
          setLoadingState(prev => ({ ...prev, transactions: false }));
          return { data: [] };
        });

      const registrationsPromise = api.getAllRegistrations()
        .then(res => {
          const registrationsCount = res.data && res.data.items ? res.data.items.length : 0;
          
          setMetrics(prev => ({
            ...prev,
            registrationsCount
          }));
          setLoadingState(prev => ({ ...prev, registrations: false }));
          return res;
        })
        .catch(error => {
          console.error('Error fetching registrations:', error);
          setLoadingState(prev => ({ ...prev, registrations: false }));
          return { data: { items: [] } };
        });

      const journalsPromise = api.getAllJournalData()
        .then(res => {
          const journalsByStatus = {
            pending: 0,
            under_review: 0,
            approved: 0,
            rejected: 0,
            submitted: 0
          };

          if (res.data && Array.isArray(res.data)) {
            res.data.forEach(journal => {
              const status = journal.status.replace(' ', '_').toLowerCase();
              if (journalsByStatus.hasOwnProperty(status)) {
                journalsByStatus[status as keyof typeof journalsByStatus]++;
              }
            });
          }

          setMetrics(prev => ({
            ...prev,
            journalsCount: res.data ? res.data.length : 0,
            journalsByStatus
          }));
          setLoadingState(prev => ({ ...prev, journals: false }));
          return res;
        })
        .catch(error => {
          console.error('Error fetching journals:', error);
          setLoadingState(prev => ({ ...prev, journals: false }));
          return { data: [] };
        });

      // Fetch prospects data
      api.getAllProspectus()
        .then(res => {
          const prospectsCount = Array.isArray(res.data) ? res.data.length : 0;
          
          setMetrics(prev => ({
            ...prev,
            prospectsCount
          }));
        })
        .catch(error => {
          console.error('Error fetching prospects:', error);
        })
        .finally(() => {
          setLoadingState(prev => ({ ...prev, prospects: false }));
        });

      // Still wait for all primary data sources to be loaded
      await Promise.all([
        executivesPromise, 
        servicesPromise, 
        transactionsPromise, 
        registrationsPromise, 
        journalsPromise
      ]);
    };

    fetchDashboardData();
  }, []);

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

  return (
    <div className="w-full p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Executives Card */}
        {loadingState.executives ? (
          <MetricCardSkeleton />
        ) : (
          <Card className="bg-primary-50 dark:bg-primary-900/20">
            <CardBody className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <UsersIcon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-default-500">Total Executives</p>
                <h3 className="text-2xl font-bold">{metrics.executivesCount}</h3>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Services Card */}
        {loadingState.services ? (
          <MetricCardSkeleton />
        ) : (
          <Card className="bg-success-50 dark:bg-success-900/20">
            <CardBody className="flex items-center gap-4">
              <div className="p-3 bg-success/10 rounded-lg">
                <WrenchScrewdriverIcon className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-default-500">Active Services</p>
                <h3 className="text-2xl font-bold">{metrics.servicesCount}</h3>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Prospects Card */}
        {loadingState.prospects ? (
          <MetricCardSkeleton />
        ) : (
          <Card className="bg-warning-50 dark:bg-warning-900/20">
            <CardBody className="flex items-center gap-4">
              <div className="p-3 bg-warning/10 rounded-lg">
                <DocumentDuplicateIcon className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-default-500">Total Prospects</p>
                <h3 className="text-2xl font-bold">{metrics.prospectsCount}</h3>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Revenue Card */}
        {loadingState.transactions ? (
          <MetricCardSkeleton />
        ) : (
          <Card className="bg-secondary-50 dark:bg-secondary-900/20">
            <CardBody className="flex items-center gap-4">
              <div className="p-3 bg-secondary/10 rounded-lg">
                <BanknotesIcon className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-default-500">Total Revenue</p>
                <h3 className="text-2xl font-bold">₹{metrics.totalRevenue.toLocaleString()}</h3>
              </div>
            </CardBody>
          </Card>
        )}
      </div>

      {/* Business Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Journal Status Chart */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Journal Status</h3>
            <ChartBarIcon className="w-5 h-5 text-default-500" />
          </CardHeader>
          <Divider/>
          <CardBody>
            {loadingState.journals ? (
              <div className="space-y-4">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-24 rounded-lg" />
                  <Skeleton className="h-4 w-6 rounded-lg" />
                </div>
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
                  <span className="text-sm">Total Journals</span>
                  <span className="font-semibold">{metrics.journalsCount}</span>
                </div>
                
                {Object.entries(metrics.journalsByStatus).map(([status, count]) => (
                  <div key={status} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize">{status.replace('_', ' ')}</span>
                      <span>{count} ({metrics.journalsCount > 0 ? Math.round((count / metrics.journalsCount) * 100) : 0}%)</span>
                    </div>
                    <Progress 
                      value={metrics.journalsCount > 0 ? (count / metrics.journalsCount) * 100 : 0} 
                      className={`h-2 ${journalStatusColors[status as keyof typeof journalStatusColors]}`} 
                    />
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
        
        {/* Client Registrations */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Business Overview</h3>
          </CardHeader>
          <Divider/>
          <CardBody>
            <div className="grid grid-cols-2 gap-6">
              {/* Prospects Stats */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                  <span className="text-sm">Prospects</span>
                </div>
                {loadingState.prospects ? (
                  <>
                    <Skeleton className="h-8 w-16 rounded-lg mb-1" />
                    <Skeleton className="h-3 w-24 rounded-lg" />
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold">{metrics.prospectsCount}</p>
                    <p className="text-xs text-success">
                      {metrics.prospectsCount > 0 ? Math.round((metrics.registrationsCount / metrics.prospectsCount) * 100) : 0}% conversion rate
                    </p>
                  </>
                )}
              </div>
              
              {/* Registrations Stats */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-success"></div>
                  <span className="text-sm">Registrations</span>
                </div>
                {loadingState.registrations ? (
                  <>
                    <Skeleton className="h-8 w-16 rounded-lg mb-1" />
                    <Skeleton className="h-3 w-24 rounded-lg" />
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold">{metrics.registrationsCount}</p>
                    <p className="text-xs text-primary">
                      {metrics.registrationsCount > 0 ? Math.round((metrics.journalsCount / metrics.registrationsCount) * 100) : 0}% journal submission
                    </p>
                  </>
                )}
              </div>
              
              {/* Journals Stats */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-secondary"></div>
                  <span className="text-sm">Journals</span>
                </div>
                {loadingState.journals ? (
                  <>
                    <Skeleton className="h-8 w-16 rounded-lg mb-1" />
                    <Skeleton className="h-3 w-24 rounded-lg" />
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold">{metrics.journalsCount}</p>
                    <p className="text-xs text-warning">
                      {metrics.journalsByStatus.approved} approved
                    </p>
                  </>
                )}
              </div>
              
              {/* Average Revenue Stats */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-warning"></div>
                  <span className="text-sm">Avg. Revenue</span>
                </div>
                {loadingState.transactions || loadingState.registrations ? (
                  <>
                    <Skeleton className="h-8 w-24 rounded-lg mb-1" />
                    <Skeleton className="h-3 w-20 rounded-lg" />
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold">
                      ₹{metrics.registrationsCount > 0 ? Math.round(metrics.totalRevenue / metrics.registrationsCount).toLocaleString() : 0}
                    </p>
                    <p className="text-xs text-default-500">per registration</p>
                  </>
                )}
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
      
      {/* Recent Activity Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Executives */}
        <Card>
          <CardHeader className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Recent Executives</h3>
          </CardHeader>
          <Divider/>
          <CardBody>
            <div className="space-y-4">
              {loadingState.executives ? (
                <>
                  {[1, 2, 3, 4, 5].map(i => <RecentItemSkeleton key={i} />)}
                </>
              ) : metrics.recentExecutives.length > 0 ? (
                metrics.recentExecutives.map((executive) => (
                  <div key={executive.id} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{executive.username}</p>
                      <p className="text-sm text-default-400">
                        {formatDate(executive.created_at)}
                      </p>
                    </div>
                    <ArrowTrendingUpIcon className="w-5 h-5 text-success" />
                  </div>
                ))
              ) : (
                <p className="text-center text-default-400">No executives found</p>
              )}
            </div>
          </CardBody>
          <Divider/>
          <CardFooter>
            <button 
              onClick={() => router.push('/admin/users/executives')}
              className="text-primary text-sm hover:underline w-full text-center"
            >
              View All Executives
            </button>
          </CardFooter>
        </Card>

        {/* Recent Services */}
        <Card>
          <CardHeader className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Recent Services</h3>
          </CardHeader>
          <Divider/>
          <CardBody>
            <div className="space-y-4">
              {loadingState.services ? (
                <>
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex justify-between items-center py-2">
                      <Skeleton className="h-5 w-32 rounded-lg" />
                      <Skeleton className="h-5 w-16 rounded-lg" />
                    </div>
                  ))}
                </>
              ) : metrics.recentServices.length > 0 ? (
                metrics.recentServices.map((service) => (
                  <div key={service.id} className="flex justify-between items-center">
                    <p className="font-medium">{service.service_name}</p>
                    <p className="text-success">₹{service.fee.toLocaleString()}</p>
                  </div>
                ))
              ) : (
                <p className="text-center text-default-400">No services found</p>
              )}
            </div>
          </CardBody>
          <Divider/>
          <CardFooter>
            <button 
              onClick={() => router.push('/admin/services')}
              className="text-primary text-sm hover:underline w-full text-center"
            >
              View All Services
            </button>
          </CardFooter>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Recent Transactions</h3>
          </CardHeader>
          <Divider/>
          <CardBody>
            <div className="space-y-4">
              {loadingState.transactions ? (
                <>
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex justify-between items-center py-2">
                      <div className="w-3/4">
                        <Skeleton className="h-5 w-20 rounded-lg mb-1" />
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-3 w-12 rounded-full" />
                          <Skeleton className="h-3 w-16 rounded-lg" />
                        </div>
                      </div>
                      <Skeleton className="h-4 w-16 rounded-lg" />
                    </div>
                  ))}
                </>
              ) : metrics.recentTransactions.length > 0 ? (
                metrics.recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">₹{transaction.amount.toLocaleString()}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs bg-primary-100 text-primary-600 px-2 py-0.5 rounded">
                          {transaction.transaction_type}
                        </p>
                        <p className="text-xs text-default-400">
                          {formatDate(transaction.transaction_date)}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm">{transaction.entities.username}</p>
                  </div>
                ))
              ) : (
                <p className="text-center text-default-400">No transactions found</p>
              )}
            </div>
          </CardBody>
          <Divider/>
          <CardFooter>
            <button 
              onClick={() => router.push('/admin/finance/transactions')}
              className="text-primary text-sm hover:underline w-full text-center"
            >
              View All Transactions
            </button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export default AdminDashboard;