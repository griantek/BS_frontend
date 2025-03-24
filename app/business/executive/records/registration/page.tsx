"use client"
import React from 'react';
import { useRouter } from 'next/navigation';
import { checkAuth } from '@/utils/authCheck';
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Breadcrumbs,
  BreadcrumbItem,
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Input,
  Chip,
  Pagination,
  Select,
  SelectItem,
  SelectProps,
} from "@heroui/react";
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { withExecutiveAuth } from '@/components/withExecutiveAuth';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import api from '@/services/api';
import type { Registration } from '@/services/api';
import { Spinner } from "@nextui-org/react";
import { 
  PERMISSIONS, 
  hasPermission,
  UserWithPermissions
} from '@/utils/permissions';

function RegistrationPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [registrations, setRegistrations] = React.useState<Registration[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [userData, setUserData] = React.useState<UserWithPermissions | null>(null);
  const [clickedRowId, setClickedRowId] = React.useState<string | null>(null);
  
  // Filter states
  const [filterDepartment, setFilterDepartment] = React.useState<string>("");
  const [filterStatus, setFilterStatus] = React.useState<string>("");
  const [filterService, setFilterService] = React.useState<string>("");
  const [departments, setDepartments] = React.useState<string[]>([]);
  const [services, setServices] = React.useState<string[]>([]);
  
  // Permissions state
  const [canClickRegistrationRows, setCanClickRegistrationRows] = React.useState(false);

  React.useEffect(() => {
    if (!checkAuth(router)) return;
    
    const userStr = localStorage.getItem('user');
    
    if (!userStr) return;
    
    const userDataParsed = JSON.parse(userStr);
    setUserData(userDataParsed);
    
    fetchRegistrations(userDataParsed.id);
  }, [router]);

  // Extract filter options when data changes
  React.useEffect(() => {
    if (registrations.length > 0) {
      const departmentsSet = new Set<string>();
      const servicesSet = new Set<string>();

      registrations.forEach((reg) => {
        if (reg.prospectus?.department) departmentsSet.add(reg.prospectus.department);
        if (reg.services) {
          // Services might contain multiple services separated by commas
          const serviceList = reg.services.split(",").map(s => s.trim());
          serviceList.forEach(service => {
            if (service) servicesSet.add(service);
          });
        }
      });

      setDepartments(Array.from(departmentsSet));
      setServices(Array.from(servicesSet));
    }

    // Check permissions
    if (userData) {
      setCanClickRegistrationRows(
        hasPermission(userData, PERMISSIONS.CLICK_REGISTRATION_ROWS)
      );
    }
  }, [registrations, userData]);

  const fetchRegistrations = async (userId: string) => {
    try {
      setIsLoading(true);
      const response = await api.getRegistrationsByExecutive(userId);
      setRegistrations(response.data || []);
    } catch (error) {
      console.error('Error fetching registrations:', error);
      toast.error('Failed to load registrations data');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle filter changes
  const handleDepartmentChange: SelectProps["onChange"] = (e) => {
    setFilterDepartment(e.target.value);
    setPage(1);
  };

  const handleStatusChange: SelectProps["onChange"] = (e) => {
    setFilterStatus(e.target.value);
    setPage(1);
  };

  const handleServiceChange: SelectProps["onChange"] = (e) => {
    setFilterService(e.target.value);
    setPage(1);
  };

  const handleRowsPerPageChange: SelectProps["onChange"] = (e) => {
    setRowsPerPage(Number(e.target.value));
    setPage(1);
  };

  // Search query change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  // Clear filters
  const clearAllFilters = () => {
    setFilterDepartment("");
    setFilterStatus("");
    setFilterService("");
    setSearchQuery("");
    setPage(1);
  };

  // Filter registrations based on all filters
  const filteredRegistrations = React.useMemo(() => {
    if (!Array.isArray(registrations)) return [];
    
    return registrations.filter((reg) => {
      let matches = true;
      
      // Department filter
      if (filterDepartment && reg.prospectus?.department !== filterDepartment) {
        matches = false;
      }
      
      // Status filter
      if (filterStatus && reg.status !== filterStatus) {
        matches = false;
      }
      
      // Service filter - check if services string contains the filter value
      if (filterService && !(reg.services && reg.services.includes(filterService))) {
        matches = false;
      }
      
      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const clientName = reg.prospectus?.client_name?.toLowerCase() || '';
        const regId = reg.prospectus?.reg_id?.toLowerCase() || '';
        const services = reg.services?.toLowerCase() || '';
        
        const searchMatches =
          clientName.includes(query) ||
          regId.includes(query) ||
          services.includes(query) ||
          false;
          
        if (!searchMatches) {
          matches = false;
        }
      }
      
      return matches;
    });
  }, [registrations, filterDepartment, filterStatus, filterService, searchQuery]);

  // Calculate pagination
  const pages = Math.ceil(filteredRegistrations.length / rowsPerPage);
  const items = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredRegistrations.slice(start, end);
  }, [page, rowsPerPage, filteredRegistrations]);

  const columns = React.useMemo(() => [
    { key: "created_at", label: "DATE" },
    { key: "reg_id", label: "REG ID" },
    { key: "client", label: "CLIENT" },
    { key: "services", label: "SERVICES" },
    { key: "amounts", label: "AMOUNT" },
    { key: "payment", label: "PAYMENT" },
    { key: "status", label: "STATUS" },
  ], []);

  const formatDate = React.useCallback((dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy');
    } catch {
      return dateString;
    }
  }, []);

  const handleRowClick = async (id: number) => {
    if (!canClickRegistrationRows) return;
    
    setClickedRowId(id.toString());
    await router.push(`/business/executive/view/registration/${id}`);
  };

  const refreshData = () => {
    if (userData?.id) {
      fetchRegistrations(userData.id);
    }
  };

  // Check if any filters are applied
  const hasActiveFilters =
    filterDepartment !== "" ||
    filterStatus !== "" ||
    filterService !== "" ||
    searchQuery !== "";

  // Define tooltip components for amount and payment
  const AmountTooltip = ({ 
    initial, 
    accept, 
    discount, 
    total 
  }: { 
    initial: number, 
    accept: number, 
    discount: number, 
    total: number 
  }) => (
    <div className="group relative">
      <div className="text-sm">₹{total.toLocaleString()}</div>
      <div className="absolute z-10 invisible group-hover:visible bg-gray-800 text-white p-2 rounded-lg shadow-lg whitespace-nowrap -translate-y-full -translate-x-1/4 mt-1">
        <div className="space-y-1 text-xs">
          <div>Initial: ₹{initial.toLocaleString()}</div>
          <div>Accept: ₹{accept.toLocaleString()}</div>
          {discount > 0 && <div>Discount: ₹{discount.toLocaleString()}</div>}
          <div className="font-bold border-t border-gray-600 mt-1 pt-1">
            Total: ₹{total.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );

  const PaymentTooltip = ({ 
    type, 
    amount, 
    status 
  }: { 
    type: string, 
    amount: number,
    status: string 
  }) => (
    <div className="group relative">
      <div className="text-sm">
        {status === 'pending' ? (
          '-'
        ) : (
          <Chip
            color={type === 'Cash' ? 'warning' : 'primary'}
            variant="flat"
            size="sm"
          >
            {type}
          </Chip>
        )}
      </div>
      {status !== 'pending' && amount > 0 && (
        <div className="absolute z-10 invisible group-hover:visible bg-gray-800 text-white p-2 rounded-lg shadow-lg whitespace-nowrap -translate-y-full -translate-x-1/4 mt-1">
          <div className="text-xs">
            Amount Paid: ₹{amount.toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[400px]">
        <Spinner size="lg" label="Loading registrations..." />
      </div>
    );
  }

  return (
    <div className="w-full p-6">
      <Card className="mb-6">
        <CardHeader className="flex flex-col sm:flex-row sm:justify-between sm:items-center px-6 py-4 gap-4">
          <div>
            <Breadcrumbs size="sm" className="pb-2">
              <BreadcrumbItem href="/business/executive" onClick={(e) => {
                e.preventDefault();
                router.push('/business/executive');
              }}>Dashboard</BreadcrumbItem>
              <BreadcrumbItem>Records</BreadcrumbItem>
              <BreadcrumbItem>Registrations</BreadcrumbItem>
            </Breadcrumbs>
            <h1 className="text-2xl font-bold">Registrations</h1>
          </div>
        </CardHeader>
      </Card>

      {/* Filters Panel */}
      <Card className="p-0 shadow-md rounded-lg overflow-hidden mb-6">
        <div className="bg-default-50 dark:bg-default-100/5 p-4 border-b border-divider">
          <h2 className="text-lg font-semibold flex items-center text-foreground">
            <FunnelIcon className="h-5 w-5 mr-2 text-primary" />
            Filter Registrations
          </h2>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Input
              label="Search"
              startContent={
                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
              }
              placeholder="Client name, ID, services..."
              value={searchQuery}
              onChange={handleSearchChange}
            />

            <Select
              label="Department"
              placeholder="Filter by department"
              selectedKeys={filterDepartment ? [filterDepartment] : []}
              onChange={handleDepartmentChange}
            >
              <SelectItem key="" value="">
                All Departments
              </SelectItem>
              {
                departments.map((department) => (
                  <SelectItem key={department} value={department}>
                    {department}
                  </SelectItem>
                )) as any
              }
            </Select>

            <Select
              label="Status"
              placeholder="Filter by status"
              selectedKeys={filterStatus ? [filterStatus] : []}
              onChange={handleStatusChange}
            >
              <SelectItem key="" value="">All Statuses</SelectItem>
              <SelectItem key="pending" value="pending">Pending</SelectItem>
              <SelectItem key="registered" value="registered">Registered</SelectItem>
            </Select>

            <Select
              label="Service"
              placeholder="Filter by service"
              selectedKeys={filterService ? [filterService] : []}
              onChange={handleServiceChange}
            >
              <SelectItem key="" value="">
                All Services
              </SelectItem>
              {
                services.map((service) => (
                  <SelectItem key={service} value={service}>
                    {service}
                  </SelectItem>
                )) as any
              }
            </Select>

            <Select
              label="Rows per page"
              selectedKeys={[rowsPerPage.toString()]}
              onChange={handleRowsPerPageChange}
            >
              <SelectItem key="10" value="10">10</SelectItem>
              <SelectItem key="20" value="20">20</SelectItem>
              <SelectItem key="50" value="50">50</SelectItem>
              <SelectItem key="100" value="100">100</SelectItem>
            </Select>
          </div>

          {hasActiveFilters && (
            <div className="mt-4 pt-3 border-t border-divider flex items-center justify-between">
              <div className="text-sm text-foreground-500">
                <span className="font-medium">{filteredRegistrations.length}</span>{" "}
                registrations found
              </div>
              <Button
                color="warning"
                variant="flat"
                onClick={clearAllFilters}
                size="sm"
                endContent={<XMarkIcon className="h-4 w-4" />}
              >
                Clear All Filters
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Registrations Table */}
      <Card>
        <CardHeader className="flex justify-between items-center px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold">Registrations List</h2>
            <p className="text-foreground-400 text-sm mt-1">
              {filteredRegistrations.length === 0
                ? "No registrations found"
                : `Showing ${(page - 1) * rowsPerPage + 1} to ${Math.min(page * rowsPerPage, filteredRegistrations.length)} of ${filteredRegistrations.length} registrations`}
            </p>
          </div>
          <Button
            color="primary"
            variant="light"
            startContent={<ArrowPathIcon className="h-4 w-4" />}
            onClick={refreshData}
            isDisabled={isLoading}
          >
            Refresh
          </Button>
        </CardHeader>
        <CardBody>
          <Table
            aria-label="Registrations table"
            bottomContent={
              <div className="flex w-full justify-center">
                <Pagination
                  isCompact
                  showControls
                  showShadow
                  color="primary"
                  page={page}
                  total={pages}
                  onChange={setPage}
                />
              </div>
            }
            className="min-h-[400px]"
          >
            <TableHeader>
              {columns.map((column) => (
                <TableColumn key={column.key}>
                  {column.label}
                </TableColumn>
              ))}
            </TableHeader>
            <TableBody
              items={items}
              emptyContent="No registrations found"
            >
              {(registration) => (
                clickedRowId === registration.id.toString() ? (
                  <TableRow>
                    <TableCell colSpan={columns.length}>
                      <div className="flex justify-center items-center h-16">
                        <Spinner size="sm" />
                        <span className="ml-2">Loading...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  <TableRow 
                    key={registration.id}
                    className={`${canClickRegistrationRows ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700' : ''} transition-colors`}
                    onClick={() => handleRowClick(registration.id)}
                  >
                    <TableCell>{formatDate(registration.created_at)}</TableCell>
                    <TableCell>{registration.prospectus.reg_id}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{registration.prospectus.client_name}</div>
                        <div className="text-sm text-gray-500">{registration.prospectus.department}</div>
                      </div>
                    </TableCell>
                    <TableCell>{registration.services}</TableCell>
                    <TableCell>
                      <AmountTooltip
                        initial={registration.init_amount}
                        accept={registration.accept_amount}
                        discount={registration.discount}
                        total={registration.total_amount}
                      />
                    </TableCell>
                    <TableCell>
                      <PaymentTooltip
                        type={registration.status === 'registered' ? (registration.transactions?.transaction_type || 'Unknown') : 'Pending'}
                        amount={registration.transactions?.amount || 0}
                        status={registration.status}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        color={registration.status === 'registered' ? 'success' : 'warning'}
                        variant="flat"
                      >
                        {registration.status}
                      </Chip>
                    </TableCell>
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>
        </CardBody>
      </Card>
    </div>
  );
}

export default withExecutiveAuth(RegistrationPage);
