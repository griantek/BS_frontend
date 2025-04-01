"use client";
import React, { useState, useEffect, Suspense } from "react";
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
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import api, { TransactionInfo } from "@/services/api";
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
  registered_by: string;
  client_id: string;
  admin_assigned: boolean;
  journal_added: boolean;
  author_status: string;
  file_path: string | null;
  author_comments: string | null;
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
  const [registration, setRegistration] = useState<RegistrationData | null>(null);
  const [quotation, setQuotation] = useState<ClientQuotation | null>(null);
  const [selectedFile, setSelectedFile] = useState<QuotationFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { isOpen: isPdfModalOpen, onOpen: onPdfModalOpen, onClose: onPdfModalClose } = useDisclosure();
  const { isOpen: isSuccessModalOpen, onOpen: onSuccessModalOpen, onClose: onSuccessModalClose } = useDisclosure();

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
    }
  });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.getClientRegistrationWithQuotation(parseInt(id));
      console.log("Registration data:", response);
      
      if (response.data?.registrations && response.data.registrations.length > 0) {
        // Cast the registration data from the API to match our RegistrationData type
        const registrationData = response.data.registrations[0] as unknown as RegistrationData;
        setRegistration(registrationData);
        
        // Set amount in the form
        if (registrationData.total_amount) {
          reset({
            ...watch(),
            amount: registrationData.total_amount,
          });
        }
      }
      
      if (response.data?.quotations && response.data.quotations.length > 0) {
        // Cast the quotation data to match our ClientQuotation interface
        const quotationData = response.data.quotations[0] as unknown as ClientQuotation;
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
            <Input 
              type="text" 
              label="IFSC Code" 
              {...register("ifscCode")} 
            />
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
            <Select label="Payment Gateway" {...register("gatewayProvider")}>
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
      };

      // Send update request
      const response = await api.approveRegistration(
        registration.id,
        updateData
      );

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
              <Button 
                color="primary" 
                onClick={fetchData}
              >
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
  
  if (!registration || !quotation) {
    return (
      <div className="p-6">
        <Card>
          <CardBody className="text-center py-12">
            <ExclamationTriangleIcon className="w-12 h-12 mx-auto text-danger mb-4" />
            <p className="text-default-600 mb-4">Registration or quotation information not found</p>
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
      <Button
        variant="light"
        startContent={<ArrowLeftIcon className="h-5 w-5" />}
        onClick={() => router.push("/admin/approval")}
      >
        Back to Approvals
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Quotation Details */}
        <Card className="md:col-span-3">
          <CardHeader className="flex justify-between">
            <div>
              <h1 className="text-2xl font-bold">Quotation #{registration.id}</h1>
              <p className="text-default-500">Client Info: {quotation.name} {quotation.client?.email && `(${quotation.client.email})`}</p>
            </div>
            <Chip color="primary" variant="flat">
              Quotation Accepted
            </Chip>
          </CardHeader>
          <Divider />
          <CardBody className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InfoField label="Registration ID" value={`#${registration.id}`} />
              <InfoField label="Date Created" value={formatDate(registration.created_at)} />
              <InfoField label="Quotation Date" value={formatDate(registration.date)} />
              <InfoField label="Services" value={registration.services} />
              <InfoField label="Client Name" value={quotation.name} />
              <InfoField label="Total Amount" value={`₹${registration.total_amount.toLocaleString()}`} />
            </div>
          </CardBody>
        </Card>

        {/* Payment Files */}
        <Card className="md:col-span-3">
          <CardHeader>
            <h2 className="text-xl font-bold">Payment Files</h2>
          </CardHeader>
          <Divider />
          <CardBody>
            {quotation.files && quotation.files.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {quotation.files.map((file, index) => (
                  <Card key={index} className="bg-default-50">
                    <CardBody className="space-y-3 p-4">
                      <div className="flex items-center space-x-2">
                        <DocumentIcon className="h-6 w-6 text-default-500" />
                        <div className="truncate flex-1">
                          <p className="font-medium truncate">{file.originalName}</p>
                          <p className="text-xs text-default-500">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                      <div className="flex justify-between gap-2">
                        <Button 
                          size="sm"
                          variant="flat"
                          color="primary"
                          className="flex-1"
                          startContent={<DocumentTextIcon className="h-4 w-4" />}
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
                          startContent={<DocumentArrowDownIcon className="h-4 w-4" />}
                        >
                          Download
                        </Button>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <PaperClipIcon className="h-12 w-12 mx-auto text-default-300 mb-2" />
                <p className="text-default-600">No payment files attached</p>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Cost Breakdown */}
        <Card className="md:col-span-1">
          <CardHeader>
            <h2 className="text-xl font-bold">Cost Breakdown</h2>
          </CardHeader>
          <Divider />
          <CardBody className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-200">
              <span className="text-default-500">Initial Amount</span>
              <span className="font-medium">₹{registration.init_amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-gray-200">
              <span className="text-default-500">Additional Services</span>
              <span className="font-medium">₹{registration.accept_amount.toLocaleString()}</span>
            </div>
            {registration.discount > 0 && (
              <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                <span className="text-default-500">Discount</span>
                <span className="font-medium text-danger">-₹{registration.discount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2">
              <span className="font-semibold">Total Amount</span>
              <span className="font-bold text-lg">₹{registration.total_amount.toLocaleString()}</span>
            </div>
          </CardBody>
        </Card>

        {/* Client Notes */}
        <Card className="md:col-span-2">
          <CardHeader>
            <h2 className="text-xl font-bold">Client Notes</h2>
          </CardHeader>
          <Divider />
          <CardBody>
            {quotation.notes ? (
              <p className="p-2">{quotation.notes}</p>
            ) : (
              <p className="text-default-500 p-2">No additional notes provided</p>
            )}
          </CardBody>
        </Card>

        {/* Payment Approval Form */}
        <Card className="md:col-span-3">
          <CardHeader>
            <h2 className="text-xl font-bold">Process Payment</h2>
          </CardHeader>
          <Divider />
          <CardBody>
            <form onSubmit={handleSubmit(handleProcessPayment)} className="space-y-6">
              {/* Payment Mode */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select 
                  label="Payment Mode" 
                  {...register("paymentMode")} 
                  className="w-full"
                >
                  <SelectItem key="cash" value="cash">Cash</SelectItem>
                  <SelectItem key="upi" value="upi">UPI</SelectItem>
                  <SelectItem key="netbanking" value="netbanking">Net Banking</SelectItem>
                  <SelectItem key="card" value="card">Credit/Debit Card</SelectItem>
                  <SelectItem key="cheque" value="cheque">Cheque</SelectItem>
                  <SelectItem key="wallet" value="wallet">Wallet</SelectItem>
                  <SelectItem key="gateway" value="gateway">Payment Gateway</SelectItem>
                  <SelectItem key="crypto" value="crypto">Cryptocurrency</SelectItem>
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
                >
                  Approve & Register
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>

      {/* PDF Viewer Modal */}
      <Modal
        isOpen={isPdfModalOpen}
        onClose={onPdfModalClose}
        size="5xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader>
            {selectedFile?.originalName}
          </ModalHeader>
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

      {/* Success Modal */}
      <Modal isOpen={isSuccessModalOpen} onClose={onSuccessModalClose}>
        <ModalContent>
          <ModalHeader>Registration Approved</ModalHeader>
          <ModalBody>
            <div className="flex flex-col items-center py-4">
              <CheckCircleIcon className="w-16 h-16 text-success mb-4" />
              <p className="text-xl font-medium mb-2">Success!</p>
              <p className="text-center text-default-600">
                Registration #{registration.id} has been successfully approved and marked as registered.
              </p>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onPress={() => {
              onSuccessModalClose();
              router.push("/admin/approval");
            }}>
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
  <div className="p-3 bg-default-50 rounded-lg">
    <p className="text-sm text-default-500 mb-1">{label}</p>
    <p className="font-medium">{value}</p>
  </div>
);

// Main component that handles params correctly
function ApprovalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Use React.use to unwrap the params Promise
  const resolvedParams = React.use(params);
  
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen">
      <Spinner size="lg" />
    </div>}>
      <ApprovalDetailContent id={resolvedParams.id} />
    </Suspense>
  );
}

export default WithAdminAuth(ApprovalDetailPage);
