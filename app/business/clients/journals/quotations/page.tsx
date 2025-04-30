'use client'
import React, { useState, useEffect, useRef } from 'react';
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
import html2pdf from 'html2pdf.js';

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
  const quotationRef = useRef<HTMLDivElement>(null);

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
    // Navigate to the payment page instead of simulating API call
    router.push(`/business/clients/journals/quotations/${id}`);
  };

  const handleDownloadPDF = () => {
    if (!quotationRef.current || !selectedQuotation) return;
    
    // Set options for PDF generation
    const options = {
      margin: 10,
      filename: `Quotation-${selectedQuotation.id}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Generate and download PDF
    html2pdf().from(quotationRef.current).set(options).save();
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
              <div className="p-6">
                {/* Professional Quotation Format */}
                <div ref={quotationRef} className="max-w-4xl mx-auto bg-white shadow-sm border rounded-lg overflow-hidden print:shadow-none print:border-none">
                  {/* Header - Improved spacing and alignment */}
                  <div className="bg-gray-800 text-white p-6 flex flex-col sm:flex-row justify-between items-center">
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

                  {/* Introduction - Improved padding and spacing */}
                  <div className="p-6 text-sm sm:text-base">
                    <p className="font-semibold text-gray-800">DEAR, {selectedQuotation.prospectus?.client_name || selectedQuotation.prospectus.client_name || 'Client'},</p>
                    <p className="mt-4 text-sm text-gray-700">
                      Greetings from G tek
                    </p>
                    <p className="mt-3 text-sm text-gray-700">
                      It&apos;s our immense pleasure to introduce ourselves. We, G-Tek Technology are a Research & Development venture. By the year 1998, our journey started with limited technical experts; but our strive work and dedication has made us reach an impressive success and tech giant for past 18 years in our field. We have expanded ourselves with 8 branches in pan India and with clients worldwide.
                    </p>
                  </div>

                  {/* Contact Details - Improved grid layout and spacing */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 bg-gray-50 text-sm">
                    <div className="border-r-0 sm:border-r border-gray-200 pr-0 sm:pr-4">
                      <h3 className="font-bold text-gray-700 uppercase mb-3 text-xs sm:text-sm">SERVICE PROVIDER</h3>
                      <p className="mb-2 text-gray-800">Company Name: Gtek Technology Pvt ltd</p>
                      <p className="mb-2 text-gray-800">Contact: +91 876 00 000 44</p>
                      <p className='text-gray-800'>Email: info@gtekphd.com</p>
                    </div>
                    <div className="pl-0 sm:pl-4 mt-4 sm:mt-0">
                      <h3 className="font-bold text-gray-700 uppercase mb-3 text-xs sm:text-sm">CLIENT CONTACT DETAILS</h3>
                      <p className="mb-2 text-gray-800">NAME: {selectedQuotation.prospectus?.client_name || 'Client'}</p>
                      <p className="mb-2 text-gray-800">Phone: {selectedQuotation.prospectus?.phone || 'N/A'}</p>
                      <p className='text-gray-800'>EMail: {selectedQuotation.prospectus?.email || selectedQuotation.prospectus.email || 'N/A'}</p>
                    </div>
                  </div>

                  {/* PROFORMA INVOICE header - Added more prominence */}
                  <div className="text-center p-5 bg-gray-100">
                    <h2 className="text-xl font-bold text-gray-800">PROFORMA INVOICE</h2>
                  </div>

                  {/* Services - Improved card layout and spacing */}
                  <div className="p-6">
                    <div className="rounded-lg mb-6">
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <h4 className="font-bold text-sm mb-3 uppercase text-gray-800 border-b pb-2">Services & Pricing</h4>
                          <div className="space-y-3 mt-4">
                            {/* Service and prices table - Improved table styling */}
                            {selectedQuotation.service_and_prices ? (
                              <div className="border rounded-lg overflow-hidden mb-5 shadow-sm">
                                <table className="w-full">
                                  <thead className="bg-gray-50">
                                    <tr>
                                      <th className="text-left p-3 text-sm font-medium text-gray-700">Service</                                      th>
                                      <th className="text-right p-3 text-sm font-medium text-gray-700">Price (₹)</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {Object.entries(selectedQuotation.service_and_prices).map(([service, price], index) => (
                                      <tr key={index} className="border-t border-gray-100">
                                        <td className="p-3 text-sm text-gray-800">{service}</td>
                                        <td className="p-3 text-sm text-gray-800 text-right">₹{price.toFixed(2)}/-INR</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-800 mb-4">{selectedQuotation.services}</p>
                            )}
                            
                            {/* Payment details - Improved visual hierarchy */}
                            <div className="pl-4 border-l-4 border-gray-200 py-2 bg-gray-50 rounded-r-md mb-5">
                              <p className="mb-2 text-sm text-gray-800">Initial Amount: <span className="font-medium">₹{selectedQuotation.init_amount.toFixed(2)}/-INR</span></p>
                              <p className="mb-2 text-sm text-gray-800">After Write-up: <span className="font-medium">₹{selectedQuotation.accept_amount.toFixed(2)}/-INR</span></p>
                              {selectedQuotation.discount > 0 && (
                                <p className="mb-2 text-sm text-green-600">Discount: <span className="font-medium">₹{selectedQuotation.discount.toFixed(2)}/-INR</span></p>
                              )}
                              <p className="font-medium text-sm mt-3 text-gray-800 border-t border-gray-200 pt-2">Total Amount: <span className="font-bold">₹{selectedQuotation.total_amount.toFixed(2)}/-INR</span></p>
                            </div>
                            
                            {/* Duration info - Better visual hierarchy */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-md">
                              <div className="flex items-center">
                                <ClockIcon className="h-5 w-5 text-gray-400 mr-2" />
                                <p className="text-sm text-gray-800">DURATION - Writing: <span className="font-medium">{selectedQuotation.accept_period}</span></p>
                              </div>
                              <div className="flex items-center">
                                <ClockIcon className="h-5 w-5 text-gray-400 mr-2" />
                                <p className="text-sm text-gray-800">DURATION - Publication: <span className="font-medium">{selectedQuotation.pub_period}</span></p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Services List - Two column layout for better spacing */}
                    <div className="mb-8 bg-white border rounded-lg p-5">
                      <h3 className="font-bold mb-4 text-sm text-gray-800 border-b pb-2">Our Services</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <ul className="list-disc pl-5 text-xs sm:text-sm space-y-2 text-gray-700">
                            <li>PhD Admission Support</li>
                            <li>Research Proposal or Synopsis (PhD Research Assistance Guidance)</li>
                            <li>Problem Identification - Novel Concept Finalization</li>
                            <li>Research Methodology & Results Findings and Recommendations</li>
                            <li>Research Literature Review Writing</li>
                          </ul>
                        </div>
                        <div>
                          <ul className="list-disc pl-5 text-xs sm:text-sm space-y-2 text-gray-700">
                            <li>Implementation(coding)</li>
                            <li>Journal Publication</li>
                            <li>Research Dissertation & Thesis Writing</li>
                            <li>Dissertation Writing (UG or PG)</li>
                          </ul>
                        </div>
                      </div>
                      
                      <h3 className="font-bold mt-6 mb-4 text-sm text-gray-800 border-b pb-2">Other Services</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <ul className="list-disc pl-5 text-xs sm:text-sm space-y-2 text-gray-700">
                            <li className='text-gray-800'>Anonymous Peer Review Process</li>
                            <li className='text-gray-800'>English Language Correction</li>
                            <li className='text-gray-800'>Technical Language Correction</li>
                          </ul>
                        </div>
                        <div>
                          <ul className="list-disc pl-5 text-xs sm:text-sm space-y-2 text-gray-700">
                            <li className='text-gray-800'>Formatting and Proofreading Services</li>
                            <li className='text-gray-800'>Scientific or Mathematical Formula Editing Services</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Details - Improved layout */}
                  <div className="p-6 bg-gray-50">
                    <h3 className="font-bold mb-4 uppercase text-sm text-gray-800 border-b border-gray-200 pb-2">ACCOUNT DETAILS</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                      <div>
                        <p className="mb-2 text-gray-800">Account Number: <span className="font-medium">{selectedQuotation.bank_accounts.account_number}</span></p>
                        <p className="mb-2 text-gray-800">Account name: <span className="font-medium">{selectedQuotation.bank_accounts.account_name}</span></p>
                      </div>
                      <div>
                        <p className="mb-2 text-gray-800">Bank Name: <span className="font-medium">{selectedQuotation.bank_accounts.bank}, {selectedQuotation.bank_accounts.branch}</span></p>
                        <p className="mb-2 text-gray-800">IFSC code: <span className="font-medium">{selectedQuotation.bank_accounts.ifsc_code}</span></p>
                        <p className='text-gray-800'>{selectedQuotation.bank_accounts.account_type}</p>
                      </div>
                    </div>
                  </div>

                  {/* Footer - Improved spacing and visual hierarchy */}
                  <div className="p-6 text-xs sm:text-sm">
                    <div className="mb-4">
                      <p className="mb-2 text-gray-800">Best Regards,</p>
                      <p className="font-semibold text-gray-800">G-TEK Technology Private LTD</p>
                      <p className='text-gray-800'>Email-Id: info@griantek.com</p>
                    </div>
                    
                    <div className="mt-6 text-xs border-t pt-4 text-gray-500 italic bg-gray-50 p-4 rounded-md">
                      <p className="font-semibold mb-2">Note: Do payment on G-TEK OFFICIAL account only.</p>
                      <p className="mt-2">PRIVILEGED INFORMATION: This email and any attachments thereto may contain private, confidential, and privileged material for the sole use of the intended recipient. Any review, copying, or distribution of this email (or any attachments thereto) by others is strictly prohibited. If you are not the intended recipient, please contact the sender immediately and permanently delete the original and any copies of this email and any attachments thereto. The initial processing fee is non-refundable if the author&apos;s article is not at par with the journal&apos;s quality standards for publication.</p>
                      <p className="mt-4 font-semibold text-center">THANK YOU</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Buttons - Keep layout the same but add shadow and improve spacing */}
              <div className="flex flex-col sm:flex-row justify-between gap-4 p-6 border-t ">
                <Button 
                  startContent={<CurrencyDollarIcon className="h-4 w-4" />}
                  variant="flat"
                  onClick={handleDownloadPDF}
                  className="shadow-sm"
                >
                  Download PDF
                </Button>
                
                {selectedQuotation.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button 
                      color="success" 
                      onClick={() => handleAccept(selectedQuotation.id)}
                      startContent={<CheckCircleIcon className="h-4 w-4" />}
                      className="shadow-sm"
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
