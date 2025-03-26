"use client";
import React, { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader, Spinner, Button, Input, Chip } from '@heroui/react';
import withAuthorAuth from '@/components/withAuthorAuth';
import api, { AuthorTask } from '@/services/api';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { MagnifyingGlassIcon, DocumentTextIcon, ClockIcon } from '@heroicons/react/24/outline';

function CompletedTasks() {
  const [loading, setLoading] = useState(true);
  const [completedTasks, setCompletedTasks] = useState<AuthorTask[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<AuthorTask[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchCompletedTasks = async () => {
      try {
        setLoading(true);
        const response = await api.getAuthorTasks();
        if (response.success) {
          // Filter only completed tasks
          const completed = response.data.filter(task => task.status === 'completed');
          setCompletedTasks(completed);
          setFilteredTasks(completed);
        }
      } catch (error) {
        console.error("Error fetching completed tasks:", error);
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
          task.title.toLowerCase().includes(query) ||
          task.description.toLowerCase().includes(query) ||
          task.journal_name.toLowerCase().includes(query) ||
          task.client_name.toLowerCase().includes(query)
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
                View your completed tasks and papers
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
                        <h3 className="text-md font-semibold line-clamp-1">{task.title}</h3>
                        <Chip color="success" variant="flat" size="sm">Completed</Chip>
                      </div>
                      
                      <p className="text-sm text-default-600 mb-1">
                        <span className="font-medium">Journal:</span> {task.journal_name}
                      </p>
                      
                      <p className="text-sm text-default-500 line-clamp-2 mb-3">
                        {task.description}
                      </p>
                      
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-default-500 mt-2 mb-4">
                        <div><span className="font-medium">Completed On:</span> {new Date(task.last_updated).toLocaleDateString()}</div>
                        <div><span className="font-medium">Deadline:</span> {new Date(task.deadline).toLocaleDateString()}</div>
                        {task.word_count && (
                          <div><span className="font-medium">Word Count:</span> {task.word_count.toLocaleString()}</div>
                        )}
                        <div><span className="font-medium">Client:</span> {task.client_name}</div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <Button 
                          color="primary"
                          variant="light"
                          onClick={() => handleViewTask(task.id)}
                        >
                          View Details
                        </Button>
                        
                        {task.document_url && (
                          <a 
                            href={task.document_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1 text-sm"
                          >
                            <DocumentTextIcon className="h-4 w-4" />
                            View Document
                          </a>
                        )}
                      </div>
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
