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
import { SERVICES, BANKS, PERIOD_UNITS } from '@/constants/quotation';
import type { QuotationFormData } from '@/types/quotation';
import { withAdminAuth } from '@/components/withAdminAuth';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import api from '@/services/api';
import { checkAuth } from '@/utils/authCheck';
import type { ServiceType, BankType, PeriodUnit } from '@/constants/quotation';

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

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<QuotationFormData>({
    defaultValues: {
      initialAmount: undefined,
      writingAmount: undefined,
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
      selectedServicesData: []
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
        const serviceMatch = SERVICES.find(s => s.name === response.data.services);
        if (serviceMatch) {
          setValue('selectedServices', [serviceMatch.id]); // Changed from selectedService
        }

        // Pre-fill period if available
        const periodMatch = response.data.proposed_service_period?.match(/(\d+)\s*(days|months)/i);
        if (periodMatch) {
          setValue('acceptancePeriod', parseInt(periodMatch[1]));
          setValue('acceptancePeriodUnit', periodMatch[2].toLowerCase() as 'days' | 'months');
        }

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

  // Watch all amount fields to calculate total
  const getNumericValue = (value: number | undefined) => Number(value || 0);
  const initialAmount = getNumericValue(watch('initialAmount'));
  const writingAmount = getNumericValue(watch('writingAmount'));
  const acceptanceAmount = getNumericValue(watch('acceptanceAmount'));
  const discountPercentage = getNumericValue(watch('discountPercentage'));

  React.useEffect(() => {
    const subTotal = initialAmount + writingAmount + acceptanceAmount;
    const discountAmount = (subTotal * discountPercentage) / 100;
    const total = subTotal - discountAmount;

    setValue('subTotal', subTotal);
    setValue('discountAmount', discountAmount);
    setValue('totalAmount', total);
  }, [initialAmount, writingAmount, acceptanceAmount, discountPercentage, setValue]);

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
      await generatePDF();
      toast.success('Quotation generated successfully!');
      router.push('/business');
    } catch (error) {
      toast.error('Failed to generate quotation');
    } finally {
      setIsGenerating(false);
    }
  };

  // Add these handlers for Select changes
  const handleServiceChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const service = SERVICES.find(s => s.id === event.target.value);
    if (service) {
      const updatedServices = [...watch('selectedServices'), event.target.value];
      setValue('selectedServices', updatedServices);
      
      // Calculate initial amount as sum of all service prices
      const initialAmount = updatedServices.reduce((sum, serviceId) => {
        const selectedService = SERVICES.find(s => s.id === serviceId);
        return sum + (selectedService?.price || 0);
      }, 0);

      // Set initial amount and calculate others
      setValue('initialAmount', initialAmount);
      // setValue('writingAmount', initialAmount); // Same as initial
      // setValue('acceptanceAmount', initialAmount); // Same as initial
    }
  };

  const removeService = (serviceId: string) => {
    const updatedServices = watch('selectedServices').filter(id => id !== serviceId);
    setValue('selectedServices', updatedServices);
    
    // Recalculate initial amount
    const initialAmount = updatedServices.reduce((sum, id) => {
      const service = SERVICES.find(s => s.id === id);
      return sum + (service?.price || 0);
    }, 0);

    // Update all amounts
    setValue('initialAmount', initialAmount);
    // setValue('writingAmount', initialAmount);
    // setValue('acceptanceAmount', initialAmount);
  };

  // Update PDFTemplate to handle multiple services
  const selectedServices = watch('selectedServices').map(serviceId => 
    SERVICES.find(s => s.id === serviceId)
  ).filter(Boolean);

  // Update the service data handling
  const selectedServiceData = watch('selectedServices')
    .map(id => SERVICES.find(s => s.id === id))
    .filter((service): service is ServiceType => service !== undefined);

  if (isLoading) return <div>Loading...</div>;
  if (!prospectData) return <div>No data found</div>;

  return (
    <div className="w-full p-6">
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <h2 className="text-2xl font-bold">Generate Quotation</h2>
      </CardHeader>
      <Divider/>
      <CardBody>
        {/* Prospect Summary */}
        <div className=" p-4 rounded-lg mb-6">
          <h3 className="text-lg font-semibold mb-3">Prospect Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Client Name</p>
              <p className="font-medium">{prospectData.client_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Registration ID</p>
              <p className="font-medium">{prospectData.reg_id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Department</p>
              <p className="font-medium">{prospectData.department}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Service</p>
              <p className="font-medium">{prospectData.services}</p>
            </div>
            {/* Add more details */}
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium">{prospectData.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Phone</p>
              <p className="font-medium">{prospectData.phone}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">State</p>
              <p className="font-medium">{prospectData.state}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Proposed Period</p>
              <p className="font-medium">{prospectData.proposed_service_period}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Service Selection - Moved to top */}
          <div className="space-y-4">
            <div className="flex gap-2">
              <select
                className="w-full p-2 rounded-lg border border-gray-300"
                onChange={handleServiceChange}
                value=""
              >
                <option value="">Add a service</option>
                {SERVICES.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name} - ₹{service.price.toLocaleString()}
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
                    const service = SERVICES.find(s => s.id === serviceId);
                    return service && (
                      <Chip
                        key={service.id}
                        onClose={() => removeService(service.id)}
                        variant="flat"
                        color="primary"
                      >
                        {service.name} - ₹{service.price.toLocaleString()}
                      </Chip>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Amount Details */}
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="number"
                label="Initial Amount (INR)"
                placeholder="Enter amount"
                value={watch('initialAmount')}
                onChange={(e) => setValue('initialAmount', Number(e.target.value))}
                readOnly
              />
              <Input
                type="number"
                label="Writing Amount (INR)"
                placeholder="Enter amount"
                onChange={(e) => setValue('writingAmount', Number(e.target.value))}
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
          <div className="grid grid-cols-2 gap-4">
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

          {/* Bank Selection - Fixed */}
          <div className="w-full space-y-2">
            <label className="text-sm font-medium">Select Bank</label>
            <select
              className="w-full p-2 rounded-lg border border-gray-300"
              value={watch('selectedBank')}
              onChange={(e) => handleBankChange(e.target.value)}
            >
              <option value="">Choose a bank</option>
              {BANKS.map((bank) => (
                <SelectOption key={bank.id} value={bank.id}>
                  {bank.name} - XXXX{bank.accountNumber}
                </SelectOption>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3">
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

    {/* Hidden PDF Template */}
    <div id="pdf-template" style={{ position: 'absolute', left: '-9999px', visibility: 'hidden' }}>
      <PDFTemplate
        id="pdf-content"
        prospectData={prospectData}
        quotationData={{
          ...watch(), // Pass the selected services array
          initialAmount: watch('initialAmount') || 0,
          writingAmount: watch('writingAmount') || 0,
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
