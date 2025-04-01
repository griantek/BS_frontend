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
  Chip, // Add this import
  Listbox,
  ListboxItem,
  ScrollShadow,
  useDisclosure, // Import useDisclosure properly
} from "@heroui/react";
import { useForm } from "react-hook-form";
import PDFTemplate from "@/components/PDFTemplate";
import { BANKS, PERIOD_UNITS, PeriodUnit } from "@/constants/quotation";
// import type { QuotationFormData } from "@/types/quotation";
import { withExecutiveAuth } from "@/components/withExecutiveAuth";
import { toast } from "react-toastify";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import api from "@/services/api";
import { checkAuth } from "@/utils/authCheck";
import type {
  CreateRegistrationRequest,
  BankAccount,
  Service,
} from "@/services/api";
import PasswordModal from "@/components/PasswordModal";
import { LoadingSpinner } from "@/components/LoadingSpinner";

interface ProspectData {
  id: number;
  entity_id: string;
  date: string;
  email: string;
  reg_id: string;
  client_name: string;
  phone: string;
  department: string;
  state: string;
  tech_person: string;
  requirement: string;
  proposed_service_period: string;
  created_at: string;
  services: string;
}

interface SelectOptionProps {
  key: string;
  value: string;
  children: React.ReactNode;
}

const SelectOption: React.FC<SelectOptionProps> = ({ children, ...props }) => (
  <option {...props}>{children}</option>
);

interface QuotationFormData {
  initialAmount: number | undefined;
  acceptanceAmount: number | undefined;
  discountPercentage: number | undefined;
  discountAmount: number;
  subTotal: number;
  totalAmount: number;
  selectedServices: string[];
  acceptancePeriod: number | undefined;
  acceptancePeriodUnit: PeriodUnit;
  publicationPeriod: number | undefined;
  publicationPeriodUnit: PeriodUnit;
  selectedBank: string;
  selectedServicesData: Service[];
  transactionDate: string;
  selectedServicePrices: Record<string, number>; // Add this field to track custom prices
}

