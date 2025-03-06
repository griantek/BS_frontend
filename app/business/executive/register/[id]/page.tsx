"use client";
import React, { Suspense } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Input,
  Select,
  Divider,
  Chip,
  useDisclosure,
} from "@heroui/react";
import { useForm } from "react-hook-form";
import { PERIOD_UNITS } from "@/constants/quotation";
import { withExecutiveAuth } from "@/components/withExecutiveAuth";
import { toast } from "react-toastify";
import api from "@/services/api";
import { checkAuth } from "@/utils/authCheck";
import type { PeriodUnit } from "@/constants/quotation";
import type {
  BankAccount,
  Service,
  CreateRegistrationRequest,
  TransactionInfo,
  Editor,
} from "@/services/api";

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
  paymentMode:
    | "cash"
    | "upi"
    | "netbanking"
    | "card"
    | "cheque"
    | "wallet"
    | "gateway"
    | "crypto";
  amount: number;
  transactionDate: string;
  upiId?: string;
  accountNumber?: string;
  ifscCode?: string;
  cardLastFourDigits?: string;
  receiptNumber?: string;
  chequeNumber?: string;
  walletProvider?: "paytm" | "phonepe" | "other";
  gatewayProvider?: "razorpay" | "stripe" | "other";
  transactionHash?: string;
  cryptoCurrency?: string;
  transactionId?: string;
  assigned_to?: string;
}

// Add this mapping outside the component
const PAYMENT_MODE_MAP: Record<string, TransactionInfo["transaction_type"]> = {
  cash: "Cash",
  upi: "UPI",
  netbanking: "Bank Transfer",
  card: "Card",
  cheque: "Cheque",
  wallet: "Wallet",
  gateway: "Online Payment",
  crypto: "Crypto",
} as const;

