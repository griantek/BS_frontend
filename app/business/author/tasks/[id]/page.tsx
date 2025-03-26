"use client";
import React, { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader, CardFooter, Spinner, Button, Divider, Textarea, Input, Chip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/react';
import withAuthorAuth from '@/components/withAuthorAuth';
import api, { AuthorTask, AuthorTaskUpdateRequest } from '@/services/api';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { CheckCircleIcon, ClockIcon, DocumentTextIcon, ArrowLeftIcon, PaperClipIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

function TaskDetail({ params }: { params: { id: string } }) {
  const [loading, setLoading] = useState(true);
  const [task, setTask] = useState<AuthorTask | null>(null);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [statusUpdate, setStatusUpdate] = useState('');
  const [comments, setComments] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    const fetchTask = async () => {
      try {
        setLoading(true);
        const id = parseInt(params.id);
        const response = await api.getTaskById(id);
        
        if (response.success) {
          setTask(response.data);
          setCompletionPercentage(response.data.completion_percentage);
          setStatusUpdate(response.data.status);
          setDocumentUrl(response.data.document_url || '');
        }
      } catch (error) {
        console.error("Error fetching task details:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTask();
  }, [params.id]);

  const handleUpdateProgress = async () => {
    if (!task) return;
    
    try {
      setUpdateLoading(true);
      
      // Create update request with current values
      const updateData: AuthorTaskUpdateRequest = {
        completion_percentage: completionPercentage,
        status: statusUpdate as 'pending' | 'in_progress' | 'under_review' | 'completed',
      };
      
      // Only include document URL if provided
      if (documentUrl) {
        updateData.document_url = documentUrl;
      }
      
      // Only include comments if provided
      if (comments) {
        // Get existing comments or initialize empty array
        const existingComments = task.review_comments || [];
        updateData.review_comments = [...existingComments, comments];
      }
      
      const response = await api.updateTask(task.id, updateData);
      
      if (response.success) {
        setTask(response.data);
        setComments(''); // Clear comments input after update
        onOpen(); // Open success modal
      }
    } catch (error) {
      console.error("Error updating task:", error);
    } finally {
      setUpdateLoading(false);
    }
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

  if (!task) {
    return (
      <div className="container mx-auto p-6">
        <Card className="shadow-md">
          <CardBody className="p-6 text-center">
            <ExclamationCircleIcon className="h-12 w-12 text-danger mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Task Not Found</h2>
            <p className="text-default-500 mb-4">The task you're looking for doesn't exist or you don't have permission to view it.</p>
            <Button color="primary" onClick={() => router.push('/business/author/tasks')}>
              Return to Task List
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
        <div className="mb-4">
          <Button 
            variant="light" 
            startContent={<ArrowLeftIcon className="h-4 w-4" />}
            onClick={() => router.push('/business/author/tasks')}
          >
            Back to Tasks
          </Button>
        </div>
        
        <Card className="mb-6 shadow-md">
          <CardHeader className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-secondary">{task.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Chip 
                  color={getStatusColor(task.status)} 
                  variant="flat"
                >
                  {getStatusLabel(task.status)}
                </Chip>
                <span className="text-sm text-default-500">ID: {task.id}</span>
              </div>
            </div>
          </CardHeader>
          
          <CardBody>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card className="mb-6">
                  <CardHeader>
                    <h2 className="text-lg font-semibold">Task Description</h2>
                  </CardHeader>
                  <CardBody>
                    <p className="text-default-700">{task.description}</p>
                    
                    <Divider className="my-4" />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <h3 className="text-sm font-medium mb-2">Journal Details</h3>
                        <p className="text-sm"><span className="font-medium">Journal Name:</span> {task.journal_name}</p>
                        <p className="text-sm"><span className="font-medium">Client:</span> {task.client_name}</p>
                        <p className="text-sm"><span className="font-medium">Research Area:</span> {task.research_area || 'Not specified'}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium mb-2">Requirements</h3>
                        <p className="text-sm">{task.paper_requirements || 'No specific requirements provided.'}</p>
                        {task.word_count && (
                          <p className="text-sm mt-2"><span className="font-medium">Word Count:</span> {task.word_count.toLocaleString()}</p>
                        )}
                      </div>
                    </div>
                    
                    <Divider className="my-4" />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium mb-2">Timeline</h3>
                        <p className="text-sm"><span className="font-medium">Assigned Date:</span> {new Date(task.assigned_date).toLocaleDateString()}</p>
                        <p className="text-sm"><span className="font-medium">Deadline:</span> {new Date(task.deadline).toLocaleDateString()}</p>
                        <p className="text-sm"><span className="font-medium">Last Updated:</span> {new Date(task.last_updated).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium mb-2">Progress</h3>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-full bg-default-200 rounded-full h-2.5">
                            <div 
                              className={`h-2.5 rounded-full ${
                                task.completion_percentage === 100 ? 'bg-success' : 
                                task.completion_percentage > 75 ? 'bg-success' :
                                task.completion_percentage > 25 ? 'bg-warning' : 
                                'bg-primary'
                              }`} 
                              style={{ width: `${task.completion_percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{task.completion_percentage}%</span>
                        </div>
                        <p className="text-sm"><span className="font-medium">Status:</span> {getStatusLabel(task.status)}</p>
                      </div>
                    </div>
                  </CardBody>
                </Card>
                
                {task.review_comments && task.review_comments.length > 0 && (
                  <Card className="mb-6">
                    <CardHeader>
                      <h2 className="text-lg font-semibold">Review Comments</h2>
                    </CardHeader>
                    <CardBody>
                      <div className="space-y-3">
                        {task.review_comments.map((comment, index) => (
                          <div key={index} className="border-l-4 border-primary pl-3 py-1">
                            <p className="text-sm text-default-700">{comment}</p>
                            <p className="text-xs text-default-500">Comment #{index + 1}</p>
                          </div>
                        ))}
                      </div>
                    </CardBody>
                  </Card>
                )}
                
                {task.document_url && (
                  <Card className="mb-6">
                    <CardHeader>
                      <h2 className="text-lg font-semibold">Uploaded Document</h2>
                    </CardHeader>
                    <CardBody>
                      <div className="flex items-center gap-2">
                        <PaperClipIcon className="h-5 w-5 text-default-500" />
                        <a 
                          href={task.document_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          View Document
                        </a>
                      </div>
                    </CardBody>
                  </Card>
                )}
              </div>
              
              <div>
                <Card className="sticky top-20">
                  <CardHeader>
                    <h2 className="text-lg font-semibold">Update Progress</h2>
                  </CardHeader>
                  <CardBody>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Completion Percentage</label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={completionPercentage.toString()} // Convert number to string
                          onChange={(e) => setCompletionPercentage(parseInt(e.target.value) || 0)}
                          endContent={<div className="pointer-events-none">%</div>}
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium mb-1 block">Status</label>
                        <select 
                          className="w-full rounded-md border-default-200 py-2 px-3 text-sm focus:border-primary focus:ring-primary"
                          value={statusUpdate}
                          onChange={(e) => setStatusUpdate(e.target.value)}
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="under_review">Under Review</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium mb-1 block">Document URL (when complete)</label>
                        <Input
                          placeholder="https://example.com/document.pdf"
                          value={documentUrl}
                          onChange={(e) => setDocumentUrl(e.target.value)}
                        />
                        <p className="text-xs text-default-500 mt-1">
                          Enter the URL where your completed document can be accessed
                        </p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium mb-1 block">Add Comment/Note</label>
                        <Textarea
                          placeholder="Add a comment or progress note..."
                          value={comments}
                          onChange={(e) => setComments(e.target.value)}
                          rows={4}
                        />
                      </div>
                    </div>
                  </CardBody>
                  <CardFooter>
                    <Button 
                      color="primary" 
                      className="w-full"
                      onClick={handleUpdateProgress}
                      isLoading={updateLoading}
                    >
                      Update Task
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </CardBody>
        </Card>
        
        {/* Success Modal */}
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalContent>
            <ModalHeader className="flex flex-col gap-1">
              Update Successful
            </ModalHeader>
            <ModalBody>
              <div className="flex flex-col items-center gap-2 py-4">
                <CheckCircleIcon className="h-12 w-12 text-success" />
                <p className="text-center">
                  Your task progress has been successfully updated.
                </p>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button color="primary" onPress={onClose}>
                Close
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </motion.div>
    </div>
  );
}

export default withAuthorAuth(TaskDetail);
