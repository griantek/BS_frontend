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
  Pagination,
  Select,
  SelectItem,
  SelectProps,
} from "@heroui/react";
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { withExecutiveAuth } from '@/components/withExecutiveAuth';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import api from '@/services/api';
import type { Prospectus } from '@/services/api';
import { Spinner } from "@nextui-org/react";
import { 
  PERMISSIONS, 
  hasPermission,
  UserWithPermissions
} from '@/utils/permissions';

function ProspectusPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [prospects, setProspects] = React.useState<Prospectus[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [userData, setUserData] = React.useState<UserWithPermissions | null>(null);
  const [clickedRowId, setClickedRowId] = React.useState<string | null>(null);
  
  // Filter states
  const [filterDepartment, setFilterDepartment] = React.useState<string>("");
  const [filterState, setFilterState] = React.useState<string>("");
  const [departments, setDepartments] = React.useState<string[]>([]);
  const [states, setStates] = React.useState<string[]>([]);
  
  // Permissions state
  const [hasAddProspectPermission, setHasAddProspectPermission] = React.useState(false);
  const [canClickProspectRows, setCanClickProspectRows] = React.useState(false);

  React.useEffect(() => {
    if (!checkAuth(router)) return;
    
    const userStr = localStorage.getItem('user');
    
    if (!userStr) return;
    
    const userDataParsed = JSON.parse(userStr);
    setUserData(userDataParsed);
    
    fetchProspects(userDataParsed.id);
  }, [router]);

  // Extract filter options when data changes
  React.useEffect(() => {
    if (prospects.length > 0) {
      const departmentsSet = new Set<string>();
      const statesSet = new Set<string>();

      prospects.forEach((prospect) => {
        if (prospect.department) departmentsSet.add(prospect.department);
        if (prospect.state) statesSet.add(prospect.state);
      });

      setDepartments(Array.from(departmentsSet));
      setStates(Array.from(statesSet));
    }

    // Check permissions
    if (userData) {
      setHasAddProspectPermission(
        hasPermission(userData, PERMISSIONS.SHOW_ADD_PROSPECT)
      );
      setCanClickProspectRows(
        hasPermission(userData, PERMISSIONS.CLICK_PROSPECT_ROWS)
      );
    }
  }, [prospects, userData]);

  const fetchProspects = async (userId: string) => {
    try {
      setIsLoading(true);
      const response = await api.getProspectusByClientId(userId);
      setProspects(response.data || []);
    } catch (error) {
      console.error('Error fetching prospects:', error);
      toast.error('Failed to load prospects data');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle filter changes
  const handleDepartmentChange: SelectProps["onChange"] = (e) => {
    setFilterDepartment(e.target.value);
    setPage(1);
  };

  const handleStateChange: SelectProps["onChange"] = (e) => {
    setFilterState(e.target.value);
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
    setFilterState("");
    setSearchQuery("");
    setPage(1);
  };

  // Filter prospects based on all filters
  const filteredProspects = React.useMemo(() => {
    if (!Array.isArray(prospects)) return [];
    
    return prospects.filter((prospect) => {
      let matches = true;
      
      // Department filter
      if (filterDepartment && prospect.department !== filterDepartment) {
        matches = false;
      }
      
      // State filter
      if (filterState && prospect.state !== filterState) {
        matches = false;
      }
      
      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const searchMatches =
          prospect.client_name?.toLowerCase().includes(query) ||
          prospect.email?.toLowerCase().includes(query) ||
          prospect.reg_id?.toLowerCase().includes(query) ||
          prospect.phone?.includes(query) ||
          prospect.requirement?.toLowerCase().includes(query) ||
          false;
          
        if (!searchMatches) {
          matches = false;
        }
      }
      
      return matches;
    });
  }, [prospects, filterDepartment, filterState, searchQuery]);

  // Calculate pagination
  const pages = Math.ceil(filteredProspects.length / rowsPerPage);
  const items = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredProspects.slice(start, end);
  }, [page, rowsPerPage, filteredProspects]);

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

  const handleRowClick = async (regId: string) => {
    if (!canClickProspectRows) return;
    
    setClickedRowId(regId);
    await router.push(`/business/executive/view/prospect/${regId}`);
  };

  const refreshData = () => {
    if (userData?.id) {
      fetchProspects(userData.id);
    }
  };

  // Check if any filters are applied
  const hasActiveFilters =
    filterDepartment !== "" ||
    filterState !== "" ||
    searchQuery !== "";

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[400px]">
        <Spinner size="lg" label="Loading prospects..." />
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
              <BreadcrumbItem>Prospects</BreadcrumbItem>
            </Breadcrumbs>
            <h1 className="text-2xl font-bold">Prospects</h1>
          </div>
          <div className="flex gap-2">
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

      {/* Filters Panel */}
      <Card className="p-0 shadow-md rounded-lg overflow-hidden mb-6">
        <div className="bg-default-50 dark:bg-default-100/5 p-4 border-b border-divider">
          <h2 className="text-lg font-semibold flex items-center text-foreground">
            <FunnelIcon className="h-5 w-5 mr-2 text-primary" />
            Filter Prospects
          </h2>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              label="Search"
              startContent={
                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
              }
              placeholder="Name, reg ID, email, phone..."
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
              label="State"
              placeholder="Filter by state"
              selectedKeys={filterState ? [filterState] : []}
              onChange={handleStateChange}
            >
              <SelectItem key="" value="">
                All States
              </SelectItem>
              {
                states.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
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
                <span className="font-medium">{filteredProspects.length}</span>{" "}
                prospects found
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

      {/* Prospects Table */}
      <Card>
        <CardHeader className="flex justify-between items-center px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold">Prospects List</h2>
            <p className="text-foreground-400 text-sm mt-1">
              {filteredProspects.length === 0
                ? "No prospects found"
                : `Showing ${(page - 1) * rowsPerPage + 1} to ${Math.min(page * rowsPerPage, filteredProspects.length)} of ${filteredProspects.length} prospects`}
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
                    key={item.id}
                    className={`${canClickProspectRows ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700' : ''} transition-colors`}
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
        </CardBody>
      </Card>
    </div>
  );
}

export default withExecutiveAuth(ProspectusPage);
