"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import api, { CreateLeadRequest } from "@/services/api";
// Remove manual auth check since we'll use HOC
// import { checkAuth } from "@/utils/authCheck";
import { withLeadsAuth } from "@/components/withLeadsAuth";

const AddLeadPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form fields state - updated field names to match DB schema and removed service
  const [formData, setFormData] = useState<Partial<CreateLeadRequest>>({
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
    assigned_to: "",
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
    "Lead",
    "Not a prospect",
    "Later prospect",
    "Prospect",
  ]);

  useEffect(() => {
    // Remove manual auth check since we're using the HOC
    // checkAuth(router, 'leads');
    
    // Get the user ID from localStorage and set it as assigned_to
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setFormData(prev => ({
          ...prev,
          assigned_to: user.id || user.entities?.id || "",
          created_by: user.id || user.entities?.id || "",
        }));
      }
    } catch (err) {
      console.error("Error getting user from localStorage:", err);
    }
  }, []);

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

      // Format data for API with corrected field names, removed service field
      const leadData: CreateLeadRequest = {
        lead_source: leadSourceValue!,
        client_name: formData.client_name!,
        phone_number: formData.phone_number!,
        country: formData.country || "Indian",
        state: formData.state || "",
        domain: domainValue || "",
        requirement: formData.requirement || "",
        detailed_requirement: formData.detailed_requirement || "",
        remarks: formData.remarks || "",
        followup_date: formData.followup_date || "",
        prospectus_type: formData.prospectus_type || "",
        assigned_to: formData.assigned_to || "",
        created_by: formData.created_by || "",
        followup_status: "pending",
        attended: false,
      };

      // Submit to API
      await api.createLead(leadData);
      
      setSuccess(true);
      
      // Reset form after successful submission
      setFormData({
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
        other_source: "",
        other_domain: "",
      });

      // Navigate back to leads page after short delay
      setTimeout(() => {
        router.push("/business/conversion/leads/all");  // Redirect to all leads page for consistency
      }, 2000);

    } catch (err: any) {
      console.error("Error adding lead:", err);
      setError(err.message || "Failed to add lead. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Button 
            onClick={() => router.push("/business/conversion/leads/all")}  // Update to redirect to all leads page
            variant="light" 
            startContent={<ArrowLeftIcon className="h-4 w-4" />}
          >
            Back to Leads
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Add New Lead</h1>
          <div></div>
        </div>

        {success && (
          <div className="mb-6 bg-success-50 dark:bg-success-900/20 p-4 rounded-lg border border-success text-success-700 dark:text-success-300 flex items-center">
            <CheckCircleIcon className="h-5 w-5 mr-3 text-success" />
            <div>
              <p className="font-semibold">Lead added successfully!</p>
              <p className="text-sm">Redirecting to leads list...</p>
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
                  <Textarea
                    label="Brief Requirement"
                    placeholder="Enter brief requirement summary"
                    name="requirement"
                    value={formData.requirement}
                    onChange={handleChange}
                    minRows={2}
                  />
                  
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
                onClick={() => router.push("/business/conversion/leads/all")}  // Update to redirect to all leads page
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
                {loading ? "Adding Lead..." : "Add Lead"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

// Export with auth HOC wrapper
export default withLeadsAuth(AddLeadPage);
