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
} from "@heroui/react";
import { format } from 'date-fns';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import api from '@/services/api';
import { withAdminAuth } from '@/components/withAdminAuth';
import type { Registration } from '@/services/api';

interface ExtendedRegistration extends Registration {
  date: string;
  notes?: string;
  bank_accounts: {
    id: string;
    bank: string;
    branch: string;
    upi_id: string;
    ifsc_code: string;
    account_name: string;
    account_type: string;
    account_number: string;
    account_holder_name: string;
  };
  transactions: {
    id: number;
    amount: number;
    exec_id: string;
    transaction_id: string;
    transaction_date: string;
    transaction_type: string;
    additional_info: {
      upi_id?: string;
      [key: string]: any;
    };
  };
}

function RegistrationContent({ regId }: { regId: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(true);
  const [registrationData, setRegistrationData] = React.useState<ExtendedRegistration | null>(null);

  React.useEffect(() => {
    if (!checkAuth(router)) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await api.getRegistrationById(parseInt(regId));
        setRegistrationData(response.data as ExtendedRegistration);
      } catch (error) {
        console.error('Error fetching registration:', error);
        toast.error('Failed to load registration data');
        router.push('/business');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router, regId]);

  if (isLoading) return <div>Loading...</div>;
  if (!registrationData) return <div>No data found</div>;

  const formatDate = (date: string) => format(new Date(date), 'dd/MM/yyyy');

  return (
    <>
      <Button
        isIconOnly
        variant="light"
        className="fixed top-4 left-4 z-50"
        onClick={() => router.push('/business')}
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
                >
                  Approve Registration
                </Button>
              )}
              <Button
                color="danger"
                variant="flat"
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
                {registrationData.status === 'registered' ? (
                  <>
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl">
                      <p className="text-sm text-gray-600 mb-1">Amount Paid</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        ₹{registrationData.transactions.amount.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Paid on {formatDate(registrationData.transactions.transaction_date)}
                      </p>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl">
                      <p className="text-sm text-gray-600 mb-1">Balance Due</p>
                      <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        ₹{(registrationData.total_amount - registrationData.transactions.amount).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Pending payment</p>
                    </div>
                  </>
                ) : (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-xl col-span-2">
                    <p className="text-sm text-gray-600 mb-1">Payment Status</p>
                    <div className="flex items-center gap-2">
                      <Chip color="warning" variant="flat">Pending</Chip>
                      <p className="text-sm text-gray-500">Registration approval required</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Cost Breakdown - Detailed List */}
              <div className="bg-default-50 dark:bg-default-900/20 p-6 rounded-xl">
                <h3 className="text-md font-semibold mb-4">Cost Breakdown</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600">Initial Amount</span>
                    <span className="font-medium">₹{registrationData.init_amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600">Acceptance Amount</span>
                    <span className="font-medium">₹{registrationData.accept_amount.toLocaleString()}</span>
                  </div>
                  {registrationData.discount > 0 && (
                    <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-gray-600">Discount Applied</span>
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

export default withAdminAuth(RegistrationView);
