"use client";

import React, { useState, useEffect, ChangeEvent } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Divider,
  Button,
  Spinner,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Select,
  SelectItem,
  useDisclosure,
} from "@heroui/react";
import {
  CheckCircleIcon,
  ClockIcon,
  UserPlusIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import api, { PendingRegistrationResponse, Editor } from "@/services/api";
import { formatDate } from "../../../utils/dateUtils";
import { formatCurrency } from "../../../utils/formatUtils";

export default function PendingApprovalsPage() {
  const [pendingRegistrations, setPendingRegistrations] = useState<
    PendingRegistrationResponse[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignableEntities, setAssignableEntities] = useState<Editor[]>([]);
  const [selectedEditor, setSelectedEditor] = useState<string>("");
  const [selectedRegistration, setSelectedRegistration] = useState<
    number | null
  >(null);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingEntities, setLoadingEntities] = useState(false);
  const [currentRequirement, setCurrentRequirement] = useState<string>("");
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Fetch pending registrations and editors
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setRefreshing(true);
      const registrationsRes = await api.getPendingRegistrations();
      setPendingRegistrations(registrationsRes.data);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching data:", err);
      setError("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadAssignableEntities = async (requirement: string) => {
    setLoadingEntities(true);
    setAssignableEntities([]);

    try {
      let entities: Editor[] = [];

      if (
        requirement.toLowerCase().includes("publication") &&
        requirement.toLowerCase().includes("paper writing")
      ) {
        // Case 3: Both publication and paper writing - get editors and authors
        const response = await api.getAllEditorsAndAuthors();
        entities = response.data;
      } else if (requirement.toLowerCase().includes("publication")) {
        // Case 1: Publication - get editors
        const response = await api.getAllEditors();
        entities = response.data;
      } else if (requirement.toLowerCase().includes("paper writing")) {
        // Case 2: Paper writing - get authors
        const response = await api.getAllAuthors();
        entities = response.data;
      }
      // Case 4: Other requirements - leave entities empty

      setAssignableEntities(entities);
    } catch (err) {
      console.error("Error loading assignable entities:", err);
      setError("Failed to load assignable entities.");
    } finally {
      setLoadingEntities(false);
    }
  };

  const handleAssignClick = (registrationId: number, requirement: string) => {
    setSelectedRegistration(registrationId);
    setSelectedEditor("");
    setAssignSuccess(null);
    setCurrentRequirement(requirement);

    // Load appropriate entities based on requirement
    loadAssignableEntities(requirement);

    onOpen();
  };

  const handleEditorChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedEditor(event.target.value);
  };

  const handleAssignSubmit = async () => {
    if (!selectedRegistration || !selectedEditor) {
      return;
    }

    try {
      setAssignLoading(true);
      await api.assignRegistration(selectedRegistration, selectedEditor);

      // Update local state to reflect the assignment
      setPendingRegistrations((prevRegistrations) =>
        prevRegistrations.filter(
          (reg) => reg.registration.id !== selectedRegistration
        )
      );

      setAssignSuccess(
        `Registration #${selectedRegistration} successfully assigned.`
      );

      // Close dialog after short delay to show success state
      setTimeout(() => {
        onClose();
        setAssignSuccess(null);
      }, 1500);
    } catch (err: any) {
      console.error("Error assigning registration:", err);
      setError("Failed to assign registration. Please try again.");
    } finally {
      setAssignLoading(false);
    }
  };

  const handleDialogClose = () => {
    onClose();
    setAssignSuccess(null);
  };

  const getStatusColor = (status: string) => {
    return status === "registered" ? "success" :
     status === "waiting for approval" ? "danger" :
      "warning";
  };

  if (loading && !refreshing) {
    return (
      <div className="flex justify-center items-center min-h-[80vh]">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  return (
    <div className="w-full p-6 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Registration Approvals</h1>
        <Button
          color="primary"
          variant="light"
          onClick={fetchData}
          className="px-4 flex items-center gap-2"
          disabled={refreshing}
        >
          {refreshing ? (
            <Spinner size="sm" />
          ) : (
            <ArrowPathIcon className="w-4 h-4" />
          )}
          Refresh
        </Button>
      </div>

      {error && (
        <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded mb-4 flex items-center">
          <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
          <span>{error}</span>
          <Button
            color="danger"
            variant="ghost"
            className="ml-auto"
            onClick={fetchData}
          >
            Try Again
          </Button>
        </div>
      )}

      {pendingRegistrations.length === 0 ? (
        <Card className="w-full">
          <CardBody className="py-8 flex flex-col items-center justify-center">
            <DocumentTextIcon className="w-16 h-16 text-default-300 mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Pending Approvals</h2>
            <p className="text-default-500 mb-4">
              All registrations have been processed and assigned.
            </p>
            <Button color="primary" variant="flat" onClick={fetchData}>
              Refresh Data
            </Button>
          </CardBody>
        </Card>
      ) : (
        <Card className="w-full">
          <CardHeader className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Pending Registrations</h2>
            <Chip color="primary" variant="flat" className="capitalize">
              {pendingRegistrations.length} Registrations
            </Chip>
          </CardHeader>
          <Divider />
          <CardBody>
            <Table
              aria-label="Pending registrations table"
              className="min-w-full"
            >
              <TableHeader>
                <TableColumn>Registration ID</TableColumn>
                <TableColumn>Date</TableColumn>
                <TableColumn>Client Name</TableColumn>
                <TableColumn>Requirement</TableColumn>
                <TableColumn>Total Amount</TableColumn>
                <TableColumn>Status</TableColumn>
                <TableColumn>Registered By</TableColumn>
                <TableColumn>Actions</TableColumn>
              </TableHeader>
              <TableBody>
                {pendingRegistrations.map((item) => {
                  // Use leads.requirement if available, fall back to prospectus.requirement
                  const requirement =
                    item.leads?.requirement;

                  return (
                    <TableRow key={item.registration.id}>
                      <TableCell>{item.prospectus.regId}</TableCell>
                      <TableCell>
                        {formatDate(item.registration.date)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {item.prospectus.clientName}
                      </TableCell>
                      <TableCell>{requirement}</TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(item.registration.totalAmount)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          color={getStatusColor(item.registration.status)}
                          variant="dot"
                        >
                          <div className="flex items-center gap-1">
                            {/* {item.registration.status === "registered" ? (
                              <CheckCircleIcon className="w-4 h-4" />
                            ) : (
                              <ClockIcon className="w-4 h-4" />
                            )} */}
                            {item.registration.status === "waiting for approval" ? "Approval needed"
                              : "Quotation send"}
                          </div>
                        </Chip>
                      </TableCell>
                      <TableCell>{item.registeredBy.username}</TableCell>
                      <TableCell>
                        {item.registration.status === "waiting for approval" ? (
                            <Button
                          color="primary"
                          onPress={() =>
                            handleAssignClick(item.registration.id, requirement)
                          }
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          <UserPlusIcon className="w-4 h-4" />
                          Assign
                        </Button>
                        ) : null}
                        
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      )}

      {/* Assign Editor Modal */}
      <Modal isOpen={isOpen} onClose={handleDialogClose}>
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            Assign Registration
          </ModalHeader>
          <ModalBody>
            {assignSuccess ? (
              <div className="bg-success-50 border border-success-200 text-success-700 px-4 py-3 rounded flex items-center">
                <CheckCircleIcon className="w-5 h-5 mr-2" />
                {assignSuccess}
              </div>
            ) : (
              <>
                {loadingEntities ? (
                  <div className="py-8 flex flex-col items-center">
                    <Spinner size="lg" color="primary" className="mb-4" />
                    <p>Loading assignable entities...</p>
                  </div>
                ) : assignableEntities.length > 0 ? (
                  <>
                    <p className="text-default-600 mb-2">
                      Requirement:{" "}
                      <span className="font-medium">{currentRequirement}</span>
                    </p>
                    <p className="text-default-600 mb-4">
                      Select an{" "}
                      {currentRequirement.toLowerCase() == "paper writing"
                        ? "author"
                        : currentRequirement.toLowerCase() == "publication"
                          ? "editor"
                          : "entity"}{" "}
                      to assign this registration to:
                    </p>
                    <Select
                      label="Assignee"
                      placeholder="Select an assignee"
                      value={selectedEditor}
                      onChange={handleEditorChange}
                      className="w-full"
                    >
                      {assignableEntities.map((entity) => (
                        <SelectItem key={entity.id} value={entity.id}>
                          {entity.username}
                        </SelectItem>
                      ))}
                    </Select>
                  </>
                ) : (
                  <div className="py-4">
                    <div className="bg-warning-50 border border-warning-200 text-warning-700 px-4 py-3 rounded mb-4">
                      <h3 className="font-medium mb-1">
                        Cannot Assign Registration
                      </h3>
                      <p>
                        The requirement &quot;{currentRequirement}&quot; doesn&apos;t align
                        with any available assignable entities. Please update
                        the requirement or contact an administrator.
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </ModalBody>
          <ModalFooter>
            <Button color="default" variant="flat" onClick={handleDialogClose}>
              Cancel
            </Button>
            {assignableEntities.length > 0 && !assignSuccess && (
              <Button
                color="primary"
                className="flex items-center gap-1"
                disabled={!selectedEditor || assignLoading || !!assignSuccess}
                onClick={handleAssignSubmit}
              >
                {assignLoading ? (
                  <Spinner size="sm" />
                ) : (
                  <UserPlusIcon className="w-4 h-4" />
                )}
                Assign
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
