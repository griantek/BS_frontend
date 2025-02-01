export const SERVICES = [
  {
    id: '1',
    name: 'Service 1',
    price: 1000
  },
  { id: 'research_paper', name: 'Research Paper Writing', price: 20000 },
  { id: 'thesis', name: 'Thesis Writing', price: 30000 },
  { id: 'documentation', name: 'Project Documentation', price: 15000 },
  { id: 'technical_writing', name: 'Technical Writing', price: 25000 } // Changed ID to be unique
] as const;

// Add type for the constant
export type ServiceType = typeof SERVICES[number];

export type BankType = {
  id: string;
  name: string;
  accountNumber: string;
};

export const BANKS: BankType[] = [
  { id: 'sbi', name: 'State Bank of India', accountNumber: '1234' },
  { id: 'hdfc', name: 'HDFC Bank', accountNumber: '5678' },
  { id: 'icici', name: 'ICICI Bank', accountNumber: '9012' }
];

export const PERIOD_UNITS = ['days', 'months'] as const;
export type PeriodUnit = typeof PERIOD_UNITS[number];
