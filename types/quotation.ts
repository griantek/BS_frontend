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
  initialAmount: number;
  acceptanceAmount: number;
  discountPercentage: number;
  discountAmount: number;
  subTotal: number;
  totalAmount: number;
  selectedServices: string[];
  selectedServicesData: Service[]; // Changed to use API Service type
  acceptancePeriod: number;
  acceptancePeriodUnit: 'days' | 'months';
  publicationPeriod: number;
  publicationPeriodUnit: 'days' | 'months';
  selectedBank: string;
}
