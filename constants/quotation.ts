export type ServiceType = {
  id: string;
  name: string;
  price: number;
};

export type BankType = {
  id: string;
  name: string;
  accountNumber: string;
};

export const SERVICES: ServiceType[] = [
  { id: 'research_paper', name: 'Research Paper Writing', price: 20000 },
  { id: 'thesis', name: 'Thesis Writing', price: 30000 },
  { id: 'documentation', name: 'Project Documentation', price: 15000 },
  { id: 'technical_writing', name: 'Technical Writing', price: 25000 } // Changed ID to be unique
];

export const BANKS: BankType[] = [
  { id: 'sbi', name: 'State Bank of India', accountNumber: '1234' },
  { id: 'hdfc', name: 'HDFC Bank', accountNumber: '5678' },
  { id: 'icici', name: 'ICICI Bank', accountNumber: '9012' }
];

export const PERIOD_UNITS = ['days', 'months'] as const;
export type PeriodUnit = typeof PERIOD_UNITS[number];
