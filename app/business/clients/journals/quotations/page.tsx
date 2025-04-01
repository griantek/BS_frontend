'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody, CardHeader, Divider, Button, Spinner, Chip, Image } from "@nextui-org/react";
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
        console.log('Pending registration data:', response);
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
    // Navigate to the payment page instead of simulating API call
    router.push(`/business/clients/journals/quotations/${id}`);
  };

  return (
    <div className="flex ml-10">
      <Sidebar />
      <div className="flex-1 p-6 pl-[var(--sidebar-width,4rem)] transition-all duration-300">
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
          <Card className="mb-6 overflow-hidden">
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
            <CardBody className="p-0">
              <div className="p-6 ">
                {/* Professional Quotation Format */}
                <div className="max-w-4xl mx-auto bg-white shadow-sm border rounded-lg overflow-hidden print:shadow-none print:border-none">
                  {/* Header */}
                  <div className="bg-gray-800 text-white p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-center">
                    <div className="flex items-center mb-4 sm:mb-0">
                      <div className="mr-4">
                        <Image
                          src="/logo.png"
                          alt="G-Tek Logo"
                          width={80}
                          height={50}
                          className="object-contain"
                        />
                      </div>
                      <div>
                        <h1 className="text-xl sm:text-2xl font-bold">G-TEK INVOICE</h1>
                        <p className="text-xs sm:text-sm opacity-80">Research & Development Services</p>
                      </div>
                    </div>
                    <div className="text-right text-xs sm:text-sm">
                      <p>Date: {formatDate(selectedQuotation.created_at)}</p>
                      <p>Place: BENGALURU</p>
                      <p>Invoice #: INV-{selectedQuotation.id}</p>
                    </div>
                  </div>

                  {/* Introduction */}
                  <div className="p-4 sm:p-6 text-sm sm:text-base">
                    <p className="font-semibold text-gray-800">DEAR, {selectedQuotation.prospectus?.client_name || selectedQuotation.prospectus.client_name || 'Client'},</p>
                    <p className="mt-3 text-sm text-gray-700">
                      Greetings from G tek
                    </p>
                    <p className="mt-2 text-sm text-gray-700">
                      It's our immense pleasure to introduce ourselves. We, G-Tek Technology are a Research & Development venture. By the year 1998, our journey started with limited technical experts; but our strive work and dedication has made us reach an impressive success and tech giant for past 18 years in our field. We have expanded ourselves with 8 branches in pan India and with clients worldwide.
                    </p>
                  </div>

                  {/* Contact Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 sm:p-6 bg-gray-50 text-sm">
                    <div>
                      <h3 className="font-bold text-gray-700 uppercase mb-2 text-xs sm:text-sm">SERVICE PROVIDER</h3>
                      <p className="mb-1 text-gray-800">Company Name: Gtek Technology Pvt ltd</p>
                      <p className="mb-1 text-gray-800">Contact: +91 876 00 000 44</p>
                      <p className='text-gray-800'>Email: info@gtekphd.com</p>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-700 uppercase mb-2 text-xs sm:text-sm">CLIENT CONTACT DETAILS</h3>
                      <p className="mb-1 text-gray-800">NAME: {selectedQuotation.prospectus?.client_name || 'Client'}</p>
                      <p className="mb-1 text-gray-800">Phone: {selectedQuotation.prospectus?.phone || 'N/A'}</p>
                      <p className='text-gray-800'>EMail: {selectedQuotation.prospectus?.email || selectedQuotation.prospectus.email || 'N/A'}</p>
                    </div>
                  </div>

                  {/* PROFORMA INVOICE header */}
                  <div className="text-center p-4 ">
                    <h2 className="text-xl font-bold text-gray-800">PROFORMA INVOICE</h2>
                  </div>

                  {/* Services */}
                  <div className="p-4 sm:p-6">
                    {/* <h2 className="text-center font-bold text-lg mb-4 text-gray-800 uppercase">{selectedQuotation.services}</h2> */}
                    
                    <div className="p-4 rounded-lg mb-4">
                      {/* <div className="mb-2 pb-2 border-b">
                        <p className="font-semibold">Domain: {selectedQuotation.prospectus?.domain || selectedQuotation.domain || 'Research'}</p>
                      </div> */}
                      
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <h4 className="font-bold text-sm mb-2 uppercase text-gray-800">{selectedQuotation.services}</h4>
                          <div className="space-y-2">
                            <p className="text-sm text-gray-800">Amount: <span className="font-medium">₹{(selectedQuotation.init_amount + selectedQuotation.accept_amount).toFixed(2)}/-INR</span></p>
                            
                            <div className="pl-4 border-l-2 border-gray-200">
                              <p className="mb-1 text-sm text-gray-800">Initial Amount: <span className="font-medium">₹{selectedQuotation.init_amount.toFixed(2)}/-INR</span></p>
                              <p className="mb-1 text-sm text-gray-800">After Write-up: <span className="font-medium">₹{selectedQuotation.accept_amount.toFixed(2)}/-INR</span></p>
                              {selectedQuotation.discount > 0 && (
                                <p className="mb-1 text-sm text-green-600">Discount: <span className="font-medium">₹{selectedQuotation.discount.toFixed(2)}/-INR</span></p>
                              )}
                            </div>
                            
                            <p className="font-medium text-sm mt-2 text-gray-800">Total Amount: <span className="font-bold">₹{selectedQuotation.total_amount.toFixed(2)}/-INR</span></p>
                            <p className="mt-2 text-sm text-gray-800">DURATION - Writing: <span className="font-medium">{selectedQuotation.accept_period}</span></p>
                            <p className="mt-2 text-sm text-gray-800">DURATION - Publication: <span className="font-medium">{selectedQuotation.pub_period}</span></p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Services List */}
                    <div className="mb-6">
                      <h3 className="font-bold mb-2 text-sm text-gray-800">Our Services</h3>
                      <ul className="list-disc pl-5 text-xs sm:text-sm space-y-1 text-gray-700">
                        <li>PhD Admission Support</li>
                        <li>Research Proposal or Synopsis (PhD Research Assistance Guidance)</li>
                        <li>Problem Identification - Novel Concept Finalization</li>
                        <li>Research Methodology & Results Findings and Recommendations</li>
                        <li>Research Literature Review Writing</li>
                        <li>Implementation(coding)</li>
                        <li>Journal Publication</li>
                        <li>Research Dissertation & Thesis Writing</li>
                        <li>Dissertation Writing (UG or PG)</li>
                      </ul>
                      
                      <h3 className="font-bold mt-4 mb-2 text-sm text-gray-800">Other Services</h3>
                      <ul className="list-disc pl-5 text-xs sm:text-sm space-y-1 text-gray-700">
                        <li className='text-gray-800'>Anonymous Peer Review Process</li>
                        <li className='text-gray-800'>English Language Correction</li>
                        <li className='text-gray-800'>Technical Language Correction</li>
                        <li className='text-gray-800'>Formatting and Proofreading Services</li>
                        <li className='text-gray-800'>Scientific or Mathematical Formula Editing Services</li>
                      </ul>
                    </div>
                  </div>

                  {/* Payment Details */}
                  <div className="p-4 sm:p-6 bg-gray-50">
                    <h3 className="font-bold mb-3 uppercase text-sm text-gray-800">ACCOUNT DETAILS</h3>
                    <div className="text-xs sm:text-sm">
                      <p className="mb-1 text-gray-800">Account Number: {selectedQuotation.bank_accounts.account_number}</p>
                      <p className="mb-1 text-gray-800">Account name:{selectedQuotation.bank_accounts.account_name}</p>
                      <p className="mb-1 text-gray-800">Bank Name: {selectedQuotation.bank_accounts.bank},{selectedQuotation.bank_accounts.branch}</p>
                      <p className="mb-1 text-gray-800">IFSC code: {selectedQuotation.bank_accounts.ifsc_code}</p>
                      <p className='text-gray-800'>{selectedQuotation.bank_accounts.account_type}</p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="p-4 sm:p-6 text-xs sm:text-sm">
                    <p className="mb-2 text-gray-800">Best Regards,</p>
                    <p className="font-semibold text-gray-800">G-TEK Technology Private LTD</p>
                    <p className='text-gray-800'>Email-Id: info@griantek.com</p>
                    
                    <div className="mt-4 text-xs border-t pt-4 text-gray-500 italic">
                      <p>Note: Do payment on G-TEK OFFICIAL account only.</p>
                      <p className="mt-2">PRIVILEGED INFORMATION: This email and any attachments thereto may contain private, confidential, and privileged material for the sole use of the intended recipient. Any review, copying, or distribution of this email (or any attachments thereto) by others is strictly prohibited. If you are not the intended recipient, please contact the sender immediately and permanently delete the original and any copies of this email and any attachments thereto. The initial processing fee is non-refundable if the author's article is not at par with the journal's quality standards for publication.</p>
                      <p className="mt-2 font-semibold text-center">THANK YOU</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-between gap-3 p-6 border-t">
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
                      startContent={<CheckCircleIcon className="h-4 w-4" />}
                    >
                      Accept & Pay
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
                          <div className="text-xl font-bold text-default-800">₹{quotation.total_amount.toFixed(2)}</div>
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
