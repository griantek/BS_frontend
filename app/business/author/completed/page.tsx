"use client";
import React, { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader, Spinner, Button, Input, Chip } from '@heroui/react';
import withAuthorAuth from '@/components/withAuthorAuth';
import api, { AssignedRegistration } from '@/services/api';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { MagnifyingGlassIcon, DocumentTextIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

function CompletedTasks() {
  const [loading, setLoading] = useState(true);
  const [completedTasks, setCompletedTasks] = useState<AssignedRegistration[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<AssignedRegistration[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchCompletedTasks = async () => {
      try {
        setLoading(true);
        
        // Get current user from storage
        const user = api.getStoredUser();
        if (!user || !user.id) {
          throw new Error("User information not found");
        }

        // Fetch assignments
        const response = await api.getAssignedRegistrationsAuthor(user.id);
        
        if (response.success) {
          // Filter only completed tasks
          const completed = response.data.filter(task => task.author_status === 'completed');
          setCompletedTasks(completed);
          setFilteredTasks(completed);
        } else {
          throw new Error("Failed to fetch completed tasks");
        }
      } catch (error: any) {
        console.error("Error fetching completed tasks:", error);
        setError(error.message || "Failed to load completed tasks");
      } finally {
        setLoading(false);
      }
    };
    
    fetchCompletedTasks();
  }, []);

  useEffect(() => {
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const filtered = completedTasks.filter(
        task => 
          task.prospectus.client_name.toLowerCase().includes(query) ||
          task.prospectus.requirement.toLowerCase().includes(query) ||
          task.services.toLowerCase().includes(query) ||
          task.prospectus.reg_id.toLowerCase().includes(query)
      );
      setFilteredTasks(filtered);
    } else {
      setFilteredTasks(completedTasks);
    }
  }, [searchQuery, completedTasks]);

  const handleViewTask = (taskId: number) => {
    router.push(`/business/author/tasks/${taskId}`);
  };

  if (loading) {
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
            <h2 className="text-xl font-bold mb-2">Error Loading Tasks</h2>
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
    <div className="container mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="mb-6 shadow-md">
          <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-secondary">Completed Work</h1>
              <p className="text-default-500">
                View your completed papers submitted for review
              </p>
            </div>
            <Input
              classNames={{
                base: "max-w-full sm:max-w-[14rem]"
              }}
              placeholder="Search completed tasks..."
              startContent={<MagnifyingGlassIcon className="h-4 w-4 text-default-400" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </CardHeader>
          <CardBody>
            {filteredTasks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTasks.map(task => (
                  <Card key={task.id} className="border border-default-200">
                    <CardBody className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-md font-semibold line-clamp-1">{task.prospectus.client_name}</h3>
                        <Chip color="success" variant="flat" size="sm">Completed</Chip>
                      </div>
                      
                      <p className="text-sm text-default-600 mb-1">
                        <span className="font-medium">Reg ID:</span> {task.prospectus.reg_id}
                      </p>
                      
                      <p className="text-sm text-default-500 line-clamp-2 mb-3">
                        {task.prospectus.requirement}
                      </p>
                      
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-default-500 mt-2 mb-4">
                        <div><span className="font-medium">Completed On:</span> {new Date(task.updated_at).toLocaleDateString()}</div>
                        <div><span className="font-medium">Services:</span> {task.services}</div>
                        <div><span className="font-medium">Client Email:</span> {task.prospectus.email}</div>
                        <div><span className="font-medium">Department:</span> {task.prospectus.department}</div>
                      </div>
                      
                      <Button 
                        color="primary"
                        onClick={() => handleViewTask(task.id)}
                        startContent={<DocumentTextIcon className="h-4 w-4" />}
                      >
                        View Details
                      </Button>
                    </CardBody>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <DocumentTextIcon className="h-12 w-12 text-default-300 mx-auto mb-4" />
                <p className="text-default-500 mb-2">No completed tasks found.</p>
                <p className="text-default-400 text-sm">
                  When you complete tasks, they will appear here.
                </p>
              </div>
            )}
          </CardBody>
        </Card>
      </motion.div>
    </div>
  );
}

export default withAuthorAuth(CompletedTasks);
