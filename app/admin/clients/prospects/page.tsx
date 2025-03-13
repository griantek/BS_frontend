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
  Pagination,
  Input
} from "@heroui/react";
import { WithAdminAuth } from "@/components/withAdminAuth";
import api, { type Prospectus } from "@/services/api";
import { toast } from "react-toastify";
import {PERMISSIONS} from "@/utils/permissions";

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

function ProspectsPage() {
  const [prospects, setProspects] = React.useState<Prospectus[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [searchTerm, setSearchTerm] = React.useState("");
  const PER_PAGE = 10;

  // Add debounce for search
  const debouncedSearch = React.useCallback(
    React.useMemo(
      () =>
        debounce((term: string) => {
          setSearchTerm(term);
          setPage(1);
        }, 300),
      []
    ),
    []
  );

  const fetchProspects = React.useCallback(async (pageNum: number) => {
    try {
      setIsLoading(true);
      const response = await api.getAllProspectus(pageNum, PER_PAGE);
      
      if (response?.success) {
        // Calculate start and end indices for pagination
        const startIndex = (pageNum - 1) * PER_PAGE;
        const endIndex = startIndex + PER_PAGE;
        
        // Get the full data array and slice it for current page
        const fullData = Array.isArray(response.data) ? response.data : [];
        const paginatedData = fullData.slice(startIndex, endIndex);
        
        setProspects(paginatedData);
        setTotal(fullData.length);
      } else {
        setProspects([]);
        setTotal(0);
      }
    } catch (error) {
      console.error('Error fetching prospects:', error);
      toast.error("Failed to fetch prospects");
      setProspects([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchProspects(page);
  }, [fetchProspects, page]);

  // Filter only the current page's data
  const filteredProspects = React.useMemo(() => {
    if (!Array.isArray(prospects)) return [];
    
    if (!searchTerm) return prospects;
    
    return prospects.filter((prospect) =>
      prospect?.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prospect?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prospect?.reg_id?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [prospects, searchTerm]);

  return (
    <div className="w-full p-6">
      <Card>
        <CardHeader className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Prospects Management</h1>
          <div className="flex-1 max-w-md ml-4">
            <Input
              isClearable
              placeholder="Search prospects..."
              onChange={(e) => debouncedSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardBody>
          {isLoading ? (
            <div className="flex justify-center items-center h-[200px]">
              <Spinner size="lg" />
            </div>
          ) : (
            <Table aria-label="Prospects table">
              <TableHeader>
                <TableColumn>Sl.No</TableColumn>
                <TableColumn>REG ID</TableColumn>
                <TableColumn>CLIENT NAME</TableColumn>
                <TableColumn>PHONE</TableColumn>
                <TableColumn>EMAIL</TableColumn>
                <TableColumn>STATE</TableColumn>
                <TableColumn>DEPARTMENT</TableColumn>
                <TableColumn>EXECUTIVE</TableColumn>
                <TableColumn>REGISTERED</TableColumn>
                <TableColumn>CREATED</TableColumn>
              </TableHeader>
              <TableBody>
                {filteredProspects.map((prospect, index) => (
                  <TableRow key={prospect.id}>
                    <TableCell>
                      {/* Calculate serial number based on current page */}
                      {(page - 1) * PER_PAGE + index + 1}
                    </TableCell>
                    <TableCell>{prospect.reg_id}</TableCell>
                    <TableCell>{prospect.client_name}</TableCell>
                    <TableCell>{prospect.phone}</TableCell>
                    <TableCell>{prospect.email}</TableCell>
                    <TableCell>{prospect.state}</TableCell>
                    <TableCell>{prospect.department}</TableCell>
                    <TableCell>
                      <Chip color="primary" size="sm" variant="flat">
                        {prospect.entities?.username ?? "N/A"}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <Chip
                        color={prospect.isregistered ? "success" : "warning"}
                        size="sm"
                        variant="flat"
                      >
                        {prospect.isregistered ? "Yes" : "No"}
                      </Chip>
                    </TableCell>
                    <TableCell>{formatDate(prospect.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <div className="flex justify-center mt-4">
            <Pagination
              // Total number of pages based on total records
              total={Math.ceil(total / PER_PAGE)}
              page={page}
              onChange={(newPage) => {
                setPage(newPage);
                fetchProspects(newPage);
              }}
              showControls
              showShadow
              color="primary"
            />
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Update the export to use the SHOW_PROSPECTS_TAB permission
export default WithAdminAuth(ProspectsPage, PERMISSIONS.SHOW_PROSPECTS_TAB);
