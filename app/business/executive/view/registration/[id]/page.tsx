'use client'
import React, { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { checkAuth } from '@/utils/authCheck';
import { toast } from 'react-toastify';
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Divider,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Input,
  Select,
  SelectItem
} from "@nextui-org/react";  // Correct import
import { format } from 'date-fns';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import api from '@/services/api';
import { withExecutiveAuth } from '@/components/withExecutiveAuth';
import { useForm } from "react-hook-form";
import type { Registration, BankAccount, TransactionInfo,Editor } from '@/services/api';

interface ExtendedRegistration extends Registration {
  date: string;
  notes?: string;
  bank_accounts: {
    id: string;
    bank: string;
    branch: string;
    upi_id: string;
    ifsc_code: string;
    created_at: string;  // Add this property
    account_name: string;
    account_type: string;
    account_number: string;
    account_holder_name: string;
  };
  transactions: {
    id: number;
    amount: number;
    exec_id: string;
    executive: object;  // Add this property
    transaction_id: string;
    transaction_date: string;
    transaction_type: string;
    additional_info: {
      upi_id?: string;
      [key: string]: any;
    };
  };
}

// Add payment form interface
interface PaymentFormData {
  paymentMode: 'cash' | 'upi' | 'netbanking' | 'card' | 'cheque' | 'wallet' | 'gateway' | 'crypto';
  amount: number;
  transactionDate: string;
  transactionId?: string;
  upiId?: string;
  accountNumber?: string;
  ifscCode?: string;
  cardLastFourDigits?: string;
  receiptNumber?: string;
  chequeNumber?: string;
  walletProvider?: 'paytm' | 'phonepe' | 'other';
  gatewayProvider?: 'razorpay' | 'stripe' | 'other';
  transactionHash?: string;
  cryptoCurrency?: string;
  assigned_to: string;  // Add this field
}

// Add PAYMENT_MODE_MAP constant
const PAYMENT_MODE_MAP: Record<string, TransactionInfo['transaction_type']> = {
  cash: 'Cash',
  upi: 'UPI',
  netbanking: 'Bank Transfer',
  card: 'Card',
  cheque: 'Cheque',
  wallet: 'Wallet',
  gateway: 'Online Payment',
  crypto: 'Crypto',
} as const;

