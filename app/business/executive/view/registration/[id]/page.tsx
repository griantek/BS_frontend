"use client";
import React, { Suspense } from "react";
import { useRouter } from "next/navigation";
import { checkAuth } from "@/utils/authCheck";
import { toast } from "react-toastify";
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
  SelectItem,
} from "@nextui-org/react"; // Correct import
import { format } from "date-fns";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import api from "@/services/api";
import { withExecutiveAuth } from "@/components/withExecutiveAuth";
import { useForm } from "react-hook-form";
import type { BankAccount, TransactionInfo, Editor } from "@/services/api";
import {
  hasPermission,
  PERMISSIONS,
  UserWithPermissions,
} from "@/utils/permissions";

// Replace the ExtendedRegistration interface to include the new payment fields
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
  status: string;
  month: number;
  year: number;
  created_at: string;
  transaction_id: number;
  notes?: string;
  updated_at: string;
  assigned_to: string;
  registered_by: string;
  client_id: string;
  admin_assigned: boolean;
  journal_added: boolean;
  author_status: string;
  file_path: string | null;
  author_comments: string | null;
  service_and_prices?: Record<string, number>;
  is_deleted: boolean;
  deleted_at: string | null;
  registration_date: string;
  is_secondary_payment_done: boolean;
  is_final_payment_done: boolean;
  secondary_payment: number | null;
  final_payment: number | null;
  prospectus: {
    id: number;
    date: string;
    email: string;
    notes: string;
    phone: string;
    state: string;
    reg_id: string;
    leads_id: number;
    services: string;
    entity_id: string; // This is the actual property in the API response (not executive_id)
    created_at: string;
    deleted_at: null;
    department: string;
    is_deleted: boolean;
    updated_at: string;
    client_name: string;
    requirement: string;
    tech_person: string;
    isregistered: boolean;
    next_follow_up: string;
    proposed_service_period: string;
    leads?: {
      id: number;
      date: string;
      state: string;
      title: string | null;
      degree: string | null;
      domain: string;
      country: string;
      remarks: string;
      attended: boolean;
      created_at: string;
      created_by: string;
      university: string | null;
      updated_at: string;
      assigned_to: string;
      client_name: string;
      lead_source: string;
      requirement: string;
      phone_number: string;
      followup_date: string;
      research_area: string | null;
      followup_status: string;
      prospectus_type: string;
      detailed_requirement: string;
    };
  };
  bank_accounts: {
    id: string;
    bank: string;
    branch: string;
    upi_id: string;
    ifsc_code: string;
    created_at: string;
    account_name: string;
    account_type: string;
    account_number: string;
    account_holder_name: string;
  };
  transactions: {
    id: number;
    amount: number;
    entity_id: string;
    executive: object;
    transaction_id: string;
    transaction_date: string;
    transaction_type: string;
    additional_info: {
      upi_id?: string;
      [key: string]: any;
    };
  };
  secondary_transaction: {
    id: number;
    amount: number;
    entity_id: string;
    executive: object;
    transaction_id: string;
    transaction_date: string;
    transaction_type: string;
    additional_info: {
      upi_id?: string;
      [key: string]: any;
    };
  };
  final_transaction: {
    id: number;
    amount: number;
    entity_id: string;
    executive: object;
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

// Add PAYMENT_MODE_MAP constant
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

// Add a helper function to calculate balance amount
const calculateBalanceAmount = (
  totalAmount: number,
  paidAmount: number = 0
): number => {
  return Math.max(0, totalAmount - paidAmount);
};

// Add a helper function to determine the payment status based on the requirement type
const getPaymentStatus = (registration: ExtendedRegistration) => {
  const requirement =
    registration.prospectus?.leads?.requirement?.toLowerCase() || "";

  // Paper writing requirement
  if (requirement.includes("paper writing")) {
    if (
      registration.journal_added &&
      registration.author_status === "completed"
    ) {
      return registration.is_secondary_payment_done
        ? { stage: "complete", label: "Manuscript Payment Complete" }
        : { stage: "pending", label: "Manuscript Payment Pending" };
    } else if (registration.journal_added) {
      return { stage: "in-progress", label: "Manuscript In Progress" };
    }
    return { stage: "not-started", label: "Manuscript Not Started" };
  }

  // Publication requirement
  if (requirement.includes("publication")) {
    if (registration.journal_added) {
      return registration.is_final_payment_done
        ? { stage: "complete", label: "Publication Payment Complete" }
        : { stage: "pending", label: "Publication Payment Pending" };
    }
    return { stage: "not-started", label: "Publication Not Started" };
  }

  // Default case
  return { stage: "unknown", label: "Status Unknown" };
};

// Update the PaymentStatusDisplay component with clearer status descriptions
const PaymentStatusDisplay = ({
  status,
  totalAmount,
  paidAmount,
  paymentType,
}: {
  status: string;
  totalAmount: number;
  paidAmount?: number;
  paymentType?: string;
}) => {
  // Calculate the balance amount
  const balanceAmount = calculateBalanceAmount(totalAmount, paidAmount || 0);
  const isPartiallyPaid =
    status === "registered" && paidAmount && paidAmount < totalAmount;

  return (
    <div className="space-y-2">
      <div className="flex items-center">
        <Chip
          color={
            status === "registered"
              ? isPartiallyPaid 
                ? "warning" 
                : "success"
              : status === "waiting for approval"
              ? "danger"
              : "warning"
          }
          variant="flat"
          size="sm"
        >
          {status === "registered"
            ? isPartiallyPaid
              ? "Partially Paid (Due)" // More clear language
              : "Fully Paid"
            : status === "waiting for approval" 
              ? "Pending Payment"
              : "Pending"}
        </Chip>

        {paymentType && status === "registered" && (
          <Chip className="ml-2" color="primary" variant="flat" size="sm">
            {paymentType}
          </Chip>
        )}
      </div>

      {isPartiallyPaid && (
        <div className="text-sm bg-warning-50 dark:bg-warning-900/20 p-2 rounded text-warning-700 dark:text-warning-400">
          <div className="font-medium">
            Balance Due: ₹{balanceAmount.toLocaleString()}
          </div>
          <div className="text-xs">
            Paid: ₹{paidAmount.toLocaleString()} of ₹
            {totalAmount.toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
};

// Update the PaymentTimeline component with clearer status descriptions
const PaymentTimeline = ({
  registration,
  handleOpenPaymentModal,
}: {
  registration: ExtendedRegistration;
  handleOpenPaymentModal: (type: "secondary" | "final") => void;
}) => {
  const requirement = registration.prospectus?.leads?.requirement?.toLowerCase() || 
                      registration.prospectus?.requirement?.toLowerCase() || '';
  const isPaperWriting = requirement.includes('paper writing');
  const isPublication = requirement.includes('publication');
  
  // Format date helper function
  const formatTimelineDate = (date: string) => {
    try {
      return format(new Date(date), 'MMM dd, yyyy');
    } catch {
      return date;
    }
  };

  // Check if initial payment is partially paid
  const isInitialPartiallyPaid = 
    registration.status === "registered" && 
    registration.transactions && 
    registration.transactions.amount < registration.total_amount;
  
  // Calculate initial payment balance
  const initialBalanceAmount = isInitialPartiallyPaid 
    ? registration.total_amount - registration.transactions.amount 
    : 0;

  return (
    <div className="mt-6">
      <h3 className="text-md font-semibold mb-4">Payment Timeline</h3>
      <div className="relative">
        {/* Timeline line - Fix Z-index issue by moving it behind the icons */}
        <div className="absolute left-6 top-0 h-full border-l-2 border-gray-200 dark:border-gray-700 z-0"></div>
        
        {/* Initial Payment */}
        <div className="flex mb-8 items-start relative">
          <div className="flex flex-col items-center mr-4 z-10">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="h-full border-l-2 border-transparent"></div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md w-full">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-lg font-semibold">Initial Payment</h4>
                <p className="text-sm text-gray-500">
                  {registration.status === "registered" ? formatTimelineDate(registration.transactions.transaction_date) : "Not Paid Yet"}
                </p>
              </div>
              <Chip 
                color={
                  registration.status === "registered" 
                    ? isInitialPartiallyPaid ? "warning" : "success"
                    : "danger"
                }
                variant="flat"
              >
                {registration.status === "registered" 
                  ? isInitialPartiallyPaid ? "Partially Paid (Due)" : "Fully Paid" 
                  : "Pending Payment"}
              </Chip>
            </div>
            
            {registration.status === "registered" && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Amount</p>
                  <p className="font-medium">₹{registration.transactions.amount.toLocaleString()}</p>
                  {isInitialPartiallyPaid && (
                    <p className="text-xs text-warning mt-1">
                      of ₹{registration.total_amount.toLocaleString()}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-500">Payment Method</p>
                  <p className="font-medium">{registration.transactions.transaction_type}</p>
                </div>
                {registration.transactions.transaction_id && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">Transaction ID</p>
                    <p className="font-medium">{registration.transactions.transaction_id}</p>
                  </div>
                )}
                {isInitialPartiallyPaid && (
                  <div className="col-span-2 bg-warning-50 dark:bg-warning-900/20 p-2 rounded text-warning-700 dark:text-warning-400">
                    <p className="font-medium">Balance Due: ₹{initialBalanceAmount.toLocaleString()}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Secondary Payment - Only for Paper Writing */}
        {isPaperWriting && (
          <div className="flex mb-8 items-start relative">
            <div className="flex flex-col items-center mr-4 z-10">
              <div className={`flex items-center justify-center w-12 h-12 rounded-full ${registration.journal_added && registration.author_status === "completed" ? (registration.is_secondary_payment_done ? "bg-success text-white" : "bg-warning text-white") : "bg-gray-300 text-gray-600"}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="h-full border-l-2 border-transparent"></div>
            </div>
            <div className={`${registration.journal_added && registration.author_status === "completed" ? "bg-white dark:bg-gray-800" : "bg-gray-100 dark:bg-gray-900"} p-4 rounded-lg shadow-md w-full`}>
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-lg font-semibold">Manuscript Payment</h4>
                  <p className="text-sm text-gray-500">
                    {registration.is_secondary_payment_done ? 
                      (registration.secondary_transaction ? formatTimelineDate(registration.secondary_transaction.transaction_date) : "Completed") : 
                      (registration.journal_added && registration.author_status === "completed" ? "Payment Required" : "Manuscript Not Ready Yet")}
                  </p>
                </div>
                <Chip 
                  color={
                    registration.is_secondary_payment_done ? "success" : 
                    (registration.journal_added && registration.author_status === "completed") ? "danger" : 
                    "default"
                  }
                  variant="flat"
                >
                  {registration.is_secondary_payment_done ? "Paid" : 
                   (registration.journal_added && registration.author_status === "completed") ? "Payment Due" : 
                   "Not Required Yet"}
                </Chip>
              </div>
              
              {registration.is_secondary_payment_done && registration.secondary_transaction && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Amount</p>
                    <p className="font-medium">₹{registration.secondary_transaction.amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Payment Method</p>
                    <p className="font-medium">{registration.secondary_transaction.transaction_type}</p>
                  </div>
                  {registration.secondary_transaction.transaction_id && (
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500">Transaction ID</p>
                      <p className="font-medium">{registration.secondary_transaction.transaction_id}</p>
                    </div>
                  )}
                </div>
              )}
              
              {registration.journal_added && registration.author_status === "completed" && !registration.is_secondary_payment_done && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    color="primary"
                    size="sm"
                    onClick={() => handleOpenPaymentModal("secondary")}
                    className="w-full"
                  >
                    Process Manuscript Payment
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Final Payment - Only for Publication */}
        {isPublication && (
          <div className="flex mb-8 items-start relative">
            <div className="flex flex-col items-center mr-4 z-10">
              <div className={`flex items-center justify-center w-12 h-12 rounded-full ${registration.journal_added ? (registration.is_final_payment_done ? "bg-success text-white" : "bg-warning text-white") : "bg-gray-300 text-gray-600"}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
            </div>
            <div className={`${registration.journal_added ? "bg-white dark:bg-gray-800" : "bg-gray-100 dark:bg-gray-900"} p-4 rounded-lg shadow-md w-full`}>
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-lg font-semibold">Publication Payment</h4>
                  <p className="text-sm text-gray-500">
                    {registration.is_final_payment_done ? 
                      (registration.final_transaction ? formatTimelineDate(registration.final_transaction.transaction_date) : "Completed") : 
                      (registration.journal_added ? "Payment Required" : "Publication Not Ready Yet")}
                  </p>
                </div>
                <Chip 
                  color={
                    registration.is_final_payment_done ? "success" : 
                    registration.journal_added ? "danger" : 
                    "default"
                  }
                  variant="flat"
                >
                  {registration.is_final_payment_done ? "Paid" : 
                   registration.journal_added ? "Payment Due" : 
                   "Not Required Yet"}
                </Chip>
              </div>
              
              {registration.is_final_payment_done && registration.final_transaction && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Amount</p>
                    <p className="font-medium">₹{registration.final_transaction.amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Payment Method</p>
                    <p className="font-medium">{registration.final_transaction.transaction_type}</p>
                  </div>
                  {registration.final_transaction.transaction_id && (
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500">Transaction ID</p>
                      <p className="font-medium">{registration.final_transaction.transaction_id}</p>
                    </div>
                  )}
                </div>
              )}
              
              {registration.journal_added && !registration.is_final_payment_done && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    color="primary"
                    size="sm"
                    onClick={() => handleOpenPaymentModal("final")}
                    className="w-full"
                  >
                    Process Publication Payment
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function RegistrationContent({ regId }: { regId: string }) {
  const router = useRouter();
  const {
    isOpen: isPaymentModalOpen,
    onOpen: onPaymentModalOpen,
    onClose: onPaymentModalClose,
  } = useDisclosure();
  const {
    isOpen: isDeleteModalOpen,
    onOpen: onDeleteModalOpen,
    onClose: onDeleteModalClose,
  } = useDisclosure();
  // Add new state for payment modal
  const [paymentType, setPaymentType] = React.useState<"secondary" | "final">("secondary");
  const [isSubmittingPayment, setIsSubmittingPayment] = React.useState(false);
  
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [registrationData, setRegistrationData] =
    React.useState<ExtendedRegistration | null>(null);
  const [bankAccounts, setBankAccounts] = React.useState<BankAccount[]>([]);
  const [editors, setEditors] = React.useState<Editor[]>([]);

  // Add permission states
  const [permissions, setPermissions] = React.useState({
    canEditRegistration: false,
    canDeleteRegistration: false,
    canApproveRegistration: false,
  });

  // Add payment form hook
  const paymentForm = useForm<PaymentFormData>({
    defaultValues: {
      paymentMode: "cash",
      amount: 0,
      transactionDate: new Date().toISOString().split("T")[0],
    },
  });

  React.useEffect(() => {
    if (!checkAuth(router)) return;

    const userStr = localStorage.getItem("user");
    if (!userStr) return;

    const userData: UserWithPermissions = JSON.parse(userStr);

    // Check permissions
    setPermissions({
      canEditRegistration: hasPermission(
        userData,
        PERMISSIONS.SHOW_EDIT_REGISTRATION_BUTTON
      ),
      canDeleteRegistration: hasPermission(
        userData,
        PERMISSIONS.SHOW_DELETE_REGISTRATION_BUTTON
      ),
      canApproveRegistration: hasPermission(
        userData,
        PERMISSIONS.SHOW_APPROVE_BUTTON
      ),
    });

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [registrationResponse, bankResponse, editorsResponse] =
          await Promise.all([
            api.getRegistrationById(parseInt(regId)),
            api.getAllBankAccounts(),
            api.getAllEditors(),
          ]);

        // Use a type assertion with unknown as an intermediate step
        setRegistrationData(
          registrationResponse.data as unknown as ExtendedRegistration
        );
        setBankAccounts(bankResponse.data);
        setEditors(editorsResponse.data);
      } catch (error) {
        console.error("Error fetching registration:", error);
        toast.error("Failed to load registration data");
        // router.push("/business/executives");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router, regId]);

  const handleDelete = async () => {
    if (!registrationData) return;
    
    try {
      setIsDeleting(true);
      const response = await api.deleteRegistration(registrationData.id);
      
      if (response.success) {
        toast.success("Registration deleted successfully");
        router.push("/business/executive/records/registration");
      } else {
        toast.error("Failed to delete registration");
      }
    } catch (error) {
      console.error("Error deleting registration:", error);
      toast.error("Failed to delete registration");
    } finally {
      setIsDeleting(false);
      onDeleteModalClose();
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (!registrationData) return <div>No data found</div>;

  const formatDate = (date: string) => format(new Date(date), "dd/MM/yyyy");

  const calculateTotalPaid = () => {
    let total = 0;
    
    // Add initial payment if registered
    if (registrationData.status === "registered" && registrationData.transactions) {
      total += registrationData.transactions.amount || 0;
    }
    
    // Add secondary payment if applicable
    if (registrationData.is_secondary_payment_done && registrationData.secondary_transaction) {
      total += registrationData.secondary_transaction.amount || 0;
    }
    
    // Add final payment if applicable
    if (registrationData.is_final_payment_done && registrationData.final_transaction) {
      total += registrationData.final_transaction.amount || 0;
    }
    
    return total;
  };

  // Helper function to check if requirement includes paper writing
  const isPaperWriting = () => {
    const requirement = registrationData.prospectus?.leads?.requirement?.toLowerCase() || 
                        registrationData.prospectus?.requirement?.toLowerCase() || '';
    return requirement.includes('paper writing');
  };

  // Helper function to check if requirement includes publication
  const isPublication = () => {
    const requirement = registrationData.prospectus?.leads?.requirement?.toLowerCase() || 
                        registrationData.prospectus?.requirement?.toLowerCase() || '';
    return requirement.includes('publication');
  };

  const renderPaymentFields = () => {
    const paymentMode = paymentForm.watch("paymentMode");

    switch (paymentMode) {
      case "upi":
        return (
          <>
            <Input
              type="text"
              label="UPI ID"
              placeholder="example@upi"
              {...paymentForm.register("upiId")}
            />
            <Input
              type="text"
              label="Transaction ID"
              {...paymentForm.register("transactionId")}
            />
          </>
        );

      case "netbanking":
        return (
          <>
            <Input
              type="text"
              label="Account Number"
              {...paymentForm.register("accountNumber")}
            />
            <Input type="text" label="IFSC Code" {...paymentForm.register("ifscCode")} />
            <Input
              type="text"
              label="Transaction Reference"
              {...paymentForm.register("transactionId")}
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
              {...paymentForm.register("cardLastFourDigits")}
            />
            <Input
              type="text"
              label="Transaction ID"
              {...paymentForm.register("transactionId")}
            />
          </>
        );

      case "cash":
        return (
          <Input
            type="text"
            label="Receipt Number"
            {...paymentForm.register("receiptNumber")}
          />
        );

      case "cheque":
        return (
          <Input
            type="text"
            label="Cheque Number"
            {...paymentForm.register("chequeNumber")}
          />
        );

      case "wallet":
        return (
          <>
            <Select label="Wallet Provider" {...paymentForm.register("walletProvider")}>
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
              {...paymentForm.register("transactionId")}
            />
          </>
        );

      case "gateway":
        return (
          <>
            <Select label="Payment Gateway" {...paymentForm.register("gatewayProvider")}>
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
              {...paymentForm.register("transactionId")}
            />
          </>
        );

      case "crypto":
        return (
          <>
            <Input
              type="text"
              label="Transaction Hash"
              {...paymentForm.register("transactionHash")}
            />
            <Input
              type="text"
              label="Cryptocurrency"
              {...paymentForm.register("cryptoCurrency")}
            />
          </>
        );

      default:
        return null;
    }
  };

  // Add handler for opening payment modal based on type
  const handleOpenPaymentModal = (type: "secondary" | "final") => {
    setPaymentType(type);
    paymentForm.reset({
      paymentMode: "cash",
      amount: 0,
      transactionDate: new Date().toISOString().split("T")[0],
    });
    onPaymentModalOpen();
  };

  // Add handler for payment submission
  const handlePaymentSubmit = async (data: PaymentFormData) => {
    if (!registrationData) return;
    
    try {
      setIsSubmittingPayment(true);
      
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
          if (data.upiId) additionalInfo.upi_id = data.upiId;
          break;
        case "netbanking":
          if (data.accountNumber) additionalInfo.account_number = data.accountNumber;
          if (data.ifscCode) additionalInfo.ifsc_code = data.ifscCode;
          break;
        case "card":
          if (data.cardLastFourDigits) additionalInfo.card_last_four = data.cardLastFourDigits;
          break;
        case "cash":
          if (data.receiptNumber) additionalInfo.receipt_number = data.receiptNumber;
          break;
        case "cheque":
          if (data.chequeNumber) additionalInfo.cheque_number = data.chequeNumber;
          break;
        case "wallet":
          if (data.walletProvider) additionalInfo.wallet_provider = data.walletProvider;
          break;
        case "gateway":
          if (data.gatewayProvider) additionalInfo.gateway_provider = data.gatewayProvider;
          break;
        case "crypto":
          if (data.transactionHash) additionalInfo.transaction_hash = data.transactionHash;
          if (data.cryptoCurrency) additionalInfo.crypto_currency = data.cryptoCurrency;
          break;
      }
      
      // Prepare payment data
      const paymentData = {
        registration_id: registrationData.id,
        transaction_type: PAYMENT_MODE_MAP[data.paymentMode],
        transaction_id: data.transactionId || '',
        amount: Number(data.amount),
        transaction_date: data.transactionDate,
        additional_info: additionalInfo,
        entity_id: user.id,
      };
      
      let response;
      if (paymentType === "secondary") {
        response = await api.addSecondaryPaymentTransaction(paymentData);
      } else {
        response = await api.addFinalPaymentTransaction(paymentData);
      }
      
      if (response.success) {
        toast.success(`${paymentType === "secondary" ? "Manuscript" : "Publication"} payment recorded successfully`);
        
        // Update local state to reflect the payment
        setRegistrationData(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            is_secondary_payment_done: paymentType === "secondary" ? true : prev.is_secondary_payment_done,
            is_final_payment_done: paymentType === "final" ? true : prev.is_final_payment_done,
          };
        });
        
        // Close modal and refresh the page to show updated data
        onPaymentModalClose();
        window.location.reload();
      } else {
        toast.error(`Failed to record ${paymentType === "secondary" ? "manuscript" : "publication"} payment`);
      }
    } catch (error) {
      console.error(`${paymentType} payment error:`, error);
      toast.error(`Failed to record ${paymentType === "secondary" ? "manuscript" : "publication"} payment`);
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  // Update the ProjectStatusDisplay component to use the new payment handlers and handle combined requirements
  const ProjectStatusDisplay = ({
    registration,
  }: {
    registration: ExtendedRegistration;
  }) => {
    const requirement = registration.prospectus?.leads?.requirement?.toLowerCase() || 
                        registration.prospectus?.requirement?.toLowerCase() || "";
    const isPaperWriting = requirement.includes('paper writing');
    const isPublication = requirement.includes('publication');
    const isCombined = isPaperWriting && isPublication;

    return (
      <div className="space-y-4">
        {isPaperWriting && (
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="text-md font-semibold mb-2">Manuscript Status</h3>
            <div className="flex items-center justify-between">
              <div>
                <Chip
                  color={
                    registration.author_status === "completed"
                      ? "success"
                      : registration.author_status === "in progress"
                      ? "warning"
                      : "default"
                  }
                  variant="flat"
                >
                  {registration.author_status === "completed"
                    ? "Completed"
                    : registration.author_status === "in progress"
                    ? "In Progress"
                    : "Not Started"}
                </Chip>
                {registration.author_status === "completed" && (
                  <Chip
                    className="ml-2"
                    color={
                      registration.is_secondary_payment_done ? "success" : "danger"
                    }
                    variant="flat"
                  >
                    {registration.is_secondary_payment_done
                      ? "Paid"
                      : "Payment Due"}
                  </Chip>
                )}
              </div>
              {registration.author_status === "completed" &&
                !registration.is_secondary_payment_done && (
                  <Button
                    color="primary"
                    size="sm"
                    onClick={() => handleOpenPaymentModal("secondary")}
                  >
                    Process Manuscript Payment
                  </Button>
                )}
            </div>
          </div>
        )}

        {isPublication && (
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="text-md font-semibold mb-2">Publication Status</h3>
            <div className="flex items-center justify-between">
              <div>
                <Chip
                  color={registration.journal_added ? "success" : "default"}
                  variant="flat"
                >
                  {registration.journal_added ? "Published" : "Not Published"}
                </Chip>
                {registration.journal_added && (
                  <Chip
                    className="ml-2"
                    color={
                      registration.is_final_payment_done ? "success" : "danger"
                    }
                    variant="flat"
                  >
                    {registration.is_final_payment_done
                      ? "Paid"
                      : "Payment Due"}
                  </Chip>
                )}
              </div>
              {registration.journal_added &&
                !registration.is_final_payment_done && (
                  <Button
                    color="primary"
                    size="sm"
                    onClick={() => handleOpenPaymentModal("final")}
                  >
                    Process Publication Payment
                  </Button>
                )}
            </div>
          </div>
        )}
        
        {/* Add a summary section for combined requirements */}
        {isCombined && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="text-md font-semibold mb-2 text-blue-700 dark:text-blue-300">Combined Project Status</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Manuscript:</span>
                <Chip
                  size="sm"
                  color={
                    registration.author_status === "completed"
                      ? (registration.is_secondary_payment_done ? "success" : "warning")
                      : "default"
                  }
                >
                  {registration.author_status === "completed"
                    ? (registration.is_secondary_payment_done ? "Completed & Paid" : "Completed (Payment Due)")
                    : (registration.author_status === "in progress" ? "In Progress" : "Not Started")}
                </Chip>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Publication:</span>
                <Chip
                  size="sm"
                  color={
                    registration.journal_added
                      ? (registration.is_final_payment_done ? "success" : "warning")
                      : "default"
                  }
                >
                  {registration.journal_added
                    ? (registration.is_final_payment_done ? "Published & Paid" : "Published (Payment Due)")
                    : "Not Started"}
                </Chip>
              </div>
              
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-blue-200 dark:border-blue-800">
                <span className="font-medium">Overall Status:</span>
                <Chip
                  size="sm"
                  color={
                    registration.author_status === "completed" && registration.journal_added && 
                    registration.is_secondary_payment_done && registration.is_final_payment_done
                      ? "success"
                      : "warning"
                  }
                >
                  {registration.author_status === "completed" && registration.journal_added && 
                   registration.is_secondary_payment_done && registration.is_final_payment_done
                    ? "All Work Complete & Paid" 
                    : "In Progress"}
                </Chip>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Back button - improved positioning and visibility */}
      <Button
        variant="light"
        className=" left-4 z-[1000] shadow-md flex items-center gap-2"
        onClick={() =>
          router.push("/business/executive/records/registration")
        }
        startContent={<ArrowLeftIcon className="h-5 w-5" />}
      >
        Back
      </Button>

      <div className="w-full p-6 space-y-6">
        {/* Header with status and actions */}
        <Card className="w-full">
          <CardHeader className="flex justify-between items-center px-6 py-4">
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold">Registration Details</h1>
              <p className="text-small text-default-500">
                ID: #{registrationData.id}
              </p>
              <p className="text-small text-default-500">
                REG ID: {registrationData.prospectus.reg_id}
              </p>
            </div>
            <div className="flex gap-3">
              {/* Check both registration status and permission */}
              {permissions.canEditRegistration && (
                <Button
                  color="primary"
                  variant="flat"
                  onPress={() =>
                    router.push(
                      `/business/executive/edit/registration/${regId}`
                    )
                  }
                >
                  Edit Registration
                </Button>
              )}
              {/* Add Delete button */}
              {permissions.canDeleteRegistration && (
                <Button
                  color="danger"
                  variant="flat"
                  onPress={onDeleteModalOpen}
                >
                  Delete Registration
                </Button>
              )}
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
                <InfoField
                  label="Client Name"
                  value={registrationData.prospectus.client_name}
                />
                <InfoField
                  label="Email"
                  value={registrationData.prospectus.email}
                />
                <InfoField
                  label="Phone"
                  value={registrationData.prospectus.phone}
                />
                <InfoField
                  label="Department"
                  value={registrationData.prospectus.department}
                />
                <InfoField
                  label="State"
                  value={registrationData.prospectus.state}
                />
                {/* {registrationData.assigned_to && (
                  <InfoField
                    label="Assigned Editor"
                    value={
                      editors?.find(
                        (e) => e.id === registrationData.assigned_to
                      )?.username || registrationData.assigned_to
                    }
                  />
                )} */}
                <InfoField label="Status">
                  <Chip
                    color={
                      registrationData.status === "registered"
                        ? "success"
                        : registrationData.status === "waiting for approval"
                        ? "danger"
                        : "warning"
                    }
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
                <InfoField
                  label="Registration Date"
                  value={formatDate(registrationData.date)}
                />
                <InfoField label="Services" value={registrationData.services} />
                <InfoField
                  label="Accept Period"
                  value={registrationData.accept_period}
                />
                <InfoField
                  label="Publication Period"
                  value={registrationData.pub_period}
                />
                <InfoField
                  label="Month/Year"
                  value={`${registrationData.month}/${registrationData.year}`}
                />

                {/* Lead Requirement (if available) */}
                {registrationData.prospectus.leads?.requirement && (
                  <InfoField
                    label="Requirement"
                    value={registrationData.prospectus.leads.requirement}
                  />
                )}
              </div>
            </CardBody>
          </Card>

          {/* Project Status Card */}
          <Card className="w-full md:col-span-2">
            <CardHeader>
              <h2 className="text-xl font-bold">Project Status</h2>
            </CardHeader>
            <Divider />
            <CardBody>
              <ProjectStatusDisplay registration={registrationData} />
            </CardBody>
          </Card>

          {/* Enhanced Combined Financial Information */}
          <Card className="w-full md:col-span-2">
            <CardHeader>
              <h2 className="text-xl font-bold">Financial Overview</h2>
            </CardHeader>
            <Divider />
            <CardBody className="space-y-8">
              {/* Payment Summary - Updated to include all payment types and clearer partial payment status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Initial Amount Card */}
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
                  <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                  <p className="text-2xl font-bold">
                    ₹{registrationData.total_amount.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Full amount for registration
                  </p>
                </div>

                {/* Total Paid Amount */}
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
                  <p className="text-sm text-gray-600 mb-1">Total Paid</p>
                  <p className="text-2xl font-bold text-success">
                    ₹{calculateTotalPaid().toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {calculateTotalPaid() < registrationData.total_amount 
                      ? `Partial payment (${Math.round((calculateTotalPaid() / registrationData.total_amount) * 100)}%)`
                      : "Fully paid"
                    }
                  </p>
                </div>

                {/* Payment Status Summary */}
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
                  <p className="text-sm text-gray-600 mb-1">
                    Payment Status
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {registrationData.status === "registered" && (
                      <Chip 
                        color={registrationData.transactions.amount < registrationData.total_amount ? "warning" : "success"} 
                        variant="flat" 
                        size="sm"
                      >
                        {registrationData.transactions.amount < registrationData.total_amount 
                          ? "Initial Payment Due" 
                          : "Initial Payment Complete"
                        }
                      </Chip>
                    )}
                    {registrationData.status !== "registered" && (
                      <Chip color="danger" variant="flat" size="sm">
                        Initial Payment Pending
                      </Chip>
                    )}
                    {registrationData.is_secondary_payment_done && (
                      <Chip color="success" variant="flat" size="sm">Manuscript Payment Complete</Chip>
                    )}
                    {isPaperWriting() && !registrationData.is_secondary_payment_done && registrationData.author_status === "completed" && (
                      <Chip color="danger" variant="flat" size="sm">Manuscript Payment Due</Chip>
                    )}
                    {registrationData.is_final_payment_done && (
                      <Chip color="success" variant="flat" size="sm">Publication Payment Complete</Chip>
                    )}
                    {isPublication() && !registrationData.is_final_payment_done && registrationData.journal_added && (
                      <Chip color="danger" variant="flat" size="sm">Publication Payment Due</Chip>
                    )}
                  </div>
                </div>
              </div>

              {/* Payment Timeline */}
              <PaymentTimeline 
                registration={registrationData} 
                handleOpenPaymentModal={handleOpenPaymentModal}
              />

              {/* Cost Breakdown - Updated to show unpaid amount clearly */}
              <div className="bg-default-50 dark:bg-default-300/20 p-6 rounded-xl">
                <h3 className="text-md font-semibold mb-4">Payment Breakdown</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-400">Initial Payment</span>
                    <div className="text-right">
                      <span className="font-medium">
                        ₹{registrationData.transactions?.amount?.toLocaleString() || '0'}
                      </span>
                      {registrationData.status === "registered" && 
                       registrationData.transactions && 
                       registrationData.transactions.amount < registrationData.total_amount && (
                        <div className="text-xs text-warning">
                          of ₹{registrationData.total_amount.toLocaleString()} 
                          (Balance Due: ₹{(registrationData.total_amount - registrationData.transactions.amount).toLocaleString()})
                        </div>
                      )}
                    </div>
                  </div>

                  {isPaperWriting() && (
                    <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-400">
                      <span className="text-gray-400">Manuscript Payment</span>
                      <span className="font-medium">
                        {registrationData.is_secondary_payment_done && registrationData.secondary_transaction
                          ? `₹${registrationData.secondary_transaction.amount.toLocaleString()}`
                          : registrationData.author_status === "completed" 
                            ? <span className="text-danger">Payment Due</span> 
                            : <span className="text-gray-500">Not Required Yet</span>
                        }
                      </span>
                    </div>
                  )}
                  
                  {isPublication() && (
                    <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-gray-400">Publication Payment</span>
                      <span className="font-medium">
                        {registrationData.is_final_payment_done && registrationData.final_transaction
                          ? `₹${registrationData.final_transaction.amount.toLocaleString()}`
                          : registrationData.journal_added 
                            ? <span className="text-danger">Payment Due</span> 
                            : <span className="text-gray-500">Not Required Yet</span>
                        }
                      </span>
                    </div>
                  )}
                  
                  {registrationData.discount > 0 && (
                    <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-gray-400">Discount Applied</span>
                      <span className="font-medium text-green-600">
                        - ₹{registrationData.discount.toLocaleString()}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-2">
                    <span className="font-semibold">Total Amount Paid</span>
                    <span className="font-bold text-lg">
                      ₹{calculateTotalPaid().toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Bank Details - Show after financial details */}
          {(registrationData.status === "registered" ||
            registrationData.status === "waiting for approval") && (
            <Card className="w-full md:col-span-2">
              <CardHeader>
                <h2 className="text-xl font-bold">Bank Information</h2>
              </CardHeader>
              <Divider />
              <CardBody className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <InfoField
                    label="Bank Name"
                    value={registrationData.bank_accounts.bank}
                  />
                  <InfoField
                    label="Branch"
                    value={registrationData.bank_accounts.branch}
                  />
                  <InfoField
                    label="Account Name"
                    value={registrationData.bank_accounts.account_name}
                  />
                  <InfoField
                    label="Account Holder"
                    value={
                      registrationData.bank_accounts.account_holder_name
                    }
                  />
                  <InfoField
                    label="Account Number"
                    value={registrationData.bank_accounts.account_number}
                  />
                  <InfoField
                    label="Account Type"
                    value={registrationData.bank_accounts.account_type}
                  />
                  <InfoField
                    label="IFSC Code"
                    value={registrationData.bank_accounts.ifsc_code}
                  />
                  {registrationData.bank_accounts.upi_id && (
                    <InfoField
                      label="UPI ID"
                      value={registrationData.bank_accounts.upi_id}
                    />
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

      {/* Add Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          onPaymentModalClose();
          paymentForm.reset();
        }}
        size="2xl"
      >
        <ModalContent>
          <form onSubmit={paymentForm.handleSubmit(handlePaymentSubmit)}>
            <ModalHeader>
              {paymentType === "secondary"
                ? "Manuscript Payment" 
                : "Publication Payment"}
            </ModalHeader>
            <ModalBody className="space-y-4">
              {/* Payment Mode */}
              <Select 
                label="Payment Mode" 
                selectedKeys={[paymentForm.watch("paymentMode")]}
                onChange={(e) => paymentForm.setValue("paymentMode", e.target.value as any)}
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
                  {...paymentForm.register("amount", { required: true })}
                />
                <Input
                  type="date"
                  label="Transaction Date"
                  {...paymentForm.register("transactionDate", { required: true })}
                />
              </div>

              {/* Dynamic Payment Fields */}
              {renderPaymentFields()}
            </ModalBody>
            <ModalFooter>
              <Button
                color="danger"
                variant="light"
                onPress={onPaymentModalClose}
              >
                Cancel
              </Button>
              <Button 
                color="primary" 
                type="submit"
                isLoading={isSubmittingPayment}
              >
                Submit Payment
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
            Are you sure you want to delete this registration? This action
            cannot be undone.
          </ModalBody>
          <ModalFooter>
            <Button
              color="default"
              variant="light"
              onPress={onDeleteModalClose}
            >
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
const InfoField = ({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
}) => (
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
