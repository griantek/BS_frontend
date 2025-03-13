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
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const [executivesRes, servicesRes, transactionsRes, registrationsRes, journalsRes] = await Promise.all([
          api.getAllExecutives(),
          api.getAllServices(),
          api.getAllTransactions(),
          api.getAllRegistrations(),
          api.getAllJournalData()
        ]);

        let prospectsCount = 0;
        try {
          const prospectsRes = await api.getAllProspectus();
          prospectsCount = Array.isArray(prospectsRes.data) ? prospectsRes.data.length : 0;
        } catch (error) {
          console.error('Error fetching prospects:', error);
        }

        // Calculate total revenue from transactions
        const totalRevenue = transactionsRes.data.reduce((sum, transaction) => sum + transaction.amount, 0);

        // Count journals by status
        const journalsByStatus = {
          pending: 0,
          under_review: 0,
          approved: 0,
          rejected: 0,
          submitted: 0
        };

        if (journalsRes.data && Array.isArray(journalsRes.data)) {
          journalsRes.data.forEach(journal => {
            const status = journal.status.replace(' ', '_').toLowerCase();
            if (journalsByStatus.hasOwnProperty(status)) {
              journalsByStatus[status as keyof typeof journalsByStatus]++;
            }
          });
        }

        setMetrics({
          executivesCount: executivesRes.data.length,
          servicesCount: servicesRes.data.length,
          prospectsCount: prospectsCount,
          registrationsCount: registrationsRes.data && registrationsRes.data.items ? registrationsRes.data.items.length : 0,
          journalsCount: journalsRes.data ? journalsRes.data.length : 0,
          totalRevenue: totalRevenue,
          recentExecutives: executivesRes.data.slice(0, 5),
          recentServices: servicesRes.data.slice(0, 5),
          recentTransactions: transactionsRes.data.slice(0, 5),
          journalsByStatus
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-4rem)]">
        <Spinner size="lg" />
      </div>
    );
  }

  const journalStatusColors = {
    pending: "bg-amber-500",
    under_review: "bg-blue-500",
    approved: "bg-green-500",
    rejected: "bg-red-500", 
    submitted: "bg-indigo-500"
  };

  return (
    <div className="w-full p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                  <span className="text-sm">Prospects</span>
                </div>
                <p className="text-2xl font-bold">{metrics.prospectsCount}</p>
                <p className="text-xs text-success">
                  {metrics.prospectsCount > 0 ? Math.round((metrics.registrationsCount / metrics.prospectsCount) * 100) : 0}% conversion rate
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-success"></div>
                  <span className="text-sm">Registrations</span>
                </div>
                <p className="text-2xl font-bold">{metrics.registrationsCount}</p>
                <p className="text-xs text-primary">
                  {metrics.registrationsCount > 0 ? Math.round((metrics.journalsCount / metrics.registrationsCount) * 100) : 0}% journal submission
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-secondary"></div>
                  <span className="text-sm">Journals</span>
                </div>
                <p className="text-2xl font-bold">{metrics.journalsCount}</p>
                <p className="text-xs text-warning">
                  {metrics.journalsByStatus.approved} approved
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-warning"></div>
                  <span className="text-sm">Avg. Revenue</span>
                </div>
                <p className="text-2xl font-bold">
                  ₹{metrics.registrationsCount > 0 ? Math.round(metrics.totalRevenue / metrics.registrationsCount).toLocaleString() : 0}
                </p>
                <p className="text-xs text-default-500">per registration</p>
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
              {metrics.recentExecutives.map((executive) => (
                <div key={executive.id} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{executive.username}</p>
                    <p className="text-sm text-default-400">
                      {formatDate(executive.created_at)}
                    </p>
                  </div>
                  <ArrowTrendingUpIcon className="w-5 h-5 text-success" />
                </div>
              ))}
              {metrics.recentExecutives.length === 0 && (
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
              {metrics.recentServices.map((service) => (
                <div key={service.id} className="flex justify-between items-center">
                  <p className="font-medium">{service.service_name}</p>
                  <p className="text-success">₹{service.fee.toLocaleString()}</p>
                </div>
              ))}
              {metrics.recentServices.length === 0 && (
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
              {metrics.recentTransactions.map((transaction) => (
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
              ))}
              {metrics.recentTransactions.length === 0 && (
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