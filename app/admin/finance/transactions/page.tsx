"use client";
import React from 'react';
import { WithAdminAuth } from "@/components/withAdminAuth";
import {
  Card,
  CardHeader,
  CardBody,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Spinner,
  Chip,
  Pagination
} from "@heroui/react";
import api from '@/services/api';
import type { Transaction } from '@/services/api';
import {PERMISSIONS} from '@/utils/permissions';
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

function TransactionsPage() {
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const rowsPerPage = 10;

  React.useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await api.getAllTransactions();
        setTransactions(response.data);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const pages = Math.ceil(transactions.length / rowsPerPage);
  const paginatedTransactions = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return transactions.slice(start, end);
  }, [page, transactions]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-4rem)]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="w-full p-6">
      <Card>
        <CardHeader className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Financial Transactions</h1>
        </CardHeader>
        <CardBody>
          <Table 
            aria-label="Transactions table"
            bottomContent={
              pages > 0 ? (
                <div className="flex w-full justify-center">
                  <Pagination
                    isCompact
                    showControls
                    showShadow
                    color="primary"
                    page={page}
                    total={pages}
                    onChange={(page) => setPage(page)}
                  />
                </div>
              ) : null
            }
          >
            <TableHeader>
              <TableColumn>ID</TableColumn>
              <TableColumn>Date</TableColumn>
              {/* <TableColumn>Client Name</TableColumn> */}
              <TableColumn>Type</TableColumn>
              <TableColumn>Transaction ID</TableColumn>
              <TableColumn>Amount</TableColumn>
              <TableColumn>Additional Info</TableColumn>
              <TableColumn>Executive</TableColumn>
            </TableHeader>
            <TableBody>
              {paginatedTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>{transaction.id}</TableCell>
                  <TableCell>{formatDate(transaction.transaction_date)}</TableCell>
                  {/* <TableCell>{getClientName(transaction)}</TableCell> */}
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
                  <TableCell>{transaction.entities.username}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>
    </div>
  );
}

export default WithAdminAuth(TransactionsPage, PERMISSIONS.SHOW_TRANSACTIONS_TAB);
