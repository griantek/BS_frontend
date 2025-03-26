"use client";
import React, { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader, Spinner, Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Input, Chip, Progress } from '@heroui/react';
import withAuthorAuth from '@/components/withAuthorAuth';
import api, { AuthorTask } from '@/services/api';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

function AuthorTasks() {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<AuthorTask[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<AuthorTask[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const response = await api.getAuthorTasks();
        if (response.success) {
          setTasks(response.data);
          setFilteredTasks(response.data);
        }
      } catch (error) {
        console.error("Error fetching tasks:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTasks();
  }, []);

  useEffect(() => {
    // Apply filters whenever status or search changes
    let result = tasks;
    
    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter(task => task.status === statusFilter);
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        task => 
          task.title.toLowerCase().includes(query) ||
          task.description.toLowerCase().includes(query) ||
          task.journal_name.toLowerCase().includes(query) ||
          task.client_name.toLowerCase().includes(query)
      );
    }
    
    setFilteredTasks(result);
  }, [statusFilter, searchQuery, tasks]);

  const handleViewTask = (taskId: number) => {
    router.push(`/business/author/tasks/${taskId}`);
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'warning';
      case 'under_review':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'in_progress':
        return 'In Progress';
      case 'under_review':
        return 'Under Review';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner size="lg" color="secondary" />
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
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
            <h1 className="text-2xl font-bold text-secondary">Assigned Tasks</h1>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                classNames={{
                  base: "max-w-full sm:max-w-[14rem]",
                  inputWrapper: "h-9"
                }}
                placeholder="Search tasks..."
                startContent={<MagnifyingGlassIcon className="h-4 w-4 text-default-400" />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Dropdown>
                <DropdownTrigger>
                  <Button 
                    variant="flat" 
                    endContent={<ChevronDownIcon className="h-4 w-4" />}
                  >
                    Status: {statusFilter === 'all' ? 'All' : getStatusLabel(statusFilter)}
                  </Button>
                </DropdownTrigger>
                <DropdownMenu 
                  aria-label="Filter by status"
                  onAction={(key) => setStatusFilter(key as string)}
                  selectedKeys={[statusFilter]}
                  selectionMode="single"
                >
                  <DropdownItem key="all">All</DropdownItem>
                  <DropdownItem key="pending">Pending</DropdownItem>
                  <DropdownItem key="in_progress">In Progress</DropdownItem>
                  <DropdownItem key="under_review">Under Review</DropdownItem>
                  <DropdownItem key="completed">Completed</DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </div>
          </CardHeader>
          <CardBody>
            {filteredTasks.length > 0 ? (
              <div className="space-y-4">
                {filteredTasks.map(task => (
                  <Card key={task.id} className="w-full border border-default-200 hover:border-primary transition-all">
                    <CardBody className="p-4">
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-grow">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="text-md font-semibold">{task.title}</h3>
                            <Chip 
                              color={getStatusColor(task.status)} 
                              variant="flat" 
                              size="sm"
                            >
                              {getStatusLabel(task.status)}
                            </Chip>
                          </div>
                          
                          <div className="text-sm text-default-600 mb-1">
                            <p><span className="font-medium">Journal:</span> {task.journal_name}</p>
                            <p><span className="font-medium">Client:</span> {task.client_name}</p>
                          </div>
                          
                          <p className="text-sm text-default-500 line-clamp-2 mb-3">
                            {task.description}
                          </p>
                          
                          <Progress 
                            value={task.completion_percentage} 
                            color={
                              task.status === 'completed' ? 'success' : 
                              task.completion_percentage > 75 ? 'success' :
                              task.completion_percentage > 25 ? 'warning' : 
                              'primary'
                            }
                            size="sm"
                            className="mb-2"
                            aria-label="Task progress"
                          />
                          
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-default-500 mt-2">
                            <div><span className="font-medium">Assigned:</span> {new Date(task.assigned_date).toLocaleDateString()}</div>
                            <div><span className="font-medium">Deadline:</span> {new Date(task.deadline).toLocaleDateString()}</div>
                            <div><span className="font-medium">Progress:</span> {task.completion_percentage}%</div>
                            <div><span className="font-medium">Last Updated:</span> {new Date(task.last_updated).toLocaleDateString()}</div>
                          </div>
                        </div>
                        
                        <div className="flex flex-row md:flex-col justify-end gap-2 mt-4 md:mt-0">
                          <Button 
                            color="primary" 
                            onClick={() => handleViewTask(task.id)}
                          >
                            View Task
                          </Button>
                          
                          {task.status !== 'completed' && (
                            <Button 
                              color="secondary" 
                              variant="flat"
                              onClick={() => handleViewTask(task.id)}
                            >
                              Update Progress
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-default-500 mb-4">No tasks found matching your filters.</p>
                <Button 
                  color="primary" 
                  variant="flat" 
                  onClick={() => {
                    setStatusFilter("all");
                    setSearchQuery("");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </CardBody>
        </Card>
      </motion.div>
    </div>
  );
}

export default withAuthorAuth(AuthorTasks);
