"use client"
import React from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Card,
  CardHeader,
  CardBody,
  Button,
  Spinner,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  useDisclosure,
  Select,
  SelectItem,
} from "@heroui/react";
import { PlusIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import api, { BankAccount, BankAccountRequest } from '@/services/api';
import { WithAdminAuth } from '@/components/withAdminAuth';

function BanksPage() {
  const [banks, setBanks] = React.useState<BankAccount[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedBank, setSelectedBank] = React.useState<BankAccount | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const { 
    isOpen: isAddModalOpen, 
    onOpen: onAddModalOpen, 
    onClose: onAddModalClose 
  } = useDisclosure();
  
  const { 
    isOpen: isEditModalOpen, 
    onOpen: onEditModalOpen, 
    onClose: onEditModalClose 
  } = useDisclosure();

  const refreshBanks = async () => {
    try {
      const response = await api.getAllBankAccounts();
      setBanks(response.data);
    } catch (error: any) {
      const errorMessage = api.handleError(error);
      toast.error(errorMessage.error || 'Failed to refresh bank accounts');
    }
  };

  React.useEffect(() => {
    const fetchBanks = async () => {
      try {
        setIsLoading(true);
        await refreshBanks();
      } catch (error) {
        console.error('Error fetching banks:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBanks();
  }, []);

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    
    try {
      const formData = new FormData(event.currentTarget);
      const data: BankAccountRequest = {
        account_name: formData.get('account_name') as string,
        account_holder_name: formData.get('account_holder_name') as string,
        account_number: formData.get('account_number') as string,
        ifsc_code: formData.get('ifsc_code') as string,
        account_type: formData.get('account_type') as string,
        bank: formData.get('bank') as string,
        upi_id: formData.get('upi_id') as string,
        branch: formData.get('branch') as string,
      };

      await api.createBankAccount(data);
      await refreshBanks();
      toast.success('Bank account created successfully');
      onAddModalClose();
    } catch (error: any) {
      const errorMessage = api.handleError(error);
      toast.error(errorMessage.error || 'Failed to create bank account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedBank) return;
    
    setIsSubmitting(true);
    try {
      const formData = new FormData(event.currentTarget);
      const data: BankAccountRequest = {
        account_name: formData.get('account_name') as string,
        account_holder_name: formData.get('account_holder_name') as string,
        account_number: formData.get('account_number') as string,
        ifsc_code: formData.get('ifsc_code') as string,
        account_type: formData.get('account_type') as string,
        bank: formData.get('bank') as string,
        upi_id: formData.get('upi_id') as string,
        branch: formData.get('branch') as string,
      };

      await api.updateBankAccount(selectedBank.id, data);
      await refreshBanks();
      toast.success('Bank account updated successfully');
      onEditModalClose();
    } catch (error: any) {
      const errorMessage = api.handleError(error);
      toast.error(errorMessage.error || 'Failed to update bank account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedBank) return;
    
    setIsSubmitting(true);
    try {
      await api.deleteBankAccount(selectedBank.id);
      await refreshBanks();
      toast.success('Bank account deleted successfully');
      onEditModalClose();
    } catch (error: any) {
      const errorMessage = api.handleError(error);
      toast.error(errorMessage.error || 'Failed to delete bank account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRowClick = (bank: BankAccount) => {
    setSelectedBank(bank);
    onEditModalOpen();
  };

  const accountTypes = ['Savings', 'Current', 'Other'] as const;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-4rem)]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="w-full p-6">
      <Card className="mb-6">
        <CardHeader className="flex justify-between items-center px-6 py-4">
          <h1 className="text-2xl font-bold">Bank Accounts</h1>
          <Button
            isIconOnly
            color="primary"
            onClick={onAddModalOpen}
            title="Add Bank Account"
          >
            <PlusIcon className="h-5 w-5" />
          </Button>
        </CardHeader>
      </Card>

      <Card>
        <CardBody>
          <Table aria-label="Bank accounts table">
            <TableHeader>
              <TableColumn>Account Name</TableColumn>
              <TableColumn>Account Holder</TableColumn>
              <TableColumn>Bank</TableColumn>
              <TableColumn>Account Number</TableColumn>
              <TableColumn>IFSC Code</TableColumn>
              <TableColumn>Account Type</TableColumn>
              <TableColumn>Branch</TableColumn>
              <TableColumn>UPI ID</TableColumn>
            </TableHeader>
            <TableBody>
              {banks.map((bank) => (
                <TableRow 
                  key={bank.id} 
                  className="cursor-pointer hover:bg-default-100"
                  onClick={() => handleRowClick(bank)}
                >
                  <TableCell>{bank.account_name}</TableCell>
                  <TableCell>{bank.account_holder_name}</TableCell>
                  <TableCell>{bank.bank}</TableCell>
                  <TableCell>{bank.account_number}</TableCell>
                  <TableCell>{bank.ifsc_code}</TableCell>
                  <TableCell>{bank.account_type}</TableCell>
                  <TableCell>{bank.branch}</TableCell>
                  <TableCell>{bank.upi_id}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* Add Modal */}
      <Modal isOpen={isAddModalOpen} onClose={onAddModalClose} size="2xl">
        <ModalContent>
          {(onClose) => (
            <form onSubmit={handleCreate}>
              <ModalHeader>Add Bank Account</ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <Input
                    label="Account Name"
                    name="account_name"
                    isRequired
                  />
                  <Input
                    label="Account Holder Name"
                    name="account_holder_name"
                    isRequired
                  />
                  <Input
                    label="Account Number"
                    name="account_number"
                    isRequired
                  />
                  <Input
                    label="IFSC Code"
                    name="ifsc_code"
                    isRequired
                  />
                  <Select
                    label="Account Type"
                    name="account_type"
                    isRequired
                    defaultSelectedKeys={['Savings']}
                  >
                    {accountTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </Select>
                  <Input
                    label="Bank Name"
                    name="bank"
                    isRequired
                  />
                  <Input
                    label="UPI ID"
                    name="upi_id"
                    isRequired
                  />
                  <Input
                    label="Branch Name"
                    name="branch"
                    isRequired
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button color="primary" type="submit" isLoading={isSubmitting}>
                  Add Account
                </Button>
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditModalOpen} onClose={onEditModalClose} size="2xl">
        <ModalContent>
          {(onClose) => (
            <form onSubmit={handleUpdate}>
              <ModalHeader>Edit Bank Account</ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <Input
                    label="Account Name"
                    name="account_name"
                    defaultValue={selectedBank?.account_name}
                    isRequired
                  />
                  <Input
                    label="Account Holder Name"
                    name="account_holder_name"
                    defaultValue={selectedBank?.account_holder_name}
                    isRequired
                  />
                  <Input
                    label="Account Number"
                    name="account_number"
                    defaultValue={selectedBank?.account_number}
                    isRequired
                  />
                  <Input
                    label="IFSC Code"
                    name="ifsc_code"
                    defaultValue={selectedBank?.ifsc_code}
                    isRequired
                  />
                  <Select
                    label="Account Type"
                    name="account_type"
                    isRequired
                    defaultSelectedKeys={[selectedBank?.account_type || 'Savings']}
                  >
                    {accountTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </Select>
                  <Input
                    label="Bank Name"
                    name="bank"
                    defaultValue={selectedBank?.bank}
                    isRequired
                  />
                  <Input
                    label="UPI ID"
                    name="upi_id"
                    defaultValue={selectedBank?.upi_id}
                    isRequired
                  />
                  <Input
                    label="Branch Name"
                    name="branch"
                    defaultValue={selectedBank?.branch}
                    isRequired
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button 
                  color="danger"
                  variant="flat"
                  onPress={handleDelete}
                  isLoading={isSubmitting}
                >
                  Delete
                </Button>
                <Button 
                  color="primary"
                  type="submit"
                  isLoading={isSubmitting}
                >
                  Save Changes
                </Button>
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}

export default WithAdminAuth(BanksPage);
