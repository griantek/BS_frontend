'use client'
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody, CardHeader, Divider, Button, Input, Spinner, Chip, Textarea, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@nextui-org/react";
import { withClientAuth } from '@/components/withClientAuth';
import { Sidebar } from '@/components/sidebar';
import { 
  CloudArrowUpIcon, 
  ClipboardDocumentListIcon, 
  ArrowLeftIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

// Mock submission data
const mockSubmissions = [
  {
    id: "SUB-2023-001",
    journalName: "IEEE Transactions on Neural Networks and Learning Systems",
    paperTitle: "Advanced Machine Learning Techniques in Healthcare",
    submissionDate: "2023-10-15",
    status: "Under Review",
    feedback: null
  },
  {
    id: "SUB-2023-002",
    journalName: "Renewable and Sustainable Energy Reviews",
    paperTitle: "Sustainable Energy Solutions for Urban Development",
    submissionDate: "2023-11-10",
    status: "Accepted",
    feedback: "Paper accepted with minor revisions. Please address reviewer comments within 30 days."
  }
];

const JournalSubmissionsPage = () => {
  const router = useRouter();
  const [submissions, setSubmissions] = useState(mockSubmissions);
  const [isUploading, setIsUploading] = useState(false);
  const [showNewSubmission, setShowNewSubmission] = useState(false);
  const [newSubmission, setNewSubmission] = useState({
    journalName: '',
    paperTitle: '',
    abstract: '',
    keywords: '',
    selectedJournal: 'Select Journal'
  });

  // Simulated journal options
  const journalOptions = [
    "IEEE Transactions on Neural Networks",
    "Nature Communications",
    "Journal of Artificial Intelligence Research",
    "Science Advances",
    "Cell Reports"
  ];

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Under Review': return 'warning';
      case 'Accepted': return 'success';
      case 'Rejected': return 'danger';
      case 'Pending': return 'primary';
      default: return 'default';
    }
  };

  const handleUpload = () => {
    setIsUploading(true);
    // Simulate upload process
    setTimeout(() => {
      setIsUploading(false);
      setShowNewSubmission(false);
      // Add new submission to list (in a real app, this would come from API)
      setSubmissions([
        {
          id: `SUB-2023-00${submissions.length + 1}`,
          journalName: newSubmission.selectedJournal !== 'Select Journal' ? 
            newSubmission.selectedJournal : newSubmission.journalName,
          paperTitle: newSubmission.paperTitle,
          submissionDate: new Date().toISOString().split('T')[0],
          status: "Pending",
          feedback: null
        },
        ...submissions
      ]);
      // Reset form
      setNewSubmission({
        journalName: '',
        paperTitle: '',
        abstract: '',
        keywords: '',
        selectedJournal: 'Select Journal'
      });
    }, 2000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewSubmission(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="flex ml-16">
      <Sidebar />
      <div className="flex-1 p-6 pl-[var(--sidebar-width,4rem)] transition-all duration-300">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Journal Submissions</h1>
            <p className="text-default-500">Manage your academic paper submissions</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="light"
              startContent={<ArrowLeftIcon className="h-4 w-4" />}
              onClick={() => router.push('/business/clients/journals')}
            >
              Back to Journals
            </Button>
            <Button 
              color="primary" 
              onClick={() => setShowNewSubmission(true)}
              startContent={<CloudArrowUpIcon className="h-4 w-4" />}
            >
              New Submission
            </Button>
          </div>
        </div>

        {showNewSubmission ? (
          <Card className="mb-6">
            <CardHeader className="flex justify-between">
              <h2 className="text-lg font-semibold">New Journal Submission</h2>
              <Button 
                variant="light" 
                color="danger" 
                size="sm"
                onClick={() => setShowNewSubmission(false)}
              >
                Cancel
              </Button>
            </CardHeader>
            <Divider />
            <CardBody className="space-y-4">
              <div className="flex flex-col gap-2">
                <Dropdown>
                  <DropdownTrigger>
                    <Button 
                      variant="bordered" 
                      endContent={<ChevronDownIcon className="h-4 w-4" />}
                      className="w-full justify-between"
                    >
                      {newSubmission.selectedJournal}
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu 
                    aria-label="Journal Selection"
                    onAction={(key) => setNewSubmission({
                      ...newSubmission, 
                      selectedJournal: key.toString()
                    })}
                  >
                    {journalOptions.map((journal) => (
                      <DropdownItem key={journal}>{journal}</DropdownItem>
                    ))}
                  </DropdownMenu>
                </Dropdown>
                
                {newSubmission.selectedJournal === 'Select Journal' && (
                  <Input
                    label="Journal Name"
                    placeholder="Enter journal name if not in the list"
                    name="journalName"
                    value={newSubmission.journalName}
                    onChange={handleInputChange}
                  />
                )}
              </div>
              
              <Input
                label="Paper Title"
                placeholder="Enter the title of your paper"
                name="paperTitle"
                value={newSubmission.paperTitle}
                onChange={handleInputChange}
                isRequired
              />
              
              <Textarea
                label="Abstract"
                placeholder="Enter your paper abstract"
                name="abstract"
                value={newSubmission.abstract}
                onChange={handleInputChange}
                minRows={3}
                isRequired
              />
              
              <Input
                label="Keywords"
                placeholder="Enter keywords separated by commas"
                name="keywords"
                value={newSubmission.keywords}
                onChange={handleInputChange}
              />
              
              <div className="border border-dashed border-default-300 rounded-lg p-6 text-center">
                <CloudArrowUpIcon className="w-10 h-10 mx-auto text-default-400 mb-2" />
                <p className="text-default-600 mb-2">Drag &amp; drop your paper file here</p>
                <p className="text-xs text-default-400 mb-4">Supported formats: PDF, DOCX (max 20MB)</p>
                <Button color="primary" variant="flat">
                  Browse Files
                </Button>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  variant="flat" 
                  onClick={() => setShowNewSubmission(false)}
                >
                  Cancel
                </Button>
                <Button 
                  color="primary" 
                  onClick={handleUpload}
                  isLoading={isUploading}
                  spinner={<Spinner size="sm" />}
                  isDisabled={!newSubmission.paperTitle}
                >
                  {isUploading ? "Uploading..." : "Submit Paper"}
                </Button>
              </div>
            </CardBody>
          </Card>
        ) : (
          <>
            {submissions.length === 0 ? (
              <Card>
                <CardBody className="text-center py-12">
                  <ClipboardDocumentListIcon className="w-12 h-12 mx-auto text-default-300 mb-4" />
                  <p className="text-default-600 mb-4">You haven&apos;t submitted any papers yet</p>
                  <Button 
                    color="primary" 
                    onClick={() => setShowNewSubmission(true)}
                  >
                    Submit Your First Paper
                  </Button>
                </CardBody>
              </Card>
            ) : (
              <div className="space-y-4">
                {submissions.map(submission => (
                  <Card key={submission.id} className="hover:shadow-md transition-shadow">
                    <CardBody className="p-5">
                      <div className="flex flex-col md:flex-row justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-default-600">{submission.id}</span>
                            <Chip color={getStatusColor(submission.status)} size="sm">
                              {submission.status}
                            </Chip>
                          </div>
                          <h3 className="text-lg font-semibold mb-1">{submission.paperTitle}</h3>
                          <p className="text-sm text-default-500 mb-2">{submission.journalName}</p>
                          <p className="text-xs text-default-400">Submitted on: {submission.submissionDate}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" color="primary" variant="flat">
                            View Details
                          </Button>
                          <Button size="sm" color="secondary" variant="flat">
                            Track Status
                          </Button>
                        </div>
                      </div>
                      
                      {submission.feedback && (
                        <div className="mt-4 p-3 bg-default-50 rounded-lg">
                          <p className="text-sm font-medium mb-1">Feedback:</p>
                          <p className="text-sm text-default-700">{submission.feedback}</p>
                        </div>
                      )}
                    </CardBody>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default withClientAuth(JournalSubmissionsPage);
