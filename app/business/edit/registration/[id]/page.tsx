"use client";
import React, { Suspense } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { checkAuth } from "@/utils/authCheck";
import api from "@/services/api";
import { toast } from "react-toastify";
import { withAdminAuth } from "@/components/withAdminAuth";
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Input,
  Select,
  SelectItem,
  Divider,
  Chip,
} from "@nextui-org/react";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { PERIOD_UNITS } from "@/constants/quotation";
import type { Registration, BankAccount, Service } from "@/services/api";
import type { PeriodUnit } from "@/constants/quotation";

// Add helper function
const getNumericValue = (value: number | undefined): number => {
  if (typeof value !== 'number') return 0;
  return isNaN(value) ? 0 : value;
};

// Define payment mode map with proper typing
const PAYMENT_MODE_MAP = {
  cash: "Cash",
  upi: "UPI",
  netbanking: "Bank Transfer",
  card: "Card",
  cheque: "Cheque",
  wallet: "Wallet",
  gateway: "Online Payment",
  crypto: "Crypto",
} as const;

// Define reverse mapping type for transaction type to form value
type TransactionTypeToFormMode = {
  [K in typeof PAYMENT_MODE_MAP[keyof typeof PAYMENT_MODE_MAP]]: keyof typeof PAYMENT_MODE_MAP;
};

// Create reverse mapping
const TRANSACTION_TYPE_TO_FORM_MODE: TransactionTypeToFormMode = {
  "Cash": "cash",
  "UPI": "upi",
  "Bank Transfer": "netbanking",
  "Card": "card",
  "Cheque": "cheque",
  "Wallet": "wallet",
  "Online Payment": "gateway",
  "Crypto": "crypto",
} as const;

// Add interface for additional info
interface TransactionAdditionalInfo {
  upi_id?: string;
  account_number?: string;
  ifsc_code?: string;
  card_last_four?: string;
  receipt_number?: string;
  cheque_number?: string;
  wallet_provider?: string;
  gateway_provider?: string;
  transaction_hash?: string;
  crypto_currency?: string;
  [key: string]: any; // Allow for other properties
}

// Update Registration type to include proper typing for transactions
interface ExtendedRegistration extends Omit<Registration, 'transactions'> {
  transactions: {
    id: number;
    amount: number;
    exec_id: string;
    transaction_id: string;
    transaction_date: string;
    transaction_type: string;
    additional_info: TransactionAdditionalInfo;
    executive?: object; // Make executive optional
  };
}

interface RegistrationFormData {
  selectedServices: string[];
  initialAmount: number;
  acceptanceAmount: number;
  discountPercentage: number;
  discountAmount: number;
  subTotal: number;
  totalAmount: number;
  acceptancePeriod: number;
  acceptancePeriodUnit: PeriodUnit;
  publicationPeriod: number;
  publicationPeriodUnit: PeriodUnit;
  selectedBank: string;
  paymentMode: keyof typeof PAYMENT_MODE_MAP;
  amount: number;
  transactionDate: string;
  // Add these payment-related fields
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
}

