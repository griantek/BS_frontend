'use client'
import React, { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Input,
  Select,
  Divider,
  Chip, // Add this import
  Listbox,
  ListboxItem,
  ScrollShadow
} from "@heroui/react";
import { useForm } from 'react-hook-form';
import PDFTemplate from '@/components/PDFTemplate';
import {  BANKS, PERIOD_UNITS,PeriodUnit } from '@/constants/quotation';
import type { QuotationFormData } from '@/types/quotation';
import { withAdminAuth } from '@/components/withAdminAuth';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import api from '@/services/api';
import { checkAuth } from '@/utils/authCheck';
import type { CreateRegistrationRequest,BankAccount,Service } from '@/services/api';

// Add interface for better type safety
interface ProspectData {
  id: number;
  executive_id: string;
  date: string;
  email: string;
  reg_id: string;
  client_name: string;
  phone: string;
  department: string;
  state: string;
  tech_person: string;
  requirement: string;
  proposed_service_period: string;
  created_at: string;
  services: string;
}

// Add this interface for select items
interface SelectOptionProps {
  key: string;
  value: string;
  children: React.ReactNode;
}

const SelectOption: React.FC<SelectOptionProps> = ({ children, ...props }) => (
  <option {...props}>{children}</option>
);

// Create a content component to handle the main logic
function QuotationContent({ regId }: { regId: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(true);
  const [prospectData, setProspectData] = React.useState<ProspectData | null>(null);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [bankAccounts, setBankAccounts] = React.useState<BankAccount[]>([]);
  const [services, setServices] = React.useState<Service[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<QuotationFormData>({
    defaultValues: {
      initialAmount: undefined,
      acceptanceAmount: undefined,
      discountPercentage: undefined,
      discountAmount: 0,
      subTotal: 0,
      totalAmount: 0,
      selectedServices: [],
      acceptancePeriod: undefined,
      acceptancePeriodUnit: 'months',
      publicationPeriod: undefined,
      publicationPeriodUnit: 'months',
      selectedBank: '',
      selectedServicesData: [],
      transactionDate: new Date().toISOString().split('T')[0], // Add default date
    }
  });

  React.useEffect(() => {
    if (!checkAuth(router)) return;

    const fetchProspectData = async () => {
      try {
        setIsLoading(true);
        const response = await api.getProspectusByRegId(regId);
        // Add console.log to debug the response
        console.log('API Response:', response);
        
        // Ensure we're setting the complete data object
        setProspectData(response.data);

        // Pre-fill form with service data if available
        // const serviceMatch = SERVICES.find(s => s.name === response.data.services);
        // if (serviceMatch) {
        //   setValue('selectedServices', [serviceMatch.id]); // Changed from selectedService
        // }

        // Pre-fill period if available
        // const periodMatch = response.data.proposed_service_period?.match(/(\d+)\s*(days|months)/i);
        // if (periodMatch) {
        //   setValue('acceptancePeriod', parseInt(periodMatch[1]));
        //   setValue('acceptancePeriodUnit', periodMatch[2].toLowerCase() as 'days' | 'months');
        // }

      } catch (error) {
        console.error('Error fetching prospect:', error);
        const errorMessage = api.handleError(error);
        toast.error(errorMessage.error || 'Failed to load prospect data');
        router.push('/business');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProspectData();
  }, [router, regId, setValue]);

  // Add bank accounts fetch
  React.useEffect(() => {
    const fetchBankAccounts = async () => {
      try {
        const response = await api.getAllBankAccounts();
        setBankAccounts(response.data);
      } catch (error) {
        console.error('Error fetching bank accounts:', error);
        toast.error('Failed to load bank accounts');
      }
    };

    fetchBankAccounts();
  }, []);

  // Add useEffect to fetch services
  React.useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await api.getAllServices();
        setServices(response.data);
      } catch (error) {
        console.error('Error fetching services:', error);
        toast.error('Failed to load services');
      }
    };

    fetchServices();
  }, []);

  // Watch all amount fields to calculate total
  const getNumericValue = (value: number | undefined) => Number(value || 0);
  const initialAmount = getNumericValue(watch('initialAmount'));
  const acceptanceAmount = getNumericValue(watch('acceptanceAmount'));
  const discountPercentage = getNumericValue(watch('discountPercentage'));

  React.useEffect(() => {
    const subTotal = initialAmount + acceptanceAmount;
    const discountAmount = (subTotal * discountPercentage) / 100;
    const total = subTotal - discountAmount;

    setValue('subTotal', subTotal);
    setValue('discountAmount', discountAmount);
    setValue('totalAmount', total);
  }, [initialAmount, acceptanceAmount, discountPercentage, setValue]);

  const generatePDF = async () => {
    try {
      const element = document.getElementById('pdf-template');
      if (!element) throw new Error('PDF template not found');

      // Remove hidden style temporarily
      element.style.visibility = 'visible';
      element.style.position = 'absolute';
      element.style.top = '0';
      element.style.left = '0';
      
      // Wait for rendering
      await new Promise(resolve => setTimeout(resolve, 100));

      // Create canvas
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: true,
        backgroundColor: '#ffffff'
      });

      // Reset element style
      element.style.visibility = 'hidden';
      element.style.position = 'absolute';
      element.style.left = '-9999px';

      // PDF dimensions (A4)
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Handle multi-page
      let heightLeft = imgHeight;
      let position = 0;
      let pageNumber = 1;

      // Add first page
      pdf.addImage(
        canvas.toDataURL('image/jpeg', 1.0),
        'JPEG',
        0,
        position,
        imgWidth,
        imgHeight
      );
      heightLeft -= pageHeight;

      // Add subsequent pages if content overflows
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(
          canvas.toDataURL('image/jpeg', 1.0),
          'JPEG',
          0,
          position,
          imgWidth,
          imgHeight
        );
        heightLeft -= pageHeight;
        pageNumber++;
      }

      // Add page numbers
      for (let i = 1; i <= pageNumber; i++) {
        pdf.setPage(i);
        pdf.setFontSize(10);
        pdf.text(
          `Page ${i} of ${pageNumber}`,
          imgWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }

      pdf.save(`quotation_${prospectData?.reg_id}.pdf`);
      return true;
    } catch (error) {
      console.error('PDF generation error:', error);
      throw error;
    }
  };

  const onSubmit = async (data: QuotationFormData) => {
    try {
      setIsGenerating(true);

      // Get user data for executive ID
      const userStr = localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;

      if (!user?.id) {
        throw new Error("Executive ID not found");
      }

      if (!prospectData) {
        throw new Error("Prospect data not found");
      }

      // Prepare registration data
      const registrationData: CreateRegistrationRequest = {
        // Transaction details (minimal for pending status)
        transaction_type: 'Cash', // Default type
        transaction_id: '', // Will be updated later
        amount: 0, // Will be updated later
        transaction_date: data.transactionDate || new Date().toISOString().split('T')[0],
        additional_info: {},

        // Executive and prospect details
        exec_id: user.id,
        client_id: user.client_id || user.clientId,
        prospectus_id: prospectData.id,
        services: data.selectedServices
          .map(id => services.find(s => s.id === parseInt(id))?.service_name)
          .filter(Boolean)
          .join(", "),
        init_amount: data.initialAmount || 0,
        accept_amount: data.acceptanceAmount || 0,
        discount: data.discountAmount || 0,
        total_amount: data.totalAmount || 0,
        accept_period: `${data.acceptancePeriod} ${data.acceptancePeriodUnit}`,
        pub_period: `${data.publicationPeriod} ${data.publicationPeriodUnit}`,
        bank_id: data.selectedBank,
        status: 'pending', // Set status as pending for quotation
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
      };

      // Submit registration with pending status
      const response = await api.createRegistration(registrationData);
      
      if (response.success) {
        // Generate PDF after successful registration
        await generatePDF();
        toast.success('Quotation generated and saved successfully!');
        router.push('/business');
      } else {
        throw new Error('Failed to create registration');
      }
    } catch (error) {
      console.error('Submission error:', error);
      toast.error('Failed to generate quotation');
    } finally {
      setIsGenerating(false);
    }
  };

  // Add these handlers for Select changes
  const handleServiceChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const service = services.find(s => s.id === parseInt(event.target.value));
    if (service) {
      const updatedServices = [...watch('selectedServices'), service.id.toString()];
      setValue('selectedServices', updatedServices);
      
      // Calculate initial amount as sum of all service prices
      const initialAmount = updatedServices.reduce((sum, serviceId) => {
        const selectedService = services.find(s => s.id === parseInt(serviceId));
        return sum + (selectedService?.fee || 0);
      }, 0);

      setValue('initialAmount', initialAmount);
    }
  };

  const removeService = (serviceId: string) => {
    const updatedServices = watch('selectedServices').filter(id => id !== serviceId);
    setValue('selectedServices', updatedServices);
    
    // Recalculate initial amount
    const initialAmount = updatedServices.reduce((sum, id) => {
      const service = services.find(s => s.id === parseInt(id));
      return sum + (service?.fee || 0);
    }, 0);

    // Update all amounts
    setValue('initialAmount', initialAmount);
    // setValue('writingAmount', initialAmount);
    // setValue('acceptanceAmount', initialAmount);
  };

  // Update PDFTemplate to handle multiple services
  const selectedServices = watch('selectedServices').map(serviceId => 
    services.find(s => s.id === parseInt(serviceId))
  ).filter(Boolean);

  // Update the service data handling to include duration fields
  const selectedServiceData = watch('selectedServices')
    .map(id => {
      const service = services.find(s => s.id === parseInt(id));
      if (service) {
        return {
          id: service.id,
          service_name: service.service_name,
          service_type: service.service_type,
          description: service.description,
          fee: service.fee,
          min_duration: service.min_duration,
          max_duration: service.max_duration
        } as Service;
      }
      return undefined;
    })
    .filter((service): service is Service => service !== undefined);

  // Add bank change handler
  const handleBankChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setValue('selectedBank', event.target.value);
  };

  if (isLoading) return <div>Loading...</div>;
  if (!prospectData) return <div>No data found</div>;

  return (
    <div className="w-full p-4 md:p-6">
      {/* Change grid-cols-2 to grid-cols-1 on mobile and grid-cols-2 on medium screens and up */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Left side - Prospect Details */}
        <div className="space-y-4 md:space-y-6">
          <Card className="w-full">
            <CardHeader>
              <h2 className="text-xl md:text-2xl font-bold">Prospect Details</h2>
            </CardHeader>
            <Divider />
            <CardBody className="space-y-4">
              {/* Make the inner grid responsive too */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Client Name</p>
                  <p className="font-medium">{prospectData.client_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Registration ID</p>
                  <p className="font-medium">{prospectData.reg_id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{prospectData.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium">{prospectData.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Department</p>
                  <p className="font-medium">{prospectData.department}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">State</p>
                  <p className="font-medium">{prospectData.state}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Proposed Service</p>
                  <p className="font-medium">{prospectData.services}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Proposed Period</p>
                  <p className="font-medium">{prospectData.proposed_service_period}</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Right side - Quotation Form */}
        <div className="space-y-4 md:space-y-6">
          <Card className="w-full">
            <CardHeader>
              <h2 className="text-xl md:text-2xl font-bold">Generate Quotation</h2>
            </CardHeader>
            <Divider />
            <CardBody>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
                {/* Move existing form contents here */}
                {/* Service Selection */}
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <select
                      className="w-full p-2 rounded-lg border border-gray-300"
                      onChange={handleServiceChange}
                      value=""
                    >
                      <option value="">Add a service</option>
                      {services.map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.service_name} - ₹{service.fee.toLocaleString()}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Selected Services Display */}
                  {watch('selectedServices').length > 0 && (
                    <div className="bg-default-100 p-4 rounded-lg space-y-2">
                      <h4 className="text-sm font-medium">Selected Services</h4>
                      <div className="flex flex-wrap gap-2">
                        {watch('selectedServices').map((serviceId) => {
                          const service = services.find(s => s.id === parseInt(serviceId));
                          return service && (
                            <Chip
                              key={service.id}
                              onClose={() => removeService(serviceId)}
                              variant="flat"
                              color="primary"
                            >
                              {service.service_name} - ₹{service.fee.toLocaleString()}
                            </Chip>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Amount Details */}
                <div className="space-y-4 md:space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      type="number"
                      label="Initial Amount (INR)"
                      placeholder="Enter amount"
                      value={watch('initialAmount')?.toString()}
                      onChange={(e) => setValue('initialAmount', Number(e.target.value))}
                      readOnly
                    />
                    <Input
                      type="number"
                      label="Acceptance Amount (INR)"
                      placeholder="Enter amount"
                      onChange={(e) => setValue('acceptanceAmount', Number(e.target.value))}
                    />
                    <Input
                      type="number"
                      label="Discount (%)"
                      min="0"
                      max="100"
                      placeholder="Enter discount"
                      {...register('discountPercentage')}
                    />
                  </div>

                  {/* Total Amount Summary - Refined Design */}
                  <Card 
                    className="relative overflow-hidden"
                    classNames={{
                      base: "border border-default-200/50 bg-gradient-to-br from-default-50 to-default-100 dark:from-default-100 dark:to-default-50"
                    }}
                  >
                    <CardBody className="p-6">
                      <div className="space-y-4">
                        {/* Sub Total Row */}
                        <div className="flex justify-between items-center">
                          <span className="text-default-600">Sub Total</span>
                          <Chip
                            variant="flat"
                            classNames={{
                              base: "bg-default-100 border-default-200",
                              content: "text-default-600 font-semibold text-medium"
                            }}
                          >
                            ₹ {watch('subTotal').toLocaleString()}
                          </Chip>
                        </div>

                        {/* Discount Row */}
                        {watch('discountPercentage') > 0 && (
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <span className="text-danger-600">Discount</span>
                              <Chip
                                size="sm"
                                variant="flat"
                                color="danger"
                                classNames={{
                                  base: "h-5 bg-danger-50 dark:bg-danger-100",
                                  content: "text-tiny font-medium px-2 text-danger"
                                }}
                              >
                                {watch('discountPercentage')}% off
                              </Chip>
                            </div>
                            <span className="text-danger font-medium">
                              - ₹ {watch('discountAmount').toLocaleString()}
                            </span>
                          </div>
                        )}

                        <Divider className="my-4 bg-default-200/50"/>

                        {/* Total Amount Row */}
                        <div className="flex justify-between items-center">
                          <span className="text-xl font-semibold text-default-900">Total Amount</span>
                          <div className="flex flex-col items-end gap-1">
                            <Chip
                              size="lg"
                              classNames={{
                                base: "bg-primary/10 border-primary/20 px-4",
                                content: "text-xl font-bold text-primary"
                              }}
                            >
                              ₹ {watch('totalAmount').toLocaleString()}
                            </Chip>
                            <span className="text-tiny text-default-500">
                              {watch('discountPercentage') > 0 ? 'After discount applied' : 'No discount applied'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </div>

                {/* Period Settings */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      label="Acceptance Period"
                      {...register('acceptancePeriod')}
                    />
                    <select
                      className="w-1/2 p-2 rounded-lg border border-gray-300"
                      value={watch('acceptancePeriodUnit')}
                      onChange={(e) => setValue('acceptancePeriodUnit', e.target.value as PeriodUnit)}
                    >
                      {PERIOD_UNITS.map((unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      label="Publication Period"
                      {...register('publicationPeriod')}
                    />
                    <select
                      className="w-1/2 p-2 rounded-lg border border-gray-300"
                      value={watch('publicationPeriodUnit')}
                      onChange={(e) => setValue('publicationPeriodUnit', e.target.value as PeriodUnit)}
                    >
                      {PERIOD_UNITS.map((unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Bank Selection - Updated */}
                <div className="w-full space-y-2">
                  <label className="text-sm font-medium">Select Bank Account</label>
                  <select
                    className="w-full p-2 rounded-lg border border-gray-300"
                    value={watch('selectedBank')}
                    onChange={handleBankChange}
                  >
                    <option value="">Choose a bank account</option>
                    {bankAccounts.map((account) => (
                      <SelectOption key={account.id} value={account.id}>
                        {account.account_name} - {account.bank}
                      </SelectOption>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <Button
                    color="danger"
                    variant="light"
                    onClick={() => router.back()}
                  >
                    Cancel
                  </Button>
                  <Button
                    color="primary"
                    type="submit"
                    isLoading={isGenerating}
                  >
                    Generate PDF
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Hidden PDF Template */}
      <div id="pdf-template" style={{ position: 'absolute', left: '-9999px', visibility: 'hidden' }}>
        <PDFTemplate
          id="pdf-content"
          prospectData={prospectData}
          quotationData={{
            ...watch(), // Pass the selected services array
            initialAmount: watch('initialAmount') || 0,
            acceptanceAmount: watch('acceptanceAmount') || 0,
            discountPercentage: watch('discountPercentage') || 0,
            selectedServicesData: selectedServiceData
          }}
        />
      </div>
    </div>
  );
}

// Main component wrapper that handles the Promise params
interface PageProps {
  params: Promise<{ id: string }>;
}

function QuotationPage({ params }: PageProps) {
  const resolvedParams = React.use(params);
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <QuotationContent regId={resolvedParams.id} />
    </Suspense>
  );
}

export default withAdminAuth(QuotationPage);
