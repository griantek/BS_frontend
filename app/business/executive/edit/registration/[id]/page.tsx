"use client";
import React, { Suspense } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { checkAuth } from "@/utils/authCheck";
import api from "@/services/api";
import { toast } from "react-toastify";
import { withExecutiveAuth } from "@/components/withExecutiveAuth";
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Input,
  Divider,
  Chip,
} from "@nextui-org/react";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { PERIOD_UNITS } from "@/constants/quotation";
import type { Registration, BankAccount, Service, Editor } from "@/services/api";
import type { PeriodUnit } from "@/constants/quotation";
import { LoadingSpinner } from "@/components/LoadingSpinner";

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

// Add interface for prospectus data
interface ProspectusData {
  id: number;
  date: string;
  email: string;
  notes: string;
  phone: string;
  state: string;
  reg_id: string;
  leads_id: number;
  services: string;
  entity_id: string;
  created_at: string;
  department: string;
  updated_at: string;
  client_name: string;
  requirement: string;
  tech_person: string;
  isregistered: boolean;
  next_follow_up: string;
  proposed_service_period: string;
}

// Add interface for bank account data
interface BankAccountData {
  id: string;
  bank: string;
  branch: string;
  upi_id: string;
  ifsc_code: string;
  created_at: string;
  updated_at: string;
  account_name: string;
  account_type: string;
  account_number: string;
  account_holder_name: string;
}

// Add interface for transaction data
interface TransactionData {
  id: number;
  amount: number;
  entity_id: string;
  updated_at: string;
  transaction_id: string;
  additional_info: TransactionAdditionalInfo;
  transaction_date: string;
  transaction_type: string;
}

// Add type for registration status
type RegistrationStatus = "pending" | "registered" | "waiting for approval";

// Update ExtendedRegistration interface to match the actual API response
interface ExtendedRegistration {
  id: number;
  prospectus_id: number;
  date: string;
  services: string;
  init_amount: number;
  accept_amount: number;
  discount: number;
  total_amount: number;
  accept_period: string;
  pub_period: string;
  bank_id: string;
  status: RegistrationStatus;
  month: number;
  year: number;
  created_at: string;
  transaction_id: number;
  notes: string | null;
  updated_at: string;
  // assigned_to: string | null;
  registered_by: string;
  client_id: string;
  admin_assigned: boolean;
  journal_added: boolean;
  author_status: string;
  file_path: string | null;
  author_comments: string | null;
  
  // Nested objects
  prospectus: ProspectusData;
  bank_accounts: BankAccountData;
  transactions: TransactionData;
}