function RegistrationContent({ regId }: { regId: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(true);
  const [prospectData, setProspectData] = React.useState<any>(null);
  const [bankAccounts, setBankAccounts] = React.useState<BankAccount[]>([]);
  const [services, setServices] = React.useState<Service[]>([]);
  const [editors, setEditors] = React.useState<Editor[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
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
      transactionDate: new Date().toISOString().split('T')[0], // Set today's date as default
      transactionId: "",
    },
  });

  // Fetch initial data
  React.useEffect(() => {
    if (!checkAuth(router)) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [prospectResponse, servicesResponse, bankResponse, editorsResponse] =
          await Promise.all([
            api.getProspectusByRegId(regId),
            api.getAllServices(),
            api.getAllBankAccounts(),
            api.getAllEditors(),
          ]);

        setProspectData(prospectResponse.data);
        setServices(servicesResponse.data);
        setBankAccounts(bankResponse.data);
        setEditors(editorsResponse.data);

        // Pre-fill service if it exists
        if (prospectResponse.data.services) {
          const serviceMatch = servicesResponse.data.find(
            (s) => s.service_name === prospectResponse.data.services
          );
          if (serviceMatch) {
            setValue("selectedServices", [serviceMatch.id.toString()]);
            setValue("initialAmount", serviceMatch.fee);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load data");
        router.push("/business/executive");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router, regId, setValue]);

  // Calculate totals
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
  }, [
    watch("initialAmount"),
    watch("acceptanceAmount"),
    watch("discountPercentage"),
    setValue,
  ]);

  const getNumericValue = (value: number | undefined) => Number(value || 0);

  // Handle service selection
  const handleServiceChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const service = services.find((s) => s.id === parseInt(event.target.value));
    if (service) {
      const updatedServices = [
        ...watch("selectedServices"),
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
    const updatedServices = watch("selectedServices").filter(
      (id) => id !== serviceId
    );
    setValue("selectedServices", updatedServices);

    const initialAmount = updatedServices.reduce((sum, id) => {
      const service = services.find((s) => s.id === parseInt(id));
      return sum + (service?.fee || 0);
    }, 0);

    setValue("initialAmount", initialAmount);
  };

  const onSubmit = async (data: RegistrationFormData) => {
    try {
      console.log("Starting form submission...");

      // Get and validate auth data
      const userStr = localStorage.getItem("user");
      const tokenStr = localStorage.getItem("token");
      const isLoggedIn = localStorage.getItem("isLoggedIn");

      console.log("Auth Data:", {
        hasUser: !!userStr,
        hasToken: !!tokenStr,
        isLoggedIn,
        rawUserData: userStr, // Add this to see the actual user data
      });

      // Validate required form fields first
      // if (!data.selectedServices.length) {
      //   console.log("Validation failed: No services selected");
      //   toast.error("Please select at least one service");
      //   return;
      // }

      // if (!data.amount) {
      //   console.log("Validation failed: No amount entered");
      //   toast.error("Please enter the payment amount");
      //   return ;
      // }

      //  if (!data.transactionDate) {
      //   console.log("Validation failed: No transaction date");
      //   toast.error("Please enter the transaction date");
      //   return;
      // }

      // if (!data.selectedBank) {
      //   console.log("Validation failed: No bank selected");
      //   toast.error("Please select a bank account");
      //   return;
      // }

      // Parse user data
      let user;
      try {
        user = JSON.parse(userStr || "{}");
        console.log("Parsed user data:", user);
      } catch (e) {
        console.error("Error parsing user data:", e);
        toast.error("Invalid user data");
        return;
      }

      // Log the form data
      console.log("Form Data:", {
        selectedServices: data.selectedServices,
        amounts: {
          initial: data.initialAmount,
          acceptance: data.acceptanceAmount,
          discount: data.discountAmount,
          total: data.totalAmount,
          payment: data.amount,
        },
        periods: {
          acceptance: `${data.acceptancePeriod} ${data.acceptancePeriodUnit}`,
          publication: `${data.publicationPeriod} ${data.publicationPeriodUnit}`,
        },
        payment: {
          mode: data.paymentMode,
          bank: data.selectedBank,
          date: data.transactionDate,
        },
      });

      const getTransactionInfo = () => {
        const baseInfo = {
          transaction_type: PAYMENT_MODE_MAP[data.paymentMode],
          transaction_id: data.transactionId || "",
          amount: data.amount,
          transaction_date: data.transactionDate,
        };

        let additional_info: Record<string, any> = {};

        switch (data.paymentMode) {
          case "upi":
            additional_info = {
              upi_id: data.upiId,
            };
            break;
          case "netbanking":
            additional_info = {
              account_number: data.accountNumber,
              ifsc_code: data.ifscCode,
            };
            break;
          case "card":
            additional_info = {
              last_4_digits: data.cardLastFourDigits,
              card_type: "Credit/Debit", // You might want to add a field for this
            };
            break;
          case "cash":
            additional_info = {
              receipt_number: data.receiptNumber,
            };
            break;
          case "cheque":
            additional_info = {
              cheque_number: data.chequeNumber,
            };
            break;
          case "wallet":
            additional_info = {
              wallet_provider: data.walletProvider,
            };
            break;
          case "gateway":
            additional_info = {
              gateway_provider: data.gatewayProvider,
            };
            break;
          case "crypto":
            additional_info = {
              transaction_hash: data.transactionHash,
              crypto_currency: data.cryptoCurrency,
            };
            break;
        }

        return { ...baseInfo, additional_info };
      };

      const registrationData: CreateRegistrationRequest = {  // Add type annotation here
        ...getTransactionInfo(),
        entity_id: user.id,  // Changed from exec_id
        client_id: user.client_id || user.clientId,
        prospectus_id: prospectData.id,
        services: data.selectedServices
          .map(
            (id) => services.find((s) => s.id === parseInt(id))?.service_name
          )
          .filter(Boolean)
          .join(", "),
        init_amount: data.initialAmount,
        accept_amount: data.acceptanceAmount,
        discount: data.discountAmount,
        assigned_to: data.assigned_to,
        total_amount: data.totalAmount,
        accept_period: `${data.acceptancePeriod} ${data.acceptancePeriodUnit}`,
        pub_period: `${data.publicationPeriod} ${data.publicationPeriodUnit}`,
        bank_id: data.selectedBank,
        status: 'registered' as const,  // Use const assertion to ensure literal type
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
      };

      // Send to API
      try {
        const response = await api.createRegistration(registrationData);
        if (response.success) {
          toast.success('Registration completed successfully!');
          router.push('/business/executive');
        } else {
          toast.error('Registration failed');
        }
      } catch (apiError) {
        console.error('API Error:', apiError);
        toast.error('Failed to submit registration');
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Failed to complete registration");
    }
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
            <Input type="text" label="IFSC Code" {...register("ifscCode")} />
            <Input
              type="text"
              label="Transaction Reference Number"
              {...register("transactionId")}
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

  if (isLoading) return <div>Loading...</div>;
  if (!prospectData) return <div>No data found</div>;

  return (
    <div className="w-full p-4 md:p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Left side - Prospect Details */}
        <div className="space-y-4 md:space-y-6">
          <Card className="w-full">
            <CardHeader>
              <h2 className="text-xl md:text-2xl font-bold">Prospect Details</h2>
            </CardHeader>
            <Divider />
            <CardBody className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Client Name</p>
                  <p className="font-medium">{prospectData.client_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Registration ID</p>
                  <p className="font-medium">{prospectData.reg_id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{prospectData.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium">{prospectData.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Department</p>
                  <p className="font-medium">{prospectData.department}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">State</p>
                  <p className="font-medium">{prospectData.state}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Proposed Service</p>
                  <p className="font-medium">{prospectData.services}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Proposed Period</p>
                  <p className="font-medium">
                    {prospectData.proposed_service_period}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Right side - Registration Form */}
        <div className="space-y-4 md:space-y-6">
          <Card className="w-full">
            <CardHeader>
              <h2 className="text-xl md:text-2xl font-bold">Registration Form</h2>
            </CardHeader>
            <Divider />
            <CardBody>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
                {/* Service Selection */}
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

                <div className="space-y-4">
                  {/* Add this before the submit button */}
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

                  {/* Existing submit buttons */}
                  <div className="flex justify-end gap-3">
                    <Button
                      color="danger"
                      variant="light"
                      onClick={() => router.back()}
                    >
                      Cancel
                    </Button>
                    <Button color="primary" type="submit">
                      Complete Registration
                    </Button>
                  </div>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

interface PageProps {
  params: Promise<{ id: string }>;
}

function RegistrationPage({ params }: PageProps) {
  const resolvedParams = React.use(params);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RegistrationContent regId={resolvedParams.id} />
    </Suspense>
  );
}

export default withExecutiveAuth(RegistrationPage);
