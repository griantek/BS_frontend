"use client"
import React from 'react';
import { useRouter } from 'next/navigation';
import { checkAuth } from '@/utils/authCheck';
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Pagination,
  Breadcrumbs,
  BreadcrumbItem,
} from "@heroui/react";
import { 
  PlusIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import api from '@/services/api';
import { withLeadsAuth } from '@/components/withLeadsAuth';
import type { Prospectus } from '@/services/api';
import { Spinner } from "@nextui-org/react";
import { format } from 'date-fns';

function ProspectsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(true);
  const [prospects, setProspects] = React.useState<Prospectus[]>([]);
  const [userData, setUserData] = React.useState(null);
  const [filterValue, setFilterValue] = React.useState("");
  const [page, setPage] = React.useState(1);
  const rowsPerPage = 10;
  const [clickedRowId, setClickedRowId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!checkAuth(router)) return;
    
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) return;
    
    const userDataParsed = JSON.parse(userStr);
    setUserData(userDataParsed);
    
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const prospectsResponse = await api.getProspectusByClientId(userDataParsed.id);
        setProspects(prospectsResponse.data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load prospects data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const columns = React.useMemo(() => [
    { key: "date", label: "DATE" },
    { key: "reg_id", label: "REG ID" },
    { key: "client_name", label: "CLIENT NAME" },
    { key: "email", label: "EMAIL" },
    { key: "phone", label: "PHONE" },
    { key: "department", label: "DEPARTMENT" },
    { key: "state", label: "STATE" },
  ], []);

  const filteredItems = React.useMemo(() => {
    if (!Array.isArray(prospects)) return [];
    
    return prospects.filter((prospect: Prospectus) =>
      prospect?.client_name?.toLowerCase().includes(filterValue.toLowerCase()) ||
      prospect?.email?.toLowerCase().includes(filterValue.toLowerCase()) ||
      prospect?.reg_id?.toLowerCase().includes(filterValue.toLowerCase()) ||
      prospect?.phone?.includes(filterValue)
    );
  }, [filterValue, prospects]);

  const pages = Math.ceil(filteredItems.length / rowsPerPage);
  const items = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredItems.slice(start, end);
  }, [page, filteredItems]);

  const formatDate = React.useCallback((dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy');
    } catch {
      return dateString;
    }
  }, []);

  const handleRowClick = async (id: string) => {
    setClickedRowId(id);
    await router.push(`/business/conversion/prospects/${id}`);
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[400px]">
        <Spinner size="lg" label="Loading prospects..." />
      </div>
    );
  }

  return (
    <>
      {/* Blue Banner Section - Add this at the top to match leads section */}
      <div className="bg-primary-500 dark:bg-primary-600 py-6 px-6 text-white">
        <div className="container mx-auto">
          <Breadcrumbs className="text-white/70">
            <BreadcrumbItem 
              href="/business/conversion" 
              onClick={(e) => {
                e.preventDefault();
                router.push('/business/conversion');
              }}
              className="text-white/70 hover:text-white"
            >
              Dashboard
            </BreadcrumbItem>
            <BreadcrumbItem className="text-white">Prospects</BreadcrumbItem>
          </Breadcrumbs>
          <h1 className="text-3xl font-bold mt-2">Prospects Management</h1>
          <p className="mt-2 text-white/80">Manage and track all your business prospects</p>
        </div>
      </div>

      <div className="w-full p-6">
        <Card className="mb-6">
          <CardHeader className="flex justify-between items-center px-6 py-4">
            <h2 className="text-xl font-semibold">All Prospects</h2>
            <div className="flex items-center gap-4">
              <div className="flex-1 max-w-md">
                <Input
                  isClearable
                  classNames={{
                    base: "w-full",
                    inputWrapper: "border-1",
                  }}
                  placeholder="Search by name, email, or registration ID..."
                  startContent={<MagnifyingGlassIcon className="text-default-400 w-4 h-4" />}
                  value={filterValue}
                  onClear={() => setFilterValue("")}
                  onValueChange={setFilterValue}
                />
              </div>
              <Button 
                color="primary" 
                onClick={() => router.push('/business/conversion/prospects/add_prospect')}
                startContent={<PlusIcon className="h-5 w-5" />}
              >
                Add Prospect
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            {prospects.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-default-500">No prospects found</p>
                <Button 
                  color="primary" 
                  variant="flat" 
                  className="mt-4"
                  onClick={() => router.push('/business/conversion/prospects/add_prospect')}
                >
                  Add Your First Prospect
                </Button>
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
                        className='cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors'
                        onClick={() => handleRowClick(item.reg_id)}
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
      </div>
    </>
  );
}

export default withLeadsAuth(ProspectsPage);
