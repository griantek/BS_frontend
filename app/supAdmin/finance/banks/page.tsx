'use client'
import React from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Card,
  CardBody,
  Spinner
} from "@heroui/react";
import api from '@/services/api';
import type { BankAccount } from '@/services/api';

export default function BanksPage() {
  const [banks, setBanks] = React.useState<BankAccount[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchBanks = async () => {
      try {
        const response = await api.getAllBankAccounts();
        setBanks(response.data);
      } catch (error) {
        console.error('Error fetching banks:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBanks();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-4rem)]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardBody>
        <Table aria-label="Bank accounts table">
          <TableHeader>
            <TableColumn>Account Name</TableColumn>
            <TableColumn>Account Holder</TableColumn>
            <TableColumn>Bank</TableColumn>
            <TableColumn>Account Number</TableColumn>
            <TableColumn>IFSC Code</TableColumn>
            <TableColumn>Branch</TableColumn>
            <TableColumn>UPI ID</TableColumn>
          </TableHeader>
          <TableBody>
            {banks.map((bank) => (
              <TableRow key={bank.id}>
                <TableCell>{bank.account_name}</TableCell>
                <TableCell>{bank.account_holder_name}</TableCell>
                <TableCell>{bank.bank}</TableCell>
                <TableCell>{bank.account_number}</TableCell>
                <TableCell>{bank.ifsc_code}</TableCell>
                <TableCell>{bank.branch}</TableCell>
                <TableCell>{bank.upi_id}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardBody>
    </Card>
  );
}