function RegistrationContent({ regId }: { regId: string }) {
  const router = useRouter();
  const { isOpen: isPaymentModalOpen, onOpen: onPaymentModalOpen, onClose: onPaymentModalClose } = useDisclosure();
  const { isOpen: isDeleteModalOpen, onOpen: onDeleteModalOpen, onClose: onDeleteModalClose } = useDisclosure();
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [registrationData, setRegistrationData] = React.useState<ExtendedRegistration | null>(null);
  const [bankAccounts, setBankAccounts] = React.useState<BankAccount[]>([]);
  const [editors, setEditors] = React.useState<Editor[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset
  } = useForm<PaymentFormData>({
    defaultValues: {
      paymentMode: 'cash',
      amount: 0,
      transactionDate: new Date().toISOString().split('T')[0],
      assigned_to: '', // Add this default value
    }
  });

  React.useEffect(() => {
    if (!checkAuth(router)) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [registrationResponse, bankResponse, editorsResponse] = await Promise.all([
          api.getRegistrationById(parseInt(regId)),
          api.getAllBankAccounts(),
          api.getAllEditors(),
        ]);
        setRegistrationData(registrationResponse.data as ExtendedRegistration);
        setBankAccounts(bankResponse.data);
        setEditors(editorsResponse.data);
      } catch (error) {
        console.error('Error fetching registration:', error);
        toast.error('Failed to load registration data');
        router.push('/busines/executives');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router, regId]);

  if (isLoading) return <div>Loading...</div>;
  if (!registrationData) return <div>No data found</div>;

  const formatDate = (date: string) => format(new Date(date), 'dd/MM/yyyy');

  const renderPaymentFields = () => {
    const paymentMode = watch("paymentMode");

    switch (paymentMode) {
      case "upi":
        return (
          <>
            <Input
              type="text"
              label="UPI ID"
              placeholder="example@upi"
              {...register("upiId")}
            />
            <Input
              type="text"
              label="Transaction ID"
              {...register("transactionId")}
            />
          </>
        );

      case "netbanking":
        return (
          <>
            <Input
              type="text"
              label="Account Number"
              {...register("accountNumber")}
            />
            <Input 
              type="text" 
              label="IFSC Code" 
              {...register("ifscCode")} 
            />
            <Input
              type="text"
              label="Transaction Reference"
              {...register("transactionId")}
            />
          </>
        );

      case "card":
        return (
          <>
            <Input
              type="text"
              label="Last 4 Digits"
              maxLength={4}
              {...register("cardLastFourDigits")}
            />
            <Input
              type="text"
              label="Transaction ID"
              {...register("transactionId")}
            />
          </>
        );

      case "cash":
        return (
          <Input
            type="text"
            label="Receipt Number"
            {...register("receiptNumber")}
          />
        );

      case "cheque":
        return (
          <Input
            type="text"
            label="Cheque Number"
            {...register("chequeNumber")}
          />
        );

      case "wallet":
        return (
          <>
            <Select
              label="Wallet Provider"
              {...register("walletProvider")}
            >
              <SelectItem key="paytm" value="paytm">Paytm</SelectItem>
              <SelectItem key="phonepe" value="phonepe">PhonePe</SelectItem>
              <SelectItem key="other" value="other">Other</SelectItem>
            </Select>
            <Input
              type="text"
              label="Transaction ID"
              {...register("transactionId")}
            />
          </>
        );

      case "gateway":
        return (
          <>
            <Select
              label="Payment Gateway"
              {...register("gatewayProvider")}
            >
              <SelectItem key="razorpay" value="razorpay">Razorpay</SelectItem>
              <SelectItem key="stripe" value="stripe">Stripe</SelectItem>
              <SelectItem key="other" value="other">Other</SelectItem>
            </Select>
            <Input
              type="text"
              label="Transaction ID"
              {...register("transactionId")}
            />
          </>
        );

      case "crypto":
        return (
          <>
            <Input
              type="text"
              label="Transaction Hash"
              {...register("transactionHash")}
            />
            <Input
              type="text"
              label="Cryptocurrency"
              {...register("cryptoCurrency")}
            />
          </>
        );

      default:
        return null;
    }
  };

  const handleApprove = async (data: PaymentFormData) => {
    try {
      if (!registrationData) return;

      // Add validation for editor assignment
      if (!data.assigned_to) {
        toast.error('Please select an editor to assign');
        return;
      }

      // Get user data for exec_id
      const user = api.getStoredUser();
      if (!user?.id) {
        toast.error('User data not found');
        return;
      }

      // Prepare additional info based on payment mode
      const additionalInfo: Record<string, any> = {};
      switch (data.paymentMode) {
        case 'upi':
          additionalInfo.upi_id = data.upiId;
          break;
        case 'netbanking':
          additionalInfo.account_number = data.accountNumber;
          additionalInfo.ifsc_code = data.ifscCode;
          break;
        case 'card':
          additionalInfo.card_last_four = data.cardLastFourDigits;
          break;
        case 'cash':
          additionalInfo.receipt_number = data.receiptNumber;
          break;
        case 'cheque':
          additionalInfo.cheque_number = data.chequeNumber;
          break;
        case 'wallet':
          additionalInfo.wallet_provider = data.walletProvider;
          break;
        case 'gateway':
          additionalInfo.gateway_provider = data.gatewayProvider;
          break;
        case 'crypto':
          additionalInfo.transaction_hash = data.transactionHash;
          additionalInfo.crypto_currency = data.cryptoCurrency;
          break;
      }

      // Prepare update data
      const updateData = {
        status: 'registered' as const,
        transaction_type: PAYMENT_MODE_MAP[data.paymentMode],
        transaction_id: data.transactionId || '',
        amount: data.amount,
        transaction_date: data.transactionDate,
        additional_info: additionalInfo,
        exec_id: user.id,
        assigned_to: data.assigned_to, // Add this field
      };

      // Send update request
      const response = await api.approveRegistration(registrationData.id, updateData);
      
      if (response.success) {
        toast.success('Registration approved successfully');
        // Refresh the page data
        window.location.reload();
      } else {
        toast.error('Failed to approve registration');
      }
    } catch (error) {
      console.error('Approval error:', error);
      toast.error('Failed to approve registration');
    } finally {
      onPaymentModalClose();
    }
  };

  // Add delete handler
  const handleDelete = async () => {
    try {
      if (!registrationData) return;
      
      setIsDeleting(true);
      const response = await api.deleteRegistration(registrationData.id);
      
      if (response.success) {
        toast.success('Registration deleted successfully');
        router.push('/business/executive');
      } else {
        toast.error('Failed to delete registration');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete registration');
    } finally {
      setIsDeleting(false);
      onDeleteModalClose();
    }
  };

  return (
    <>
      <Button
        isIconOnly
        variant="light"
        className="fixed top-4 left-4 z-50"
        onClick={() => router.push('/business/executive')}
      >
        <ArrowLeftIcon className="h-5 w-5" />
      </Button>

      <div className="w-full p-6 space-y-6">
        {/* Header with status and actions */}
        <Card className="w-full">
          <CardHeader className="flex justify-between items-center px-6 py-4">
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold">Registration Details</h1>
              <p className="text-small text-default-500">ID: {registrationData.prospectus.reg_id}</p>
            </div>
            <div className="flex gap-3">
              {registrationData.status === 'pending' && (
                <Button
                  color="success"
                  variant="flat"
                  onPress={onPaymentModalOpen}
                >
                  Approve Registration
                </Button>
              )}
              <Button
                color="primary"
                variant="flat"
                onPress={() => router.push(`/business/executive/edit/registration/${regId}`)}
              >
                Edit Registration
              </Button>
              <Button
                color="danger"
                variant="flat"
                onPress={onDeleteModalOpen}
              >
                Delete Registration
              </Button>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Client Details */}
          <Card className="w-full">
            <CardHeader>
              <h2 className="text-xl font-bold">Client Information</h2>
            </CardHeader>
            <Divider />
            <CardBody className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <InfoField label="Client Name" value={registrationData.prospectus.client_name} />
                <InfoField label="Email" value={registrationData.prospectus.email} />
                <InfoField label="Phone" value={registrationData.prospectus.phone} />
                <InfoField label="Department" value={registrationData.prospectus.department} />
                <InfoField label="State" value={registrationData.prospectus.state} />
                {registrationData.assigned_to && (
                  <InfoField 
                    label="Assigned Editor" 
                    value={editors?.find(e => e.id === registrationData.assigned_to)?.username || registrationData.assigned_to} 
                  />
                )}
                <InfoField label="Status">
                  <Chip
                    color={registrationData.status === 'registered' ? 'success' : 'warning'}
                    variant="flat"
                  >
                    {registrationData.status}
                  </Chip>
                </InfoField>
              </div>
            </CardBody>
          </Card>

          {/* Registration Details */}
          <Card className="w-full">
            <CardHeader>
              <h2 className="text-xl font-bold">Registration Details</h2>
            </CardHeader>
            <Divider />
            <CardBody className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <InfoField label="Registration Date" value={formatDate(registrationData.date)} />
                <InfoField label="Services" value={registrationData.services} />
                <InfoField label="Accept Period" value={registrationData.accept_period} />
                <InfoField label="Publication Period" value={registrationData.pub_period} />
                <InfoField label="Month/Year" value={`${registrationData.month}/${registrationData.year}`} />
              </div>
            </CardBody>
          </Card>

          {/* Enhanced Combined Financial Information */}
          <Card className="w-full md:col-span-2">
            <CardHeader>
              <h2 className="text-xl font-bold">Financial Overview</h2>
            </CardHeader>
            <Divider />
            <CardBody className="space-y-8">
              {/* Payment Summary - Large Numbers */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
                  <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                  <p className="text-2xl font-bold">₹{registrationData.total_amount.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-1">Inclusive of all charges</p>
                </div>
                {registrationData.status === 'registered' && (
                  <>
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
                      <p className="text-sm text-gray-600 mb-1">Amount Paid</p>
                      <p className="text-2xl font-bold text-success">₹{registrationData.transactions.amount.toLocaleString()}</p>
                      <p className="text-xs text-gray-500 mt-1">Payment completed</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
                      <p className="text-sm text-gray-600 mb-1">Payment Status</p>
                      <Chip color={registrationData.transactions.amount === registrationData.total_amount ? 'success' : 'warning'} variant="flat" className="text-lg">
                        {registrationData.transactions.amount === registrationData.total_amount ? 'Paid' : 'Partially Paid'}
                      </Chip>
                    </div>
                  </>
                )}
              </div>

              {/* Cost Breakdown - Detailed List */}
              <div className="bg-default-50 dark:bg-default-300/20 p-6 rounded-xl">
                <h3 className="text-md font-semibold mb-4">Cost Breakdown</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-400">Initial Amount</span>
                    <span className="font-medium">₹{registrationData.init_amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-400">
                    <span className="text-gray-400">Acceptance Amount</span>
                    <span className="font-medium">₹{registrationData.accept_amount.toLocaleString()}</span>
                  </div>
                  {registrationData.discount > 0 && (
                    <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-gray-400">Discount Applied</span>
                      <span className="font-medium text-green-600">- ₹{registrationData.discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2">
                    <span className="font-semibold">Total Amount</span>
                    <span className="font-bold text-lg">₹{registrationData.total_amount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Transaction Details - Only show if registered */}
              {registrationData.status === 'registered' && (
                <div className="bg-default-50 dark:bg-default-900/20 p-6 rounded-xl">
                  <h3 className="text-md font-semibold mb-4">Transaction Information</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Payment Method</p>
                      <Chip
                        color={registrationData.transactions.transaction_type === 'Cash' ? 'warning' : 'primary'}
                        variant="flat"
                      >
                        {registrationData.transactions.transaction_type}
                      </Chip>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Transaction ID</p>
                      <p className="font-medium">{registrationData.transactions.transaction_id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Transaction Date</p>
                      <p className="font-medium">{formatDate(registrationData.transactions.transaction_date)}</p>
                    </div>
                    {registrationData.transactions.additional_info.upi_id && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">UPI ID</p>
                        <p className="font-medium">{registrationData.transactions.additional_info.upi_id}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Bank Details - Show after financial details */}
          {registrationData.status === 'registered' && (
            <Card className="w-full md:col-span-2">
              <CardHeader>
                <h2 className="text-xl font-bold">Bank Information</h2>
              </CardHeader>
              <Divider />
              <CardBody className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <InfoField label="Bank Name" value={registrationData.bank_accounts.bank} />
                  <InfoField label="Branch" value={registrationData.bank_accounts.branch} />
                  <InfoField label="Account Name" value={registrationData.bank_accounts.account_name} />
                  <InfoField label="Account Holder" value={registrationData.bank_accounts.account_holder_name} />
                  <InfoField label="Account Number" value={registrationData.bank_accounts.account_number} />
                  <InfoField label="Account Type" value={registrationData.bank_accounts.account_type} />
                  <InfoField label="IFSC Code" value={registrationData.bank_accounts.ifsc_code} />
                  {registrationData.bank_accounts.upi_id && (
                    <InfoField label="UPI ID" value={registrationData.bank_accounts.upi_id} />
                  )}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Notes Section */}
          {registrationData.notes && (
            <Card className="w-full md:col-span-2">
              <CardHeader>
                <h2 className="text-xl font-bold">Notes</h2>
              </CardHeader>
              <Divider />
              <CardBody>
                <p className="text-gray-600">{registrationData.notes}</p>
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      <Modal 
        isOpen={isPaymentModalOpen} 
        onClose={() => {
          onPaymentModalClose();
          reset();
        }}
        size="2xl"
      >
        <ModalContent>
          <form onSubmit={handleSubmit(handleApprove)}>
            <ModalHeader>Payment Details</ModalHeader>
            <ModalBody className="space-y-4">
              {/* Payment Mode */}
              <Select
                label="Payment Mode"
                {...register("paymentMode")}
              >
                <SelectItem key="cash" value="cash">Cash</SelectItem>
                <SelectItem key="upi" value="upi">UPI</SelectItem>
                <SelectItem key="netbanking" value="netbanking">Net Banking</SelectItem>
                <SelectItem key="card" value="card">Card</SelectItem>
                <SelectItem key="cheque" value="cheque">Cheque</SelectItem>
                <SelectItem key="wallet" value="wallet">Wallet</SelectItem>
                <SelectItem key="gateway" value="gateway">Payment Gateway</SelectItem>
                <SelectItem key="crypto" value="crypto">Cryptocurrency</SelectItem>
              </Select>

              {/* Amount and Date */}
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="number"
                  label="Amount"
                  {...register("amount", { required: true })}
                />
                <Input
                  type="date"
                  label="Transaction Date"
                  {...register("transactionDate", { required: true })}
                />
              </div>

              {/* Dynamic Payment Fields */}
              {renderPaymentFields()}

              {/* Add editor selection */}
              <select
                className="w-full p-2 rounded-lg border border-gray-300"
                {...register("assigned_to", { required: "Editor assignment is required" })}
              >
                <option value="">Select Editor to Assign</option>
                {editors.map((editor) => (
                  <option key={editor.id} value={editor.id}>
                    {editor.username}
                  </option>
                ))}
              </select>
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={onPaymentModalClose}>
                Cancel
              </Button>
              <Button color="primary" type="submit">
                Complete Approval
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={onDeleteModalClose}>
        <ModalContent>
          <ModalHeader>Confirm Delete</ModalHeader>
          <ModalBody>
            Are you sure you want to delete this registration? This action cannot be undone.
          </ModalBody>
          <ModalFooter>
            <Button color="default" variant="light" onPress={onDeleteModalClose}>
              Cancel
            </Button>
            <Button 
              color="danger" 
              onPress={handleDelete}
              isLoading={isDeleting}
            >
              Delete Registration
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

// Helper component for displaying info fields
const InfoField = ({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) => (
  <div className="space-y-1">
    <p className="text-sm text-gray-600">{label}</p>
    {children || <p className="font-medium">{value}</p>}
  </div>
);

interface PageProps {
  params: Promise<{ id: string }>;
}

function RegistrationView({ params }: PageProps) {
  const resolvedParams = React.use(params);
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RegistrationContent regId={resolvedParams.id} />
    </Suspense>
  );
}

export default withExecutiveAuth(RegistrationView);