function QuotationContent({ regId }: { regId: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(true);
  const [prospectData, setProspectData] = React.useState<ProspectData | null>(
    null
  );
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [bankAccounts, setBankAccounts] = React.useState<BankAccount[]>([]);
  const [services, setServices] = React.useState<Service[]>([]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [clientId, setClientId] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<QuotationFormData>({
    defaultValues: {
      initialAmount: undefined,
      acceptanceAmount: undefined,
      discountPercentage: undefined,
      discountAmount: 0,
      subTotal: 0,
      totalAmount: 0,
      selectedServices: [],
      acceptancePeriod: undefined,
      acceptancePeriodUnit: "months",
      publicationPeriod: undefined,
      publicationPeriodUnit: "months",
      selectedBank: "",
      selectedServicesData: [],
      transactionDate: new Date().toISOString().split("T")[0], // Add default date
      selectedServicePrices: {}, // Add this field to track custom prices
    },
  });

  React.useEffect(() => {
    if (!checkAuth(router)) return;

    const fetchProspectData = async () => {
      try {
        setIsLoading(true);
        const response = await api.getProspectusByRegId(regId);
        // Add console.log to debug the response
        console.log("API Response:", response);

        // Ensure we're setting the complete data object
        setProspectData(response.data);

        // Pre-fill form with service data if available
        // const serviceMatch = SERVICES.find(s => s.name === response.data.services);
        // if (serviceMatch) {
        //   setValue('selectedServices', [serviceMatch.id]); // Changed from selectedService
        // }

        // Pre-fill period if available
        // const periodMatch = response.data.proposed_service_period?.match(/(\d+)\s*(days|months)/i);
        // if (periodMatch) {
        //   setValue('acceptancePeriod', parseInt(periodMatch[1]));
        //   setValue('acceptancePeriodUnit', periodMatch[2].toLowerCase() as 'days' | 'months');
        // }
      } catch (error) {
        console.error("Error fetching prospect:", error);
        const errorMessage = api.handleError(error);
        toast.error(errorMessage.error || "Failed to load prospect data");
        router.push("/business/executive");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProspectData();
  }, [router, regId, setValue]);

  // Add bank accounts fetch
  React.useEffect(() => {
    const fetchBankAccounts = async () => {
      try {
        const response = await api.getAllBankAccounts();
        setBankAccounts(response.data);
      } catch (error) {
        console.error("Error fetching bank accounts:", error);
        toast.error("Failed to load bank accounts");
      }
    };

    fetchBankAccounts();
  }, []);

  // Add useEffect to fetch services
  React.useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await api.getAllServices();
        setServices(response.data);
      } catch (error) {
        console.error("Error fetching services:", error);
        toast.error("Failed to load services");
      }
    };

    fetchServices();
  }, []);

  // Watch all amount fields to calculate total
  const getNumericValue = (value: number | undefined) => Number(value || 0);
  const initialAmount = getNumericValue(watch("initialAmount"));
  const acceptanceAmount = getNumericValue(watch("acceptanceAmount"));
  const discountPercentage = getNumericValue(watch("discountPercentage"));

  React.useEffect(() => {
    const subTotal = initialAmount + acceptanceAmount;
    const discountAmount = (subTotal * discountPercentage) / 100;
    const total = subTotal - discountAmount;

    setValue("subTotal", subTotal);
    setValue("discountAmount", discountAmount);
    setValue("totalAmount", total);
  }, [initialAmount, acceptanceAmount, discountPercentage, setValue]);

  const onSubmit = async (data: QuotationFormData) => {
    try {
      setIsGenerating(true);

      // Get user data
      const userStr = localStorage.getItem("user");
      if (!userStr) {
        toast.error("User data not found");
        return;
      }

      const user = JSON.parse(userStr);

      if (!prospectData) {
        throw new Error("Prospect data not found");
        return;
      }

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
    } catch (error: any) {
      console.error("Submission error:", error);
      toast.error("Failed to generate quotation");
    } finally {
      setIsGenerating(false);
    }
  };

  // New function to handle client creation with password
  const createClientWithPassword = async (password: string | null) => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) {
        toast.error("User data not found");
        return;
      }

      const user = JSON.parse(userStr);
      const formData = watch();
      
      // Add null check for prospectData
      if (!prospectData) {
        toast.error("Prospect data not found");
        return;
      }

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
      
      // Prepare registration data with updated fields
      const registrationData: CreateRegistrationRequest = {
        // Transaction details 
        transaction_type: "Cash",
        transaction_id: "",
        amount: 0,
        transaction_date: formData.transactionDate || new Date().toISOString().split("T")[0],
        additional_info: {},
        
        entity_id: user.id,
        client_id: newClientId,
        registered_by: user.id,
        prospectus_id: prospectData.id,
        services: formData.selectedServices
          .map((id) => services.find((s) => s.id === parseInt(id))?.service_name)
          .filter(Boolean)
          .join(", "),
        init_amount: formData.initialAmount || 0,
        accept_amount: formData.acceptanceAmount || 0,
        discount: formData.discountAmount || 0,
        total_amount: formData.totalAmount || 0,
        accept_period: `${formData.acceptancePeriod} ${formData.acceptancePeriodUnit}`,
        pub_period: `${formData.publicationPeriod} ${formData.publicationPeriodUnit}`,
        bank_id: formData.selectedBank,
        status: "pending",
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
      };

      // Submit registration
      const response = await api.createRegistration(registrationData);

      if (response.success) {
        toast.success("Quotation generated and saved successfully!");
        router.push("/business/executive/records/prospectus");
      } else {
        throw new Error("Failed to create registration");
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

  // Add these handlers for Select changes
  const handleServiceChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const service = services.find((s) => s.id === parseInt(event.target.value));
    if (service) {
      const updatedServices = [
        ...watch("selectedServices"),
        service.id.toString(),
      ];
      setValue("selectedServices", updatedServices);

      // Set the initial price in the selectedServicePrices
      const updatedPrices = { ...watch("selectedServicePrices") };
      updatedPrices[service.id.toString()] = service.fee;
      setValue("selectedServicePrices", updatedPrices);

      // Calculate initial amount based on custom prices
      recalculateInitialAmount(updatedServices, updatedPrices);
    }
  };

  const removeService = (serviceId: string) => {
    const updatedServices = watch("selectedServices").filter(
      (id) => id !== serviceId
    );
    setValue("selectedServices", updatedServices);

    // Remove price from selectedServicePrices
    const updatedPrices = { ...watch("selectedServicePrices") };
    delete updatedPrices[serviceId];
    setValue("selectedServicePrices", updatedPrices);

    // Recalculate initial amount
    recalculateInitialAmount(updatedServices, updatedPrices);
  };

  // New function to handle price changes
  const handlePriceChange = (serviceId: string, price: number) => {
    const updatedPrices = { ...watch("selectedServicePrices") };
    updatedPrices[serviceId] = price;
    setValue("selectedServicePrices", updatedPrices);

    // Recalculate initial amount
    recalculateInitialAmount(watch("selectedServices"), updatedPrices);
  };

  // Helper function to recalculate the initial amount
  const recalculateInitialAmount = (
    serviceIds: string[],
    prices: Record<string, number>
  ) => {
    const initialAmount = serviceIds.reduce((sum, id) => {
      return sum + (prices[id] || 0);
    }, 0);

    setValue("initialAmount", initialAmount);
  };

  // Update PDFTemplate to handle multiple services
  const selectedServices = watch("selectedServices")
    .map((serviceId) => services.find((s) => s.id === parseInt(serviceId)))
    .filter(Boolean);

  // Update the service data handling to include duration fields
  const selectedServiceData = watch("selectedServices")
    .map((id) => {
      const service = services.find((s) => s.id === parseInt(id));
      if (service) {
        return {
          id: service.id,
          service_name: service.service_name,
          service_type: service.service_type,
          description: service.description,
          fee: service.fee,
          min_duration: service.min_duration,
          max_duration: service.max_duration,
        } as Service;
      }
      return undefined;
    })
    .filter((service): service is Service => service !== undefined);

  // Add bank change handler
  const handleBankChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setValue("selectedBank", event.target.value);
  };

  // Add explicit null check before the return
  if (isLoading) return <LoadingSpinner text="Loading quotation data..." />;
  if (!prospectData) return <LoadingSpinner text="No prospect data found" />;

  return (
    <div className="w-full p-4 md:p-6">
      {/* Change grid-cols-2 to grid-cols-1 on mobile and grid-cols-2 on medium screens and up */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Left side - Prospect Details */}
        <div className="space-y-4 md:space-y-6">
          <Card className="w-full">
            <CardHeader>
              <h2 className="text-xl md:text-2xl font-bold">
                Prospect Details
              </h2>
            </CardHeader>
            <Divider />
            <CardBody className="space-y-4">
              {/* Make the inner grid responsive too */}
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

        {/* Right side - Quotation Form */}
        <div className="space-y-4 md:space-y-6">
          <Card className="w-full">
            <CardHeader>
              <h2 className="text-xl md:text-2xl font-bold">
                Generate Quotation
              </h2>
            </CardHeader>
            <Divider />
            <CardBody>
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-4 md:space-y-6"
              >
                {/* Move existing form contents here */}
                {/* Service Selection */}
                <div className="space-y-4">
                  <div className="flex gap-2">
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
                          {service.service_name} - ₹
                          {service.fee.toLocaleString()}
                          {watch("selectedServices").includes(
                            service.id.toString()
                          )
                            ? " (Selected)"
                            : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Selected Services Display */}
                  {watch("selectedServices").length > 0 && (
                    <div className="bg-default-100 p-4 rounded-lg space-y-2">
                      <h4 className="text-sm font-medium">Selected Services</h4>
                      <div className="space-y-3">
                        {watch("selectedServices").map((serviceId) => {
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
                                    value={watch("selectedServicePrices")[serviceId]?.toString()}
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

                {/* Amount Details */}
                <div className="space-y-4 md:space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      type="number"
                      label="Initial Amount (INR)"
                      placeholder="Enter amount"
                      value={watch("initialAmount")?.toString()}
                      onChange={(e) =>
                        setValue("initialAmount", Number(e.target.value))
                      }
                      readOnly
                    />
                    <Input
                      type="number"
                      label="Acceptance Amount (INR)"
                      placeholder="Enter amount"
                      onChange={(e) =>
                        setValue("acceptanceAmount", Number(e.target.value))
                      }
                    />
                    <Input
                      type="number"
                      label="Discount (%)"
                      min="0"
                      max="100"
                      placeholder="Enter discount"
                      {...register("discountPercentage")}
                    />
                  </div>

                  {/* Total Amount Summary - Refined Design */}
                  <Card
                    className="relative overflow-hidden"
                    classNames={{
                      base: "border border-default-200/50 bg-gradient-to-br from-default-50 to-default-100 dark:from-default-100 dark:to-default-50",
                    }}
                  >
                    <CardBody className="p-6">
                      <div className="space-y-4">
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
                            ₹ {watch("subTotal").toLocaleString()}
                          </Chip>
                        </div>

                        {/* Discount Row */}
                        {getNumericValue(watch("discountPercentage")) > 0 && (
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
                                {watch("discountPercentage")}% off
                              </Chip>
                            </div>
                            <span className="text-danger font-medium">
                              - ₹ {watch("discountAmount").toLocaleString()}
                            </span>
                          </div>
                        )}

                        <Divider className="my-4 bg-default-200/50" />

                        {/* Total Amount Row */}
                        <div className="flex justify-between items-center">
                          <span className="text-xl font-semibold text-default-900">
                            Total Amount
                          </span>
                          <div className="flex flex-col items-end gap-1">
                            <Chip
                              size="lg"
                              classNames={{
                                base: "bg-primary/10 border-primary/20 px-4",
                                content: "text-xl font-bold text-primary",
                              }}
                            >
                              ₹ {watch("totalAmount").toLocaleString()}
                            </Chip>
                            <span className="text-tiny text-default-500">
                              {getNumericValue(watch("discountPercentage")) > 0
                                ? "After discount applied"
                                : "No discount applied"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
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
                      aria-label="Acceptance Period Unit"
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
                      aria-label="Publication Period Unit"
                    >
                      {PERIOD_UNITS.map((unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Bank Selection - Updated */}
                <div className="w-full space-y-2">
                  <label htmlFor="bank-select" className="text-sm font-medium">
                    Select Bank Account
                  </label>
                  <select
                    id="bank-select"
                    className="w-full p-2 rounded-lg border border-gray-300"
                    value={watch("selectedBank")}
                    onChange={handleBankChange}
                  >
                    <option value="">Choose a bank account</option>
                    {bankAccounts.map((account) => (
                      <SelectOption key={account.id} value={account.id}>
                        {account.account_name} - {account.bank}
                      </SelectOption>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <Button
                    color="danger"
                    variant="light"
                    onClick={() => router.back()}
                  >
                    Cancel
                  </Button>
                  <Button
                    color="primary"
                    type="submit"
                    isLoading={isGenerating}
                  >
                    Generate Quotation
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Add the Password Modal */}
      <PasswordModal
        isOpen={isOpen}
        onOpenChange={onOpen}
        onConfirm={createClientWithPassword}
        onCancel={onClose}
      />
    </div>
  );
}

// Main component wrapper that handles the Promise params
interface PageProps {
  params: Promise<{ id: string }>;
}

function QuotationPage({ params }: PageProps) {
  const resolvedParams = React.use(params);

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <QuotationContent regId={resolvedParams.id} />
    </Suspense>
  );
}

export default withExecutiveAuth(QuotationPage);