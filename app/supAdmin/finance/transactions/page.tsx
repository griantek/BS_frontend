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
  CardHeader,
  CardBody,
  Spinner,
  Chip
} from "@heroui/react";
import api from '@/services/api';

interface Transaction {
  id: number;
  transaction_type: string;
  transaction_id: string;
  amount: number;
  transaction_date: string;
  additional_info: Record<string, any>;
  exec_id: string;
  executive: {
    id: string;
    username: string;
  };
}

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

export default function TransactionsPage() {
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await api.axiosInstance.get('/common/transactions/all');
        setTransactions(response.data.data);
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
            <TableColumn>Date</TableColumn>
            <TableColumn>Type</TableColumn>
            <TableColumn>Transaction ID</TableColumn>
            <TableColumn>Amount</TableColumn>
            <TableColumn>Executive</TableColumn>
            <TableColumn>Additional Info</TableColumn>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>{formatDate(transaction.transaction_date)}</TableCell>
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
                <TableCell>{transaction.executive.username}</TableCell>
                <TableCell>
                  {Object.entries(transaction.additional_info).map(([key, value]) => (
                    <div key={key} className="text-sm">
                      <span className="font-medium">{key}:</span> {value}
                    </div>
                  ))}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardBody>
    </Card>
  );
}