interface RegistrationFormData {
  selectedServices: string[];
  initialAmount: number;
  acceptanceAmount: number;
  discountPercentage: number;
  // assigned_to: string;
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
  const [editors, setEditors] = React.useState<Editor[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<RegistrationFormData>({
    // Add default values to prevent undefined errors
    defaultValues: {
      selectedServices: [],
      initialAmount: 0,
      acceptanceAmount: 0,
      discountPercentage: 0,
      discountAmount: 0,
      subTotal: 0,
      totalAmount: 0,
      acceptancePeriod: 0,
      acceptancePeriodUnit: "months",
      publicationPeriod: 0,
      publicationPeriodUnit: "months",
      selectedBank: "",
      paymentMode: "cash",
      amount: 0,
      transactionDate: new Date().toISOString().split("T")[0]
    }
  });

  // Add a safe watch helper function to prevent undefined errors
  const safeWatch = <T extends keyof RegistrationFormData>(field: T): RegistrationFormData[T] => {
    const value = watch(field);
    if (value === undefined) {
      // Return appropriate default value based on field type
      if (field === 'selectedServices') return [] as any;
      if (field === 'initialAmount' || field === 'acceptanceAmount' || 
          field === 'discountPercentage' || field === 'discountAmount' || 
          field === 'subTotal' || field === 'totalAmount' ||
          field === 'acceptancePeriod' || field === 'publicationPeriod' ||
          field === 'amount') return 0 as any;
      if (field === 'acceptancePeriodUnit' || field === 'publicationPeriodUnit') 
        return 'months' as any;
      if (field === 'selectedBank' || field === 'paymentMode') return '' as any;
      return '' as any;
    }
    return value;
  };

  // Calculate totals effect - use safeWatch instead of watch
  React.useEffect(() => {
    const initialAmount = getNumericValue(safeWatch("initialAmount"));
    const acceptanceAmount = getNumericValue(safeWatch("acceptanceAmount"));
    const discountPercentage = getNumericValue(safeWatch("discountPercentage"));

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
        const [regResponse, servicesResponse, bankResponse, editorsResponse] = await Promise.all([
          api.getRegistrationById(parseInt(regId)),
          api.getAllServices(),
          api.getAllBankAccounts(),
          api.getAllEditors(),
        ]);
        console.log('Fetched data:',regResponse);
        if (regResponse.success) {
          // First cast to unknown, then to ExtendedRegistration to avoid type error
          const reg = regResponse.data as unknown as ExtendedRegistration;
          
          setRegistrationData(reg);
          setServices(servicesResponse.data);
          setBankAccounts(bankResponse.data);
          setEditors(editorsResponse.data);
          
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
      const updatedServices = [
        ...safeWatch("selectedServices"),
        service.id.toString(),
      ];
      setValue("selectedServices", updatedServices);

      const initialAmount = updatedServices.reduce((sum, serviceId) => {
        const selectedService = services.find(
          (s) => s.id === parseInt(serviceId)
        );
        return sum + (selectedService?.fee || 0);
      }, 0);

      setValue("initialAmount", initialAmount);
    }
  };

  const removeService = (serviceId: string) => {
    const updatedServices = safeWatch("selectedServices").filter(
      (id) => id !== serviceId
    );
    setValue("selectedServices", updatedServices);

    const initialAmount = updatedServices.reduce((sum, id) => {
      const service = services.find((s) => s.id === parseInt(id));
      return sum + (service?.fee || 0);
    }, 0);

    setValue("initialAmount", initialAmount);
  };

  const renderPaymentFields = () => {
    const paymentMode = safeWatch("paymentMode");

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

      // Get user data for entity_id
      const user = api.getStoredUser();
      if (!user?.id) {
        toast.error("User data not found");
        return;
      }

      // Get selected services names
      const selectedServiceNames = data.selectedServices
        .map((id) => services.find((s) => s.id === parseInt(id))?.service_name)
        .filter(Boolean)
        .join(", ");

      // Convert the form data to match API expectations
      const updateData = {
        services: selectedServiceNames,
        init_amount: Number(data.initialAmount),
        accept_amount: Number(data.acceptanceAmount),
        discount: Number(data.discountAmount),
        total_amount: Number(data.totalAmount),
        accept_period: `${data.acceptancePeriod} ${data.acceptancePeriodUnit}`,
        pub_period: `${data.publicationPeriod} ${data.publicationPeriodUnit}`,
        bank_id: data.selectedBank,
        // Cast status to a valid RegistrationStatus type to avoid compilation errors
        status: registrationData.status as RegistrationStatus,
        month: registrationData.month,
        year: registrationData.year,
        entity_id: user.id,
      };

      console.log('Sending update request:', {
        registrationId: registrationData.id,
        updateData
      });

      const response = await api.updateRegistration(registrationData.id, updateData);

      if (response.success) {
        toast.success('Registration updated successfully');
        router.push(`/business/executive/view/registration/${regId}`);
      } else {
        toast.error('Failed to update registration');
      }
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Failed to update registration');
    }
  };

  // Replace simple loading text with LoadingSpinner component
  if (isLoading) return <LoadingSpinner text="Loading registration data..." />;
  if (!registrationData) return <LoadingSpinner text="No registration data found" />;

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

      <div className="w-full max-w-6xl mx-auto p-4 md:p-6">
        <Card className="w-full shadow-lg">
          <CardHeader className="flex flex-col items-start px-6 py-5 bg-primary-50 dark:bg-primary-900/20">
            <h1 className="text-2xl font-bold text-primary">Edit Registration</h1>
            <p className="text-sm text-default-600">
              Registration ID: {registrationData.prospectus.reg_id}
            </p>
          </CardHeader>
          <Divider />
          
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardBody className="p-0">
              {/* Client Information Section */}
              <div className="p-6 bg-default-50 border-b border-default-100">
                <h2 className="text-lg font-semibold mb-4">Client Information</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-default-600">Name</p>
                    <p className="font-medium">{registrationData.prospectus.client_name || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-default-600">Email</p>
                    <p className="font-medium">{registrationData.prospectus.email || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-default-600">Phone</p>
                    <p className="font-medium">{registrationData.prospectus.phone || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-default-600">Status</p>
                    <Chip size="sm" color={registrationData.status === "registered" ? "success" : "warning"}>
                      {registrationData.status}
                    </Chip>
                  </div>
                  <div>
                    <p className="text-default-600">Department</p>
                    <p className="font-medium">{registrationData.prospectus.department || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-default-600">State</p>
                    <p className="font-medium">{registrationData.prospectus.state || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-default-600">Requirement</p>
                    <p className="font-medium">{registrationData.prospectus.requirement || "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* Services Section */}
              <div className="p-6 border-b border-default-100">
                <h2 className="text-lg font-semibold mb-4">Services</h2>
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
                        disabled={safeWatch('selectedServices').includes(service.id.toString())}
                      >
                        {service.service_name} - ₹{service.fee.toLocaleString()}
                        {safeWatch('selectedServices').includes(service.id.toString()) ? ' (Selected)' : ''}
                      </option>
                    ))}
                  </select>

                  {/* Selected Services Display */}
                  {safeWatch("selectedServices").length > 0 && (
                    <div className="bg-default-100 p-4 rounded-lg space-y-2">
                      <h4 className="text-sm font-medium">Selected Services</h4>
                      <div className="flex flex-wrap gap-2">
                        {safeWatch("selectedServices").map((serviceId) => {
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
              </div>

              {/* Amount & Period Section */}
              <div className="p-6 border-b border-default-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column - Amounts */}
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold mb-2">Amount Details</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        type="number"
                        label="Initial Amount (INR)"
                        value={safeWatch("initialAmount")?.toString()}
                        readOnly
                      />
                      <Input
                        type="number"
                        label="Acceptance Amount (INR)"
                        {...register("acceptanceAmount")}
                      />
                      <Input
                        type="number"
                        label="Discount (%)"
                        min="0"
                        max="100"
                        {...register("discountPercentage")}
                      />
                    </div>

                    {/* Total Amount Summary */}
                    <Card
                      className="relative overflow-hidden"
                      classNames={{
                        base: "border border-default-200/50 bg-gradient-to-br from-default-50 to-default-100 dark:from-default-100 dark:to-default-50",
                      }}
                    >
                      <CardBody className="p-4">
                        <div className="space-y-3">
                          {/* Sub Total Row */}
                          <div className="flex justify-between items-center">
                            <span className="text-default-600">Sub Total</span>
                            <Chip
                              variant="flat"
                              classNames={{
                                base: "bg-default-100 border-default-200",
                                content:
                                  "text-default-600 font-semibold text-medium",
                              }}
                            >
                              ₹ {safeWatch("subTotal").toLocaleString()}
                            </Chip>
                          </div>

                          {/* Discount Row */}
                          {getNumericValue(safeWatch("discountPercentage")) > 0 && (
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <span className="text-danger-600">Discount</span>
                                <Chip
                                  size="sm"
                                  variant="flat"
                                  color="danger"
                                  classNames={{
                                    base: "h-5 bg-danger-50 dark:bg-danger-100",
                                    content:
                                      "text-tiny font-medium px-2 text-danger",
                                  }}
                                >
                                  {safeWatch("discountPercentage")}% off
                                </Chip>
                              </div>
                              <span className="text-danger font-medium">
                                - ₹ {safeWatch("discountAmount").toLocaleString()}
                              </span>
                            </div>
                          )}

                          <Divider className="my-3 bg-default-200/50" />

                          {/* Total Amount Row */}
                          <div className="flex justify-between items-center">
                            <span className="text-lg font-semibold text-default-900">
                              Total Amount
                            </span>
                            <div className="flex flex-col items-end gap-1">
                              <Chip
                                size="lg"
                                classNames={{
                                  base: "bg-primary/10 border-primary/20 px-4",
                                  content: "text-lg font-bold text-primary",
                                }}
                              >
                                ₹ {safeWatch("totalAmount").toLocaleString()}
                              </Chip>
                              <span className="text-tiny text-default-500">
                                {getNumericValue(safeWatch("discountPercentage")) > 0
                                  ? "After discount applied"
                                  : "No discount applied"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  </div>

                  {/* Right Column - Periods */}
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold mb-2">Period Settings</h2>
                    <div className="space-y-4">
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

                      {/* Bank Account */}
                      <div className="space-y-2 mt-4">
                        <label htmlFor="bank-select" className="text-sm font-medium">
                          Select Bank Account
                        </label>
                        <select
                          id="bank-select"
                          className="w-full p-2 rounded-lg border border-gray-300"
                          {...register("selectedBank")}
                        >
                          <option value="">Choose a bank account</option>
                          {bankAccounts.map((account) => (
                            <option key={account.id} value={account.id}>
                              {account.account_name} - {account.bank}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Details - Conditionally shown */}
              {registrationData?.status === 'registered' && (
                <div className="p-6 border-b border-default-100">
                  <h2 className="text-lg font-semibold mb-4">Payment Details</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="w-full space-y-2">
                        <label htmlFor="payment-mode" className="text-sm font-medium">
                          Payment Method
                        </label>
                        <select
                          id="payment-mode"
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
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                          type="date"
                          label="Transaction Date"
                          {...register('transactionDate')}
                        />
                        <Input
                          type="number"
                          label="Amount Paid (₹)"
                          {...register('amount')}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {renderPaymentFields()}
                    </div>
                  </div>
                </div>
              )}

              {/* Editor Assignment Section */}
              {/* <div className="p-6 border-b border-default-100">
                <h2 className="text-lg font-semibold mb-4">Editor Assignment</h2>
                <div className="w-full max-w-md">
                  <div className="space-y-2">
                    <label htmlFor="editor-select" className="text-sm font-medium">
                      Assign to Editor
                    </label>
                    <select
                      id="editor-select"
                      className="w-full p-2 rounded-lg border border-gray-300"
                      {...register("assigned_to")}
                    >
                      <option value="">Select Editor to Assign</option>
                      {editors.map((editor) => (
                        <option key={editor.id} value={editor.id}>
                          {editor.username}
                        </option>
                      ))}
                    </select>
                    {errors.assigned_to && (
                      <p className="text-danger-500 text-sm mt-1">
                        {errors.assigned_to.message}
                      </p>
                    )}
                  </div>
                </div>
              </div> */}

              {/* Action Buttons */}
              <div className="p-6 flex justify-end gap-3">
                <Button
                  color="danger"
                  variant="light"
                  size="lg"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button 
                  color="primary" 
                  type="submit"
                  size="lg"
                >
                  Update Registration
                </Button>
              </div>
            </CardBody>
          </form>
        </Card>
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
    <Suspense fallback={<LoadingSpinner />}>
      <EditRegistrationContent regId={resolvedParams.id} />
    </Suspense>
  );
}

export default withExecutiveAuth(EditRegistrationPage);
