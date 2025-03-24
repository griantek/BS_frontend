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
  SelectItem,
  Divider,
  Chip,
  useDisclosure,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/react";
import { 
  CheckIcon, 
  CreditCardIcon, 
  BanknotesIcon, 
  CurrencyRupeeIcon, 
  ArrowLeftIcon,
  CalendarDaysIcon
} from "@heroicons/react/24/outline";
import { withLeadsAuth } from "@/components/withLeadsAuth";
import { toast } from "react-toastify";
import api from "@/services/api";
import { checkAuth } from "@/utils/authCheck";
import { format } from "date-fns";
import { Spinner } from "@nextui-org/react";
import type { 
  Prospectus, 
  Service, 
  BankAccount,
  CreateRegistrationRequest
} from "@/services/api";

function RegistrationContent({ regId }: { regId: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [prospectData, setProspectData] = React.useState<Prospectus | null>(null);
  const [services, setServices] = React.useState<Service[]>([]);
  const [bankAccounts, setBankAccounts] = React.useState<BankAccount[]>([]);
  
  // Form state variables
  const [selectedServices, setSelectedServices] = React.useState<string[]>([]);
  const [initialAmount, setInitialAmount] = React.useState<string>("");
  const [acceptanceAmount, setAcceptanceAmount] = React.useState<string>("");
  const [discount, setDiscount] = React.useState<string>("");
  const [totalAmount, setTotalAmount] = React.useState<number>(0);
  const [subTotal, setSubTotal] = React.useState<number>(0);
  const [acceptancePeriod, setAcceptancePeriod] = React.useState<string>("");
  const [acceptancePeriodUnit, setAcceptancePeriodUnit] = React.useState<string>("months");
  const [publicationPeriod, setPublicationPeriod] = React.useState<string>("");
  const [publicationPeriodUnit, setPublicationPeriodUnit] = React.useState<string>("months");
  const [selectedBank, setSelectedBank] = React.useState<string>("");
  const [transactionType, setTransactionType] = React.useState<string>("Cash");
  const [transactionId, setTransactionId] = React.useState<string>("");
  const [transactionDate, setTransactionDate] = React.useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [paymentAmount, setPaymentAmount] = React.useState<string>("");
  
  // Modal state
  const {isOpen, onOpen, onClose} = useDisclosure();
  const [showTransactionIdField, setShowTransactionIdField] = React.useState(false);
  const [showSuccessModal, setShowSuccessModal] = React.useState(false);

  React.useEffect(() => {
    if (!checkAuth(router)) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch prospect data
        const prospectResponse = await api.getProspectusByRegId(regId);
        setProspectData(prospectResponse.data);
        
        // Fetch services and bank accounts in parallel
        const [servicesResponse, banksResponse] = await Promise.all([
          api.getAllServices(),
          api.getAllBankAccounts()
        ]);
        
        setServices(servicesResponse.data || []);
        setBankAccounts(banksResponse.data || []);
        
        // Initialize selected services if prospect has services
        if (prospectResponse.data && prospectResponse.data.services) {
          const prospectServices = prospectResponse.data.services
            .split(",")
            .map(s => s.trim());
          
          // Match prospect services with actual service IDs
          const matchedServiceIds = servicesResponse.data
            .filter(service => {
              return prospectServices.some(ps => 
                service.service_name.toLowerCase().includes(ps.toLowerCase())
              );
            })
            .map(service => service.id.toString());
          
          if (matchedServiceIds.length > 0) {
            setSelectedServices(matchedServiceIds);
            
            // Calculate initial amount based on matched services
            const initialTotal = matchedServiceIds.reduce((sum, id) => {
              const service = servicesResponse.data.find(s => s.id.toString() === id);
              return sum + (service ? service.fee : 0);
            }, 0);
            
            setInitialAmount(initialTotal.toString());
            updateTotals(initialTotal.toString(), acceptanceAmount, discount);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load prospect data");
        router.push('/business/conversion/prospects');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router, regId]);

  // Calculate totals whenever amounts change
  React.useEffect(() => {
    updateTotals(initialAmount, acceptanceAmount, discount);
  }, [initialAmount, acceptanceAmount, discount]);

  // Toggle transaction ID field based on transaction type
  React.useEffect(() => {
    setShowTransactionIdField(transactionType !== "Cash");
  }, [transactionType]);

  // Update totals when amount fields change
  const updateTotals = (initial: string, acceptance: string, disc: string) => {
    const initialNum = parseFloat(initial) || 0;
    const acceptanceNum = parseFloat(acceptance) || 0;
    const discountNum = parseFloat(disc) || 0;
    
    const subTotalNum = initialNum + acceptanceNum;
    const totalAmountNum = subTotalNum - discountNum;
    
    setSubTotal(subTotalNum);
    setTotalAmount(totalAmountNum);
  };

  // Handle service selection
  const handleServiceChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const serviceId = event.target.value;
    if (!serviceId) return;
    
    // Add to selected services if not already selected
    if (!selectedServices.includes(serviceId)) {
      const updatedServices = [...selectedServices, serviceId];
      setSelectedServices(updatedServices);
      
      // Update initial amount
      const service = services.find(s => s.id.toString() === serviceId);
      if (service) {
        const newInitialAmount = (parseFloat(initialAmount) || 0) + service.fee;
        setInitialAmount(newInitialAmount.toString());
      }
    }
  };

  // Remove a selected service
  const removeService = (serviceId: string) => {
    const service = services.find(s => s.id.toString() === serviceId);
    const updatedServices = selectedServices.filter(id => id !== serviceId);
    setSelectedServices(updatedServices);
    
    // Update initial amount
    if (service) {
      const newInitialAmount = Math.max(0, (parseFloat(initialAmount) || 0) - service.fee);
      setInitialAmount(newInitialAmount.toString());
    }
  };

  // Handle payment modal submission
  const handlePaymentSubmit = () => {
    // Validate payment details
    if (transactionType === "Online" && !transactionId) {
      toast.error("Transaction ID is required for online payments");
      return;
    }

    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast.error("Please enter a valid payment amount");
      return;
    }

    if (parseFloat(paymentAmount) > totalAmount) {
      toast.error("Payment amount cannot exceed total amount");
      return;
    }

    // If valid, close modal and proceed with registration
    onClose();
    handleRegisterProspect();
  };

  // Submit registration
  const handleRegisterProspect = async () => {
    try {
      setIsSaving(true);
      
      if (!prospectData) {
        throw new Error("Prospect data not found");
      }
      
      if (selectedServices.length === 0) {
        throw new Error("Please select at least one service");
      }
      
      if (!initialAmount || !acceptanceAmount) {
        throw new Error("Initial and acceptance amounts are required");
      }
      
      if (!acceptancePeriod || !publicationPeriod) {
        throw new Error("Acceptance and publication periods are required");
      }
      
      if (!selectedBank) {
        throw new Error("Please select a bank account");
      }
      
      // Get user data from storage
      const userStr = localStorage.getItem("user");
      if (!userStr) {
        throw new Error("User data not found");
      }
      
      const user = JSON.parse(userStr);
      
      // Prepare services string
      const servicesString = selectedServices
        .map(id => {
          const service = services.find(s => s.id.toString() === id);
          return service ? service.service_name : null;
        })
        .filter(Boolean)
        .join(", ");
      
      // Create registration request
      // const registrationData: CreateRegistrationRequest = {
      //   entity_id: user.id,
      //   client_id: user.id,
      //   registered_by: user.id,
      //   prospectus_id: prospectData.id,
      //   services: servicesString,
      //   init_amount: parseFloat(initialAmount) || 0,
      //   accept_amount: parseFloat(acceptanceAmount) || 0,
      //   discount: parseFloat(discount) || 0,
      //   total_amount: totalAmount,
      //   accept_period: `${acceptancePeriod} ${acceptancePeriodUnit}`,
      //   pub_period: `${publicationPeriod} ${publicationPeriodUnit}`,
      //   bank_id: selectedBank,
      //   status: parseFloat(paymentAmount) > 0 ? "registered" : "pending",
      //   month: new Date().getMonth() + 1,
      //   year: new Date().getFullYear(),
        
      //   // Payment transaction details
      //   // transaction_type: transactionType,
      //   transaction_id: transactionId,
      //   amount: parseFloat(paymentAmount) || 0,
      //   transaction_date: transactionDate,
      //   additional_info: {}
      // };
      
      // Submit registration
      // const response = await api.createRegistration(registrationData);
      
      // if (response.success) {
      //   // Show success modal instead of toast for better UX
      //   setShowSuccessModal(true);
      //   // Update prospect status to registered
      //   // await api.updateProspectusStatus(prospectData.reg_id, "registered");
      // } else {
      //   throw new Error("Failed to register prospect");
      // }
    } catch (error: any) {
      console.error("Registration error:", error);
      toast.error(error.message || "Failed to register prospect");
    } finally {
      setIsSaving(false);
    }
  };

  // Navigate back to prospects list
  const goBack = () => {
    router.push('/business/conversion/prospects');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[400px]">
        <Spinner size="lg" label="Loading prospect data..." />
      </div>
    );
  }

  if (!prospectData) {
    return (
      <div className="p-8 text-center">
        <p className="text-danger mb-4">Prospect data not found</p>
        <Button color="primary" onClick={goBack}>Back to Prospects</Button>
      </div>
    );
  }

  return (
    <div className="w-full p-6">
      <Button
        variant="light"
        startContent={<ArrowLeftIcon className="h-4 w-4" />}
        onClick={goBack}
        className="mb-4"
      >
        Back to Prospects
      </Button>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left side - Prospect Details */}
        <Card className="p-0">
          <CardHeader className="border-b border-divider">
            <h2 className="text-xl font-bold">Prospect Details</h2>
          </CardHeader>
          <CardBody className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-default-500">Registration ID</p>
                <p className="font-medium">{prospectData.reg_id}</p>
              </div>
              <div>
                <p className="text-sm text-default-500">Date</p>
                <p className="font-medium">{format(new Date(prospectData.date), 'dd/MM/yyyy')}</p>
              </div>
              <div>
                <p className="text-sm text-default-500">Client Name</p>
                <p className="font-medium">{prospectData.client_name}</p>
              </div>
              <div>
                <p className="text-sm text-default-500">Email</p>
                <p className="font-medium">{prospectData.email}</p>
              </div>
              <div>
                <p className="text-sm text-default-500">Phone</p>
                <p className="font-medium">{prospectData.phone}</p>
              </div>
              <div>
                <p className="text-sm text-default-500">Department</p>
                <p className="font-medium">{prospectData.department}</p>
              </div>
              <div>
                <p className="text-sm text-default-500">Location</p>
                <p className="font-medium">{prospectData.state}</p>
              </div>
              <div>
                <p className="text-sm text-default-500">Proposed Service</p>
                <p className="font-medium">{prospectData.services}</p>
              </div>
            </div>
            
            <Divider className="my-4" />
            
            <div>
              <p className="text-sm text-default-500">Requirements</p>
              <p className="mt-1">{prospectData.requirement}</p>
            </div>
          </CardBody>
        </Card>

        {/* Right side - Registration Form */}
        <Card className="p-0">
          <CardHeader className="border-b border-divider">
            <h2 className="text-xl font-bold">Registration Details</h2>
          </CardHeader>
          <CardBody className="p-6">
            <div className="space-y-4">
              {/* Service Selection */}
              <div>
                <label className="text-sm font-medium">Selected Services</label>
                <Select
                  placeholder="Add a service"
                  className="mt-1"
                  onChange={handleServiceChange}
                >
                  <SelectItem key="placeholder" value="">
                    Select a service
                  </SelectItem>
                  {/* {services.map((service) => (
                    <SelectItem
                      key={service.id}
                      value={service.id.toString()}
                      textValue={service.service_name}
                      isDisabled={selectedServices.includes(service.id.toString())}
                    >
                      {service.service_name} - ₹{service.fee.toLocaleString()}
                    </SelectItem>
                  ))} */}
                </Select>
                
                {selectedServices.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedServices.map(id => {
                      const service = services.find(s => s.id.toString() === id);
                      return (
                        service && (
                          <Chip
                            key={id}
                            onClose={() => removeService(id)}
                            variant="flat"
                            color="primary"
                          >
                            {service.service_name} - ₹{service.fee.toLocaleString()}
                          </Chip>
                        )
                      );
                    })}
                  </div>
                )}
              </div>
              
              {/* Amounts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  type="number"
                  label="Initial Amount (₹)"
                  value={initialAmount}
                  onChange={(e) => setInitialAmount(e.target.value)}
                  startContent={<CurrencyRupeeIcon className="w-4 h-4 text-default-400" />}
                />
                
                <Input
                  type="number"
                  label="Acceptance Amount (₹)"
                  value={acceptanceAmount}
                  onChange={(e) => setAcceptanceAmount(e.target.value)}
                  startContent={<CurrencyRupeeIcon className="w-4 h-4 text-default-400" />}
                />
                
                <Input
                  type="number"
                  label="Discount (₹)"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  startContent={<CurrencyRupeeIcon className="w-4 h-4 text-default-400" />}
                />
              </div>
              
              {/* Total Amount Display */}
              <div className="bg-default-50 p-4 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Sub Total:</span>
                  <span className="font-medium">₹{subTotal.toLocaleString()}</span>
                </div>
                {parseFloat(discount) > 0 && (
                  <div className="flex justify-between mb-2 text-danger">
                    <span className="text-sm">Discount:</span>
                    <span className="font-medium">- ₹{parseFloat(discount).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-divider">
                  <span>Total:</span>
                  <span>₹{totalAmount.toLocaleString()}</span>
                </div>
              </div>
              
              {/* Time Periods */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex gap-2">
                  <Input
                    type="number"
                    label="Acceptance Period"
                    value={acceptancePeriod}
                    onChange={(e) => setAcceptancePeriod(e.target.value)}
                    className="flex-1"
                  />
                  <Select
                    label="Unit"
                    value={acceptancePeriodUnit}
                    onChange={(e) => setAcceptancePeriodUnit(e.target.value)}
                    className="w-1/3"
                  >
                    <SelectItem key="days" value="days">
                      Days
                    </SelectItem>
                    <SelectItem key="months" value="months">
                      Months
                    </SelectItem>
                    <SelectItem key="years" value="years">
                      Years
                    </SelectItem>
                  </Select>
                </div>
                
                <div className="flex gap-2">
                  <Input
                    type="number"
                    label="Publication Period"
                    value={publicationPeriod}
                    onChange={(e) => setPublicationPeriod(e.target.value)}
                    className="flex-1"
                  />
                  <Select
                    label="Unit"
                    value={publicationPeriodUnit}
                    onChange={(e) => setPublicationPeriodUnit(e.target.value)}
                    className="w-1/3"
                  >
                    <SelectItem key="days" value="days">
                      Days
                    </SelectItem>
                    <SelectItem key="months" value="months">
                      Months
                    </SelectItem>
                    <SelectItem key="years" value="years">
                      Years
                    </SelectItem>
                  </Select>
                </div>
              </div>
              
              {/* Bank Selection */}
              <Select
                label="Bank Account"
                placeholder="Select bank account"
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
              >
                {bankAccounts.map((bank) => (
                  <SelectItem key={bank.id} value={bank.id}>
                    {bank.account_name} - {bank.bank}
                  </SelectItem>
                ))}
              </Select>
              
              {/* Action Buttons */}
              <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-divider">
                <Button
                  color="danger"
                  variant="light"
                  onClick={goBack}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  color="success"
                  onClick={onOpen}
                  isLoading={isSaving}
                  startContent={<CheckIcon className="h-4 w-4" />}
                >
                  Register Prospect
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
      
      {/* Payment Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>
            <h3 className="text-xl font-bold">Payment Details</h3>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Select
                label="Payment Type"
                value={transactionType}
                onChange={(e) => setTransactionType(e.target.value)}
                startContent={
                  transactionType === "Cash" 
                    ? <BanknotesIcon className="h-4 w-4 text-default-400" /> 
                    : <CreditCardIcon className="h-4 w-4 text-default-400" />
                }
              >
                <SelectItem key="Cash" value="Cash">
                  Cash
                </SelectItem>
                <SelectItem key="Online" value="Online">
                  Online Transfer
                </SelectItem>
                <SelectItem key="Cheque" value="Cheque">
                  Cheque
                </SelectItem>
              </Select>
              
              {showTransactionIdField && (
                <Input
                  label="Transaction ID / Reference"
                  placeholder="Enter transaction reference number"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                />
              )}
              
              <Input
                type="date"
                label="Transaction Date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                startContent={<CalendarDaysIcon className="h-4 w-4 text-default-400" />}
              />
              
              <Input
                type="number"
                label="Payment Amount (₹)"
                placeholder="Enter amount paid"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                startContent={<CurrencyRupeeIcon className="h-4 w-4 text-default-400" />}
                // helperText={`Total amount: ₹${totalAmount.toLocaleString()}`}
              />
              
              <div className="bg-default-50 p-3 rounded-lg text-sm">
                <p className="mb-1">
                  <span className="font-medium">Note:</span> If payment amount is zero, 
                  the registration will be marked as pending.
                </p>
                <p>
                  Full payment will mark the registration as completed.
                </p>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="default" variant="light" onClick={onClose}>
              Cancel
            </Button>
            <Button color="success" onClick={handlePaymentSubmit}>
              Confirm Payment
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Success Modal */}
      <Modal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)}>
        <ModalContent>
          <ModalHeader>
            <h3 className="text-xl font-bold text-success">Registration Successful</h3>
          </ModalHeader>
          <ModalBody>
            <div className="flex items-center justify-center mb-4">
              <div className="bg-success/10 p-4 rounded-full">
                <CheckIcon className="h-8 w-8 text-success" />
              </div>
            </div>
            <p className="text-center mb-2">
              Prospect has been successfully registered.
            </p>
            <p className="text-center text-sm text-default-500">
              Registration ID: {prospectData.reg_id}
            </p>
          </ModalBody>
          <ModalFooter>
            <Button 
              color="primary" 
              className="w-full"
              onClick={() => {
                setShowSuccessModal(false);
                router.push('/business/conversion/prospects');
              }}
            >
              Back to Prospects
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

// Main component wrapper that handles the Promise params
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

export default withLeadsAuth(RegistrationPage);
