'use client'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation';
import { Card, CardBody, CardHeader, Divider, Spinner, Button, Chip } from "@nextui-org/react";
import { toast } from 'react-toastify';
import { withClientAuth } from '@/components/withClientAuth';
import api from '@/services/api';
import { Sidebar } from '@/components/sidebar';
import { 
  NewspaperIcon, 
  DocumentTextIcon 
} from '@heroicons/react/24/outline';

// Mock journal data
const mockJournals = [
  {
    id: 1,
    title: "Advanced Machine Learning Techniques in Healthcare",
    status: "In Review",
    progress: 65,
    lastUpdated: "2023-10-12T14:30:00Z",
    type: "Paper Writing",
    journal: "IEEE Transactions on Neural Networks and Learning Systems",
    authors: "John Smith, Maria Garcia"
  },
  {
    id: 2,
    title: "Sustainable Energy Solutions for Urban Development",
    status: "Submitted",
    progress: 100,
    lastUpdated: "2023-11-05T09:15:00Z",
    type: "Paper Submission",
    journal: "Renewable and Sustainable Energy Reviews",
    authors: "David Johnson, Sarah Lee"
  },
  {
    id: 3,
    title: "Quantum Computing Applications in Cryptography",
    status: "In Review",
    progress: 40,
    lastUpdated: "2023-12-01T11:20:00Z",
    type: "Paper Writing",
    journal: "Journal of Cryptographic Engineering",
    authors: "Jennifer Williams, Robert Martinez"
  }
];

const JournalsPage = () => {
  const router = useRouter();
  const [journals, setJournals] = useState(mockJournals);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Filter journals based on selection
  const filteredJournals = selectedFilter === 'all' 
    ? journals 
    : journals.filter(journal => {
        if (selectedFilter === 'in-review') return journal.status === 'In Review';
        if (selectedFilter === 'submitted') return journal.status === 'Submitted';
        return true;
      });

  // Status badge color mapping
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'In Review': return 'warning';
      case 'Submitted': return 'success';
      case 'Rejected': return 'danger';
      default: return 'default';
    }
  };

  // Format dates for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-6 ml-16 md:ml-64">
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
            variant={selectedFilter === 'submitted' ? 'solid' : 'bordered'} 
            color="success"
            onClick={() => setSelectedFilter('submitted')}
            className="cursor-pointer"
          >
            Submitted
          </Chip>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Spinner size="lg" label="Loading journals..." />
          </div>
        ) : (
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
              filteredJournals.map(journal => (
                <Card 
                  key={journal.id} 
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  isPressable 
                  onPress={() => router.push(`/business/clients/journals/${journal.id}`)}
                >
                  <CardBody className="p-5">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Chip color={getStatusColor(journal.status)} size="sm">{journal.status}</Chip>
                          <span className="text-xs text-default-500">{journal.type}</span>
                        </div>
                        <h3 className="text-lg font-semibold mb-1">{journal.title}</h3>
                        <p className="text-sm text-default-500 mb-3">{journal.journal}</p>
                        <div className="text-xs text-default-400 flex flex-wrap gap-x-4 gap-y-1">
                          <span>Authors: {journal.authors}</span>
                          <span>Last updated: {formatDate(journal.lastUpdated)}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-center gap-2 sm:border-l sm:pl-4 sm:ml-2 w-full sm:w-auto">
                        <div className="text-2xl font-bold text-primary">{journal.progress}%</div>
                        <div className="text-xs text-default-500">Completion</div>
                        <Button 
                          size="sm" 
                          color="primary" 
                          variant="flat"
                          className="w-full sm:w-auto mt-2"
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default withClientAuth(JournalsPage);
