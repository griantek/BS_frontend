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
  selectedServicePrices: Record<string, number>;
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
      transactionDate: new Date().toISOString().split("T")[0],
      selectedServicePrices: {},
    }
  });

  const safeWatch = <T extends keyof RegistrationFormData>(field: T): RegistrationFormData[T] => {
    const value = watch(field);
    if (value === undefined) {
      if (field === 'selectedServices') return [] as any;
      if (field === 'initialAmount' || field === 'acceptanceAmount' || 
          field === 'discountPercentage' || field === 'discountAmount' || 
          field === 'subTotal' || field === 'totalAmount' ||
          field === 'acceptancePeriod' || field === 'publicationPeriod' ||
          field === 'amount') return 0 as any;
      if (field === 'acceptancePeriodUnit' || field === 'publicationPeriodUnit') 
        return 'months' as any;
      if (field === 'selectedBank' || field === 'paymentMode') return '' as any;
      if (field === 'selectedServicePrices') return {} as any;
      return '' as any;
    }
    return value;
  };

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
  }, [setValue, watch]);

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
          const reg = regResponse.data as unknown as ExtendedRegistration;
          
          setRegistrationData(reg);
          setServices(servicesResponse.data);
          setBankAccounts(bankResponse.data);
          setEditors(editorsResponse.data);
          
          const [acceptPeriodValue, acceptPeriodUnit] = reg.accept_period.split(' ');
          const [pubPeriodValue, pubPeriodUnit] = reg.pub_period.split(' ');
          
          const serviceNames = reg.services.split(', ');
          const serviceIds = servicesResponse.data
            .filter(service => serviceNames.includes(service.service_name))
            .map(service => service.id.toString());
            
          const servicePrices: Record<string, number> = {};
          serviceIds.forEach(id => {
            const service = servicesResponse.data.find(s => s.id.toString() === id);
            if (service) {
              servicePrices[id] = service.fee;
            }
          });
          
          const initAmount = Number(reg.init_amount);
          const acceptAmount = Number(reg.accept_amount);
          const calculatedSubTotal = initAmount + acceptAmount;

          reset({
            selectedServices: serviceIds,
            initialAmount: initAmount,
            acceptanceAmount: acceptAmount,
            discountAmount: reg.discount,
            totalAmount: reg.total_amount,
            subTotal: calculatedSubTotal,
            discountPercentage: (reg.discount / calculatedSubTotal) * 100,
            acceptancePeriod: parseInt(acceptPeriodValue),
            acceptancePeriodUnit: acceptPeriodUnit as PeriodUnit,
            publicationPeriod: parseInt(pubPeriodValue),
            publicationPeriodUnit: pubPeriodUnit as PeriodUnit,
            selectedBank: reg.bank_id,
            paymentMode: Object.entries(PAYMENT_MODE_MAP).find(
              ([_, value]) => value === reg.transactions.transaction_type
            )?.[0] as keyof typeof PAYMENT_MODE_MAP || 'cash',
            amount: reg.transactions.amount,
            transactionDate: reg.transactions.transaction_date,
            transactionId: reg.transactions.transaction_id,
            ...(reg.transactions.additional_info || {}),
            ...(reg.transactions.transaction_type === 'Bank Transfer' && {
              accountNumber: reg.transactions.additional_info.account_number,
              ifscCode: reg.transactions.additional_info.ifsc_code,
            }),
            selectedServicePrices: servicePrices,
          });
          
          setTimeout(() => {
            const initialAmount = getNumericValue(initAmount);
            const acceptanceAmount = getNumericValue(acceptAmount);
            const discountPercentage = getNumericValue((reg.discount / calculatedSubTotal) * 100);
            
            setValue("subTotal", initialAmount + acceptanceAmount);
            setValue("discountAmount", ((initialAmount + acceptanceAmount) * discountPercentage) / 100);
            setValue("totalAmount", (initialAmount + acceptanceAmount) - (((initialAmount + acceptanceAmount) * discountPercentage) / 100));
          }, 0);
        }
      } catch (error) {
        toast.error("Failed to load registration");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [regId, router, reset, setValue]);

  const handleServiceChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const service = services.find((s) => s.id === parseInt(event.target.value));
    if (service) {
      const updatedServices = [
        ...safeWatch("selectedServices"),
        service.id.toString(),
      ];
      setValue("selectedServices", updatedServices);

      const updatedPrices = { ...safeWatch("selectedServicePrices") };
      updatedPrices[service.id.toString()] = service.fee;
      setValue("selectedServicePrices", updatedPrices);

      recalculateInitialAmount(updatedServices, updatedPrices);
    }
  };

  const removeService = (serviceId: string) => {
    const updatedServices = safeWatch("selectedServices").filter(
      (id) => id !== serviceId
    );
    setValue("selectedServices", updatedServices);

    const updatedPrices = { ...safeWatch("selectedServicePrices") };
    delete updatedPrices[serviceId];
    setValue("selectedServicePrices", updatedPrices);

    recalculateInitialAmount(updatedServices, updatedPrices);
  };

  const handlePriceChange = (serviceId: string, price: number) => {
    const updatedPrices = { ...safeWatch("selectedServicePrices") };
    updatedPrices[serviceId] = price;
    setValue("selectedServicePrices", updatedPrices);

    recalculateInitialAmount(safeWatch("selectedServices"), updatedPrices);
  };

  const recalculateInitialAmount = (
    serviceIds: string[],
    prices: Record<string, number>
  ) => {
    const initialAmount = serviceIds.reduce((sum, id) => {
      return sum + (prices[id] || 0);
    }, 0);

    setValue("initialAmount", initialAmount);
  };

  const renderPaymentFields = () => {
    const paymentMode = safeWatch("paymentMode");

    switch (paymentMode) {
      case "upi":
        return (
          <div className="w-full space-y-4">
            <Input
              type="text"
              label="UPI ID"
              placeholder="example@upi"
              {...register("upiId")}
              className="w-full"
            />
            <Input
              type="text"
              label="Transaction ID"
              {...register("transactionId")}
              className="w-full"
            />
          </div>
        );

      case "netbanking":
        return (
          <div className="w-full space-y-4">
            <Input
              type="text"
              label="Account Number"
              {...register("accountNumber")}
              className="w-full"
            />
            <Input 
              type="text" 
              label="IFSC Code" 
              {...register("ifscCode")} 
              className="w-full"
            />
          </div>
        );

      case "card":
        return (
          <div className="w-full space-y-4">
            <Input
              type="text"
              label="Last 4 Digits of Card"
              maxLength={4}
              pattern="[0-9]{4}"
              {...register("cardLastFourDigits")}
              className="w-full"
            />
            <Input
              type="text"
              label="Transaction ID"
              {...register("transactionId")}
              className="w-full"
            />
          </div>
        );

      case "cash":
        return (
          <Input
            type="text"
            label="Receipt Number"
            {...register("receiptNumber")}
            className="w-full"
          />
        );

      case "cheque":
        return (
          <Input
            type="text"
            label="Cheque Number"
            {...register("chequeNumber")}
            className="w-full"
          />
        );

      case "wallet":
        return (
          <div className="w-full space-y-4">
            <div className="w-full">
              <label className="block text-sm font-medium mb-1">Wallet Provider</label>
              <select
                className="w-full p-2 rounded-lg border border-gray-300"
                {...register("walletProvider")}
              >
                <option value="">Select Wallet Provider</option>
                <option value="paytm">Paytm</option>
                <option value="phonepe">PhonePe</option>
                <option value="other">Other</option>
              </select>
            </div>
            <Input
              type="text"
              label="Transaction ID"
              {...register("transactionId")}
              className="w-full"
            />
          </div>
        );

      case "gateway":
        return (
          <div className="w-full space-y-4">
            <div className="w-full">
              <label className="block text-sm font-medium mb-1">Payment Gateway</label>
              <select
                className="w-full p-2 rounded-lg border border-gray-300"
                {...register("gatewayProvider")}
              >
                <option value="">Select Payment Gateway</option>
                <option value="razorpay">Razorpay</option>
                <option value="stripe">Stripe</option>
                <option value="other">Other</option>
              </select>
            </div>
            <Input
              type="text"
              label="Transaction ID"
              {...register("transactionId")}
              className="w-full"
            />
          </div>
        );

      case "crypto":
        return (
          <div className="w-full space-y-4">
            <Input
              type="text"
              label="Transaction Hash"
              {...register("transactionHash")}
              className="w-full"
            />
            <Input
              type="text"
              label="Cryptocurrency"
              {...register("cryptoCurrency")}
              className="w-full"
            />
          </div>
        );

      default:
        return null;
    }
  };

  const onSubmit = async (data: RegistrationFormData) => {
    try {
      if (!registrationData) return;

      const user = api.getStoredUser();
      if (!user?.id) {
        toast.error("User data not found");
        return;
      }

      const selectedServiceNames = data.selectedServices
        .map((id) => {
          const service = services.find((s) => s.id === parseInt(id));
          if (service) {
            const customPrice = data.selectedServicePrices[id] || service.fee;
            return service.service_name;
          }
          return null;
        })
        .filter(Boolean)
        .join(", ");

      const additionalInfo: Record<string, any> = {};
      
      switch (data.paymentMode) {
        case 'upi':
          if (data.upiId) additionalInfo.upi_id = data.upiId;
          break;
        case 'netbanking':
          if (data.accountNumber) additionalInfo.account_number = data.accountNumber;
          if (data.ifscCode) additionalInfo.ifsc_code = data.ifscCode;
          break;
        case 'card':
          if (data.cardLastFourDigits) additionalInfo.card_last_four = data.cardLastFourDigits;
          break;
        case 'cash':
          if (data.receiptNumber) additionalInfo.receipt_number = data.receiptNumber;
          break;
        case 'cheque':
          if (data.chequeNumber) additionalInfo.cheque_number = data.chequeNumber;
          break;
        case 'wallet':
          if (data.walletProvider) additionalInfo.wallet_provider = data.walletProvider;
          break;
        case 'gateway':
          if (data.gatewayProvider) additionalInfo.gateway_provider = data.gatewayProvider;
          break;
        case 'crypto':
          if (data.transactionHash) additionalInfo.transaction_hash = data.transactionHash;
          if (data.cryptoCurrency) additionalInfo.crypto_currency = data.cryptoCurrency;
          break;
      }

      const updateData = {
        services: selectedServiceNames,
        init_amount: Number(data.initialAmount),
        accept_amount: Number(data.acceptanceAmount),
        discount: Number(data.discountAmount),
        total_amount: Number(data.totalAmount),
        accept_period: `${data.acceptancePeriod} ${data.acceptancePeriodUnit}`,
        pub_period: `${data.publicationPeriod} ${data.publicationPeriodUnit}`,
        bank_id: data.selectedBank,
        status: registrationData.status as RegistrationStatus,
        month: registrationData.month,
        year: registrationData.year,
        entity_id: user.id,
        transaction_type: PAYMENT_MODE_MAP[data.paymentMode],
        transaction_id: data.transactionId || '',
        amount: Number(data.amount),
        transaction_date: data.transactionDate,
        additional_info: additionalInfo,
        service_and_prices: data.selectedServicePrices
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

                  {safeWatch("selectedServices").length > 0 && (
                    <div className="bg-default-100 p-4 rounded-lg space-y-2">
                      <h4 className="text-sm font-medium">Selected Services</h4>
                      <div className="space-y-3">
                        {safeWatch("selectedServices").map((serviceId) => {
                          const service = services.find(
                            (s) => s.id === parseInt(serviceId)
                          );
                          return (
                            service && (
                              <div key={service.id} className="flex flex-col gap-2 pb-2 border-b border-default-200 last:border-0">
                                <div className="flex justify-between items-center">
                                  <div className="font-medium">{service.service_name}</div>
                                  <Button 
                                    size="sm" 
                                    color="danger" 
                                    variant="light"
                                    onClick={() => removeService(serviceId)}
                                  >
                                    Remove
                                  </Button>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-default-600">Price (₹):</span>
                                  <Input
                                    type="number"
                                    min="0"
                                    size="sm"
                                    className="max-w-[150px]"
                                    value={safeWatch("selectedServicePrices")[serviceId]?.toString()}
                                    onChange={(e) => handlePriceChange(serviceId, Number(e.target.value))}
                                  />
                                </div>
                              </div>
                            )
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 border-b border-default-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                    <Card
                      className="relative overflow-hidden"
                      classNames={{
                        base: "border border-default-200/50 bg-gradient-to-br from-default-50 to-default-100 dark:from-default-100 dark:to-default-50",
                      }}
                    >
                      <CardBody className="p-4">
                        <div className="space-y-3">
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

              {registrationData?.status === 'registered' && (
                <div className="p-6 border-b border-default-100">
                  <h2 className="text-lg font-semibold mb-4">Payment Details</h2>
                  <div className="space-y-4">
                    {/* Row 1: Payment Method (full width) */}
                    <div className="w-full">
                      <label htmlFor="payment-mode" className="block text-sm font-medium mb-1">
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

                    {/* Row 2: Transaction Date and Amount Paid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        type="date"
                        label="Transaction Date"
                        {...register('transactionDate')}
                        className="w-full"
                      />
                      <Input
                        type="number"
                        label="Amount Paid (₹)"
                        {...register('amount')}
                        className="w-full"
                      />
                    </div>

                    {/* Row 3: Payment specific fields (full width) */}
                    <div className="w-full">
                      {renderPaymentFields()}
                    </div>
                  </div>
                </div>
              )}

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
