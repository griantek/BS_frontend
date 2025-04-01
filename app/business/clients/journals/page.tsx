'use client'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation';
import { Card, CardBody, CardHeader, Divider, Spinner, Button, Chip, Progress, Tooltip } from "@nextui-org/react";
import { toast } from 'react-toastify';
import { withClientAuth } from '@/components/withClientAuth';
import api, { Registration } from '@/services/api';
import { Sidebar } from '@/components/sidebar';
import { 
  NewspaperIcon, 
  DocumentTextIcon,
  ExclamationCircleIcon,
  CalendarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { motion } from "framer-motion";

const JournalsPage = () => {
  const router = useRouter();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState('all');

  useEffect(() => {
    const fetchJournals = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Get current user from storage
        const user = api.getStoredUser();
        if (!user || !user.id) {
          throw new Error("User information not found");
        }
        
        // Fetch registered registrations using the API
        const response = await api.getClientRegisteredRegistration(user.id);
        
        if (response.success) {
          setRegistrations(response.data);
        } else {
          throw new Error("Failed to fetch journal registrations");
        }
      } catch (error: any) {
        console.error("Error fetching journals:", error);
        setError(error.message || "Failed to load journal data");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchJournals();
  }, []);

  // Filter journals based on selection
  const filteredJournals = selectedFilter === 'all' 
    ? registrations 
    : registrations.filter(registration => {
        if (selectedFilter === 'in-review') return registration.status === 'waiting for approval' || registration.status === 'pending';
        if (selectedFilter === 'registered') return registration.status === 'registered';
        if (selectedFilter === 'completed') return registration.status === 'completed';
        return true;
      });

  // Status badge color mapping
  const getStatusColor = (status: string = "pending") => {
    switch(status) {
      case 'registered':
      case 'completed':
      case 'published':
        return 'success';
      case 'in progress':
      case 'drafting': 
        return 'primary';
      case 'under review':
      case 'submitted':
        return 'secondary';
      case 'revisions required':
      case 'rejected':
        return 'danger';
      case 'waiting for approval':
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string = "pending") => {
    // Capitalize the words in the status
    return status
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Calculate progress percentage based on status
  const getProgressFromStatus = (status: string = "pending") => {
    const statusMap: { [key: string]: number } = {
      "pending": 10,
      "waiting for approval": 25,
      "registered": 50,
      "in progress": 75,
      "completed": 100,
    };

    return statusMap[status] || 0;
  };

  // Format dates for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner size="lg" color="secondary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="shadow-md">
          <CardBody className="p-6 text-center">
            <ExclamationCircleIcon className="h-12 w-12 text-danger mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Error Loading Journals</h2>
            <p className="text-default-500 mb-4">{error}</p>
            <Button color="primary" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex ml-16">
      <Sidebar />
      <div className="flex-1 p-6 pl-[var(--sidebar-width,4rem)] transition-all duration-300">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">My Journals</h1>
            <p className="text-default-500">Manage your academic papers and journal submissions</p>
          </div>
          <div className="flex gap-2 mt-2 sm:mt-0">
            <Button 
              color="primary" 
              onClick={() => router.push('/business/clients/journals/submissions')}
            >
              View Submissions
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Chip 
            variant={selectedFilter === 'all' ? 'solid' : 'bordered'} 
            color="default"
            onClick={() => setSelectedFilter('all')}
            className="cursor-pointer"
          >
            All
          </Chip>
          <Chip 
            variant={selectedFilter === 'in-review' ? 'solid' : 'bordered'} 
            color="warning"
            onClick={() => setSelectedFilter('in-review')}
            className="cursor-pointer"
          >
            In Review
          </Chip>
          <Chip 
            variant={selectedFilter === 'registered' ? 'solid' : 'bordered'} 
            color="primary"
            onClick={() => setSelectedFilter('registered')}
            className="cursor-pointer"
          >
            Registered
          </Chip>
          <Chip 
            variant={selectedFilter === 'completed' ? 'solid' : 'bordered'} 
            color="success"
            onClick={() => setSelectedFilter('completed')}
            className="cursor-pointer"
          >
            Completed
          </Chip>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="grid grid-cols-1 gap-4">
            {filteredJournals.length === 0 ? (
              <Card>
                <CardBody className="text-center py-8">
                  <NewspaperIcon className="w-12 h-12 mx-auto text-default-300 mb-4" />
                  <p className="text-default-500">No journals found matching your filter.</p>
                  {selectedFilter !== 'all' && (
                    <Button 
                      color="primary" 
                      variant="flat" 
                      size="sm" 
                      className="mt-4"
                      onClick={() => setSelectedFilter('all')}
                    >
                      Show All Journals
                    </Button>
                  )}
                </CardBody>
              </Card>
            ) : (
              filteredJournals.map(journal => {
                // Get current status
                const currentStatus = journal.status;
                
                // Calculate progress percentage
                const progressPercentage = getProgressFromStatus(currentStatus);
                
                // Calculate days since creation
                const daysSinceCreated = Math.floor(
                  (new Date().getTime() - new Date(journal.created_at).getTime()) /
                    (1000 * 3600 * 24)
                );
                
                return (
                  <Card 
                    key={journal.id} 
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    isPressable 
                    onPress={() => router.push(`/business/clients/journals/details/${journal.id}`)}
                  >
                    <CardBody className="p-5">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Chip 
                              color={getStatusColor(currentStatus)} 
                              size="sm"
                            >
                              {getStatusLabel(currentStatus)}
                            </Chip>
                            <span className="text-xs text-default-500">
                              {journal.prospectus?.reg_id}
                            </span>
                          </div>
                          
                          <h3 className="text-lg font-semibold mb-1">
                            {journal.prospectus?.client_name}
                          </h3>
                          
                          <p className="text-sm text-default-500 mb-3 line-clamp-1">
                            {journal.services}
                          </p>
                          
                          <div className="text-xs text-default-400 flex flex-wrap gap-x-4 gap-y-1">
                            <div className="flex items-center gap-1">
                              <CalendarIcon className="h-3.5 w-3.5" />
                              <span>Created: {formatDate(journal.created_at)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <ClockIcon className="h-3.5 w-3.5" />
                              <span>Period: {journal.pub_period}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-center gap-2 sm:border-l sm:pl-4 sm:ml-2 w-full sm:w-auto">
                          <div className="text-2xl font-bold text-primary">{progressPercentage}%</div>
                          <div className="text-xs text-default-500">Completion</div>
                          <Progress
                            value={progressPercentage}
                            color={getStatusColor(currentStatus)}
                            size="sm"
                            aria-label="Journal progress"
                            className="w-24 h-2 mt-1"
                          />
                          <Button 
                            size="sm" 
                            color="primary" 
                            variant="flat"
                            className="w-full sm:w-auto mt-2"
                            endContent={<DocumentTextIcon className="h-4 w-4" />}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default withClientAuth(JournalsPage);
