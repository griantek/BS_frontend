"use client";
import React, { useState, useEffect, Suspense, ChangeEvent } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Divider,
  Button,
  Spinner,
  Chip,
  Input,
  Select,
  SelectItem,
  Textarea,
  Link,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@nextui-org/react";
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  DocumentIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PaperClipIcon,
  DocumentArrowDownIcon,
  UserGroupIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import api, { TransactionInfo, Editor, Transaction } from "@/services/api";
import { toast } from "react-toastify";
import { useForm } from "react-hook-form";
import { WithAdminAuth } from "@/components/withAdminAuth";

// Define interfaces based on actual API response
interface QuotationFile {
  url: string;
  size: number;
  type: string;
  storagePath: string;
  originalName: string;
}

interface ClientQuotation {
  id: number;
  reg_id: number;
  name: string;
  amount: number;
  notes?: string;
  transaction_date: string;
  client_id: string;
  files: QuotationFile[];
  prospectus_id: number;
  created_at: string;
  updated_at: string;
  client?: {
    id: string;
    email: string;
  };
}

// Update RegistrationData interface to include prospectus with leads_id
interface RegistrationData {
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
  status: string;
  month: number;
  year: number;
  created_at: string;
  transaction_id: number;
  notes: string | null;
  updated_at: string;
  assigned_to: string | null;
  registered_by_entity:{
    id: string;
    username: string;
    email: string;
  }
  client_id: string;
  admin_assigned: boolean;
  journal_added: boolean;
  author_status: string;
  file_path: string | null;
  author_comments: string | null;
  service_and_prices?: Record<string, number>; // Add this property for service breakdown
  // Add the prospectus property
  prospectus?: {
    id: number;
    reg_id?: string;
    client_name: string;
    email?: string;
    phone?: string;
    department?: string;
    requirement?: string;
    services?: string;
    notes?: string;
    leads_id?: number;
    // Add other properties as needed
  };
  transaction: Transaction | null;
  bank_details?: {
    id:string;
    account_name: string;
    bank: string;
    account_number: string;
    ifsc_code: string;
    upi_id?: string;
    account_type: string;
  };
}

// Add interfaces for the new response structure
interface Prospectus {
  id: number;
  client_name: string;
  email: string;
  phone: string;
  requirement: string;
  services: string;
  notes: string;
  leads_id: number;
}

interface Leads {
  id: number;
  requirement: string;
}

interface ClientRegistrationWithQuotationData {
  registrations: RegistrationData[];
  quotations: ClientQuotation[];
  prospectus: Prospectus;
  leads: Leads;
}

// Payment form data interface
interface PaymentFormData {
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
  transactionId?: string;
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
}

// Transaction type mapping
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

