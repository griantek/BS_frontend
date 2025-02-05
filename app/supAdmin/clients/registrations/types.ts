export interface RegistrationResponse {
  id: number;
  prospectus_id: number;
  services: string;
  init_amount: number;
  accept_amount: number;
  discount: number;
  total_amount: number;
  accept_period: string;
  pub_period: string;
  status: 'pending' | 'registered';
  month: number;
  year: number;
  created_at: string;
  prospectus: {
    id: number;
    reg_id: string;
    client_name: string;
  };
  bank_accounts: {  // Changed to match the original interface
    bank: string;
    account_number: string;
  };
  transactions: {  // Changed to match the original interface
    id: number;
    amount: number;
    transaction_type: string;
  };
}

export const getBankInfo = (registration: any) => {
  return {
    bank: registration.bank_accounts?.bank || 'N/A',
    accountNumber: registration.bank_accounts?.account_number || 'N/A'
  };
};

export const getTransactionInfo = (registration: any) => {
  return {
    type: registration.transactions?.transaction_type || 'N/A',
    amount: registration.transactions?.amount || 0
  };
};
