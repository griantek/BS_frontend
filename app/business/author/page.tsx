"use client";
import React, { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader, Spinner, Button, Progress, Chip, Divider } from '@heroui/react';
import withAuthorAuth from '@/components/withAuthorAuth';
import api, { AssignedRegistration } from '@/services/api';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  DocumentTextIcon, 
  ClipboardDocumentListIcon, 
  CheckCircleIcon, 
  PencilIcon, 
  ExclamationCircleIcon, 
  ClockIcon, 
  ArrowTrendingUpIcon, 
  BellAlertIcon,
  ChevronRightIcon,
  CalendarIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

function AuthorDashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<AssignedRegistration[]>([]);
  const [taskStats, setTaskStats] = useState({
    total: 0,
    notStarted: 0,
    inProgress: 0,
    underReview: 0,
    completed: 0,
    revisionsRequired: 0,
    upcoming: 0,
    overdue: 0
  });
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get the user data from localStorage
        const userData = api.getStoredUser();
        if (!userData || !userData.id) {
          throw new Error("User information not found");
        }
        
        setUser(userData);
        
        // Fetch assignments
        const response = await api.getAssignedRegistrationsAuthor(userData.id);
        
        if (response.success) {
          const assignedTasks = response.data;
          setTasks(assignedTasks);
          
          // Calculate task statistics
          const stats = {
            total: assignedTasks.length,
            notStarted: assignedTasks.filter(t => !t.author_status || t.author_status === 'not started').length,
            inProgress: assignedTasks.filter(t => 
              t.author_status === 'in progress' || 
              t.author_status === 'drafting' || 
              t.author_status === 'idea stage').length,
            underReview: assignedTasks.filter(t => t.author_status === 'under review').length,
            completed: assignedTasks.filter(t => t.author_status === 'completed').length,
            revisionsRequired: assignedTasks.filter(t => t.author_status === 'revisions required').length,
            upcoming: 0, // Will calculate based on dates
            overdue: 0   // Will calculate based on dates
          };
          
          // For demonstration, we'll set some example values for upcoming/overdue
          // In a real app, this would be calculated based on task deadlines
          stats.upcoming = Math.min(3, Math.floor(stats.total * 0.3));
          stats.overdue = Math.min(1, Math.floor(stats.total * 0.1));
          
          setTaskStats(stats);
        } else {
          throw new Error("Failed to fetch task data");
        }
      } catch (error: any) {
        console.error("Error fetching author data:", error);
        setError(error.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  // Get percentage of completed tasks
  const getCompletionPercentage = () => {
    if (taskStats.total === 0) return 0;
    return Math.round((taskStats.completed / taskStats.total) * 100);
  };

  // Get most recent tasks (limited to 3)
  const getRecentTasks = () => {
    return [...tasks]
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 3);
  };

  // Get priority tasks (based on status - revisions required or not started)
  const getPriorityTasks = () => {
    const revisionsRequired = tasks.filter(t => t.author_status === 'revisions required');
    const notStarted = tasks.filter(t => !t.author_status || t.author_status === 'not started');
    
    return [...revisionsRequired, ...notStarted].slice(0, 3);
  };

  // Get status color based on task status
  const getStatusColor = (status: string = '') => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in progress':
      case 'drafting':
      case 'revised':
        return 'primary';
      case 'under review':
        return 'secondary';
      case 'revisions required':
        return 'danger';
      case 'idea stage':
      case 'not started':
        return 'warning';
      default:
        return 'default';
    }
  };

  // Get status label in a capitalized format
  const getStatusLabel = (status: string = 'not started') => {
    return status
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Format date in a readable form
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric'
    });
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
            <h2 className="text-xl font-bold mb-2">Error Loading Dashboard</h2>
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
          <CardHeader className="flex justify-between items-center border-b">
            <div>
              <h1 className="text-2xl font-bold text-secondary">Author Dashboard</h1>
              <p className="text-default-500">
                {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                color="secondary"
                onClick={() => handleNavigation('/business/author/tasks')}
                startContent={<ClipboardDocumentListIcon className="h-5 w-5" />}
              >
                View All Tasks
              </Button>
              <Button 
                color="primary" 
                onClick={() => handleNavigation('/business/author/completed')}
                startContent={<CheckCircleIcon className="h-5 w-5" />}
              >
                Completed Work
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Task Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="border-l-4 border-primary">
            <CardBody className="flex flex-row items-center justify-between">
              <div>
                <p className="text-default-500 text-sm">Assigned Tasks</p>
                <h3 className="text-2xl font-bold">{taskStats.total}</h3>
              </div>
              <div className="bg-primary/10 p-3 rounded-full">
                <DocumentTextIcon className="w-6 h-6 text-primary" />
              </div>
            </CardBody>
          </Card>

          <Card className="border-l-4 border-success">
            <CardBody className="flex flex-row items-center justify-between">
              <div>
                <p className="text-default-500 text-sm">Completed</p>
                <h3 className="text-2xl font-bold">{taskStats.completed}</h3>
              </div>
              <div className="bg-success/10 p-3 rounded-full">
                <CheckCircleIcon className="w-6 h-6 text-success" />
              </div>
            </CardBody>
          </Card>

          <Card className="border-l-4 border-warning">
            <CardBody className="flex flex-row items-center justify-between">
              <div>
                <p className="text-default-500 text-sm">In Progress</p>
                <h3 className="text-2xl font-bold">{taskStats.inProgress}</h3>
              </div>
              <div className="bg-warning/10 p-3 rounded-full">
                <PencilIcon className="w-6 h-6 text-warning" />
              </div>
            </CardBody>
          </Card>

          <Card className="border-l-4 border-danger">
            <CardBody className="flex flex-row items-center justify-between">
              <div>
                <p className="text-default-500 text-sm">Needs Attention</p>
                <h3 className="text-2xl font-bold">{taskStats.revisionsRequired}</h3>
              </div>
              <div className="bg-danger/10 p-3 rounded-full">
                <ExclamationCircleIcon className="w-6 h-6 text-danger" />
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Two column layout for detailed content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Priority Tasks */}
          <Card className="shadow-sm lg:col-span-2">
            <CardHeader className="flex justify-between items-center border-b border-divider pb-2">
              <div>
                <h3 className="text-lg font-semibold flex items-center">
                  <BellAlertIcon className="h-5 w-5 mr-2 text-warning" />
                  Priority Tasks
                </h3>
                <p className="text-default-500 text-sm">
                  Tasks that require your immediate attention
                </p>
              </div>
              <Button 
                size="sm" 
                color="warning" 
                variant="light"
                onClick={() => handleNavigation('/business/author/tasks')}
                endContent={<ChevronRightIcon className="h-4 w-4" />}
              >
                View All
              </Button>
            </CardHeader>
            <CardBody className="py-3">
              {getPriorityTasks().length === 0 ? (
                <div className="text-center py-6 text-default-400">
                  <CheckCircleIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No priority tasks at the moment - great job!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {getPriorityTasks().map((task) => (
                    <div 
                      key={task.id} 
                      className="p-3 bg-default-50 rounded-lg hover:bg-default-100 transition-colors cursor-pointer"
                      onClick={() => handleNavigation(`/business/author/tasks/${task.id}`)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          handleNavigation(`/business/author/tasks/${task.id}`);
                        }
                      }}
                    >
                      <div className="flex justify-between mb-1">
                        <h4 className="font-medium">{task.prospectus.client_name}</h4>
                        <Chip 
                          size="sm" 
                          variant="flat" 
                          color={getStatusColor(task.author_status)}
                        >
                          {getStatusLabel(task.author_status || 'Not Started')}
                        </Chip>
                      </div>
                      <div className="text-sm text-default-600 line-clamp-2 mb-2">
                        {task.prospectus.requirement}
                      </div>
                      <div className="flex gap-4 text-xs text-default-500">
                        <span className="flex items-center">
                          <CalendarIcon className="h-3 w-3 mr-1" />
                          {formatDate(task.created_at)}
                        </span>
                        <span className="flex items-center">
                          <DocumentTextIcon className="h-3 w-3 mr-1" />
                          {task.services}
                        </span>
                      </div>
                    </div>
                  ))}

                  <Button 
                    color="warning" 
                    variant="flat" 
                    className="w-full mt-2"
                    onClick={() => handleNavigation('/business/author/tasks')}
                  >
                    Manage All Tasks
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Completion Stats */}
          <Card className="shadow-sm">
            <CardHeader className="border-b">
              <h3 className="text-lg font-semibold flex items-center">
                <ChartBarIcon className="h-5 w-5 mr-2 text-primary" />
                Work Progress
              </h3>
            </CardHeader>
            <CardBody className="py-4">
              <div className="flex flex-col gap-6">
                {/* Overall completion */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">Overall Completion</span>
                    <span>{getCompletionPercentage()}%</span>
                  </div>
                  <Progress 
                    value={getCompletionPercentage()} 
                    color="success" 
                    className="h-2"
                    aria-label="Overall completion"
                  />
                  <p className="text-xs text-default-500 mt-1">
                    {taskStats.completed} of {taskStats.total} tasks completed
                  </p>
                </div>

                {/* Status breakdown */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Task Status Breakdown</h4>
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Not Started</span>
                        <span>{taskStats.notStarted}</span>
                      </div>
                      <Progress 
                        value={(taskStats.notStarted / Math.max(1, taskStats.total)) * 100} 
                        color="warning" 
                        className="h-1.5"
                        aria-label="Not started tasks"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>In Progress</span>
                        <span>{taskStats.inProgress}</span>
                      </div>
                      <Progress 
                        value={(taskStats.inProgress / Math.max(1, taskStats.total)) * 100} 
                        color="primary" 
                        className="h-1.5"
                        aria-label="In progress tasks"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Under Review</span>
                        <span>{taskStats.underReview}</span>
                      </div>
                      <Progress 
                        value={(taskStats.underReview / Math.max(1, taskStats.total)) * 100} 
                        color="secondary" 
                        className="h-1.5"
                        aria-label="Under review tasks"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Needs Revision</span>
                        <span>{taskStats.revisionsRequired}</span>
                      </div>
                      <Progress 
                        value={(taskStats.revisionsRequired / Math.max(1, taskStats.total)) * 100} 
                        color="danger" 
                        className="h-1.5"
                        aria-label="Revision required tasks"
                      />
                    </div>
                  </div>
                </div>

                <Divider />
                
                <div>
                  <h4 className="text-sm font-medium mb-3">Quick Actions</h4>
                  <div className="space-y-2">
                    <Button 
                      color="primary" 
                      className="w-full"
                      startContent={<DocumentTextIcon className="h-4 w-4" />}
                      onClick={() => handleNavigation('/business/author/tasks')}
                    >
                      View All Tasks
                    </Button>
                    <Button 
                      color="success" 
                      className="w-full"
                      variant="flat"
                      startContent={<CheckCircleIcon className="h-4 w-4" />}
                      onClick={() => handleNavigation('/business/author/completed')}
                    >
                      View Completed Work
                    </Button>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Recent Activity and Guidelines */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <Card className="shadow-sm">
            <CardHeader className="border-b">
              <h3 className="text-lg font-semibold flex items-center">
                <ClockIcon className="h-5 w-5 mr-2 text-primary" />
                Recent Activity
              </h3>
            </CardHeader>
            <CardBody>
              {getRecentTasks().length === 0 ? (
                <div className="text-center py-6 text-default-400">
                  <ClockIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No recent task activity found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {getRecentTasks().map((task) => (
                    <div 
                      key={task.id}
                      className="flex items-start gap-3 p-2 hover:bg-default-50 rounded-md cursor-pointer"
                      onClick={() => handleNavigation(`/business/author/tasks/${task.id}`)}
                    >
                      <div className={`p-2 rounded-full bg-${getStatusColor(task.author_status)}/10`}>
                        <ArrowTrendingUpIcon className={`h-5 w-5 text-${getStatusColor(task.author_status)}`} />
                      </div>
                      <div className="flex-grow">
                        <h4 className="text-sm font-medium">{task.prospectus.client_name}</h4>
                        <p className="text-xs text-default-500 mt-1">
                          Status updated to <span className="font-medium">{getStatusLabel(task.author_status || 'Not Started')}</span>
                        </p>
                        <p className="text-xs text-default-400 mt-1">
                          {formatDate(task.updated_at)}
                        </p>
                      </div>
                      <Chip size="sm" variant="flat" color={getStatusColor(task.author_status)}>
                        {getStatusLabel(task.author_status || 'Not Started')}
                      </Chip>
                    </div>
                  ))}
                  <Button 
                    size="sm" 
                    variant="light" 
                    color="primary" 
                    className="w-full mt-2"
                    onClick={() => handleNavigation('/business/author/tasks')}
                  >
                    View All Tasks
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Guidelines */}
          <Card className="shadow-sm">
            <CardHeader className="border-b">
              <h3 className="text-lg font-semibold text-secondary">Author Guidelines</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <p className="text-default-600 text-sm">
                  As an author, follow these guidelines to ensure high-quality academic papers:
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-primary/5 p-3 rounded-lg">
                    <h4 className="text-sm font-semibold text-primary mb-2">Research Standards</h4>
                    <ul className="list-disc pl-5 space-y-1 text-xs text-default-600">
                      <li>Use credible academic sources and proper citations</li>
                      <li>Follow required formatting style (APA, MLA, Chicago, etc.)</li>
                      <li>Ensure comprehensive literature review</li>
                      <li>Use primary sources when applicable</li>
                    </ul>
                  </div>
                  
                  <div className="bg-success/5 p-3 rounded-lg">
                    <h4 className="text-sm font-semibold text-success mb-2">Quality Control</h4>
                    <ul className="list-disc pl-5 space-y-1 text-xs text-default-600">
                      <li>Ensure paper is free of plagiarism</li>
                      <li>Proofread for grammar and spelling errors</li>
                      <li>Verify all facts and data are accurate</li>
                      <li>Check all figures, tables, and citations</li>
                    </ul>
                  </div>
                  
                  <div className="bg-secondary/5 p-3 rounded-lg">
                    <h4 className="text-sm font-semibold text-secondary mb-2">Timeline Management</h4>
                    <ul className="list-disc pl-5 space-y-1 text-xs text-default-600">
                      <li>Submit drafts according to schedule</li>
                      <li>Regularly update task status</li>
                      <li>Request clarification early if needed</li>
                      <li>Plan for buffer time before final deadline</li>
                    </ul>
                  </div>
                  
                  <div className="bg-warning/5 p-3 rounded-lg">
                    <h4 className="text-sm font-semibold text-warning mb-2">Revision Process</h4>
                    <ul className="list-disc pl-5 space-y-1 text-xs text-default-600">
                      <li>Address all reviewer comments thoroughly</li>
                      <li>Track changes to show revisions</li>
                      <li>Provide reasoning for unaddressed comments</li>
                      <li>Complete revisions promptly</li>
                    </ul>
                  </div>
                </div>
                
                <p className="text-xs text-default-500 mt-3">
                  When you&apos;ve completed a paper, submit it through the task detail page for review by management.
                  They will handle the publication process after review.
                </p>
              </div>
            </CardBody>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}

export default withAuthorAuth(AuthorDashboard);
