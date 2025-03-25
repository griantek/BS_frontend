'use client'
import React, { useState } from 'react';
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

// Mock quotation data
const mockQuotations = [
  {
    id: "Q-2023-001",
    title: "IEEE Transactions Submission",
    description: "Quotation for the submission of research paper to IEEE Transactions on Neural Networks and Learning Systems",
    amount: 450,
    currency: "USD",
    status: "Pending",
    created: "2023-11-10T10:00:00Z",
    expiry: "2023-12-10T23:59:59Z",
    services: [
      { name: "Editorial Review", price: 150 },
      { name: "Formatting", price: 100 },
      { name: "Journal Submission Fee", price: 200 }
    ]
  },
  {
    id: "Q-2023-002",
    title: "Nature Communications Submission",
    description: "Quotation for the submission of research paper to Nature Communications including premium editing",
    amount: 750,
    currency: "USD",
    status: "Paid",
    created: "2023-10-05T14:30:00Z",
    expiry: "2023-11-05T23:59:59Z",
    services: [
      { name: "Premium Editorial Review", price: 300 },
      { name: "Advanced Formatting", price: 150 },
      { name: "Journal Submission Fee", price: 300 }
    ]
  },
  {
    id: "Q-2023-003",
    title: "Science Advances Submission",
    description: "Quotation for preparation and submission to Science Advances",
    amount: 950,
    currency: "USD",
    status: "Expired",
    created: "2023-09-01T09:15:00Z",
    expiry: "2023-10-01T23:59:59Z",
    services: [
      { name: "Premium Editorial Review", price: 350 },
      { name: "Figure Preparation", price: 200 },
      { name: "Advanced Formatting", price: 150 },
      { name: "Journal Submission Fee", price: 250 }
    ]
  }
];

const QuotationsPage = () => {
  const router = useRouter();
  const [quotations, setQuotations] = useState(mockQuotations);
  const [selectedQuotation, setSelectedQuotation] = useState<typeof mockQuotations[0] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Pending': return 'warning';
      case 'Paid': return 'success';
      case 'Expired': return 'danger';
      default: return 'default';
    }
  };

  const handleAccept = (id: string) => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setQuotations(quotations.map(q => 
        q.id === id ? {...q, status: 'Paid'} : q
      ));
      setSelectedQuotation(null);
      setIsLoading(false);
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
                <h2 className="text-lg font-semibold">{selectedQuotation.title}</h2>
                <p className="text-default-500 text-sm">Quotation #{selectedQuotation.id}</p>
              </div>
              <Button 
                variant="light" 
                size="sm"
                onClick={() => setSelectedQuotation(null)}
              >
                Back to List
              </Button>
            </CardHeader>
            <Divider />
            <CardBody className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div>
                  <p className="text-default-500 text-sm">Issued on</p>
                  <p className="font-medium">{formatDate(selectedQuotation.created)}</p>
                </div>
                <div>
                  <p className="text-default-500 text-sm">Valid until</p>
                  <p className="font-medium">{formatDate(selectedQuotation.expiry)}</p>
                </div>
                <div>
                  <p className="text-default-500 text-sm">Status</p>
                  <Chip color={getStatusColor(selectedQuotation.status)} size="sm">
                    {selectedQuotation.status}
                  </Chip>
                </div>
              </div>
              
              <div>
                <p className="text-default-700 mb-2">{selectedQuotation.description}</p>
              </div>
              
              <div>
                <h3 className="text-md font-semibold mb-2">Services</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-default-50">
                      <tr>
                        <th className="text-left p-3 font-medium text-default-700">Service</th>
                        <th className="text-right p-3 font-medium text-default-700">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedQuotation.services.map((service, index) => (
                        <tr key={index} className="border-t border-default-100">
                          <td className="p-3">{service.name}</td>
                          <td className="p-3 text-right">${service.price.toFixed(2)}</td>
                        </tr>
                      ))}
                      <tr className="border-t border-default-200 bg-default-50">
                        <td className="p-3 font-semibold">Total</td>
                        <td className="p-3 text-right font-semibold">${selectedQuotation.amount.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4">
                <Button 
                  startContent={<CurrencyDollarIcon className="h-4 w-4" />}
                  variant="flat"
                >
                  Download PDF
                </Button>
                
                {selectedQuotation.status === 'Pending' && (
                  <div className="flex gap-2">
                    <Button 
                      color="success" 
                      onClick={() => handleAccept(selectedQuotation.id)}
                      isLoading={isLoading}
                      spinner={<Spinner size="sm" />}
                      startContent={!isLoading && <CheckCircleIcon className="h-4 w-4" />}
                    >
                      {isLoading ? "Processing..." : "Accept & Pay"}
                    </Button>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        ) : (
          <>
            {quotations.length === 0 ? (
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
                            <span className="text-sm font-medium text-default-600">{quotation.id}</span>
                            <Chip color={getStatusColor(quotation.status)} size="sm">
                              {quotation.status}
                            </Chip>
                          </div>
                          <h3 className="text-lg font-semibold mb-1">{quotation.title}</h3>
                          <p className="text-sm text-default-500 line-clamp-1 mb-2">{quotation.description}</p>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-default-400">
                            <span>Created: {formatDate(quotation.created)}</span>
                            <span>Expires: {formatDate(quotation.expiry)}</span>
                          </div>
                        </div>
                        <div className="flex flex-col justify-center items-end gap-2">
                          <div className="text-xl font-bold text-default-800">${quotation.amount.toFixed(2)}</div>
                          <div className="flex items-center gap-2">
                            {quotation.status === 'Pending' ? (
                              <div className="flex items-center text-xs text-warning">
                                <ClockIcon className="h-3 w-3 mr-1" />
                                Awaiting payment
                              </div>
                            ) : quotation.status === 'Paid' ? (
                              <div className="flex items-center text-xs text-success">
                                <CheckCircleIcon className="h-3 w-3 mr-1" />
                                Payment complete
                              </div>
                            ) : (
                              <div className="flex items-center text-xs text-danger">
                                Expired
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
