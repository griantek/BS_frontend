"use client";
import React from "react";

import {
  Card,
  CardBody,
  CardHeader,
  Chip,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Input,
  Pagination,
} from "@heroui/react";
import { toast } from "react-toastify";
import { WithAdminAuth } from "@/components/withAdminAuth";
import api, { type ServerRegistration } from "@/services/api";

// Helper functions
const getBankInfo = (registration: ServerRegistration) => {
  const accountNumber = registration.bank_account?.account_number || "";
  const lastFourDigits = accountNumber.slice(-4);
  return {
    bank: registration.bank_account?.bank || "N/A",
    accountNumber: accountNumber ? `****${lastFourDigits}` : "N/A",
  };
};

const getPaymentStatus = (totalAmount: number, paidAmount: number) => {
  const remaining = totalAmount - paidAmount;
  if (remaining === totalAmount) return { label: "Not Paid", color: "danger" };
  if (remaining === 0) return { label: "Paid", color: "success" };
  return { label: "Partial", color: "warning" };
};

const getTransactionInfo = (registration: ServerRegistration) => {
  const paidAmount = registration.transaction?.amount || 0;
  const status = getPaymentStatus(registration.total_amount, paidAmount);
  return {
    type: registration.transaction?.transaction_type || "N/A",
    amount: paidAmount,
    status,
  };
};

function AmountTooltip({
  initial,
  accepted,
  discount,
  total,
}: {
  initial: number;
  accepted: number;
  discount: number;
  total: number;
}) {
  return (
    <div className="group relative">
      <div className="text-sm font-medium">₹{total.toLocaleString()}</div>
      <div className="absolute z-50 invisible group-hover:visible bg-content1 border border-divider rounded-lg shadow-lg p-3 w-48 -translate-y-full -translate-x-1/4 mt-1">
        <div className="space-y-2 text-sm">
          <div>Initial: ₹{initial.toLocaleString()}</div>
          <div>Accepted: ₹{accepted.toLocaleString()}</div>
          {discount > 0 && (
            <div className="text-success">
              Discount: -₹{discount.toLocaleString()}
            </div>
          )}
          <div className="border-t border-divider mt-2 pt-2 font-medium">
            Total: ₹{total.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}

function RegistrationsPage() {
  const [registrations, setRegistrations] = React.useState<
    ServerRegistration[]
  >([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [searchTerm, setSearchTerm] = React.useState("");
  const PER_PAGE = 10;

  const fetchRegistrations = React.useCallback(async (pageNum: number) => {
    try {
      setIsLoading(true);
      const response = await api.getAllRegistrations();

      if (response?.success) {
        // Calculate start and end indices for pagination
        const startIndex = (pageNum - 1) * PER_PAGE;
        const endIndex = startIndex + PER_PAGE;

        // Get the full data array and slice it for current page
        const fullData = Array.isArray(response.data.items)
          ? response.data.items
          : [];
        const paginatedData = fullData.slice(startIndex, endIndex);

        setRegistrations(paginatedData);
        setTotal(fullData.length);
      } else {
        setRegistrations([]);
        setTotal(0);
      }
    } catch (error) {
      console.error("Error fetching registrations:", error);
      toast.error("Failed to fetch registrations");
      setRegistrations([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchRegistrations(page);
  }, [fetchRegistrations, page]);

  // Filter registrations based on search term
  const filteredRegistrations = React.useMemo(() => {
    if (!Array.isArray(registrations)) return [];

    if (!searchTerm) return registrations;

    return registrations.filter(
      (registration) =>
        registration.prospectus?.client_name
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        registration.prospectus?.reg_id
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        registration.services?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [registrations, searchTerm]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <>
      <div className="w-full p-6">
        <Card>
          <CardHeader className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Registrations Management</h1>
            <div className="flex-1 max-w-md ml-4">
              <Input
                isClearable
                placeholder="Search registrations..."
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardBody>
            {isLoading ? (
              <div className="flex justify-center items-center h-[200px]">
                <Spinner size="lg" />
              </div>
            ) : (
              <Table aria-label="Registrations table">
                <TableHeader>
                  <TableColumn>REG ID</TableColumn>
                  <TableColumn>CLIENT NAME</TableColumn>
                  <TableColumn>SERVICES</TableColumn>
                  <TableColumn>AMOUNT</TableColumn>
                  <TableColumn>STATUS</TableColumn>
                  <TableColumn>ASSIGNED TO</TableColumn>
                  <TableColumn>BANK</TableColumn>
                  <TableColumn>PAYMENT</TableColumn>
                  <TableColumn>PAYMENT STATUS</TableColumn>
                  <TableColumn>EXECUTIVE</TableColumn>
                </TableHeader>
                <TableBody>
                  {filteredRegistrations.map((registration) => (
                    <TableRow key={registration.id}>
                      <TableCell>{registration.prospectus.reg_id}</TableCell>
                      <TableCell>
                        {registration.prospectus.client_name}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {registration.services
                            .split(",")
                            .map((service, idx) => (
                              <Chip key={idx} size="sm" variant="flat">
                                {service.trim()}
                              </Chip>
                            ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <AmountTooltip
                          initial={registration.init_amount}
                          accepted={registration.accept_amount}
                          discount={registration.discount}
                          total={registration.total_amount}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          color={
                            registration.status === "registered"
                              ? "success"
                              : "warning"
                          }
                          size="sm"
                          variant={
                            registration.status === "registered"
                              ? "flat"
                              : "dot"
                          }
                        >
                          {registration.status}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <Chip size="sm" variant="flat" color="primary">
                          {registration.assigned_username}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-default-600">
                            {getBankInfo(registration).bank}
                          </span>
                          <span className="text-xs text-default-400 font-mono">
                            {getBankInfo(registration).accountNumber}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Chip size="sm" variant="flat" color="primary">
                          {getTransactionInfo(registration).type}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="sm"
                          variant="flat"
                          color={
                            getTransactionInfo(registration).status.color as any
                          }
                        >
                          {getTransactionInfo(registration).status.label}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <Chip size="sm" variant="shadow" color="default">
                          {registration.prospectus.entities?.username || "N/A"}
                        </Chip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            <div className="flex justify-center mt-4">
              <Pagination
                total={Math.ceil(total / PER_PAGE)}
                page={page}
                onChange={(newPage) => {
                  setPage(newPage);
                  fetchRegistrations(newPage);
                }}
                showControls
                showShadow
                color="primary"
              />
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  );
}

export default WithAdminAuth(RegistrationsPage);
