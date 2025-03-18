"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Card,
  Button,
  Input,
  Select,
  SelectItem,
  Textarea,
  Divider,
  Spinner,
} from "@heroui/react";
import {
  ArrowLeftIcon,
  CheckIcon,
  ExclamationCircleIcon,
  UserGroupIcon,
  EnvelopeIcon,
  IdentificationIcon,
  UserIcon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import api, { Editor } from "@/services/api";
// Remove manual auth check since we'll use HOC
// import { checkAuth } from "@/utils/authCheck";
import { withLeadsAuth } from "@/components/withLeadsAuth";

const generateRegId = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `REG${year}${month}${day}${hours}${minutes}`;
};

const ApproveLeadPage = () => {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  // Simplified lead data structure with only needed fields
  const [lead, setLead] = useState<{
    id: number;
    client_name: string;
    phone_number: string;
    domain: string;
    state: string;
    country: string;
    requirement: string;
  } | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [executives, setExecutives] = useState<Editor[]>([]);
  const [loadingExecutives, setLoadingExecutives] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    assigned_to: "",
    email: "",
    reg_id: generateRegId(),
    tech_person: "",
    proposed_service_period: "",
    services: "",
    notes: "",
  });

  useEffect(() => {
    // Remove manual auth check since we're using the HOC
    // checkAuth(router, "leads");
    
    if (id) {
      fetchLead(parseInt(id));
      fetchExecutives();
    }
  }, [id, router]);

  // Fetch only the necessary lead details
  const fetchLead = async (leadId: number) => {
    try {
      setLoading(true);
      const response = await api.getLeadById(leadId);

      if (response && response.data) {
        // Extract only the fields we need
        const { id, client_name, phone_number, domain, state, country, requirement } = response.data;
        setLead({ id, client_name, phone_number, domain, state, country, requirement });
      } else {
        setError("Lead not found");
      }
    } catch (err) {
      console.error("Error fetching lead:", err);
      setError("Failed to load lead details");
    } finally {
      setLoading(false);
    }
  };

  // Fetch executives for the dropdown
  const fetchExecutives = async () => {
    try {
      setLoadingExecutives(true);
      const response = await api.getAllExecutives();

      if (response && response.data) {
        setExecutives(response.data);
      } else {
        console.error("No executives found");
      }
    } catch (err) {
      console.error("Error fetching executives:", err);
    } finally {
      setLoadingExecutives(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!lead) return;
    
    // Validate required fields
    const requiredFields = ["assigned_to", "email", "services", "proposed_service_period"];
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
    
    if (missingFields.length > 0) {
      setError(`Please fill in all required fields: ${missingFields.join(", ")}`);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Call the API to approve lead
      const response = await api.approveLeadAsProspect(parseInt(id), {
        ...formData,
        lead_id: lead.id,
        client_name: lead.client_name,
        phone: lead.phone_number,
        state: lead.state,
        country: lead.country,
        requirement: lead.requirement,
      });

      if (response && response.data) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/business/leads");
        }, 2000);
      }
    } catch (err: any) {
      console.error("Error approving lead:", err);
      setError(err.message || "Failed to approve lead. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
            <div className="flex justify-center items-center min-h-screen bg-background">
              <Spinner size="lg" />
          </div>
      );
  }

  if (error && !lead) {
    return (
      <div className="p-6 min-h-screen bg-background">
        <Button onClick={handleBack} variant="light" startContent={<ArrowLeftIcon className="h-4 w-4" />}>
          Back to Lead Details
        </Button>
        <div className="mt-8 max-w-2xl mx-auto text-center">
          <div className="bg-danger-50 dark:bg-danger-900/20 p-6 rounded-lg">
            <ExclamationCircleIcon className="h-12 w-12 mx-auto text-danger" />
            <h2 className="text-xl font-bold mt-4 text-danger">{error}</h2>
            <p className="mt-2">Could not load the requested lead information.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Button onClick={handleBack} variant="light" startContent={<ArrowLeftIcon className="h-4 w-4" />}>
            Back to Lead Details
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Approve Lead</h1>
          <div></div>
        </div>

        {success ? (
          <div className="bg-success-50 dark:bg-success-900/20 p-6 rounded-lg text-success-700 dark:text-success-300 text-center">
            <CheckIcon className="h-16 w-16 mx-auto mb-4" />
            <h2 className="text-2xl font-bold">Lead Successfully Approved</h2>
            <p className="mt-2">The lead has been successfully converted to a prospect.</p>
            <p className="text-sm mt-4">Redirecting to leads list...</p>
          </div>
        ) : (
          <Card className="p-6 bg-content1">
            {lead && (
              <div className="mb-6 bg-primary-50 dark:bg-primary-900/10 p-4 rounded-lg">
                <h2 className="text-lg font-semibold text-primary-700 dark:text-primary-300">
                  Lead Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div>
                    <p className="text-sm text-foreground-500">Client Name:</p>
                    <p className="font-medium">{lead.client_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-foreground-500">Phone:</p>
                    <p className="font-medium">{lead.phone_number || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-foreground-500">Domain:</p>
                    <p className="font-medium">{lead.domain || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-foreground-500">Location:</p>
                    <p className="font-medium">
                      {[lead.state, lead.country].filter(Boolean).join(", ") || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-6 bg-danger-50 dark:bg-danger-900/20 p-4 rounded-lg border border-danger text-danger-700 dark:text-danger-300">
                <div className="flex items-start">
                  <ExclamationCircleIcon className="h-5 w-5 mr-2 mt-0.5" />
                  <div>
                    <p className="font-semibold">Error</p>
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                {/* Assignment Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <UserGroupIcon className="h-5 w-5 mr-2 text-primary" />
                    Assignment Details
                  </h3>
                  <Divider className="mb-4" />

                  <div className="space-y-4">
                    <Select
                      label="Assign to Executive"
                      placeholder={loadingExecutives ? "Loading executives..." : "Select an executive"}
                      selectedKeys={formData.assigned_to ? [formData.assigned_to] : []}
                      onChange={(e) => handleSelectChange("assigned_to", e.target.value)}
                      isDisabled={loadingExecutives}
                      isRequired
                    >
                      {executives.map((executive) => (
                        <SelectItem key={executive.id} value={executive.id}>
                          {executive.username}
                        </SelectItem>
                      ))}
                    </Select>

                    <Input
                      label="Email"
                      name="email"
                      type="email"
                      placeholder="Client email address"
                      value={formData.email}
                      onChange={handleChange}
                      startContent={<EnvelopeIcon className="h-4 w-4 text-default-400" />}
                      isRequired
                    />
                  </div>
                </div>

                {/* Registration Details */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <ClipboardDocumentListIcon className="h-5 w-5 mr-2 text-primary" />
                    Registration Details
                  </h3>
                  <Divider className="mb-4" />

                  <div className="space-y-4">
                    <Input
                      label="Registration ID"
                      name="reg_id"
                      value={formData.reg_id}
                      isReadOnly
                      startContent={<IdentificationIcon className="h-4 w-4 text-default-400" />}
                    />

                    <Input
                      label="Technical Person"
                      name="tech_person"
                      placeholder="Name of technical contact person"
                      value={formData.tech_person}
                      onChange={handleChange}
                      startContent={<UserIcon className="h-4 w-4 text-default-400" />}
                    />

                    <Input
                      label="Proposed Service Period"
                      name="proposed_service_period"
                      placeholder="e.g., 3 months, 1 year"
                      value={formData.proposed_service_period}
                      onChange={handleChange}
                      startContent={<CalendarDaysIcon className="h-4 w-4 text-default-400" />}
                      isRequired
                    />
                  </div>
                </div>

                {/* Services Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <DocumentTextIcon className="h-5 w-5 mr-2 text-primary" />
                    Services & Notes
                  </h3>
                  <Divider className="mb-4" />

                  <div className="space-y-4">
                    <Textarea
                      label="Services"
                      name="services"
                      placeholder="List the services to be provided"
                      value={formData.services}
                      onChange={handleChange}
                      minRows={2}
                      isRequired
                    />

                    <Textarea
                      label="Notes"
                      name="notes"
                      placeholder="Additional notes or information"
                      value={formData.notes}
                      onChange={handleChange}
                      minRows={3}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-divider">
                <Button 
                  color="danger" 
                  variant="flat" 
                  onClick={handleBack}
                  isDisabled={submitting}
                >
                  Cancel
                </Button>
                <Button 
                  color="success" 
                  type="submit" 
                  startContent={<CheckIcon className="h-4 w-4" />}
                  isLoading={submitting}
                  className="px-8"
                >
                  {submitting ? "Approving Lead..." : "Approve Lead"}
                </Button>
              </div>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
};

// Export with auth HOC wrapper
export default withLeadsAuth(ApproveLeadPage);
