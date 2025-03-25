import type { PeriodUnit } from '@/constants/quotation';
import type { Service } from '@/services/api';

export interface SelectedServiceType {
  id: number; // Changed from string to number to match API type
  service_name: string;
  service_type: string | null;
  description: string | null;
  fee: number;
  min_duration: string | null;
  max_duration: string | null;
}

export interface QuotationFormData {
  initialAmount?: number;
  acceptanceAmount?: number;
  discountPercentage?: number;
  discountAmount: number;
  subTotal: number;
  totalAmount: number;
  selectedServices: string[];
  selectedServicesData: Service[]; // Changed to use API Service type
  acceptancePeriod?: number;
  acceptancePeriodUnit: PeriodUnit;  // Updated to use PeriodUnit type
  publicationPeriod?: number;
  publicationPeriodUnit: PeriodUnit;  // Updated to use PeriodUnit type
  selectedBank: string;
  transactionDate:string;
  password:string;
}
