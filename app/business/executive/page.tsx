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
  TableCellsIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import api from '@/services/api';
import { withExecutiveAuth } from '@/components/withExecutiveAuth';
import type { Prospectus, Registration } from '@/services/api';
import { Spinner } from "@nextui-org/react";
import { format } from 'date-fns';
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
    
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [prospectsResponse, registrationsResponse] = await Promise.all([
          api.getProspectusByClientId(userDataParsed.id),
          api.getRegistrationsByExecutive(userDataParsed.id)
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
          hasPermission(userDataParsed, PERMISSIONS.SHOW_ADD_PROSPECT)
        );
        setHasAnyRecordsPermission(
          hasRecordsAccess(userDataParsed)
        );
        
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const formatCurrency = (value: number) => {
    return `₹${value.toLocaleString('en-IN')}`;
  };

  const getFormattedDate = () => {
    return format(new Date(), "EEEE, MMMM d, yyyy");
  };

  if (isLoading) {
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
          <h1 className="text-2xl font-bold">Business Executive Dashboard</h1>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="border-l-4 border-primary">
          <CardBody className="flex flex-row items-center justify-between">
            <div>
              <p className="text-default-500 text-sm">Total Prospects</p>
              <h3 className="text-2xl font-bold">{dashboardData.totalProspects}</h3>
            </div>
            <div className="bg-primary/10 p-3 rounded-full">
              <DocumentTextIcon className="w-6 h-6 text-primary" />
            </div>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-success">
          <CardBody className="flex flex-row items-center justify-between">
            <div>
              <p className="text-default-500 text-sm">Registrations</p>
              <h3 className="text-2xl font-bold">{dashboardData.totalRegistrations}</h3>
            </div>
            <div className="bg-success/10 p-3 rounded-full">
              <DocumentDuplicateIcon className="w-6 h-6 text-success" />
            </div>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-warning">
          <CardBody className="flex flex-row items-center justify-between">
            <div>
              <p className="text-default-500 text-sm">Pending Registrations</p>
              <h3 className="text-2xl font-bold">{dashboardData.pendingRegistrations}</h3>
            </div>
            <div className="bg-warning/10 p-3 rounded-full">
              <ClockIcon className="w-6 h-6 text-warning" />
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex justify-between">
            <div>
              <h3 className="text-lg font-semibold">Revenue Overview</h3>
              <p className="text-default-500 text-sm">Financial summary</p>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-default-500">Total Revenue</span>
                <span className="font-semibold">{formatCurrency(dashboardData.totalRevenue)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-default-500">Pending Amount</span>
                <span className="font-semibold">{formatCurrency(dashboardData.pendingAmount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-default-500">Registered Clients</span>
                <span className="font-semibold">{dashboardData.completedRegistrations}</span>
              </div>
              {hasAnyRecordsPermission && (
                <Button 
                  color="primary" 
                  variant="flat" 
                  className="w-full mt-4"
                  onClick={() => router.push('/business/executive/records')}
                  startContent={<TableCellsIcon className="h-4 w-4" />}
                >
                  View All Records
                </Button>
              )}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex justify-between">
            <div>
              <h3 className="text-lg font-semibold">Recent Activity</h3>
              <p className="text-default-500 text-sm">{getFormattedDate()}</p>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <p>Your recent activities will appear here.</p>
              {hasAddProspectPermission && (
                <Button 
                  color="primary" 
                  className="w-full mt-4"
                  onClick={() => router.push('/business/executive/add_prospect')}
                  startContent={<PlusIcon className="h-4 w-4" />}
                >
                  Add New Prospect
                </Button>
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export default withExecutiveAuth(BusinessDashboard);