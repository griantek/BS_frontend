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
  Input,
  Textarea,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure
} from "@nextui-org/react";
import { withClientAuth } from '@/components/withClientAuth';
import { Sidebar } from '@/components/sidebar';
import { 
  DocumentTextIcon, 
  ArrowLeftIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  ClockIcon,
  PaperClipIcon,
  XMarkIcon,
  ArrowUpOnSquareIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import api, { Registration } from '@/services/api';

// Interface for the quotation data (based on Registration)
interface Quotation extends Registration {
  // We'll use the Registration interface directly
}

interface PaymentFormData {
  name: string;
  amount: number;
  files: File[];
  notes?: string;
}

const QuotationDetailPage = ({ params }: { params: { id: string } }) => {
  const router = useRouter();
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<PaymentFormData>({
    name: '',
    amount: 0,
    files: [],
    notes: ''
  });
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    const fetchQuotationData = async () => {
      setIsLoading(true);
      try {
        // Get the registration by ID
        const response = await api.getRegistrationById(parseInt(params.id));
        setQuotation(response.data as Quotation);
        
        // Pre-fill the payment amount from the quotation
        if (response.data) {
          setFormData(prev => ({
            ...prev,
            amount: response.data.total_amount
          }));
        }
      } catch (error) {
        console.error('Error fetching quotation data:', error);
        toast.error('Failed to load quotation details');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchQuotationData();
  }, [params.id]);

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
      case 'waiting for approval': return 'primary';
      default: return 'default';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      // Convert FileList to array and append to existing files
      const newFiles = Array.from(e.target.files);
      setFormData(prev => ({
        ...prev,
        files: [...prev.files, ...newFiles]
      }));
    }
  };

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }));
  };

  const handleSubmitPayment = async () => {
    if (!quotation) return;
    
    // Validate form
    if (!formData.name.trim()) {
      toast.error('Please enter your name');
      return;
    }
    
    if (formData.amount <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    setIsSubmitting(true);
    try {
      // Get user data for entity_id
      const user = api.getStoredUser();
      if (!user?.id) {
        toast.error('User data not found');
        return;
      }

      // Prepare form data for API
      const formDataToSend = new FormData();
      formDataToSend.append('quotation_id', quotation.id.toString());
      formDataToSend.append('name', formData.name);
      formDataToSend.append('amount', formData.amount.toString());
      formDataToSend.append('notes', formData.notes || '');
      formDataToSend.append('transaction_date', new Date().toISOString().split('T')[0]);
      formDataToSend.append('entity_id', user.id);
      
      // Append all files
      formData.files.forEach((file, index) => {
        formDataToSend.append(`files`, file);
      });

      // Send request to new API endpoint
      const response = await api.submitClientPayment(formDataToSend);
      
      if (response.success) {
        toast.success('Payment information submitted successfully');
        onOpen(); // Show success modal
      } else {
        toast.error('Failed to submit payment information');
      }
    } catch (error) {
      console.error('Error submitting payment:', error);
      toast.error('An error occurred while submitting your payment information');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="flex-1 p-6 ml-16 md:ml-64 flex justify-center items-center h-screen">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="flex-1 p-6 ml-16 md:ml-64">
          <Card>
            <CardBody className="text-center py-12">
              <DocumentTextIcon className="w-12 h-12 mx-auto text-default-300 mb-4" />
              <p className="text-default-600 mb-2">Quotation not found</p>
              <Button 
                variant="light" 
                startContent={<ArrowLeftIcon className="h-4 w-4" />}
                onClick={() => router.push('/business/clients/journals/quotations')}
              >
                Back to Quotations
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  // Determine if quotation is already paid or in processing
  const isPaid = quotation.status === 'registered';
  const isProcessing = quotation.status === 'waiting for approval';
  const canPay = quotation.status === 'pending';

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-6 ml-16 md:ml-64">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Quotation #{quotation.id}</h1>
            <p className="text-default-500">Review and make payment</p>
          </div>
          <Button
            variant="light"
            startContent={<ArrowLeftIcon className="h-4 w-4" />}
            onClick={() => router.push('/business/clients/journals/quotations')}
          >
            Back to Quotations
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Quotation Details Section */}
          <div className="md:col-span-2">
            <Card className="mb-6">
              <CardHeader className="flex justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Quotation Details</h2>
                  <p className="text-default-500 text-sm">Service: {quotation.services}</p>
                </div>
                <Chip color={getStatusColor(quotation.status)} size="sm">
                  {quotation.status === 'waiting for approval' 
                    ? 'Processing Payment'
                    : quotation.status.charAt(0).toUpperCase() + quotation.status.slice(1)}
                </Chip>
              </CardHeader>
              <Divider />
              <CardBody className="space-y-6">
                <div className="flex flex-wrap justify-between gap-4">
                  <div>
                    <p className="text-default-500 text-sm">Issued on</p>
                    <p className="font-medium">{formatDate(quotation.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-default-500 text-sm">Valid until</p>
                    <p className="font-medium">{formatDate(quotation.date)}</p>
                  </div>
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
                          <td className="p-3">{quotation.services}</td>
                          <td className="p-3 text-right">₹{quotation.init_amount.toFixed(2)}</td>
                        </tr>
                        {quotation.accept_amount > 0 && (
                          <tr className="border-t border-default-100">
                            <td className="p-3">Additional Services</td>
                            <td className="p-3 text-right">₹{quotation.accept_amount.toFixed(2)}</td>
                          </tr>
                        )}
                        {quotation.discount > 0 && (
                          <tr className="border-t border-default-100">
                            <td className="p-3 text-danger">Discount</td>
                            <td className="p-3 text-right text-danger">-₹{quotation.discount.toFixed(2)}</td>
                          </tr>
                        )}
                        <tr className="border-t border-default-200 bg-default-50">
                          <td className="p-3 font-semibold">Total</td>
                          <td className="p-3 text-right font-semibold">₹{quotation.total_amount.toFixed(2)}</td>
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
                      <p className="font-medium">{quotation.accept_period}</p>
                    </div>
                    <div className="bg-default-50 p-3 rounded-lg">
                      <p className="text-sm text-default-500">Publication Period</p>
                      <p className="font-medium">{quotation.pub_period}</p>
                    </div>
                  </div>
                </div>
                
                <Button 
                  startContent={<CurrencyDollarIcon className="h-4 w-4" />}
                  variant="flat"
                >
                  Download PDF
                </Button>
              </CardBody>
            </Card>
          </div>

          {/* Payment Form Section */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">
                  {isPaid ? 'Payment Complete' : 
                   isProcessing ? 'Payment Processing' : 
                   'Make Payment'}
                </h2>
              </CardHeader>
              <Divider />
              <CardBody>
                {isPaid ? (
                  <div className="text-center py-6">
                    <CheckCircleIcon className="h-12 w-12 mx-auto text-success mb-4" />
                    <p className="text-success-600 font-medium mb-2">Payment Complete</p>
                    <p className="text-sm text-default-500 mb-4">This quotation has been paid and registered.</p>
                  </div>
                ) : isProcessing ? (
                  <div className="text-center py-6">
                    <ClockIcon className="h-12 w-12 mx-auto text-primary mb-4" />
                    <p className="text-primary-600 font-medium mb-2">Payment Being Processed</p>
                    <p className="text-sm text-default-500 mb-4">Your payment information is being verified.</p>
                  </div>
                ) : (
                  <div className="space-y-4 py-2">
                    <div className="bg-default-50 p-3 rounded-lg mb-4">
                      <p className="text-sm font-medium mb-1">Amount Due</p>
                      <p className="text-2xl font-bold">₹{quotation.total_amount.toFixed(2)}</p>
                    </div>
                    
                    <Input
                      name="name"
                      label="Your Name"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={handleInputChange}
                      isRequired
                    />
                    
                    <Input
                      name="amount"
                      type="number"
                      label="Payment Amount (₹)"
                      placeholder="Enter payment amount"
                      value={formData.amount.toString()}
                      onChange={handleInputChange}
                      startContent={
                        <div className="pointer-events-none flex items-center">
                          <span className="text-default-400 text-small">₹</span>
                        </div>
                      }
                      isRequired
                    />
                    
                    <Textarea
                      name="notes"
                      label="Payment Notes (Optional)"
                      placeholder="Add any notes about your payment"
                      value={formData.notes}
                      onChange={handleInputChange}
                    />
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-default-700" htmlFor="file-upload">
                        Upload Receipt(s)
                      </label>
                      <div className="border-2 border-dashed border-default-200 rounded-lg p-4 text-center">
                        <input
                          type="file"
                          id="file-upload"
                          multiple
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <label 
                          htmlFor="file-upload" 
                          className="cursor-pointer flex flex-col items-center justify-center"
                        >
                          <ArrowUpOnSquareIcon className="h-8 w-8 text-default-300 mb-2" />
                          <p className="text-sm text-default-600">
                            Drag files here or click to upload
                          </p>
                          <p className="text-xs text-default-400 mt-1">
                            Supports: PDF, JPG, PNG (Max 10MB each)
                          </p>
                        </label>
                      </div>
                      
                      {/* Display selected files */}
                      {formData.files.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium mb-2">
                            {formData.files.length} file(s) selected
                          </p>
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {formData.files.map((file, index) => (
                              <div 
                                key={index} 
                                className="flex items-center justify-between bg-default-50 p-2 rounded-md"
                              >
                                <div className="flex items-center space-x-2 truncate">
                                  <PaperClipIcon className="h-4 w-4 text-default-500" />
                                  <span className="text-sm truncate">{file.name}</span>
                                </div>
                                <Button 
                                  isIconOnly 
                                  size="sm" 
                                  variant="light" 
                                  onPress={() => removeFile(index)}
                                >
                                  <XMarkIcon className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <Button 
                      color="primary" 
                      className="w-full mt-4"
                      onClick={handleSubmitPayment}
                      isLoading={isSubmitting}
                      spinner={<Spinner size="sm" />}
                    >
                      {isSubmitting ? "Processing..." : "Submit Payment"}
                    </Button>
                    
                    <p className="text-xs text-default-400 text-center mt-2">
                      Your payment will be verified by our team.
                    </p>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </div>

        {/* Success Modal */}
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalContent>
            <ModalHeader>Payment Submitted Successfully</ModalHeader>
            <ModalBody>
              <div className="text-center py-4">
                <CheckCircleIcon className="h-12 w-12 mx-auto text-success mb-4" />
                <p className="text-lg font-medium mb-2">Thank You!</p>
                <p className="text-default-600 mb-4">
                  Your payment information has been submitted successfully and is now awaiting verification.
                </p>
                <p className="text-sm text-default-500">
                  You will be notified once your payment is confirmed.
                </p>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button 
                color="primary" 
                onPress={() => {
                  onClose();
                  router.push('/business/clients/journals/quotations');
                }}
              >
                Return to Quotations
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    </div>
  );
};

export default withClientAuth(QuotationDetailPage);
