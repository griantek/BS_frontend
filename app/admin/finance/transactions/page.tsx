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
  Spinner,
  Chip
} from "@heroui/react";
import api from '@/services/api';
import type { Transaction } from '@/services/api';

// Keep the helper functions
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const getStatusColor = (type: string): "default" | "success" | "primary" | "secondary" | "warning" | "danger" | undefined => {
  const colors: Record<string, "default" | "success" | "primary" | "secondary" | "warning" | "danger"> = {
    'UPI': 'success',
    'Card': 'primary',
    'Bank Transfer': 'secondary',
    'Cash': 'warning',
    'Online Payment': 'primary',
    'Crypto': 'danger'
  };
  return colors[type] || 'default';
};

const getClientName = (transaction: Transaction) => {
  if (transaction.registration && transaction.registration.length > 0) {
    return transaction.registration[0].prospectus.client_name;
  }
  return 'N/A';
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await api.getAllTransactions();
        console.log("transactionssssss: ",response.data); 
        setTransactions(response.data);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
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
        <Table aria-label="Transactions table">
          <TableHeader>
            <TableColumn>ID</TableColumn>
            <TableColumn>Date</TableColumn>
            <TableColumn>Client Name</TableColumn>
            <TableColumn>Type</TableColumn>
            <TableColumn>Transaction ID</TableColumn>
            <TableColumn>Amount</TableColumn>
            <TableColumn>Additional Info</TableColumn>
            <TableColumn>Executive</TableColumn>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>{transaction.id}</TableCell>
                <TableCell>{formatDate(transaction.transaction_date)}</TableCell>
                <TableCell>{getClientName(transaction)}</TableCell>
                <TableCell>
                  <Chip
                    color={getStatusColor(transaction.transaction_type)}
                    size="sm"
                  >
                    {transaction.transaction_type}
                  </Chip>
                </TableCell>
                <TableCell>{transaction.transaction_id || '-'}</TableCell>
                <TableCell>₹{transaction.amount.toLocaleString()}</TableCell>
                <TableCell>
                  {Object.entries(transaction.additional_info).map(([key, value]) => (
                    <div key={key} className="text-sm">
                      <span className="font-medium">{key}:</span> {value}
                    </div>
                  ))}
                </TableCell>
                <TableCell>{transaction.executive_name}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardBody>
    </Card>
  );
}
