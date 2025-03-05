'use client'
import React from 'react';
import { useRouter } from 'next/navigation';
import { 
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Divider,
} from "@heroui/react";
import { 
  UsersIcon, 
  WrenchScrewdriverIcon, 
  DocumentDuplicateIcon,
  ArrowTrendingUpIcon 
} from "@heroicons/react/24/outline";
import api from '@/services/api';

interface DashboardMetrics {
  executivesCount: number;
  servicesCount: number;
  prospectsCount: number;
  recentExecutives: Array<{id: string; username: string; created_at: string}>;
  recentServices: Array<{id: number; service_name: string; fee: number}>;
}

function AdminDashboard() {
  const router = useRouter();
  const [metrics, setMetrics] = React.useState<DashboardMetrics>({
    executivesCount: 0,
    servicesCount: 0,
    prospectsCount: 0,
    recentExecutives: [],
    recentServices: []
  });
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [executivesRes, servicesRes] = await Promise.all([
          api.getAllExecutives(),
          api.getAllServices()
        ]);

        setMetrics({
          executivesCount: executivesRes.data.length,
          servicesCount: servicesRes.data.length,
          prospectsCount: 0, // Will be implemented later
          recentExecutives: executivesRes.data.slice(0, 5),
          recentServices: servicesRes.data.slice(0, 5)
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

  return (
    <div className="w-full p-6 space-y-6">
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
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
            </div>
          </CardBody>
          <Divider/>
          <CardFooter>
            <button 
              onClick={() => router.push('/admin/executives')}
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
      </div>
    </div>
  );
}

export default AdminDashboard;