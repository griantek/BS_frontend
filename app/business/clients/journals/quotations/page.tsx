'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody, CardHeader, Divider, Button, Spinner, Chip } from "@nextui-org/react";
import { withClientAuth } from '@/components/withClientAuth';
import { Sidebar } from '@/components/sidebar';
import { 
  DocumentTextIcon, 
  ArrowLeftIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import api, { Registration } from '@/services/api';

// Interface for the quotation data (based on Registration)
interface Quotation extends Registration {
  // We'll use the Registration interface directly
}

const QuotationsPage = () => {
  const router = useRouter();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  useEffect(() => {
    const fetchRegistrationData = async () => {
      setIsLoading(true);
      try {
        // Get the client data from localStorage
        const userStr = localStorage.getItem('user');
        if (!userStr) {
          console.error('No user data found');
          setIsLoading(false);
          return;
        }
        
        const user = JSON.parse(userStr);
        const clientId = user.id;
        
        if (!clientId) {
          console.error('No client ID found in user data');
          setIsLoading(false);
          return;
        }
        
        const response = await api.getClientPendingRegistration(clientId);
        setQuotations(response.data);
      } catch (error) {
        console.error('Error fetching registration data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRegistrationData();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'pending': return 'warning';
      case 'registered': return 'success';
      default: return 'default';
    }
  };

  const handleAccept = (id: number) => {
    setLoadingId(id);
    
    // Simulate API call - in a real implementation, this would call an API endpoint
    setTimeout(() => {
      setQuotations(quotations.map(q => 
        q.id === id ? {...q, status: 'registered' as 'registered'} : q
      ));
      setSelectedQuotation(null);
      setLoadingId(null);
    }, 1500);
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-6 ml-16 md:ml-64">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Quotations</h1>
            <p className="text-default-500">View and manage quotations for your journal submissions</p>
          </div>
          <Button
            variant="light"
            startContent={<ArrowLeftIcon className="h-4 w-4" />}
            onClick={() => router.push('/business/clients/journals')}
          >
            Back to Journals
          </Button>
        </div>

        {selectedQuotation ? (
          <Card className="mb-6">
            <CardHeader className="flex justify-between">
              <div>
                <h2 className="text-lg font-semibold">Quotation #{selectedQuotation.id}</h2>
                <p className="text-default-500 text-sm">Service: {selectedQuotation.services}</p>
              </div>
              <Button 
                color="primary"
                variant="flat" 
                size="md"
                onClick={() => setSelectedQuotation(null)}
                startContent={<ArrowLeftIcon className="h-4 w-4" />}
              >
                Back to List
              </Button>
            </CardHeader>
            <Divider />
            <CardBody className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div>
                  <p className="text-default-500 text-sm">Issued on</p>
                  <p className="font-medium">{formatDate(selectedQuotation.created_at)}</p>
                </div>
                <div>
                  <p className="text-default-500 text-sm">Valid until</p>
                  <p className="font-medium">{formatDate(selectedQuotation.date)}</p>
                </div>
                <div>
                  <p className="text-default-500 text-sm">Status</p>
                  <Chip color={getStatusColor(selectedQuotation.status)} size="sm">
                    {selectedQuotation.status.charAt(0).toUpperCase() + selectedQuotation.status.slice(1)}
                  </Chip>
                </div>
              </div>
              
              <div>
                <p className="text-default-700 mb-2">
                  {selectedQuotation.services} for {selectedQuotation.accept_period}
                </p>
              </div>
              
              <div>
                <h3 className="text-md font-semibold mb-2">Services & Pricing</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-default-50">
                      <tr>
                        <th className="text-left p-3 font-medium text-default-700">Service</th>
                        <th className="text-right p-3 font-medium text-default-700">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t border-default-100">
                        <td className="p-3">{selectedQuotation.services}</td>
                        <td className="p-3 text-right">${selectedQuotation.init_amount.toFixed(2)}</td>
                      </tr>
                      {selectedQuotation.accept_amount > 0 && (
                        <tr className="border-t border-default-100">
                          <td className="p-3">Additional Services</td>
                          <td className="p-3 text-right">${selectedQuotation.accept_amount.toFixed(2)}</td>
                        </tr>
                      )}
                      {selectedQuotation.discount > 0 && (
                        <tr className="border-t border-default-100">
                          <td className="p-3 text-danger">Discount</td>
                          <td className="p-3 text-right text-danger">-${selectedQuotation.discount.toFixed(2)}</td>
                        </tr>
                      )}
                      <tr className="border-t border-default-200 bg-default-50">
                        <td className="p-3 font-semibold">Total</td>
                        <td className="p-3 text-right font-semibold">${selectedQuotation.total_amount.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div>
                <h3 className="text-md font-semibold mb-2">Service Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-default-50 p-3 rounded-lg">
                    <p className="text-sm text-default-500">Service Period</p>
                    <p className="font-medium">{selectedQuotation.accept_period}</p>
                  </div>
                  <div className="bg-default-50 p-3 rounded-lg">
                    <p className="text-sm text-default-500">Publication Period</p>
                    <p className="font-medium">{selectedQuotation.pub_period}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4">
                <Button 
                  startContent={<CurrencyDollarIcon className="h-4 w-4" />}
                  variant="flat"
                >
                  Download PDF
                </Button>
                
                {selectedQuotation.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button 
                      color="success" 
                      onClick={() => handleAccept(selectedQuotation.id)}
                      isLoading={loadingId === selectedQuotation.id}
                      spinner={<Spinner size="sm" />}
                      startContent={loadingId !== selectedQuotation.id && <CheckCircleIcon className="h-4 w-4" />}
                    >
                      {loadingId === selectedQuotation.id ? "Processing..." : "Accept & Pay"}
                    </Button>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        ) : (
          <>
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Spinner size="lg" />
              </div>
            ) : quotations.length === 0 ? (
              <Card>
                <CardBody className="text-center py-12">
                  <DocumentTextIcon className="w-12 h-12 mx-auto text-default-300 mb-4" />
                  <p className="text-default-600 mb-2">No quotations available</p>
                  <p className="text-default-500 text-sm mb-4">Quotations will appear here when provided by your executive</p>
                </CardBody>
              </Card>
            ) : (
              <div className="space-y-4">
                {quotations.map(quotation => (
                  <Card 
                    key={quotation.id} 
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    isPressable
                    onPress={() => setSelectedQuotation(quotation)}
                  >
                    <CardBody className="p-5">
                      <div className="flex flex-col md:flex-row justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-default-600">Quotation #{quotation.id}</span>
                            <Chip color={getStatusColor(quotation.status)} size="sm">
                              {quotation.status.charAt(0).toUpperCase() + quotation.status.slice(1)}
                            </Chip>
                          </div>
                          <h3 className="text-lg font-semibold mb-1">{quotation.services}</h3>
                          <p className="text-sm text-default-500 line-clamp-1 mb-2">
                            Service period: {quotation.accept_period} | Publication period: {quotation.pub_period}
                          </p>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-default-400">
                            <span>Created: {formatDate(quotation.created_at)}</span>
                            <span>Valid until: {formatDate(quotation.date)}</span>
                          </div>
                        </div>
                        <div className="flex flex-col justify-center items-end gap-2">
                          <div className="text-xl font-bold text-default-800">${quotation.total_amount.toFixed(2)}</div>
                          <div className="flex items-center gap-2">
                            {quotation.status === 'pending' ? (
                              <div className="flex items-center text-xs text-warning">
                                <ClockIcon className="h-3 w-3 mr-1" />
                                Awaiting payment
                              </div>
                            ) : quotation.status === 'registered' ? (
                              <div className="flex items-center text-xs text-success">
                                <CheckCircleIcon className="h-3 w-3 mr-1" />
                                Payment complete
                              </div>
                            ) : (
                              <div className="flex items-center text-xs text-default-400">
                                Unknown status
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
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

export default withClientAuth(QuotationsPage);
