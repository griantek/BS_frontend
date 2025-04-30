"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
  CalendarDaysIcon, 
  UserCircleIcon, 
  PhoneIcon,
  GlobeAltIcon,
  MapPinIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import api, { Lead, UpdateLeadRequest } from "@/services/api";
import { withExecutiveAuth } from "@/components/withExecutiveAuth";

const EditLeadPage = () => {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  // Add state to track if "Other" option is selected for requirement
  const [isOtherRequirement, setIsOtherRequirement] = useState(false);
  const [leadData, setLeadData] = useState<Lead | null>(null);

  // Form fields state
  const [formData, setFormData] = useState<Partial<UpdateLeadRequest>>({
    lead_source: "",
    client_name: "",
    phone_number: "",
    country: "Indian",
    state: "",
    domain: "",
    requirement: "",
    detailed_requirement: "",
    remarks: "",
    followup_date: "",
    prospectus_type: "",
    // Fields for handling "Other" option inputs, not sent directly to API
    other_source: "",
    other_domain: "",
  });

  // Options for dropdown fields
  const [leadSources, setLeadSources] = useState<string[]>([
    "Live lead",
    "Website",
    "Social Media",
    "Referral",
    "Call",
    "Email",
    "WhatsApp",
    "Other",
  ]);

  const [domains, setDomains] = useState<string[]>([
    "Computer Science",
    "Mechanical Engineering",
    "Electrical Engineering",
    "Civil Engineering",
    "Medical",
    "Dentistry",
    "Nursing",
    "Education",
    "Management",
    "Arts",
    "Journalism",
    "Law",
    "Psychology",
    "Social Science",
    "Other",
  ]);

  const [prospectTypes, setProspectTypes] = useState<string[]>([
    "Leads",
    "Not a prospect",
    "Later prospect",
    "Prospect",
  ]);

  // Add requirement types
  const [requirementTypes, setRequirementTypes] = useState<string[]>([
    "Publication",
    "Paper writing",
    "Publication and Paper writing",
    "Other",
  ]);

  // Fetch lead data when component mounts
  useEffect(() => {
    if (id) {
      fetchLead(parseInt(id));
    }
  }, [id]);

  const fetchLead = async (leadId: number) => {
    try {
      setFetchLoading(true);
      setError(null);
      const response = await api.getLeadById(leadId);

      if (response && response.data) {
        setLeadData(response.data);
        
        // Pre-populate form data
        const lead = response.data;
        
        // Check if requirement is in our predefined list
        const isCustomRequirement = !requirementTypes.includes(lead.requirement || "");
        setIsOtherRequirement(isCustomRequirement);
        
        // Set form data
        setFormData({
          lead_source: lead.lead_source || "",
          client_name: lead.client_name || "",
          phone_number: lead.phone_number || "",
          country: lead.country || "Indian",
          state: lead.state || "",
          domain: lead.domain || "",
          requirement: isCustomRequirement ? "Other" : lead.requirement || "",
          detailed_requirement: lead.detailed_requirement || "",
          remarks: lead.remarks || "",
          followup_date: lead.followup_date || "",
          prospectus_type: lead.prospectus_type || "",
          
          // If these are "Other", store the actual values in the corresponding fields
          other_source: lead.lead_source && !leadSources.includes(lead.lead_source) ? lead.lead_source : "",
          other_domain: lead.domain && !domains.includes(lead.domain) ? lead.domain : "",
        });
        
      } else {
        setError("Lead not found");
      }
    } catch (err) {
      console.error("Error fetching lead:", err);
      setError("Failed to load lead details. Please try again later.");
    } finally {
      setFetchLoading(false);
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
    // Check if requirement selection is changing to or from "Other"
    if (name === "requirement") {
      setIsOtherRequirement(value === "Other");
      
      // Always set the dropdown value, even for "Other"
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      // Validate required fields
      const requiredFields = [
        "lead_source",
        "client_name",
        "phone_number",
      ];
      
      const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
      
      if (missingFields.length > 0) {
        throw new Error(`Please fill in required fields: ${missingFields.join(", ")}`);
      }

      // Process "Other" options before submission
      let leadSourceValue = formData.lead_source;
      if (leadSourceValue === "Other" && formData.other_source) {
        leadSourceValue = formData.other_source;
      }

      let domainValue = formData.domain;
      if (domainValue === "Other" && formData.other_domain) {
        domainValue = formData.other_domain;
      }

      // Format data for API with corrected field names
      const updateData: UpdateLeadRequest = {
        lead_source: leadSourceValue!,
        client_name: formData.client_name!,
        phone_number: formData.phone_number!,
        country: formData.country || "Indian",
        state: formData.state || "",
        domain: domainValue || "",
        requirement: isOtherRequirement && formData.requirement !== "Other" 
          ? formData.requirement 
          : (formData.requirement === "Other" ? "" : formData.requirement) || "",
        detailed_requirement: formData.detailed_requirement || "",
        remarks: formData.remarks || "",
        followup_date: formData.followup_date || "",
        prospectus_type: formData.prospectus_type || "",
      };

      // Submit to API
      await api.updateLead(parseInt(id), updateData);
      
      setSuccess(true);
      
      // Navigate back after successful update
      setTimeout(() => {
        router.push(`/business/executive/leads/${id}`);
      }, 2000);

    } catch (err: any) {
      console.error("Error updating lead:", err);
      setError(err.message || "Failed to update lead. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="min-h-screen bg-background p-6 flex justify-center items-center">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-foreground-600">Loading lead data...</p>
        </div>
      </div>
    );
  }

  if (!leadData && !fetchLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <Button 
              onClick={() => router.push("/business/executive/leads/all")}
              variant="light" 
              startContent={<ArrowLeftIcon className="h-4 w-4" />}
            >
              Back to Leads
            </Button>
          </div>
          
          <Card className="p-6 text-center">
            <ExclamationCircleIcon className="h-12 w-12 mx-auto mb-4 text-danger" />
            <h2 className="text-xl font-bold mb-2">Lead Not Found</h2>
            <p className="text-foreground-600 mb-4">
              The requested lead could not be found or you don&apos;t have permission to edit it.
            </p>
            <Button 
              color="primary"
              onClick={() => router.push("/business/executive/leads/all")}
            >
              Return to Leads List
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Button 
            onClick={() => router.push(`/business/executive/leads/${id}`)}
            variant="light" 
            startContent={<ArrowLeftIcon className="h-4 w-4" />}
          >
            Back to Lead
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Edit Lead</h1>
          <div></div>
        </div>

        {success && (
          <div className="mb-6 bg-success-50 dark:bg-success-900/20 p-4 rounded-lg border border-success text-success-700 dark:text-success-300 flex items-center">
            <CheckCircleIcon className="h-5 w-5 mr-3 text-success" />
            <div>
              <p className="font-semibold">Lead updated successfully!</p>
              <p className="text-sm">Redirecting to lead details...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-danger-50 dark:bg-danger-900/20 p-4 rounded-lg border border-danger text-danger-700 dark:text-danger-300 flex items-center">
            <ExclamationCircleIcon className="h-5 w-5 mr-3 text-danger" />
            <div>
              <p className="font-semibold">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        <Card className="p-6 bg-content1">
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Client Information */}
              <div>
                <h2 className="text-lg font-semibold mb-4 text-foreground flex items-center">
                  <UserCircleIcon className="h-5 w-5 mr-2 text-primary" />
                  Client Information
                </h2>
                <Divider className="mb-4" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    isRequired
                    label="Client Name"
                    name="client_name"
                    placeholder="Enter client name"
                    value={formData.client_name}
                    onChange={handleChange}
                  />
                  
                  <Input
                    isRequired
                    label="Phone Number"
                    type="tel"
                    name="phone_number"
                    startContent={<PhoneIcon className="h-4 w-4 text-default-400" />}
                    placeholder="Enter phone number"
                    value={formData.phone_number}
                    onChange={handleChange}
                  />
                  
                  <Input
                    label="Country"
                    name="country"
                    startContent={<GlobeAltIcon className="h-4 w-4 text-default-400" />}
                    placeholder="Enter country"
                    value={formData.country}
                    onChange={handleChange}
                  />
                  
                  <Input
                    label="State"
                    name="state"
                    startContent={<MapPinIcon className="h-4 w-4 text-default-400" />}
                    placeholder="Enter state"
                    value={formData.state}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Lead Details */}
              <div>
                <h2 className="text-lg font-semibold mb-4 text-foreground flex items-center">
                  <DocumentTextIcon className="h-5 w-5 mr-2 text-primary" />
                  Lead Details
                </h2>
                <Divider className="mb-4" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    isRequired
                    label="Lead Source"
                    placeholder="Select lead source"
                    selectedKeys={formData.lead_source ? [formData.lead_source] : []}
                    onChange={(e) => handleSelectChange("lead_source", e.target.value)}
                  >
                    {leadSources.map((source) => (
                      <SelectItem key={source} value={source}>
                        {source}
                      </SelectItem>
                    ))}
                  </Select>
                  
                  {formData.lead_source === "Other" && (
                    <Input
                      isRequired
                      label="Specify Lead Source"
                      name="other_source"
                      placeholder="Enter lead source"
                      value={formData.other_source}
                      onChange={handleChange}
                    />
                  )}
                  
                  <Select
                    label="Domain/Subject"
                    placeholder="Select domain"
                    selectedKeys={formData.domain ? [formData.domain] : []}
                    onChange={(e) => handleSelectChange("domain", e.target.value)}
                  >
                    {domains.map((domain) => (
                      <SelectItem key={domain} value={domain}>
                        {domain}
                      </SelectItem>
                    ))}
                  </Select>
                  
                  {formData.domain === "Other" && (
                    <Input
                      label="Specify Domain/Subject"
                      name="other_domain"
                      placeholder="Enter domain or subject"
                      value={formData.other_domain}
                      onChange={handleChange}
                    />
                  )}
                  
                  <Select
                    label="Prospect Type"
                    placeholder="Select prospect type"
                    selectedKeys={formData.prospectus_type ? [formData.prospectus_type] : []}
                    onChange={(e) => handleSelectChange("prospectus_type", e.target.value)}
                  >
                    {prospectTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </Select>
                  
                  <Input
                    type="date"
                    label="Follow-up Date"
                    name="followup_date"
                    startContent={<CalendarDaysIcon className="h-4 w-4 text-default-400" />}
                    value={formData.followup_date}
                    onChange={handleChange}
                  />
                </div>
              </div>
              
              {/* Requirements */}
              <div>
                <h2 className="text-lg font-semibold mb-4 text-foreground flex items-center">
                  <DocumentTextIcon className="h-5 w-5 mr-2 text-primary" />
                  Requirements
                </h2>
                <Divider className="mb-4" />
                
                <div className="space-y-4">
                  <Select
                    label="Brief Requirement"
                    placeholder="Select requirement type"
                    selectedKeys={
                      isOtherRequirement 
                        ? ["Other"] 
                        : formData.requirement ? [formData.requirement] : []
                    }
                    onChange={(e) => handleSelectChange("requirement", e.target.value)}
                  >
                    {requirementTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </Select>
                  
                  {isOtherRequirement && (
                    <div className="p-3 border rounded-md bg-default-50">
                      <div className="mb-2 text-sm text-default-600">
                        <p>You selected &quot;Other&quot;. Please specify the requirement:</p>
                      </div>
                      <Input
                        label="Specify Requirement"
                        name="requirement"
                        placeholder="Enter specific requirement"
                        value={formData.requirement !== "Other" ? formData.requirement : ""}
                        onChange={handleChange}
                      />
                    </div>
                  )}
                  
                  <Textarea
                    label="Detailed Requirement"
                    placeholder="Enter detailed client requirements"
                    name="detailed_requirement"
                    value={formData.detailed_requirement}
                    onChange={handleChange}
                    minRows={4}
                  />
                  
                  <Textarea
                    label="Remarks"
                    placeholder="Add any additional remarks"
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleChange}
                    minRows={2}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-divider">
              <Button
                color="danger"
                variant="flat"
                onClick={() => router.push(`/business/executive/leads/${id}`)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                color="primary"
                type="submit"
                isLoading={loading}
                className="px-8"
              >
                {loading ? "Saving Changes..." : "Update Lead"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

// Export with auth HOC wrapper
export default withExecutiveAuth(EditLeadPage);
