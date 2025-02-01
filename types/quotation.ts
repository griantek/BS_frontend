export type SelectedServiceType = {
  id: string;
  name: string;
  price: number;
};

export interface QuotationFormData {
  initialAmount: number;
  // Remove writingAmount
  acceptanceAmount: number;
  discountPercentage: number;
  discountAmount: number;
  subTotal: number;
  totalAmount: number;
  selectedServices: string[]; // Keep as string[] for form data
  selectedServicesData?: SelectedServiceType[]; // Add this for resolved service data
  acceptancePeriod: number;
  acceptancePeriodUnit: 'days' | 'months';
  publicationPeriod: number;
  publicationPeriodUnit: 'days' | 'months';
  selectedBank: string;
}
