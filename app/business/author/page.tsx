"use client";
import React, { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader, Spinner, Button } from '@heroui/react';
import withAuthorAuth from '@/components/withAuthorAuth';
import api from '@/services/api';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { DocumentTextIcon, ClipboardDocumentListIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

function AuthorDashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Get the user data from localStorage
    const userData = api.getStoredUser();
    if (userData) {
      setUser(userData);
    }
    setLoading(false);
  }, []);

  const handleNavigation = (path: string) => {
    router.push(path);
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
          <CardHeader className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-secondary">Author Dashboard</h1>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-secondary/5 rounded-lg">
                <h2 className="text-lg font-medium text-secondary mb-2">Welcome, {user?.username || 'Author'}</h2>
                <p className="text-default-500">
                  This is your author dashboard where you can manage your writing assignments, track progress on your papers, and submit completed work.
                </p>
              </div>
              
              <div className="p-4 bg-secondary/5 rounded-lg">
                <h2 className="text-lg font-medium text-secondary mb-2">Quick Actions</h2>
                <ul className="space-y-2">
                  <li>
                    <Button 
                      variant="light" 
                      color="primary" 
                      startContent={<ClipboardDocumentListIcon className="h-4 w-4" />}
                      onClick={() => handleNavigation('/business/author/tasks')}
                      className="text-left w-full justify-start"
                    >
                      View assigned tasks
                    </Button>
                  </li>
                  <li>
                    <Button 
                      variant="light" 
                      color="success" 
                      startContent={<CheckCircleIcon className="h-4 w-4" />}
                      onClick={() => handleNavigation('/business/author/completed')} 
                      className="text-left w-full justify-start"
                    >
                      View completed work
                    </Button>
                  </li>
                  <li>
                    <Button 
                      variant="light" 
                      color="secondary" 
                      startContent={<DocumentTextIcon className="h-4 w-4" />}
                      onClick={() => handleNavigation('/business/author/tasks')}
                      className="text-left w-full justify-start"
                    >
                      Update task status
                    </Button>
                  </li>
                </ul>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card className="shadow-md">
          <CardHeader>
            <h2 className="text-xl font-semibold text-secondary">Paper Writing Guidelines</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <p className="text-default-600">
                As an author, your primary responsibility is to write high-quality academic papers based on client requirements. Here are some general guidelines:
              </p>
              
              <ul className="list-disc pl-5 space-y-1 text-default-600">
                <li>Thoroughly research your topic using credible academic sources</li>
                <li>Follow the required formatting style (APA, MLA, Chicago, etc.)</li>
                <li>Ensure your paper is free of plagiarism</li>
                <li>Keep management updated on your progress</li>
                <li>Submit completed papers by the deadline</li>
                <li>Be responsive to revision requests from reviewers</li>
              </ul>
              
              <p className="text-default-600">
                When you&apos;ve completed a paper, please submit it through the task detail page for review by management. They will handle the publication process after review.
              </p>
            </div>
          </CardBody>
        </Card>
      </motion.div>
    </div>
  );
}

export default withAuthorAuth(AuthorDashboard);
