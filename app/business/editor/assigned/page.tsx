"use client";
import React from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Chip,
  Card,
  CardHeader,
  CardBody,
  Input,
  Spinner,
} from "@nextui-org/react";
import { format } from "date-fns";
import { SearchIcon } from "@/app/business/executive/SearchIcon";
import api from "@/services/api";
import type { AssignedRegistration } from "@/services/api";
import { withEditorAuth } from "@/components/withEditorAuth";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { currentUserHasPermission, PERMISSIONS } from "@/utils/permissions";

function AssignedPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(true);
  const [registrations, setRegistrations] = React.useState<
    AssignedRegistration[]
  >([]);
  const [filterValue, setFilterValue] = React.useState("");
  const [canClickRows, setCanClickRows] = React.useState(false);

  React.useEffect(() => {
    // Check permission for clicking rows
    setCanClickRows(currentUserHasPermission(PERMISSIONS.CLICK_ASSIGNED_ROWS));

    const fetchData = async () => {
      try {
        const user = api.getStoredUser();

        const response = await api.getAssignedRegistrations(user.id);
        setRegistrations(response.data);
      } catch (error) {
        console.error("Error fetching assigned registrations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredRegistrations = React.useMemo(() => {
    return registrations.filter(
      (reg) =>
        reg.prospectus.client_name
          .toLowerCase()
          .includes(filterValue.toLowerCase()) ||
        reg.prospectus.reg_id
          .toLowerCase()
          .includes(filterValue.toLowerCase()) ||
        reg.services.toLowerCase().includes(filterValue.toLowerCase())
    );
  }, [registrations, filterValue]);

  const handleRowClick = (registrationId: number) => {
    if (canClickRows) {
      router.push(`/business/editor/view/assigned/${registrationId}`);
    }
  };

  const columns = [
    { key: "date", label: "DATE" },
    { key: "reg_id", label: "REG ID" },
    { key: "client", label: "CLIENT" },
    { key: "services", label: "SERVICES" },
    { key: "executive", label: "EXECUTIVE" },
  ];

  const formatDate = (date: string) => format(new Date(date), "dd/MM/yyyy");

  return (
    <div className="w-full p-6">
      <Card className="w-full">
        <CardHeader className="flex justify-between items-center px-6 py-4">
          <h1 className="text-2xl font-bold">Pending Submissions</h1>
          <div className="flex-1 max-w-md ml-4">
            <Input
              isClearable
              placeholder="Search by name, ID or services..."
              startContent={<SearchIcon />}
              value={filterValue}
              onClear={() => setFilterValue("")}
              onValueChange={setFilterValue}
            />
          </div>
        </CardHeader>
        <CardBody>
          {isLoading ? (
            <LoadingSpinner text="Loading pending submissions..." />
          ) : (
            <Table
              aria-label="Pending Submissions table"
              classNames={{
                wrapper: "min-h-[400px]",
              }}
            >
              <TableHeader columns={columns}>
                {(column) => (
                  <TableColumn key={column.key}>{column.label}</TableColumn>
                )}
              </TableHeader>
              <TableBody
                items={filteredRegistrations}
                emptyContent="No registrations found"
                isLoading={isLoading}
              >
                {(registration) => (
                  <TableRow
                    key={registration.id}
                    className={`${canClickRows && "cursor-pointer hover:bg-gray-500"}, ${
                      !canClickRows && "cursor-default"
                    }`}
                    onClick={() => handleRowClick(registration.id)}
                  >
                    <TableCell>{formatDate(registration.date)}</TableCell>
                    <TableCell>{registration.prospectus.reg_id}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {registration.prospectus.client_name}
                        </span>
                        <span className="text-sm text-gray-500">
                          {registration.prospectus.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {registration.services.split(", ").map((service, i) => (
                          <Chip key={i} size="sm" variant="flat">
                            {service}
                          </Chip>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {registration.prospectus.entity.username}
                        </span>
                        <span className="text-sm text-gray-500">
                          {registration.prospectus.entity.email}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

// Use withEditorAuth to ensure proper permission checks
export default withEditorAuth(AssignedPage, PERMISSIONS.SHOW_ASSIGNED_TABLE);
