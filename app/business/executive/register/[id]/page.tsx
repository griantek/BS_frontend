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
} from "@/services/api";
import PasswordModal from "@/components/PasswordModal";

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
}

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
  const [clientId, setClientId] = React.useState<string | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

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
      transactionDate: new Date().toISOString().split("T")[0],
      transactionId: "",
    },
  });

  React.useEffect(() => {
    if (!checkAuth(router)) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [
          prospectResponse,
          servicesResponse,
          bankResponse,
        ] = await Promise.all([
          api.getProspectusByRegId(regId),
          api.getAllServices(),
          api.getAllBankAccounts(),
        ]);

        setProspectData(prospectResponse.data);
        setServices(servicesResponse.data);
        setBankAccounts(bankResponse.data);

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

  const getTransactionInfo = () => {
    const data = watch();
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

const onSubmit = async (data: RegistrationFormData) => {
  try {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      toast.error("User data not found");
      return;
    }

    const user = JSON.parse(userStr);

    try {
      // First check if a client already exists with this email
      const clientResponse = await api.getClientByEmail(prospectData.email);
      
      if (clientResponse.success) {
        // Client exists, call createClientWithPassword with null password
        // This will ensure the backend logic is executed without showing the modal
        createClientWithPassword(null);
      } else {
        // Client doesn't exist, open password modal
        onOpen();
      }
    } catch (error: any) {
      // If error occurs (client doesn't exist or other error)
      console.error("Client check error:", error);
      onOpen(); // Open password modal to create new client
    }
  } catch (error) {
    console.error("Registration error:", error);
    toast.error("Failed to complete registration");
  }
};

const createClientWithPassword = async (password: string | null) => {
  try {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      toast.error("User data not found");
      return;
    }

    const user = JSON.parse(userStr);

    // Always attempt to create the client regardless of whether password is null
    const clientData = {
      prospectus_id: prospectData.id,
      email: prospectData.email,
      password: password, // This can be null, the backend should handle existing users
    };

    // Try to create client - backend should handle existing clients appropriately
    const clientResponse = await api.createClient(clientData);
    
    // Get the client ID from the response or fetch it if needed
    let newClientId: string;
    
    if (clientResponse.success && clientResponse.data?.data?.id) {
      // Client was created successfully
      newClientId = clientResponse.data.data.id;
    } else {
      // Client might already exist - try to fetch the existing client ID
      try {
        const existingClientResponse = await api.getClientByEmail(prospectData.email);
        if (existingClientResponse.success && existingClientResponse.data.id) {
          newClientId = existingClientResponse.data.id;
        } else {
          throw new Error("Failed to get client ID");
        }
      } catch (error) {
        console.error("Error getting client:", error);
        toast.error("Failed to find or create client account");
        return;
      }
    }
    
    setClientId(newClientId);

    const formData = watch();
    const transactionInfo = getTransactionInfo();

    const registrationData: CreateRegistrationRequest = {
      ...transactionInfo,
      entity_id: user.id,
      client_id: newClientId,
      registered_by: user.id,
      prospectus_id: prospectData.id,
      services: formData.selectedServices
        .map(
          (id) => services.find((s) => s.id === parseInt(id))?.service_name
        )
        .filter(Boolean)
        .join(", "),
      init_amount: formData.initialAmount,
      accept_amount: formData.acceptanceAmount,
      discount: formData.discountAmount,
      total_amount: formData.totalAmount,
      accept_period: `${formData.acceptancePeriod} ${formData.acceptancePeriodUnit}`,
      pub_period: `${formData.publicationPeriod} ${formData.publicationPeriodUnit}`,
      bank_id: formData.selectedBank,
      status: "waiting for approval" as const,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
    };

    const response = await api.createRegistration(registrationData);
    if (response.success) {
      toast.success("Registration completed successfully!");
      router.push("/business/executive/records/prospectus");
    } else {
      toast.error("Registration failed");
    }
  } catch (error: any) {
    console.error("Client creation error:", error);
    toast.error(
      "Failed to create client account: " +
        (error.message || "Unknown error")
    );
  } finally {
    onClose();
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
        <div className="space-y-4 md:space-y-6">
          <Card className="w-full">
            <CardHeader>
              <h2 className="text-xl md:text-2xl font-bold">
                Prospect Details
              </h2>
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

        <div className="space-y-4 md:space-y-6">
          <Card className="w-full">
            <CardHeader>
              <h2 className="text-xl md:text-2xl font-bold">
                Registration Form
              </h2>
            </CardHeader>
            <Divider />
            <CardBody>
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-4 md:space-y-6"
              >
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
                        disabled={watch("selectedServices").includes(
                          service.id.toString()
                        )}
                      >
                        {service.service_name} - ₹{service.fee.toLocaleString()}
                        {watch("selectedServices").includes(
                          service.id.toString()
                        )
                          ? " (Selected)"
                          : ""}
                      </option>
                    ))}
                  </select>

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
                      defaultValue={new Date().toISOString().split("T")[0]}
                      {...register("transactionDate", {
                        required: "Transaction date is required",
                      })}
                    />
                    <Input
                      type="number"
                      label="Amount Paid (₹)"
                      required
                      {...register("amount", {
                        required: "Amount is required",
                      })}
                    />
                  </div>

                  {renderPaymentFields()}
                </div>

                <div className="space-y-4">
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

      <PasswordModal
        isOpen={isOpen}
        onOpenChange={onOpen}
        onConfirm={createClientWithPassword}
        onCancel={onClose}
      />
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
