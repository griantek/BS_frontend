"use client";
import React, { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader, Spinner } from '@heroui/react';
import withAuthorAuth from '@/components/withAuthorAuth';
import api from '@/services/api';
import { motion } from 'framer-motion';

function AuthorDashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get the user data from localStorage
    const userData = api.getStoredUser();
    if (userData) {
      setUser(userData);
    }
    setLoading(false);
  }, []);

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
                  This is your author dashboard where you can manage your publications, submissions, and track the status of your papers.
                </p>
              </div>
              
              <div className="p-4 bg-secondary/5 rounded-lg">
                <h2 className="text-lg font-medium text-secondary mb-2">Quick Actions</h2>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-secondary rounded-full mr-2"></span>
                    <span>View your publications</span>
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-secondary rounded-full mr-2"></span>
                    <span>Submit a new paper</span>
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-secondary rounded-full mr-2"></span>
                    <span>Check submission status</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardBody>
        </Card>
        
        {/* Add more sections and functionality as needed */}
        <Card className="shadow-md">
          <CardHeader>
            <h2 className="text-xl font-semibold text-secondary">My Publications</h2>
          </CardHeader>
          <CardBody>
            <p className="text-default-500 text-center py-6">
              No publications found. Start by submitting your first paper.
            </p>
          </CardBody>
        </Card>
      </motion.div>
    </div>
  );
}

export default withAuthorAuth(AuthorDashboard);
