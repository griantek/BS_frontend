'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Card, 
  CardBody, 
  CardHeader, 
  Divider, 
  Button, 
  Spinner, 
  Chip, 
  Tabs, 
  Tab,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Link
} from "@nextui-org/react";
import { withClientAuth } from '@/components/withClientAuth';
import { Sidebar } from '@/components/sidebar';
import { 
  DocumentTextIcon, 
  ArrowLeftIcon,
  BeakerIcon,
  ClipboardDocumentListIcon,
  DocumentIcon,
  ArrowDownTrayIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';
import api, { CombinedRegistrationData } from '@/services/api';
import RegistrationTimeline from '@/components/RegistrationTimeline';

const RegistrationDetailsPage = ({ params }: { params: { id: string } | Promise<{ id: string }> }) => {
  const router = useRouter();
  const [registrationData, setRegistrationData] = useState<CombinedRegistrationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("details");
  
  // Extract the ID in a way that works with both Promise and direct object
  const id = typeof params === 'object' && 'id' in params 
    ? params.id 
    : params instanceof Promise 
      ? undefined // We'll handle this in useEffect
      : '';

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // If id is undefined, resolve it from the Promise
        let registrationId: string;
        if (id === undefined && params instanceof Promise) {
          const resolvedParams = await params;
          registrationId = resolvedParams.id;
        } else {
          registrationId = id as string;
        }
        
        console.log("Fetching data for registration ID:", registrationId);
        const numericId = parseInt(registrationId);
        if (isNaN(numericId)) {
          throw new Error('Invalid registration ID');
        }

        const response = await api.getCombinedData(numericId);
        console.log("API response:", response);
        if (response.success) {
          setRegistrationData(response.data);
        } else {
          throw new Error('Failed to fetch registration data');
        }
      } catch (err: any) {
        console.error('Error fetching registration data:', err);
        setError(err.message || 'An error occurred while fetching data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [params, id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch(status.toLowerCase()) {
      case 'registered':
      case 'completed':
        return 'success';
      case 'in progress':
        return 'primary';
      case 'pending':
      case 'waiting for approval':
      case 'quotation accepted':
        return 'warning';
      case 'rejected':
        return 'danger';
      default:
        return 'default';
    }
  };

  const getAuthorStatusColor = (status: string) => {
    switch(status.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'in progress':
        return 'primary';
      case 'not started':
        return 'default';
      default:
        return 'warning';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !registrationData) {
    return (
      <div className="flex ml-10">
        <Sidebar />
        <div className="flex-1 p-6 pl-[var(--sidebar-width,4rem)] transition-all duration-300">
          <Card className="shadow-sm">
            <CardBody className="text-center py-8">
              <DocumentTextIcon className="w-12 h-12 mx-auto text-danger-300 mb-4" />
              <p className="text-default-600 mb-2">Error Loading Registration Details</p>
              <p className="text-default-500 text-sm mb-4">{error || 'Unable to load data'}</p>
              <Button
                color="primary"
                onClick={() => router.push('/business/clients/journals')}
                startContent={<ArrowLeftIcon className="h-4 w-4" />}
              >
                Back to Journals
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  const { registration, quotations, journalData, transaction } = registrationData;

  return (
    <div className="flex ml-10">
      <Sidebar />
      <div className="flex-1 p-6 pl-[var(--sidebar-width,4rem)] transition-all duration-300">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Registration Details</h1>
            <p className="text-default-500">
              View detailed information about your journal registration
            </p>
          </div>
          <Button
            variant="light"
            startContent={<ArrowLeftIcon className="h-4 w-4" />}
            onClick={() => router.push('/business/clients/journals')}
          >
            Back to Journals
          </Button>
        </div>

        <Card className="shadow-sm mb-6">
          <CardHeader className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold">Registration #{registration.id}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Chip color={getStatusColor(registration.status)} size="sm">
                  {registration.status.charAt(0).toUpperCase() + registration.status.slice(1)}
                </Chip>
                <span className="text-xs text-default-500">{registration.prospectus.reg_id}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Chip variant="flat" size="sm">
                Research Requirement
              </Chip>
            </div>
          </CardHeader>
          <Divider />

          <div className="px-4 py-4 bg-default-50">
            <RegistrationTimeline 
              currentStatus={registration.status}
              className="max-w-3xl mx-auto"
            />
          </div>

          <CardBody>
            <Tabs 
              aria-label="Registration Details" 
              selectedKey={activeTab}
              onSelectionChange={(key) => setActiveTab(key as string)}
              className="mb-4"
              variant="underlined"
            >
              <Tab 
                key="details" 
                title={
                  <div className="flex items-center gap-2">
                    <DocumentTextIcon className="h-4 w-4" />
                    <span>Registration Details</span>
                  </div>
                }
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-2">
                  <Card className="shadow-none border">
                    <CardHeader className="pb-0 pt-4">
                      <h3 className="text-md font-medium flex items-center">
                        <ClipboardDocumentListIcon className="h-5 w-5 mr-2 text-default-500" />
                        Service Details
                      </h3>
                    </CardHeader>
                    <CardBody>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-default-500">Services:</p>
                          <p className="font-medium">{registration.services}</p>
                        </div>
                        <div>
                          <p className="text-sm text-default-500">Research Requirement:</p>
                          <p className="font-medium">{registration.prospectus.requirement}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-default-500">Writing Period:</p>
                            <p className="font-medium">{registration.accept_period}</p>
                          </div>
                          <div>
                            <p className="text-sm text-default-500">Publication Period:</p>
                            <p className="font-medium">{registration.pub_period}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-default-500">Research Area:</p>
                          <p className="font-medium">{registration.prospectus.department}</p>
                        </div>
                        <div>
                          <p className="text-sm text-default-500">Progress Status:</p>
                          <Chip color={getAuthorStatusColor(registration.author_status)} size="sm">
                            {registration.author_status.charAt(0).toUpperCase() + registration.author_status.slice(1)}
                          </Chip>
                        </div>
                      </div>
                    </CardBody>
                  </Card>

                  <Card className="shadow-none border">
                    <CardHeader className="pb-0 pt-4">
                      <h3 className="text-md font-medium flex items-center">
                        <BeakerIcon className="h-5 w-5 mr-2 text-default-500" />
                        Service Pricing
                      </h3>
                    </CardHeader>
                    <CardBody>
                      {registration.service_and_prices ? (
                        <Table aria-label="Service pricing" removeWrapper className="mb-3">
                          <TableHeader>
                            <TableColumn>SERVICE</TableColumn>
                            <TableColumn className="text-right">PRICE (₹)</TableColumn>
                          </TableHeader>
                          <TableBody>
                            {Object.entries(registration.service_and_prices).map(([service, price], index) => (
                              <TableRow key={index}>
                                <TableCell>{service}</TableCell>
                                <TableCell className="text-right">₹{price.toFixed(2)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-default-500 text-sm">Service pricing details not available</p>
                      )}

                      <Divider className="my-3" />
                      
                      <div className="space-y-2 mt-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-default-500">Initial Amount:</span>
                          <span className="font-medium">₹{registration.init_amount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-default-500">After Write-up:</span>
                          <span className="font-medium">₹{registration.accept_amount.toFixed(2)}</span>
                        </div>
                        {registration.discount > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-success">Discount:</span>
                            <span className="font-medium text-success">-₹{registration.discount.toFixed(2)}</span>
                          </div>
                        )}
                        <Divider className="my-2" />
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Total Amount:</span>
                          <span className="font-bold">₹{registration.total_amount.toFixed(2)}</span>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </div>

                <div className="mt-6">
                  <Card className="shadow-none border">
                    <CardHeader className="pb-0 pt-4">
                      <h3 className="text-md font-medium flex items-center">
                        <DocumentIcon className="h-5 w-5 mr-2 text-default-500" />
                        Registration Information
                      </h3>
                    </CardHeader>
                    <CardBody>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-default-500">Registration Date:</p>
                          <p className="font-medium">{formatDate(registration.created_at)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-default-500">Registration ID:</p>
                          <p className="font-medium">{registration.prospectus.reg_id}</p>
                        </div>
                        <div>
                          <p className="text-sm text-default-500">Status:</p>
                          <Chip color={getStatusColor(registration.status)} size="sm">
                            {registration.status.charAt(0).toUpperCase() + registration.status.slice(1)}
                          </Chip>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </div>
              </Tab>

              <Tab 
                key="quotations" 
                title={
                  <div className="flex items-center gap-2">
                    <ArrowDownTrayIcon className="h-4 w-4" />
                    <span>Payment Details</span>
                  </div>
                }
              >
                {transaction && transaction.length > 0 ? (
                  <div className="space-y-4">
                    {transaction.map((tx, index) => (
                      <Card key={index} className="shadow-sm">
                        <CardHeader className="pb-2">
                          <h3 className="text-md font-medium">Transaction #{tx.id}</h3>
                        </CardHeader>
                        <CardBody>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                              <div>
                                <p className="text-sm text-default-500">Amount:</p>
                                <p className="font-medium text-success">₹{tx.amount.toFixed(2)}</p>
                              </div>
                              <div>
                                <p className="text-sm text-default-500">Transaction Date:</p>
                                <p className="font-medium">{formatDate(tx.transaction_date)}</p>
                              </div>
                              <div>
                                <p className="text-sm text-default-500">Transaction Type:</p>
                                <p className="font-medium">{tx.transaction_type}</p>
                              </div>
                              <div>
                                <p className="text-sm text-default-500">Transaction ID:</p>
                                <p className="font-medium">{tx.transaction_id}</p>
                              </div>
                            </div>
                            
                            <div className="space-y-3">
                              {tx.entity_id && (
                                <div>
                                  <p className="text-sm text-default-500">Processed By:</p>
                                  <p className="font-medium">
                                    {tx.entities?.username || 'System'}
                                  </p>
                                </div>
                              )}
                              
                              {tx.additional_info && Object.keys(tx.additional_info).length > 0 && (
                                <div>
                                  <p className="text-sm text-default-500 mb-1">Additional Information:</p>
                                  <div className="bg-default-50 p-3 rounded-md text-sm">
                                    {Object.entries(tx.additional_info).map(([key, value], i) => (
                                      <div key={i} className="mb-1">
                                        <span className="font-medium">{key}:</span> {value}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                ) : quotations.length > 0 && registration.status === "registered" ? (
                  <div className="space-y-4">
                    {quotations.map((quotation, index) => (
                      <Card key={index} className="shadow-sm">
                        <CardHeader className="pb-2">
                          <h3 className="text-md font-medium">Payment #{quotation.id}</h3>
                        </CardHeader>
                        <CardBody>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                              <div>
                                <p className="text-sm text-default-500">Amount Paid:</p>
                                <p className="font-medium text-success">₹{quotation.amount.toFixed(2)}</p>
                              </div>
                              <div>
                                <p className="text-sm text-default-500">Payment Date:</p>
                                <p className="font-medium">{formatDate(quotation.transaction_date)}</p>
                              </div>
                              {quotation.notes && (
                                <div>
                                  <p className="text-sm text-default-500">Payment Notes:</p>
                                  <p className="font-medium">{quotation.notes}</p>
                                </div>
                              )}
                            </div>
                            
                            <div>
                              <p className="text-sm text-default-500 mb-2">Payment Receipt:</p>
                              {quotation.files && quotation.files.length > 0 ? (
                                <div className="space-y-2">
                                  {quotation.files.map((file, fileIndex) => (
                                    <div key={fileIndex} className="flex items-center gap-2">
                                      <Link 
                                        href={file.url} 
                                        target="_blank" 
                                        className="text-sm text-primary hover:underline flex items-center"
                                      >
                                        <DocumentIcon className="h-4 w-4 mr-1" />
                                        {file.originalName}
                                      </Link>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-default-500 text-sm">No receipt files available</p>
                              )}
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="shadow-sm">
                    <CardBody className="text-center py-8">
                      <DocumentTextIcon className="w-12 h-12 mx-auto text-default-300 mb-4" />
                      <p className="text-default-600 mb-2">No payment records found</p>
                      <p className="text-default-500 text-sm">Payment details will appear here after successful payment</p>
                    </CardBody>
                  </Card>
                )}
              </Tab>

              <Tab 
                key="journal" 
                title={
                  <div className="flex items-center gap-2">
                    <BookOpenIcon className="h-4 w-4" />
                    <span>Journal Data</span>
                  </div>
                }
                isDisabled={journalData.length === 0}
              >
                {journalData.length > 0 ? (
                  <div className="space-y-4">
                    {journalData.map((journal, index) => (
                      <Card key={index} className="shadow-sm">
                        <CardHeader className="pb-2">
                          <div>
                            <h3 className="text-md font-medium">{journal.journal_name}</h3>
                            <Chip color={getStatusColor(journal.status)} size="sm" className="mt-1">
                              {journal.status.charAt(0).toUpperCase() + journal.status.slice(1)}
                            </Chip>
                          </div>
                        </CardHeader>
                        <CardBody>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                              <div>
                                <p className="text-sm text-default-500">Paper Title:</p>
                                <p className="font-medium">{journal.paper_title}</p>
                              </div>
                              <div>
                                <p className="text-sm text-default-500">Journal Status:</p>
                                <Chip color={getStatusColor(journal.status)} size="sm">
                                  {journal.status.charAt(0).toUpperCase() + journal.status.slice(1)}
                                </Chip>
                              </div>
                              <div>
                                <p className="text-sm text-default-500">Submission Date:</p>
                                <p className="font-medium">{formatDate(journal.created_at)}</p>
                              </div>
                            </div>
                            
                            <div className="space-y-3">
                              <div>
                                <p className="text-sm text-default-500">Journal Link:</p>
                                {journal.journal_link ? (
                                  <Link 
                                    href={journal.journal_link} 
                                    target="_blank" 
                                    className="text-sm text-primary hover:underline"
                                  >
                                    {journal.journal_link}
                                  </Link>
                                ) : (
                                  <p className="text-default-500 text-sm">Not available</p>
                                )}
                              </div>
                              
                              {journal.status_link && (
                                <div>
                                  <p className="text-sm text-default-500">Status Link:</p>
                                  <Link 
                                    href={journal.status_link} 
                                    target="_blank" 
                                    className="text-sm text-primary hover:underline"
                                  >
                                    Check submission status
                                  </Link>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="shadow-sm">
                    <CardBody className="text-center py-8">
                      <BookOpenIcon className="w-12 h-12 mx-auto text-default-300 mb-4" />
                      <p className="text-default-600 mb-2">No journal submissions yet</p>
                      <p className="text-default-500 text-sm">Journal details will appear here once the paper is submitted to a journal</p>
                    </CardBody>
                  </Card>
                )}
              </Tab>
            </Tabs>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default withClientAuth(RegistrationDetailsPage);
