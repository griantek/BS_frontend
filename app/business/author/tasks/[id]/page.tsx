"use client";
import React, { useEffect, useState, useRef } from 'react';
import { Card, CardBody, CardHeader, CardFooter, Spinner, Button, Divider, Textarea, Input, Chip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/react';
import withAuthorAuth from '@/components/withAuthorAuth';
import api, { AssignedRegistration } from '@/services/api';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { CheckCircleIcon, ArrowLeftIcon, PaperClipIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'; 

// Define the available status options - simplified for paper writing workflow
const STATUS_OPTIONS = [
  "not started",
  "idea stage",
  "drafting",
  "in progress",
  "under review",
  "revisions required",
  "revised",
  "completed"
];

function TaskDetail({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap params using React.use()
  const resolvedParams = React.use(params);
  const taskId = resolvedParams.id;
  
  const [loading, setLoading] = useState(true);
  const [task, setTask] = useState<AssignedRegistration | null>(null);
  const [statusUpdate, setStatusUpdate] = useState('');
  const [comments, setComments] = useState('');
  const [paperFile, setPaperFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTask = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get current user from storage
        const user = api.getStoredUser();
        if (!user || !user.id) {
          throw new Error("User information not found");
        }

        // Fetch assignments
        const response = await api.getAssignedRegistrationsAuthor(user.id);
        
        if (response.success) {
          // Find the specific task by ID using the resolved taskId
          const parsedTaskId = parseInt(taskId);
          const foundTask = response.data.find(t => t.id === parsedTaskId);
          
          if (foundTask) {
            setTask(foundTask);
            // Use author_status if available, otherwise fall back to a default status
            setStatusUpdate(foundTask.author_status || "not started");
          } else {
            throw new Error("Task not found");
          }
        } else {
          throw new Error("Failed to fetch task details");
        }
      } catch (error: any) {
        console.error("Error fetching task details:", error);
        setError(error.message || "Failed to load task details");
      } finally {
        setLoading(false);
      }
    };
    
    fetchTask();
  }, [taskId]); // Update dependency to use unwrapped taskId

  const handleUpdateStatus = async () => {
    if (!task) return;
    
    try {
      setUpdateLoading(true);
      
      // Create the data object based on status
      const updateData: any = {
        status: statusUpdate
      };
      
      // If status is completed and there's a file, use FormData
      if (statusUpdate === "completed" && paperFile) {
        const formData = new FormData();
        formData.append('status', statusUpdate);
        formData.append('paper_file', paperFile);
        
        // Only append comments if provided
        if (comments) {
          formData.append('comments', comments);
        }
        
        formData.append('reg_id', task.prospectus.id.toString());
        
        // Call API function to update author status with file
        const response = await api.updateAuthorStatusWithFile(formData);
        
        if (response.success) {
          // Update local task state with new status
          setTask({
            ...task,
            author_status: statusUpdate
          });
          
          // Show success modal
          onOpen();
        } else {
          setError("Failed to update status");
        }
      } else {
        // Standard status update (no file)
        if (comments) {
          updateData.comments = comments;
        }
        
        // Call API function to update author status
        const response = await api.updateAuthorStatus(task.prospectus.id, updateData);
        
        if (response.success) {
          // Update local task state with new status
          setTask({
            ...task,
            author_status: statusUpdate
          });
          
          // Show success modal
          onOpen();
        } else {
          setError("Failed to update status");
        }
      }
    } catch (error: any) {
      console.error("Error updating task status:", error);
      setError(error.message || "Failed to update task status");
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPaperFile(file);
      setFileName(file.name);
    }
  };

  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
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

  const getStatusLabel = (status: string) => {
    // Just capitalize the words in the status
    return status
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
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
            <h2 className="text-xl font-bold mb-2">Error</h2>
            <p className="text-default-500 mb-4">{error}</p>
            <Button color="primary" onClick={() => router.push('/business/author/tasks')}>
              Return to Task List
            </Button>
          </CardBody>
        </Card>
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
            <p className="text-default-500 mb-4">The task you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.</p>
            <Button color="primary" onClick={() => router.push('/business/author/tasks')}>
              Return to Task List
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  // Determine if we should show the update button
  const showUpdateButton = statusUpdate !== (task.author_status || "not started");
  
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
              <h1 className="text-2xl font-bold text-secondary">{task.prospectus.client_name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Chip 
                  color={getStatusColor(task.author_status || 'not started')} 
                  variant="flat"
                >
                  {getStatusLabel(task.author_status || 'not started')}
                </Chip>
                <span className="text-sm text-default-500">ID: {task.id}</span>
                <span className="text-sm text-default-500">Reg ID: {task.prospectus.reg_id}</span>
              </div>
            </div>
          </CardHeader>
          
          <CardBody>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card className="mb-6">
                  <CardHeader>
                    <h2 className="text-lg font-semibold">Task Details</h2>
                  </CardHeader>
                  <CardBody>
                    <p className="text-default-700">{task.prospectus.requirement}</p>
                    
                    <Divider className="my-4" />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <h3 className="text-sm font-medium mb-2">Client Details</h3>
                        <p className="text-sm"><span className="font-medium">Name:</span> {task.prospectus.client_name}</p>
                        <p className="text-sm"><span className="font-medium">Email:</span> {task.prospectus.email}</p>
                        <p className="text-sm"><span className="font-medium">Phone:</span> {task.prospectus.phone}</p>
                        <p className="text-sm"><span className="font-medium">Department:</span> {task.prospectus.department}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium mb-2">Service Details</h3>
                        <p className="text-sm"><span className="font-medium">Services:</span> {task.services}</p>
                        <p className="text-sm"><span className="font-medium">Tech Person:</span> {task.prospectus.tech_person || 'Not specified'}</p>
                        <p className="text-sm"><span className="font-medium">Period:</span> {task.pub_period}</p>
                        <p className="text-sm"><span className="font-medium">State:</span> {task.prospectus.state}</p>
                      </div>
                    </div>
                    
                    <Divider className="my-4" />
                    
                    <div>
                      <h3 className="text-sm font-medium mb-2">Timeline</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
                        <p className="text-sm"><span className="font-medium">Date:</span> {new Date(task.date).toLocaleDateString()}</p>
                        <p className="text-sm"><span className="font-medium">Accepted Period:</span> {task.accept_period}</p>
                        <p className="text-sm"><span className="font-medium">Publication Period:</span> {task.pub_period}</p>
                        <p className="text-sm"><span className="font-medium">Created At:</span> {new Date(task.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    {task.notes && (
                      <>
                        <Divider className="my-4" />
                        <div>
                          <h3 className="text-sm font-medium mb-2">Notes</h3>
                          <p className="text-sm">{task.notes}</p>
                        </div>
                      </>
                    )}
                  </CardBody>
                </Card>
              </div>
              
              {/* Updated status section */}
              <div>
                <Card className="sticky top-20">
                  <CardHeader>
                    <h2 className="text-lg font-semibold">Update Status</h2>
                  </CardHeader>
                  <CardBody>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="status-update" className="text-sm font-medium mb-1 block">Current Status</label>
                        <select 
                          id="status-update"
                          className="w-full rounded-md border-default-200 py-2 px-3 text-sm focus:border-primary focus:ring-primary"
                          value={statusUpdate}
                          onChange={(e) => setStatusUpdate(e.target.value)}
                        >
                          {STATUS_OPTIONS.map(status => (
                            <option key={status} value={status}>
                              {getStatusLabel(status)}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-default-500 mt-1">
                          Current status: {getStatusLabel(task.author_status || 'not started')}
                        </p>
                      </div>
                      
                      {/* Additional fields based on status - always show comments field */}
                      <div>
                        <label htmlFor="status-comments" className="text-sm font-medium mb-1 block">Comments (Optional)</label>
                        <Textarea
                          id="status-comments"
                          placeholder="Add any comments about this status update..."
                          value={comments}
                          onChange={(e) => setComments(e.target.value)}
                          rows={3}
                        />
                      </div>

                      {/* Show file upload option when status is 'completed' */}
                      {statusUpdate === 'completed' && (
                        <div className="bg-default-100 p-3 rounded mt-3">
                          <h3 className="text-sm font-medium mb-2">Upload Completed Paper (Optional)</h3>
                          <div className="mb-2">
                            <input
                              type="file"
                              ref={fileInputRef}
                              onChange={handleFileChange}
                              accept=".pdf,.doc,.docx"
                              className="hidden"
                            />
                            <div className="flex items-center gap-2">
                              <Button 
                                color="primary" 
                                variant="flat" 
                                size="sm"
                                startContent={<PaperClipIcon className="h-4 w-4" />}
                                onClick={handleBrowseClick}
                              >
                                Browse Files
                              </Button>
                              <span className="text-xs text-default-600 truncate">
                                {fileName || "No file selected"}
                              </span>
                            </div>
                            <p className="text-xs text-default-500 mt-1">
                              You can optionally upload your completed paper for review.
                              <br />
                              Accepted formats: PDF, DOC, DOCX
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardBody>
                  <CardFooter>
                    {showUpdateButton && (
                      <Button 
                        color="primary" 
                        className="w-full"
                        onClick={handleUpdateStatus}
                        isLoading={updateLoading}
                      >
                        {statusUpdate === 'completed' ? 'Mark as Completed' : 'Update Status'}
                      </Button>
                    )}
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
              {statusUpdate === 'completed' ? 'Task Marked as Complete' : 'Status Updated'}
            </ModalHeader>
            <ModalBody>
              <div className="flex flex-col items-center gap-2 py-4">
                <CheckCircleIcon className="h-12 w-12 text-success" />
                <p className="text-center">
                  {statusUpdate === 'completed' 
                    ? paperFile 
                      ? 'Your completed paper has been submitted for review.' 
                      : 'Task has been marked as completed successfully.'
                    : `Task status has been updated to ${getStatusLabel(statusUpdate)}.`}
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
