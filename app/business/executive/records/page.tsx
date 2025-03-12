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
  Tabs,
  Tab,
} from "@heroui/react";
import { 
  PlusIcon, 
  ChartBarIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { withExecutiveAuth } from '@/components/withExecutiveAuth';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import api from '@/services/api';
import type { Prospectus, Registration } from '@/services/api';
import { Spinner } from "@nextui-org/react";

function RecordsPage() {
  const router = useRouter();
  const [filterValue, setFilterValue] = React.useState("");
  const [page, setPage] = React.useState(1);
  const rowsPerPage = 10;
  const [prospects, setProspects] = React.useState<Prospectus[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [registrations, setRegistrations] = React.useState<Registration[]>([]);
  const [selectedTab, setSelectedTab] = React.useState("prospects");
  const [clickedRowId, setClickedRowId] = React.useState<string | null>(null);
  const [hasAddProspectPermission, setHasAddProspectPermission] = React.useState(false);

  React.useEffect(() => {
    if (!checkAuth(router)) return;
    
    const userStr = localStorage.getItem('user');
    
    if (!userStr) return;
    
    const userData = JSON.parse(userStr);
    
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [prospectsResponse, registrationsResponse] = await Promise.all([
          api.getProspectusByClientId(userData.id),
          api.getRegistrationsByExecutive(userData.id)
        ]);
        
        setProspects(prospectsResponse.data || []);
        setRegistrations(registrationsResponse.data || []);

        // Check if user has the specific permission
        if (userData.permissions) {
          const hasPermission = userData.permissions.some(
            (permission: { name: string; }) => permission.name === 'show_add_prosp_btn'
          );
          setHasAddProspectPermission(hasPermission);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const filteredItems = React.useMemo(() => {
    if (!Array.isArray(prospects)) return [];
    
    return prospects.filter((prospect: Prospectus) =>
      prospect?.client_name?.toLowerCase().includes(filterValue.toLowerCase()) ||
      prospect?.email?.toLowerCase().includes(filterValue.toLowerCase()) ||
      prospect?.reg_id?.toLowerCase().includes(filterValue.toLowerCase())
    );
  }, [filterValue, prospects]);

  const pages = Math.ceil(filteredItems.length / rowsPerPage);
  const items = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredItems.slice(start, end);
  }, [page, filteredItems]);

  const registrationColumns = React.useMemo(() => [
    { key: "created_at", label: "DATE" },
    { key: "reg_id", label: "REG ID" },
    { key: "client", label: "CLIENT" },
    { key: "services", label: "SERVICES" },
    { key: "amounts", label: "AMOUNT" },
    { key: "payment", label: "PAYMENT" },
    { key: "status", label: "STATUS" },
  ], []);

  // Add a tooltip component for amount details
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

  // Add a tooltip component for payment details
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

  const filteredRegistrations = React.useMemo(() => {
    if (!Array.isArray(registrations)) return [];
    
    const filtered = registrations.filter((reg) =>
      reg.prospectus?.client_name?.toLowerCase().includes(filterValue.toLowerCase()) ||
      reg.prospectus?.reg_id?.toLowerCase().includes(filterValue.toLowerCase()) ||
      reg.services?.toLowerCase().includes(filterValue.toLowerCase()) ||
      reg.status?.toLowerCase().includes(filterValue.toLowerCase()) ||
      reg.prospectus?.department?.toLowerCase().includes(filterValue.toLowerCase())
    );
    return filtered;
  }, [filterValue, registrations]);

  const columns = React.useMemo(() => [
    { key: "date", label: "DATE" },
    { key: "reg_id", label: "REG ID" },
    { key: "client_name", label: "CLIENT NAME" },
    { key: "email", label: "EMAIL" },
    { key: "phone", label: "PHONE" },
    { key: "department", label: "DEPARTMENT" },
    { key: "state", label: "STATE" },
  ], []);

  const formatDate = React.useCallback((dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy');
    } catch {
      return dateString;
    }
  }, []);

  const handleRowClick = async (route: string, id: string) => {
    setClickedRowId(id);
    await router.push(route);
  };

  const renderLoadingRow = (colspan: number) => (
    <TableRow>
      <TableCell colSpan={colspan}>
        <div className="flex justify-center items-center h-16">
          <Spinner size="sm" />
          <span className="ml-2">Loading...</span>
        </div>
      </TableCell>
    </TableRow>
  );

  const SearchIcon = () => (
    <MagnifyingGlassIcon className="text-default-400 w-4 h-4" />
  );

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
            </Breadcrumbs>
            <h1 className="text-2xl font-bold">Prospects & Registrations</h1>
          </div>
          <div className="flex gap-2">
            {/* <Button 
              color="secondary"
              variant="flat"
              onClick={() => router.push('/business/executive')}
              startContent={<ChartBarIcon className="h-5 w-5" />}
            >
              Dashboard
            </Button> */}
            {hasAddProspectPermission && (
              <Button 
                color="primary" 
                onClick={() => router.push('/business/executive/add_prospect')}
                startContent={<PlusIcon className="h-5 w-5" />}
              >
                Add Prospect
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      <Tabs 
        selectedKey={selectedTab} 
        onSelectionChange={setSelectedTab as any}
      >
        <Tab key="prospects" title="Prospects">
          <Card>
            <CardHeader className="flex justify-between items-center px-6 py-4">
              <div className="flex-1 max-w-md">
                <Input
                  isClearable
                  classNames={{
                    base: "w-full",
                    inputWrapper: "border-1",
                  }}
                  placeholder="Search by name, email, or registration ID..."
                  startContent={<SearchIcon />}
                  value={filterValue}
                  onClear={() => setFilterValue("")}
                  onValueChange={setFilterValue}
                />
              </div>
            </CardHeader>
            <CardBody>
              {isLoading ? (
                <div className="flex justify-center items-center h-[400px]">
                  <Spinner size="lg" label="Loading prospects..." />
                </div>
              ) : (
                <Table
                  aria-label="Prospects table"
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
                      <TableColumn 
                        key={column.key}
                        align={column.key === "actions" ? "center" : "start"}
                      >
                        {column.label}
                      </TableColumn>
                    ))}
                  </TableHeader>
                  <TableBody
                    items={items}
                    emptyContent="No prospects found"
                  >
                    {(item) => (
                      clickedRowId === item.reg_id ? (
                        renderLoadingRow(columns.length)
                      ) : (
                        <TableRow 
                          key={item.id}
                          className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          onClick={() => handleRowClick(`/business/executive/view/prospect/${item.reg_id}`, item.reg_id)}
                        >
                          <TableCell>{formatDate(item.date)}</TableCell>
                          <TableCell>{item.reg_id}</TableCell>
                          <TableCell>{item.client_name}</TableCell>
                          <TableCell>{item.email}</TableCell>
                          <TableCell>{item.phone}</TableCell>
                          <TableCell>{item.department}</TableCell>
                          <TableCell>{item.state}</TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              )}
            </CardBody>
          </Card>
        </Tab>
        <Tab key="registrations" title="Registrations">
          <Card>
            <CardHeader className="flex justify-between items-center px-6 py-4">
              <div className="flex-1 max-w-md">
                <Input
                  isClearable
                  classNames={{
                    base: "w-full",
                    inputWrapper: "border-1",
                  }}
                  placeholder="Search registrations..."
                  startContent={<SearchIcon />}
                  value={filterValue}
                  onClear={() => setFilterValue("")}
                  onValueChange={setFilterValue}
                />
              </div>
            </CardHeader>
            <CardBody>
              {isLoading ? (
                <div className="flex justify-center items-center h-[400px]">
                  <Spinner size="lg" label="Loading registrations..." />
                </div>
              ) : (
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
                        total={Math.ceil(filteredRegistrations.length / rowsPerPage)}
                        onChange={setPage}
                      />
                    </div>
                  }
                >
                  <TableHeader>
                    {registrationColumns.map((column) => (
                      <TableColumn key={column.key}>
                        {column.label}
                      </TableColumn>
                    ))}
                  </TableHeader>
                  <TableBody
                    items={filteredRegistrations.slice(
                      (page - 1) * rowsPerPage,
                      page * rowsPerPage
                    )}
                    emptyContent="No registrations found"
                  >
                    {(registration) => (
                      clickedRowId === registration.id.toString() ? (
                        renderLoadingRow(registrationColumns.length)
                      ) : (
                        <TableRow 
                          key={registration.id}
                          className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          onClick={() => handleRowClick(`/business/executive/view/registration/${registration.id}`, registration.id.toString())}
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
              )}
            </CardBody>
          </Card>
        </Tab>
      </Tabs>
    </div>
  );
}

export default withExecutiveAuth(RecordsPage);
