'use client'
import React from 'react';
import { useRouter } from 'next/navigation';
import { checkAuth } from '@/utils/authCheck';
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Input,
  Button,
  Card,
  CardHeader,
  CardBody,
  Chip,
  useDisclosure,
  Pagination,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/react";
import { SearchIcon } from './SearchIcon';
import { format } from 'date-fns';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import api from '@/services/api';
import { withAdminAuth } from '@/components/withAdminAuth';

interface Prospect {
  id: number;
  executive_id: string;
  date: string;
  email: string;
  reg_id: string;
  client_name: string;
  phone: string;
  department: string;
  state: string;
  tech_person: string;
  requirement: string;
  proposed_service_period: string;
  created_at: string;
  services: string;
}

interface ApiResponse {
  success: boolean;
  data: Prospect[];
  timestamp: string;
}

function BusinessDashboard() {
  const router = useRouter();
  const [filterValue, setFilterValue] = React.useState("");
  const [page, setPage] = React.useState(1);
  const rowsPerPage = 10;
  const [prospects, setProspects] = React.useState<Prospect[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (!checkAuth(router)) return;
    
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) return;
    
    // api.setAuthToken(token);
    const userData = JSON.parse(userStr);
    
    const fetchProspects = async () => {
      try {
        setIsLoading(true);
        const response = await api.getProspectusByClientId(userData.id);
        // Extract data and preserve all fields
        const prospects = response.data || [];
        setProspects(prospects);
        // console.log('Prospects loaded:', prospects);
      } catch (error) {
        console.error('Error fetching prospects:', error);
        setProspects([]); // Set empty array on error
        const errorMessage = api.handleError(error);
        // You might want to show an error toast here
      } finally {
        setIsLoading(false);
      }
    };

    fetchProspects();
  }, [router]);

  const filteredItems = React.useMemo(() => {
    if (!Array.isArray(prospects)) return [];
    
    return prospects.filter((prospect: Prospect) =>
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

  // Stable key generation for table columns
  const columns = React.useMemo(() => [
    { key: "date", label: "DATE" },
    { key: "reg_id", label: "REG ID" },
    { key: "client_name", label: "CLIENT NAME" },
    { key: "email", label: "EMAIL" },
    { key: "phone", label: "PHONE" },
    { key: "department", label: "DEPARTMENT" },
    { key: "state", label: "STATE" },
  ], []);

  // Date formatting wrapped in useCallback
  const formatDate = React.useCallback((dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy');
    } catch {
      return dateString;
    }
  }, []);

  return (
    <div className="w-full p-6">
      <Card className="mb-6">
        <CardHeader className="flex justify-between items-center px-6 py-4">
          <h1 className="text-2xl font-bold">Prospects Dashboard</h1>
          <Button 
            isIconOnly
            color="primary" 
            onClick={() => router.push('/business/add_prospect')}
            title="Add Prospect"
          >
            <PlusIcon className="h-5 w-5" />
          </Button>
        </CardHeader>
      </Card>

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
                <TableRow 
                  key={item.id}
                  className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => router.push(`/business/view/${item.reg_id}`)}
                >
                  <TableCell>{formatDate(item.date)}</TableCell>
                  <TableCell>{item.reg_id}</TableCell>
                  <TableCell>{item.client_name}</TableCell>
                  <TableCell>{item.email}</TableCell>
                  <TableCell>{item.phone}</TableCell>
                  <TableCell>{item.department}</TableCell>
                  <TableCell>{item.state}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardBody>
      </Card>
    </div>
  );
}

export default withAdminAuth(BusinessDashboard);