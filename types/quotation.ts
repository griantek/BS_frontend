export interface QuotationFormData {
  initialAmount: number;
  writingAmount: number;
  acceptanceAmount: number;
  discountPercentage: number;
  discountAmount: number;
  subTotal: number;
  totalAmount: number;
  selectedServices: string[]; // Changed from selectedService: string
  acceptancePeriod: number;
  acceptancePeriodUnit: 'days' | 'months';
  publicationPeriod: number;
  publicationPeriodUnit: 'days' | 'months';
  selectedBank: string;
}