function EditRegistrationContent({ regId }: { regId: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(true);
  const [registrationData, setRegistrationData] = React.useState<ExtendedRegistration | null>(null);
  const [bankAccounts, setBankAccounts] = React.useState<BankAccount[]>([]);
  const [services, setServices] = React.useState<Service[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<RegistrationFormData>();

  // Calculate totals effect
  React.useEffect(() => {
    const initialAmount = getNumericValue(watch("initialAmount"));
    const acceptanceAmount = getNumericValue(watch("acceptanceAmount"));
    const discountPercentage = getNumericValue(watch("discountPercentage"));

    const subTotal = initialAmount + acceptanceAmount;
    const discountAmount = (subTotal * discountPercentage) / 100;
    const total = subTotal - discountAmount;

    setValue("subTotal", subTotal);
    setValue("discountAmount", discountAmount);
    setValue("totalAmount", total);
  }, [watch("initialAmount"), watch("acceptanceAmount"), watch("discountPercentage"), setValue]);

  // Fetch data effect
  React.useEffect(() => {
    if (!checkAuth(router)) return;
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [regResponse, servicesResponse, bankResponse] = await Promise.all([
          api.getRegistrationById(parseInt(regId)),
          api.getAllServices(),
          api.getAllBankAccounts(),
        ]);
        
        if (regResponse.success) {
          const reg = regResponse.data as ExtendedRegistration; // Type assertion here
          setRegistrationData(reg);
          setServices(servicesResponse.data);
          setBankAccounts(bankResponse.data);
          
          // Parse periods
          const [acceptPeriodValue, acceptPeriodUnit] = reg.accept_period.split(' ');
          const [pubPeriodValue, pubPeriodUnit] = reg.pub_period.split(' ');
          
          // Get service IDs from service names
          const serviceNames = reg.services.split(', ');
          const serviceIds = servicesResponse.data
            .filter(service => serviceNames.includes(service.service_name))
            .map(service => service.id.toString());

          // Pre-fill form with correct data mapping
          reset({
            selectedServices: serviceIds,
            initialAmount: reg.init_amount,
            acceptanceAmount: reg.accept_amount,
            discountAmount: reg.discount,
            totalAmount: reg.total_amount,
            discountPercentage: (reg.discount / (reg.init_amount + reg.accept_amount)) * 100,
            acceptancePeriod: parseInt(acceptPeriodValue),
            acceptancePeriodUnit: acceptPeriodUnit as PeriodUnit,
            publicationPeriod: parseInt(pubPeriodValue),
            publicationPeriodUnit: pubPeriodUnit as PeriodUnit,
            selectedBank: reg.bank_id,
            // Fix payment mode mapping
            paymentMode: Object.entries(PAYMENT_MODE_MAP).find(
              ([_, value]) => value === reg.transactions.transaction_type
            )?.[0] as keyof typeof PAYMENT_MODE_MAP || 'cash',
            amount: reg.transactions.amount,
            transactionDate: reg.transactions.transaction_date,
            transactionId: reg.transactions.transaction_id,
            // Map additional payment info
            ...(reg.transactions.additional_info || {}),
            // If it's a bank transfer, map these fields
            ...(reg.transactions.transaction_type === 'Bank Transfer' && {
              accountNumber: reg.transactions.additional_info.account_number,
              ifscCode: reg.transactions.additional_info.ifsc_code,
            }),
          });
        }
      } catch (error) {
        toast.error("Failed to load registration");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [regId, router, reset]);

  const handleServiceChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const service = services.find((s) => s.id === parseInt(event.target.value));
    if (service) {
      const updatedServices = [...watch("selectedServices"), service.id.toString()];
      setValue("selectedServices", updatedServices);

      const initialAmount = updatedServices.reduce((sum, serviceId) => {
        const selectedService = services.find((s) => s.id === parseInt(serviceId));
        return sum + (selectedService?.fee || 0);
      }, 0);

      setValue("initialAmount", initialAmount);
    }
  };

  const removeService = (serviceId: string) => {
    const updatedServices = watch("selectedServices").filter((id) => id !== serviceId);
    setValue("selectedServices", updatedServices);

    const initialAmount = updatedServices.reduce((sum, id) => {
      const service = services.find((s) => s.id === parseInt(id));
      return sum + (service?.fee || 0);
    }, 0);

    setValue("initialAmount", initialAmount);
  };

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
          </>
        );

      case "card":
        return (
          <>
            <Input
              type="text"
              label="Last 4 Digits of Card"
              maxLength={4}
              pattern="[0-9]{4}"
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
            <select
              className="w-full p-2 rounded-lg border border-gray-300"
              {...register("walletProvider")}
            >
              <option value="">Select Wallet Provider</option>
              <option value="paytm">Paytm</option>
              <option value="phonepe">PhonePe</option>
              <option value="other">Other</option>
            </select>
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
            <select
              className="w-full p-2 rounded-lg border border-gray-300"
              {...register("gatewayProvider")}
            >
              <option value="">Select Payment Gateway</option>
              <option value="razorpay">Razorpay</option>
              <option value="stripe">Stripe</option>
              <option value="other">Other</option>
            </select>
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

  const onSubmit = async (data: RegistrationFormData) => {
    try {
      if (!registrationData) return;

      // Get user data for exec_id
      const user = api.getStoredUser();
      if (!user?.id) {
        toast.error("User data not found");
        return;
      }

      // Prepare additional info based on payment mode
      const additionalInfo: Record<string, any> = {};
      switch (data.paymentMode) {
        case "upi":
          additionalInfo.upi_id = data.upiId;
          break;
        case "netbanking":
          additionalInfo.account_number = data.accountNumber;
          additionalInfo.ifsc_code = data.ifscCode;
          break;
        case "card":
          additionalInfo.card_last_four = data.cardLastFourDigits;
          break;
        case "cash":
          additionalInfo.receipt_number = data.receiptNumber;
          break;
        case "cheque":
          additionalInfo.cheque_number = data.chequeNumber;
          break;
        case "wallet":
          additionalInfo.wallet_provider = data.walletProvider;
          break;
        case "gateway":
          additionalInfo.gateway_provider = data.gatewayProvider;
          break;
        case "crypto":
          additionalInfo.transaction_hash = data.transactionHash;
          additionalInfo.crypto_currency = data.cryptoCurrency;
          break;
      }

      // Prepare update data
      const updateData = {
        services: data.selectedServices
          .map((id) => services.find((s) => s.id === parseInt(id))?.service_name)
          .filter(Boolean)
          .join(", "),
        init_amount: data.initialAmount,
        accept_amount: data.acceptanceAmount,
        discount: data.discountAmount,
        total_amount: data.totalAmount,
        accept_period: `${data.acceptancePeriod} ${data.acceptancePeriodUnit}`,
        pub_period: `${data.publicationPeriod} ${data.publicationPeriodUnit}`,
        bank_id: data.selectedBank,
        transaction_type: PAYMENT_MODE_MAP[data.paymentMode],
        transaction_id: data.transactionId || "",
        amount: data.amount,
        transaction_date: data.transactionDate,
        additional_info: additionalInfo,
        exec_id: user.id,
      };

      // Log the request body
      console.log('Update Registration Request:', {
        registrationId: registrationData.id,
        updateData: updateData,
        formData: data, // Log original form data for debugging
      });

      const response = await api.updateRegistration(registrationData.id, updateData);

      if (response.success) {
        toast.success("Registration updated successfully");
        router.push(`/business/view/registration/${regId}`);
      } else {
        toast.error("Failed to update registration");
      }
    } catch (error) {
      console.error('Update Registration Error:', error);
      toast.error("Failed to update registration");
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (!registrationData) return <div>No data found</div>;

  return (
    <>
      <Button
        isIconOnly
        variant="light"
        className="fixed top-4 left-4 z-50"
        onClick={() => router.back()}
      >
        <ArrowLeftIcon className="h-5 w-5" />
      </Button>

      <div className="w-full p-4 md:p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6"> 
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Left side - Registration Details */}
            <Card className="w-full">
              <CardHeader>
                <h2 className="text-xl font-bold">Registration Details</h2>
              </CardHeader>
              <Divider />
              <CardBody className="space-y-4">
                {/* Remove form tag from here */}
                <div className="space-y-4">
                  <select
                    className="w-full p-2 rounded-lg border border-gray-300"
                    onChange={handleServiceChange}
                    value=""
                  >
                    <option value="">Add a service</option>
                    {services.map((service) => (
                      <option 
                        key={service.id} 
                        value={service.id}
                        disabled={watch('selectedServices').includes(service.id.toString())}
                      >
                        {service.service_name} - ₹{service.fee.toLocaleString()}
                        {watch('selectedServices').includes(service.id.toString()) ? ' (Selected)' : ''}
                      </option>
                    ))}
                  </select>

                  {/* Selected Services Display */}
                  {watch("selectedServices").length > 0 && (
                    <div className="bg-default-100 p-4 rounded-lg space-y-2">
                      <h4 className="text-sm font-medium">Selected Services</h4>
                      <div className="flex flex-wrap gap-2">
                        {watch("selectedServices").map((serviceId) => {
                          const service = services.find(
                            (s) => s.id === parseInt(serviceId)
                          );
                          return (
                            service && (
                              <Chip
                                key={service.id}
                                onClose={() => removeService(serviceId)}
                                variant="flat"
                                color="primary"
                              >
                                {service.service_name} - ₹
                                {service.fee.toLocaleString()}
                              </Chip>
                            )
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Amount Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    type="number"
                    label="Initial Amount (₹)"
                    value={watch("initialAmount")?.toString()}
                    readOnly
                  />
                  <Input
                    type="number"
                    label="Acceptance Amount (₹)"
                    {...register("acceptanceAmount")}
                  />
                  <Input
                    type="number"
                    label="Discount (%)"
                    {...register("discountPercentage")}
                  />
                  <Input
                    type="number"
                    label="Total Amount (₹)"
                    value={watch("totalAmount")?.toString()}
                    readOnly
                  />
                </div>

                {/* Period Settings */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      label="Acceptance Period"
                      {...register("acceptancePeriod")}
                    />
                    <select
                      className="w-1/2 p-2 rounded-lg border border-gray-300"
                      {...register("acceptancePeriodUnit")}
                    >
                      {PERIOD_UNITS.map((unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      label="Publication Period"
                      {...register("publicationPeriod")}
                    />
                    <select
                      className="w-1/2 p-2 rounded-lg border border-gray-300"
                      {...register("publicationPeriodUnit")}
                    >
                      {PERIOD_UNITS.map((unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Right side - Payment Details */}
            <Card className="w-full">
              <CardHeader>
                <h2 className="text-xl font-bold">Payment Details</h2>
              </CardHeader>
              <Divider />
              <CardBody>
                {/* Bank and Payment Details */}
                <div className="space-y-4">
                  <select
                    className="w-full p-2 rounded-lg border border-gray-300"
                    {...register("selectedBank")}
                  >
                    <option value="">Select Bank Account</option>
                    {bankAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.account_name} - {account.bank}
                      </option>
                    ))}
                  </select>

                  <select
                    className="w-full p-2 rounded-lg border border-gray-300"
                    {...register("paymentMode")}
                  >
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                    <option value="netbanking">Net Banking</option>
                    <option value="card">Credit/Debit Card</option>
                    <option value="cheque">Cheque</option>
                    <option value="wallet">Wallet</option>
                    <option value="gateway">Payment Gateway</option>
                    <option value="crypto">Cryptocurrency</option>
                  </select>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      type="date"
                      label="Transaction Date"
                      defaultValue={new Date().toISOString().split('T')[0]}
                      {...register('transactionDate', { required: 'Transaction date is required' })}
                    />
                    <Input
                      type="number"
                      label="Amount Paid (₹)"
                      required
                      {...register('amount', { required: 'Amount is required' })}
                    />
                  </div>

                  {renderPaymentFields()}
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Move buttons inside form */}
          <div className="flex justify-end gap-3 mt-6">
            <Button
              color="danger"
              variant="light"
              onClick={() => router.back()}
              type="button"
            >
              Cancel
            </Button>
            <Button color="primary" type="submit">
              Update Registration
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}

interface PageProps {
  params: Promise<{ id: string }>;
}

function EditRegistrationPage({ params }: PageProps) {
  const resolvedParams = React.use(params);
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EditRegistrationContent regId={resolvedParams.id} />
    </Suspense>
  );
}

export default withAdminAuth(EditRegistrationPage);
