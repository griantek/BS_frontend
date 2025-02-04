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

export type PeriodUnit = "days" | "weeks" | "months" | "years";

export const PERIOD_UNITS: PeriodUnit[] = ["days", "weeks", "months", "years"];