// Content component to be wrapped with Suspense
function ApprovalDetailContent({ id }: { id: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registration, setRegistration] = useState<RegistrationData | null>(
    null
  );
  const [quotation, setQuotation] = useState<ClientQuotation | null>(null);
  const [selectedFile, setSelectedFile] = useState<QuotationFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [assignableEntities, setAssignableEntities] = useState<Editor[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<string>("");
  const [loadingEntities, setLoadingEntities] = useState(false);
  const {
    isOpen: isPdfModalOpen,
    onOpen: onPdfModalOpen,
    onClose: onPdfModalClose,
  } = useDisclosure();
  const {
    isOpen: isSuccessModalOpen,
    onOpen: onSuccessModalOpen,
    onClose: onSuccessModalClose,
  } = useDisclosure();
  const {
    isOpen: isEntityModalOpen,
    onOpen: onEntityModalOpen,
    onClose: onEntityModalClose,
  } = useDisclosure();
  const [prospectus, setProspectus] = useState<Prospectus | null>(null);
  const [leads, setLeads] = useState<Leads | null>(null);
  const [isApprovingQuotation, setIsApprovingQuotation] = useState(false);
  const {
    isOpen: isQuotationApprovedModalOpen,
    onOpen: onQuotationApprovedModalOpen,
    onClose: onQuotationApprovedModalClose,
  } = useDisclosure();
  const [isEditMode, setIsEditMode] = useState(false);
  const [banks, setBanks] = useState<Array<{id: string, bank: string, account_name: string}>>([]);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [editFormData, setEditFormData] = useState<{
    init_amount: number;
    accept_amount: number;
    discount: number;
    total_amount: number;
    bank_id: string;
    service_and_prices?: Record<string, number>;
  } | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<PaymentFormData>({
    defaultValues: {
      paymentMode: "cash",
      amount: 0,
      transactionDate: new Date().toISOString().split("T")[0],
    },
  });

  useEffect(() => {
    fetchData();
    // Load banks for the dropdown
    fetchBanks();
  }, [id]);

  // Add a function to fetch banks
  const fetchBanks = async () => {
    try {
      const response = await api.getAllBankAccounts();
      if (response.data) {
        setBanks(response.data);
      }
    } catch (error) {
      console.error("Error fetching banks:", error);
    }
  };

  // Initialize edit form data when registration data is available
  useEffect(() => {
    if (registration) {
      
      setEditFormData({
        init_amount: registration.init_amount,
        accept_amount: registration.accept_amount,
        discount: registration.discount,
        total_amount: registration.total_amount,
        bank_id: registration.bank_id,
        service_and_prices: registration.service_and_prices
      });
    }
  }, [registration]);

  // Add this useEffect to log banks when they're loaded
  useEffect(() => {
    if (banks.length > 0) {
      console.log("Available banks:", banks);
      if (registration?.bank_id) {
        const selectedBank = banks.find(bank => bank.id === registration.bank_id);
      }
    }
  }, [banks, registration?.bank_id]);

  // Add this function to handle bank selection specifically
  const handleBankChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!editFormData) return;
    
    const bankId = e.target.value;
    console.log("Bank selected:", bankId);
    
    setEditFormData({
      ...editFormData,
      bank_id: bankId
    });
  };

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.getClientRegistrationWithQuotation(
        parseInt(id)
      );
      if (
        response.data?.registrations &&
        response.data.registrations.length > 0
      ) {
        // Cast the registration data from the API to match our RegistrationData type
        const registrationData = response.data
          .registrations[0] as unknown as RegistrationData;

        // Check if registration is already registered, redirect if so
        if (registrationData.status === "registered") {
          toast.info("This registration has already been processed");
          router.push("/admin/approval");
          return; // Stop further processing
        }

        setRegistration(registrationData);

        // Set amount in the form
        if (registrationData.total_amount) {
          reset({
            ...watch(),
            amount: registrationData.total_amount,
          });
        }

        // Store prospectus and leads from the new response structure
        if (response.data.prospectus) {
          setProspectus(response.data.prospectus);
        }

        if (response.data.leads) {
          setLeads(response.data.leads);
        }

        // Load assignable entities based on requirements - prioritize leads.requirement if available
        const requirement =
          response.data.leads?.requirement ||
          response.data.prospectus?.requirement ||
          registrationData.prospectus?.requirement ||
          "";
        loadAssignableEntities(requirement);
      }

      if (response.data?.quotations && response.data.quotations.length > 0) {
        // Cast the quotation data to match our ClientQuotation interface
        const quotationData = response.data
          .quotations[0] as unknown as ClientQuotation;
        setQuotation(quotationData);
      }
    } catch (error) {
      console.error("Error fetching registration data:", error);
      setError("Failed to load registration details. Please try again.");
      toast.error("Failed to load registration details");
    } finally {
      setIsLoading(false);
    }
  };

  const loadAssignableEntities = async (requirement: string) => {
    setLoadingEntities(true);
    setAssignableEntities([]);

    try {
      let entities: Editor[] = [];

      if (
        requirement.toLowerCase().includes("publication") &&
        requirement.toLowerCase().includes("paper writing")
      ) {
        // Case 3: Both publication and paper writing - get editors and authors
        const response = await api.getAllEditorsAndAuthors();
        entities = response.data;
      } else if (requirement.toLowerCase().includes("publication")) {
        // Case 1: Publication - get editors
        const response = await api.getAllEditors();
        entities = response.data;
      } else if (requirement.toLowerCase().includes("paper writing")) {
        // Case 2: Paper writing - get authors
        const response = await api.getAllAuthors();
        entities = response.data;
      } else {
        // Case 4: Default - get all assignable entities
        const response = await api.getAllEditorsAndAuthors();
        entities = response.data;
      }

      setAssignableEntities(entities);
    } catch (err) {
      console.error("Error loading assignable entities:", err);
      setError("Failed to load assignable entities.");
    } finally {
      setLoadingEntities(false);
    }
  };

  const handleEntitySelect = () => {
    onEntityModalOpen();
  };

  const handleEntityChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedEntity(event.target.value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleFileView = (file: QuotationFile) => {
    setSelectedFile(file);
    onPdfModalOpen();
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
            <Select label="Wallet Provider" {...register("walletProvider")}>
              <SelectItem key="paytm" value="paytm">
                Paytm
              </SelectItem>
              <SelectItem key="phonepe" value="phonepe">
                PhonePe
              </SelectItem>
              <SelectItem key="other" value="other">
                Other
              </SelectItem>
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
            <Select label="Payment Gateway" {...register("gatewayProvider")}>
              <SelectItem key="razorpay" value="razorpay">
                Razorpay
              </SelectItem>
              <SelectItem key="stripe" value="stripe">
                Stripe
              </SelectItem>
              <SelectItem key="other" value="other">
                Other
              </SelectItem>
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

  const handleProcessPayment = async (data: PaymentFormData) => {
    if (!registration) return;

    setIsSubmitting(true);
    try {
      // Get user data for entity_id
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
        status: "registered" as const,
        transaction_type: PAYMENT_MODE_MAP[data.paymentMode],
        transaction_id: data.transactionId || "",
        amount: data.amount,
        transaction_date: data.transactionDate,
        additional_info: additionalInfo,
        entity_id: user.id,
        // Remove assigned_to from here as we'll use assignRegistration instead
      };

      // First: Approve the registration
      const response = await api.approveRegistration(
        registration.id,
        updateData
      );

      // Second: If we have a selected entity, assign the registration
      if (selectedEntity) {
        try {
          await api.assignRegistration(registration.id, selectedEntity);
          console.log(
            `Registration ${registration.id} assigned to entity ${selectedEntity}`
          );
        } catch (assignError) {
          console.error("Error assigning registration:", assignError);
          toast.warning("Registration approved but entity assignment failed");
        }
      }

      if (response.success) {
        toast.success("Registration approved successfully");
        onSuccessModalOpen();
      } else {
        toast.error("Failed to approve registration");
      }
    } catch (error) {
      console.error("Approval error:", error);
      toast.error("Failed to approve registration");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveQuotation = async () => {
    if (!registration) return;

    setIsApprovingQuotation(true);
    try {
      const response = await api.approveQuotationReview(registration.id);

      if (response.success) {
        toast.success("Quotation approved successfully");
        onQuotationApprovedModalOpen();
      } else {
        toast.error("Failed to approve quotation");
      }
    } catch (error) {
      console.error("Approval error:", error);
      toast.error("Failed to approve quotation");
    } finally {
      setIsApprovingQuotation(false);
    }
  };

  // Add this function to handle assignment for "waiting for approval" status
  const handleAssignEntity = async () => {
    if (!registration || !selectedEntity) return;

    setIsSubmitting(true);
    try {
      const response = await api.assignRegistration(
        registration.id,
        selectedEntity
      );

      if (response.success) {
        toast.success("Registration successfully assigned");
        // Show success modal
        onSuccessModalOpen();
      } else {
        toast.error("Failed to assign registration");
      }
    } catch (error) {
      console.error("Assignment error:", error);
      toast.error("Failed to assign registration");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle edit mode
  const handleEditToggle = () => {
    if (isEditMode) {
      // Exit edit mode without saving
      setIsEditMode(false);
    } else {
      // Enter edit mode
      setIsEditMode(true);
    }
  };

  // Handle changes to the edit form fields
  const handleEditChange = (field: string, value: number | string) => {
    if (!editFormData) return;
    
    const updatedData = { ...editFormData, [field]: value };
    
    // Auto-calculate total amount when init_amount, accept_amount, or discount changes
    if (['init_amount', 'accept_amount', 'discount'].includes(field)) {
      updatedData.total_amount = 
        Number(updatedData.init_amount) + 
        Number(updatedData.accept_amount) - 
        Number(updatedData.discount);
    }
    
    setEditFormData(updatedData);
  };

  // Handle changes to service prices
  const handleServicePriceChange = (service: string, price: number) => {
    if (!editFormData || !editFormData.service_and_prices) return;
    
    const updatedPrices = { ...editFormData.service_and_prices, [service]: price };
    
    // Calculate init_amount as sum of all service prices
    const newInitAmount = Object.values(updatedPrices).reduce((sum, price) => sum + Number(price), 0);
    
    setEditFormData({
      ...editFormData,
      service_and_prices: updatedPrices,
      init_amount: newInitAmount,
      total_amount: newInitAmount + editFormData.accept_amount - editFormData.discount
    });
  };

  // Save changes to the invoice
  const handleSaveChanges = async () => {
    if (!editFormData || !registration) return;
    
    setIsEditSubmitting(true);
    try {
      // Call API to update registration invoice details
      const response = await api.updateRegistrationInvoice(registration.id, {
        init_amount: editFormData.init_amount,
        accept_amount: editFormData.accept_amount,
        discount: editFormData.discount,
        total_amount: editFormData.total_amount,
        bank_id: editFormData.bank_id,
        service_and_prices: editFormData.service_and_prices
      });
      
      if (response.success) {
        toast.success("Invoice details updated successfully");
        // Refresh data after update
        fetchData();
        // Exit edit mode
        setIsEditMode(false);
      } else {
        toast.error("Failed to update invoice details");
      }
    } catch (error) {
      console.error("Error updating invoice:", error);
      toast.error("An error occurred while updating invoice details");
    } finally {
      setIsEditSubmitting(false);
    }
  };

  // Handle cancel editing
  const handleCancelEdit = () => {
    // Reset form data to original values
    if (registration) {
      setEditFormData({
        init_amount: registration.init_amount,
        accept_amount: registration.accept_amount,
        discount: registration.discount,
        total_amount: registration.total_amount,
        bank_id: registration.bank_id,
        service_and_prices: registration.service_and_prices
      });
    }
    // Exit edit mode
    setIsEditMode(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardBody className="text-center py-12">
            <ExclamationTriangleIcon className="w-12 h-12 mx-auto text-danger mb-4" />
            <p className="text-default-600 mb-4">{error}</p>
            <div className="flex justify-center gap-2">
              <Button color="primary" onClick={fetchData}>
                Try Again
              </Button>
              <Button
                variant="flat"
                onClick={() => router.push("/admin/approval")}
                startContent={<ArrowLeftIcon className="h-4 w-4" />}
              >
                Return to Approvals
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (!registration) {
    return (
      <div className="p-6">
        <Card>
          <CardBody className="text-center py-12">
            <ExclamationTriangleIcon className="w-12 h-12 mx-auto text-danger mb-4" />
            <p className="text-default-600 mb-4">
              Registration information not found
            </p>
            <Button
              color="primary"
              onClick={() => router.push("/admin/approval")}
              startContent={<ArrowLeftIcon className="h-4 w-4" />}
            >
              Return to Approvals
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header Section with Title - Remove Edit Invoice Details button */}
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-2">
        <div className="flex items-center gap-3">
          <Button
            variant="light"
            isIconOnly
            aria-label="Back"
            onClick={() => router.push("/admin/approval")}
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Registration Details #{id}</h1>
            <p className="text-default-500">
              View and process registration approval for client:{" "}
              {quotation?.name ||
                prospectus?.client_name ||
                registration?.prospectus?.client_name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Chip
            color={
              registration?.status === "quotation review"
                ? "warning"
                : "primary"
            }
            variant="flat"
          >
            {registration?.status === "quotation review"
              ? "Quotation Review"
              : registration?.status === "waiting for approval"
              ? "Approval Needed"
              : "Quotation Accepted"}
          </Chip>
        </div>
      </div>

      <Divider className="my-2" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Client Information Card */}
        <Card className="md:col-span-1 dark:bg-content1">
          <CardHeader className="pb-1 flex justify-between items-center">
            <h2 className="text-lg font-bold">Client Information</h2>
            {isEditMode && (
              <Button size="sm" color="primary" variant="light" isIconOnly>
                <DocumentTextIcon className="h-4 w-4" />
              </Button>
            )}
          </CardHeader>
          <Divider />
          <CardBody className="py-3">
            <div className="space-y-3">
              <div>
                <p className="text-sm text-default-500">Name</p>
                <p className="font-medium">
                  {quotation?.name ||
                    prospectus?.client_name ||
                    registration.prospectus?.client_name}
                </p>
              </div>
              <div>
                <p className="text-sm text-default-500">Email</p>
                <p className="font-medium">
                  {quotation?.client?.email ||
                    prospectus?.email ||
                    registration.prospectus?.email ||
                    "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-default-500">Phone</p>
                <p className="font-medium">
                  {prospectus?.phone || registration.prospectus?.phone || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-default-500">Requirement</p>
                <p className="font-medium">
                  {leads?.requirement ||
                    prospectus?.requirement ||
                    registration.prospectus?.requirement ||
                    "N/A"}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Registration Details Card - Added notes field */}
        <Card className="md:col-span-2 dark:bg-content1">
          <CardHeader className="pb-1 flex justify-between">
            <h2 className="text-lg font-bold">
              Registration #{registration.id}
            </h2>
            <Chip
              color={
                registration.status === "quotation review"
                  ? "warning"
                  : "primary"
              }
              variant="flat"
            >
              {registration.status === "quotation review"
                ? "Quotation Review"
                : "Quotation Accepted"}
            </Chip>
          </CardHeader>
          <Divider />
          <CardBody className="py-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <p className="text-sm text-default-500">Registration Date</p>
                <p className="font-medium">{formatDate(registration.date)}</p>
              </div>
              <div>
                <p className="text-sm text-default-500">Created On</p>
                <p className="font-medium">
                  {formatDate(registration.created_at)}
                </p>
              </div>
              <div>
                <p className="text-sm text-default-500">Services</p>
                <p className="font-medium">{registration.services}</p>
              </div>
              <div>
                <p className="text-sm text-default-500">Service Period</p>
                <p className="font-medium">{registration.accept_period}</p>
              </div>
              <div>
                <p className="text-sm text-default-500">Publication Period</p>
                <p className="font-medium">{registration.pub_period}</p>
              </div>
              <div>
                <p className="text-sm text-default-500">Registered By</p>
                <p className="font-medium">{registration.registered_by_entity.username}</p>
              </div>
              <div className="md:col-span-2 mt-2 border-t border-dashed border-default-200 dark:border-default-700 pt-3">
                <p className="text-sm text-default-500">Client Notes</p>
                <p className="font-medium">
                  {quotation?.notes ||
                    prospectus?.notes ||
                    registration.notes || (
                      <span className="text-default-400 italic">
                        No additional notes provided
                      </span>
                    )}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Payment Files - Only show if quotation data is available */}
        {quotation && quotation.files && quotation.files.length > 0 && (
          <Card className="md:col-span-3 dark:bg-content1">
            <CardHeader>
              <h2 className="text-xl font-bold">Payment Files</h2>
            </CardHeader>
            <Divider />
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {quotation.files.map((file, index) => (
                  <Card key={index} className="bg-default-50 dark:bg-content2">
                    <CardBody className="space-y-3 p-4">
                      <div className="flex items-center space-x-2">
                        <DocumentIcon className="h-6 w-6 text-default-500" />
                        <div className="truncate flex-1">
                          <p className="font-medium truncate">
                            {file.originalName}
                          </p>
                          <p className="text-xs text-default-500">
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-between gap-2">
                        <Button
                          size="sm"
                          variant="flat"
                          color="primary"
                          className="flex-1"
                          startContent={
                            <DocumentTextIcon className="h-4 w-4" />
                          }
                          onClick={() => handleFileView(file)}
                        >
                          View
                        </Button>
                        <Button
                          as={Link}
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          size="sm"
                          variant="flat"
                          color="default"
                          className="flex-1"
                          startContent={
                            <DocumentArrowDownIcon className="h-4 w-4" />
                          }
                        >
                          Download
                        </Button>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </CardBody>
          </Card>
        )}

        {/* Simplified Invoice Summary - Integrated bank details and transaction details */}
        <Card className="md:col-span-2 dark:bg-content1">
          <CardHeader className="pb-2 flex justify-between items-center">
            <h2 className="text-xl font-bold">Invoice Summary</h2>
            {isEditMode ? (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  color="default"
                  variant="flat"
                  onClick={handleCancelEdit}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  color="success"
                  variant="solid"
                  startContent={isEditSubmitting ? <Spinner size="sm" /> : <CheckCircleIcon className="h-4 w-4" />}
                  onClick={handleSaveChanges}
                  isLoading={isEditSubmitting}
                >
                  Save Changes
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                color="primary"
                variant="flat"
                startContent={<DocumentTextIcon className="h-4 w-4" />}
                onClick={handleEditToggle}
              >
                Edit Invoice
              </Button>
            )}
          </CardHeader>
          <Divider />
          <CardBody className="py-3 space-y-3">
            {/* Basic Invoice Info */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-default-500">
                Invoice #{registration.id}
              </span>
              <span className="text-sm">
                {formatDate(registration.created_at)}
              </span>
            </div>

            {/* Payment Status Indicator */}
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Status</span>
              {registration.transaction &&
              registration.transaction.amount === registration.total_amount ? (
                <Chip color="success" size="sm">
                  Paid
                </Chip>
              ) : registration.status === "quotation accepted" ? (
                <Chip color="warning" size="sm">
                  Pending Payment
                </Chip>
              ) : (
                <Chip color="primary" size="sm">
                  Processing
                </Chip>
              )}
            </div>

            <Divider />

            {/* Services Section - Now with edit mode */}
            <div>
              <h3 className="text-sm font-semibold mb-2">Services</h3>
              {isEditMode && editFormData?.service_and_prices ? (
                <div className="space-y-2 mb-3">
                  {Object.entries(editFormData.service_and_prices).map(([service, price]) => (
                    <div key={service} className="flex justify-between items-center gap-2">
                      <Input 
                        className="flex-1" 
                        size="sm" 
                        value={service}
                        readOnly
                      />
                      <Input 
                        className="w-32" 
                        size="sm" 
                        type="number"
                        startContent={<span className="text-default-400">₹</span>}
                        value={price.toString()}
                        onChange={(e) => handleServicePriceChange(service, Number(e.target.value))}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                registration.service_and_prices &&
                Object.keys(registration.service_and_prices).length > 0 ? (
                  <div className="space-y-1 mb-3">
                    {Object.entries(registration.service_and_prices).map(
                      ([service, price]) => (
                        <div
                          key={service}
                          className="flex justify-between text-sm"
                        >
                          <span>{service}</span>
                          <span>₹{Number(price).toLocaleString()}</span>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <div className="text-sm mb-3">{registration.services}</div>
                )
              )}
            </div>

            {/* Registration Price Details - Now with edit mode */}
            <div className="space-y-2 pt-2 pb-2">
              {isEditMode && editFormData ? (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Initial Amount (Calculated)</span>
                    <span className="text-sm font-medium">₹{editFormData.init_amount.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-sm">Additional Services</span>
                    <Input 
                      className="w-32"
                      size="sm"
                      type="number"
                      startContent={<span className="text-default-400">₹</span>}
                      value={editFormData.accept_amount.toString()}
                      onChange={(e) => handleEditChange('accept_amount', Number(e.target.value))}
                    />
                  </div>
                  
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-sm text-danger-500">Discount</span>
                    <Input 
                      className="w-32"
                      size="sm"
                      type="number"
                      startContent={<span className="text-default-400">₹</span>}
                      value={editFormData.discount.toString()}
                      onChange={(e) => handleEditChange('discount', Number(e.target.value))}
                    />
                  </div>
                  
                  <div className="flex justify-between items-center font-medium pt-2 border-t border-dashed border-default-200 dark:border-default-700">
                    <span>Total Amount</span>
                    <span>₹{editFormData.total_amount.toLocaleString()}</span>
                  </div>
                  
                  {/* Bank Selection - Fixed */}
                  <div className="mt-4">
                    <div className="mb-2">
                      <span className="text-sm text-default-600">Current Bank:</span>
                      {registration.bank_details ? (
                        <span className="text-sm ml-2 font-medium">
                          {registration.bank_details.account_name} - {registration.bank_details.bank}
                        </span>
                      ) : (
                        <span className="text-sm ml-2 text-default-400 italic">
                          No bank selected
                        </span>
                      )}
                    </div>
                    
                    <Select
                      label="Select Bank"
                      size="sm"
                      selectedKeys={editFormData.bank_id ? [editFormData.bank_id] : []}
                      onChange={handleBankChange}
                      className="w-full"
                      placeholder="Choose a bank account"
                    >
                      {banks.map((bank) => (
                        <SelectItem key={bank.id} value={bank.id}>
                          {bank.account_name} - {bank.bank}
                        </SelectItem>
                      ))}
                    </Select>
                    
                    {/* Debug info */}
                    <div className="text-xs text-default-400 mt-1">
                      Selected bank ID: {editFormData.bank_id || "None"}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between text-sm">
                    <span>Initial Amount</span>
                    <span>₹{registration.init_amount.toLocaleString()}</span>
                  </div>

                  {registration.accept_amount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Additional Services</span>
                      <span>₹{registration.accept_amount.toLocaleString()}</span>
                    </div>
                  )}

                  {registration.discount > 0 && (
                    <div className="flex justify-between text-sm text-danger-500">
                      <span>Discount</span>
                      <span>-₹{registration.discount.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="flex justify-between font-medium pt-2 border-t border-dashed border-default-200 dark:border-default-700">
                    <span>Total Amount</span>
                    <span>₹{registration.total_amount.toLocaleString()}</span>
                  </div>

                  {/* Add this to show selected bank in view mode */}
                  {registration.bank_details && (
                    <div className="flex justify-between text-sm pt-2">
                      <span>Selected Bank</span>
                      <span>{registration.bank_details.account_name} ({registration.bank_details.bank})</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Payment & Bank Information - Fixed Divider with label */}
            <div className="relative my-6">
              <Divider className="absolute w-full" />
              <div className="relative flex justify-center">
                <span className="bg-content1 px-3 text-xs text-default-500">
                  Payment Information
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Bank Details Section */}
              {registration.bank_details && (
                <div className="bg-default-50 dark:bg-content2 p-3 rounded-md">
                  <h3 className="text-sm font-semibold mb-2">Bank Details</h3>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-default-600">Account Name</span>
                      <span className="font-medium">
                        {registration.bank_details.account_name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-default-600">Bank</span>
                      <span>{registration.bank_details.bank}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-default-600">Account Number</span>
                      <span className="font-mono">
                        {registration.bank_details.account_number}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-default-600">IFSC Code</span>
                      <span className="font-mono">
                        {registration.bank_details.ifsc_code}
                      </span>
                    </div>
                    {registration.bank_details.upi_id && (
                      <div className="flex justify-between">
                        <span className="text-default-600">UPI ID</span>
                        <span>{registration.bank_details.upi_id}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Transaction Details Section */}
              {registration.transaction && (
                <div className="bg-success-50/30 dark:bg-success-900/10 p-3 rounded-md">
                  <h3 className="text-sm font-semibold mb-2">
                    Transaction Details
                  </h3>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Payment Method</span>
                      <span className="font-medium">
                        {registration.transaction.transaction_type}
                      </span>
                    </div>

                    {registration.transaction.transaction_id && (
                      <div className="flex justify-between">
                        <span>Transaction ID</span>
                        <span className="font-mono">
                          {registration.transaction.transaction_id}
                        </span>
                      </div>
                    )}

                    {registration.transaction.transaction_date && (
                      <div className="flex justify-between">
                        <span>Payment Date</span>
                        <span>
                          {formatDate(
                            registration.transaction.transaction_date
                          )}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between font-medium">
                      <span>Paid Amount</span>
                      <span>
                        ₹{registration.transaction.amount.toLocaleString()}
                      </span>
                    </div>

                    {/* Additional transaction details if available */}
                    {registration.transaction.additional_info &&
                      Object.keys(registration.transaction.additional_info)
                        .length > 0 && (
                        <div className="mt-1 pt-1 border-t border-dashed border-default-200 dark:border-default-700">
                          {Object.entries(
                            registration.transaction.additional_info
                          ).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span>
                                {key
                                  .replace(/_/g, " ")
                                  .replace(/\b\w/g, (l) => l.toUpperCase())}
                              </span>
                              <span>{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                </div>
              )}
            </div>

            {/* Payment Status Summary */}
            {registration.transaction && (
              <div className="flex justify-between items-center pt-2 mt-1 border-t border-default-200 dark:border-default-700">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Payment Status</span>
                  {registration.transaction.amount ===
                  registration.total_amount ? (
                    <Chip color="success" size="sm" variant="dot">
                      Fully Paid
                    </Chip>
                  ) : registration.transaction.amount <
                    registration.total_amount ? (
                    <Chip color="warning" size="sm" variant="dot">
                      Partially Paid
                    </Chip>
                  ) : (
                    <Chip color="primary" size="sm" variant="dot">
                      Overpaid
                    </Chip>
                  )}
                </div>

                {/* Show balance if partially paid */}
                {registration.transaction.amount <
                  registration.total_amount && (
                  <div className="text-sm">
                    <span className="text-warning-600">Balance: </span>
                    <span className="font-medium">
                      ₹
                      {(
                        registration.total_amount -
                        registration.transaction.amount
                      ).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Remove the stand-alone Client Notes card */}

        {/* Entity Assignment Section - Only show for "waiting for approval" status */}
        {registration.status === "waiting for approval" && (
          <Card className="md:col-span-1 dark:bg-content1">
            <CardHeader className="pb-1">
              <h2 className="text-lg font-bold">Entity Assignment</h2>
            </CardHeader>
            <Divider />
            <CardBody>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-default-600 mb-2">
                    Assign this registration to handle the client's project:
                  </p>
                  <div className="bg-default-50 dark:bg-content2 p-2 rounded text-sm">
                    <p className="font-medium">Requirement:</p>
                    <p>
                      {leads?.requirement ||
                        prospectus?.requirement ||
                        registration.prospectus?.requirement ||
                        "No requirement specified"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {selectedEntity ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="bg-primary-100 dark:bg-primary-900/30 text-primary p-2 rounded-md flex items-center gap-2">
                        <UserGroupIcon className="w-5 h-5" />
                        <span className="font-medium">
                          {assignableEntities.find((e) => e.id === selectedEntity)
                            ?.username || "Selected Entity"}
                        </span>
                      </div>
                      <Button
                        color="primary"
                        variant="light"
                        size="sm"
                        onClick={handleEntitySelect}
                      >
                        Change
                      </Button>
                    </div>
                  ) : (
                    <Button
                      color="primary"
                      onClick={handleEntitySelect}
                      startContent={<UserGroupIcon className="h-4 w-4" />}
                    >
                      Select Entity
                    </Button>
                  )}
                </div>

                {/* Action button */}
                <div className="pt-2 mt-2 border-t border-default-200 dark:border-default-700">
                  <Button
                    color="primary"
                    fullWidth
                    isDisabled={!selectedEntity}
                    isLoading={isSubmitting}
                    onClick={handleAssignEntity}
                    startContent={
                      !isSubmitting && <UserPlusIcon className="h-4 w-4" />
                    }
                  >
                    Assign Registration
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Entity selection for "quotation accepted" status */}
        {registration.status === "quotation accepted" && (
          <Card className="md:col-span-1 dark:bg-content1">
            <CardHeader className="pb-1">
              <h2 className="text-lg font-bold">Entity Assignment</h2>
            </CardHeader>
            <Divider />
            <CardBody>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-default-600 mb-2">
                    Assign an entity for this registration:
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {selectedEntity ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="bg-primary-100 dark:bg-primary-900/30 text-primary p-2 rounded-md flex items-center gap-2">
                        <UserGroupIcon className="w-5 h-5" />
                        <span className="font-medium">
                          {assignableEntities.find((e) => e.id === selectedEntity)
                            ?.username || "Selected Entity"}
                        </span>
                      </div>
                      <Button
                        color="primary"
                        variant="light"
                        size="sm"
                        onClick={handleEntitySelect}
                      >
                        Change
                      </Button>
                    </div>
                  ) : (
                    <Button
                      color="primary"
                      onClick={handleEntitySelect}
                      startContent={<UserGroupIcon className="h-4 w-4" />}
                    >
                      Select Entity
                    </Button>
                  )}
                </div>

                <div className="pt-2 mt-2 border-t border-default-200 dark:border-default-700">
                  <Button
                    color="success"
                    fullWidth
                    isDisabled={!selectedEntity}
                    onClick={() =>
                      document
                        .getElementById("payment-form")
                        ?.scrollIntoView({ behavior: "smooth" })
                    }
                  >
                    Continue to Payment
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Quotation Review Approval Button */}
        {registration.status === "quotation review" && (
          <Card className="md:col-span-3 dark:bg-content1">
            <CardHeader>
              <h2 className="text-xl font-bold">Quotation Review</h2>
            </CardHeader>
            <Divider />
            <CardBody className="py-8">
              <div className="flex flex-col items-center justify-center">
                <div className="mb-6 text-center">
                  <p className="text-default-700 mb-4">
                    This quotation is pending review. Once approved, the client
                    will be able to process payment.
                  </p>
                  <div className="bg-warning-50 text-warning-700 dark:bg-warning-900/20 dark:text-warning-400 p-4 rounded-md mb-4">
                    <p>
                      Please verify all details before approving the quotation.
                    </p>
                  </div>
                </div>
                <Button
                  color="primary"
                  size="lg"
                  className="px-8"
                  isLoading={isApprovingQuotation}
                  onClick={handleApproveQuotation}
                  startContent={
                    !isApprovingQuotation && (
                      <CheckCircleIcon className="h-5 w-5" />
                    )
                  }
                >
                  Approve Quotation
                </Button>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Payment Approval Form - Only show for quotation accepted */}
        {registration.status === "quotation accepted" && (
          <Card
            id="payment-form"
            className="md:col-span-3 dark:bg-content1 scroll-mt-6"
          >
            <CardHeader>
              <h2 className="text-xl font-bold">Process Payment</h2>
            </CardHeader>
            <Divider />
            <CardBody>
              <form
                onSubmit={handleSubmit(handleProcessPayment)}
                className="space-y-6"
              >
                {/* Payment Mode */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Payment Mode"
                    {...register("paymentMode")}
                    className="w-full"
                  >
                    <SelectItem key="cash" value="cash">
                      Cash
                    </SelectItem>
                    <SelectItem key="upi" value="upi">
                      UPI
                    </SelectItem>
                    <SelectItem key="netbanking" value="netbanking">
                      Net Banking
                    </SelectItem>
                    <SelectItem key="card" value="card">
                      Credit/Debit Card
                    </SelectItem>
                    <SelectItem key="cheque" value="cheque">
                      Cheque
                    </SelectItem>
                    <SelectItem key="wallet" value="wallet">
                      Wallet
                    </SelectItem>
                    <SelectItem key="gateway" value="gateway">
                      Payment Gateway
                    </SelectItem>
                    <SelectItem key="crypto" value="crypto">
                      Cryptocurrency
                    </SelectItem>
                  </Select>

                  <Input
                    type="date"
                    label="Transaction Date"
                    {...register("transactionDate", { required: true })}
                  />
                </div>

                {/* Amount */}
                <Input
                  type="number"
                  label="Amount"
                  startContent={<span className="text-default-400">₹</span>}
                  {...register("amount", { required: true, min: 1 })}
                />

                {/* Payment mode specific fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderPaymentFields()}
                </div>

                {/* Admin notes */}
                <Textarea
                  label="Additional Notes (Optional)"
                  placeholder="Add any notes or comments about this transaction"
                />

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="flat"
                    color="danger"
                    onClick={() => router.push("/admin/approval")}
                  >
                    Cancel
                  </Button>
                  <Button
                    color="success"
                    type="submit"
                    isLoading={isSubmitting}
                    startContent={
                      !isSubmitting && <CheckCircleIcon className="h-4 w-4" />
                    }
                    isDisabled={!selectedEntity}
                  >
                    Approve & Register
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        )}
      </div>

      {/* PDF Viewer Modal */}
      <Modal
        isOpen={isPdfModalOpen}
        onClose={onPdfModalClose}
        size="5xl"
        scrollBehavior="inside"
        backdrop="blur"
      >
        <ModalContent>
          <ModalHeader>{selectedFile?.originalName}</ModalHeader>
          <ModalBody>
            {selectedFile && (
              <div className="w-full h-[70vh]">
                <iframe
                  src={selectedFile.url}
                  className="w-full h-full border-0"
                  title={selectedFile.originalName}
                />
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              color="primary"
              as={Link}
              href={selectedFile?.url || "#"}
              target="_blank"
              rel="noopener noreferrer"
            >
              Download
            </Button>
            <Button color="default" onPress={onPdfModalClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Entity Selection Modal */}
      <Modal
        isOpen={isEntityModalOpen}
        onClose={onEntityModalClose}
        backdrop="blur"
      >
        <ModalContent className="dark:bg-content1">
          <ModalHeader className="flex flex-col gap-1">
            Assign Registration
          </ModalHeader>
          <ModalBody>
            {loadingEntities ? (
              <div className="py-8 flex flex-col items-center">
                <Spinner size="lg" color="primary" className="mb-4" />
                <p>Loading assignable entities...</p>
              </div>
            ) : assignableEntities.length > 0 ? (
              <>
                <p className="text-default-600 mb-2">
                  Requirement:{" "}
                  <span className="font-medium">
                    {leads?.requirement ||
                      prospectus?.requirement ||
                      registration.prospectus?.requirement ||
                      "Not specified"}
                  </span>
                </p>
                <p className="text-default-600 mb-4">
                  Select an entity to assign this registration to:
                </p>
                <Select
                  label="Assignee"
                  placeholder="Select an assignee"
                  value={selectedEntity}
                  onChange={handleEntityChange}
                  className="w-full"
                >
                  {assignableEntities.map((entity) => (
                    <SelectItem key={entity.id} value={entity.id}>
                      {entity.username}
                    </SelectItem>
                  ))}
                </Select>
              </>
            ) : (
              <div className="py-4">
                <div className="bg-warning-50 border border-warning-200 text-warning-700 dark:bg-warning-900/20 dark:border-warning-800 dark:text-warning-400 px-4 py-3 rounded mb-4">
                  <h3 className="font-medium mb-1">No Entities Available</h3>
                  <p>
                    There are no available entities for assignment. Please add
                    entities before proceeding.
                  </p>
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button color="default" variant="flat" onClick={onEntityModalClose}>
              Cancel
            </Button>
            <Button
              color="primary"
              onClick={() => {
                if (selectedEntity) {
                  onEntityModalClose();
                }
              }}
              isDisabled={!selectedEntity}
            >
              Confirm Selection
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Success Modal */}
      <Modal
        isOpen={isSuccessModalOpen}
        onClose={onSuccessModalClose}
        backdrop="blur"
      >
        <ModalContent className="dark:bg-content1">
          <ModalHeader>
            {registration.status === "waiting for approval"
              ? "Registration Assigned"
              : "Registration Approved"}
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col items-center py-4">
              <CheckCircleIcon className="w-16 h-16 text-success mb-4" />
              <p className="text-xl font-medium mb-2">Success!</p>
              <p className="text-center text-default-600">
                {registration.status === "waiting for approval"
                  ? `Registration #${registration.id} has been successfully assigned.`
                  : `Registration #${registration.id} has been successfully approved and marked as registered.`}
              </p>
              {selectedEntity && (
                <div className="mt-4 p-3 bg-success-50 dark:bg-success-900/20 text-success-600 dark:text-success-400 rounded-md text-center">
                  <p>
                    Assigned to:{" "}
                    <span className="font-medium">
                      {
                        assignableEntities.find((e) => e.id === selectedEntity)
                          ?.username
                      }
                    </span>
                  </p>
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              color="primary"
              onPress={() => {
                onSuccessModalClose();
                router.push("/admin/approval");
              }}
            >
              Return to Approvals
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Quotation Approved Modal */}
      <Modal
        isOpen={isQuotationApprovedModalOpen}
        onClose={onQuotationApprovedModalClose}
        backdrop="blur"
      >
        <ModalContent className="dark:bg-content1">
          <ModalHeader>Quotation Approved</ModalHeader>
          <ModalBody>
            <div className="flex flex-col items-center py-4">
              <CheckCircleIcon className="w-16 h-16 text-success mb-4" />
              <p className="text-xl font-medium mb-2">Success!</p>
              <p className="text-center text-default-600">
                Quotation #{registration.id} has been approved successfully. The
                client can now proceed with payment.
              </p>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              color="primary"
              onPress={() => {
                onQuotationApprovedModalClose();
                router.push("/admin/approval");
              }}
            >
              Return to Approvals
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

// Helper component for displaying fields
const InfoField = ({ label, value }: { label: string; value?: string }) => (
  <div className="p-3 bg-default-50 dark:bg-content2 rounded-lg">
    <p className="text-sm text-default-500 mb-1">{label}</p>
    <p className="font-medium">{value}</p>
  </div>
);

// Main component that handles params correctly
function ApprovalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Use React.use to unwrap the params Promise
  const resolvedParams = React.use(params);

  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-screen">
          <Spinner size="lg" />
        </div>
      }
    >
      <ApprovalDetailContent id={resolvedParams.id} />
    </Suspense>
  );
}

export default WithAdminAuth(ApprovalDetailPage);
