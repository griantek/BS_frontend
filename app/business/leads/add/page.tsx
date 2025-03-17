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
import { ArrowLeftIcon, CalendarDaysIcon } from "@heroicons/react/24/outline";
import api, { CreateLeadRequest } from "@/services/api";
import { checkAuth } from "@/utils/authCheck";

const AddLeadPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form fields state
  const [formData, setFormData] = useState<Partial<CreateLeadRequest>>({
    lead_source: "",
    client_name: "",
    contact_number: "",
    country: "Indian",
    state: "",
    main_subject: "",
    service: "",
    requirements: "",
    detailed_requirement: "",
    customer_remarks: "",
    followup_date: "",
    prospectus_type: "",
    other_lead_source: "",
    other_main_subject: "",
    assigned_to: "",
    date: new Date().toISOString().split("T")[0], // Changed from registration_date to date
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

  const [services, setServices] = useState<string[]>([
    "Publication",
    "Scopus Publication",
    "Web of Science",
    "Consultation",
    "Thesis Help",
    "Conference",
  ]);

  const [subjects, setSubjects] = useState<string[]>([
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
    "Other", // Added "Other" option
  ]);

  const [prospectTypes, setProspectTypes] = useState<string[]>([
    "Lead",
    "Not a prospect",
    "Later prospect",
    "Prospect",
  ]);

  useEffect(() => {
    checkAuth(router, "leads");
    
    // Get the user ID from localStorage and set it as assigned_to
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setFormData(prev => ({
          ...prev,
          assigned_to: user.id || user.entities?.id || "",
        }));
      }
    } catch (err) {
      console.error("Error getting user from localStorage:", err);
    }
  }, [router]);

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
        "contact_number",
      ];
      
      const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
      
      if (missingFields.length > 0) {
        throw new Error(`Please fill in required fields: ${missingFields.join(", ")}`);
      }

      // Validate other fields if "Other" is selected
      if (formData.lead_source === "Other" && !formData.other_lead_source) {
        throw new Error("Please specify the lead source.");
      }

      if (formData.main_subject === "Other" && !formData.other_main_subject) {
        throw new Error("Please specify the main subject/domain.");
      }

      // Format data for API - use "Other" values if applicable
      const finalLeadSource = formData.lead_source === "Other" 
        ? formData.other_lead_source 
        : formData.lead_source;

      const finalMainSubject = formData.main_subject === "Other"
        ? formData.other_main_subject
        : formData.main_subject;

      const leadData: CreateLeadRequest = {
        lead_source: finalLeadSource!,
        client_name: formData.client_name!,
        contact_number: formData.contact_number!,
        country: formData.country || "Indian",
        state: formData.state || "",
        main_subject: finalMainSubject || "",
        service: formData.service || "",
        requirements: formData.requirements || "",
        detailed_requirement: formData.detailed_requirement || "",
        customer_remarks: formData.customer_remarks || "",
        date: formData.date!, // Use date instead of registration_date
        followup_date: formData.followup_date || "",
        prospectus_type: formData.prospectus_type || "",
        assigned_to: formData.assigned_to || "",
        followup_status: true,
      };

      // Submit to API
      await api.createLead(leadData);
      
      setSuccess(true);
      
      // Reset form after successful submission
      setFormData({
        lead_source: "",
        client_name: "",
        contact_number: "",
        country: "Indian",
        state: "",
        main_subject: "",
        service: "",
        requirements: "",
        detailed_requirement: "",
        customer_remarks: "",
        date: new Date().toISOString().split("T")[0],
        followup_date: "",
        prospectus_type: "",
        other_lead_source: "",
        other_main_subject: "",
      });

      // Navigate back to leads page after short delay
      setTimeout(() => {
        router.push("/business/leads");
      }, 2000);

    } catch (err: any) {
      console.error("Error adding lead:", err);
      setError(err.message || "Failed to add lead. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <Button
          onClick={() => router.push("/business/leads")}
          variant="light"
          startContent={<ArrowLeftIcon className="h-4 w-4" />}
        >
          Back to Leads
        </Button>
        <h1 className="text-2xl font-bold">Add New Lead</h1>
        <div></div>
      </div>

      {success && (
        <div className="mb-6 bg-success/10 p-4 rounded-lg border border-success text-success text-center">
          Lead added successfully! Redirecting to leads list...
        </div>
      )}

      {error && (
        <div className="mb-6 bg-danger/10 p-4 rounded-lg border border-danger text-danger">
          {error}
        </div>
      )}

      <Card className="p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Client Information */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Client Information</h2>
              
              <div className="mb-4">
                <Input
                  isRequired
                  label="Client Name"
                  name="client_name"
                  placeholder="Enter client name"
                  value={formData.client_name}
                  onChange={handleChange}
                />
              </div>
              
              <div className="mb-4">
                <Input
                  isRequired
                  label="Phone Number"
                  type="tel"
                  name="contact_number"
                  placeholder="Enter phone number"
                  value={formData.contact_number}
                  onChange={handleChange}
                />
              </div>
              
              <div className="mb-4">
                <Input
                  label="Country"
                  name="country"
                  placeholder="Enter country"
                  value={formData.country}
                  onChange={handleChange}
                />
              </div>
              
              <div className="mb-4">
                <Input
                  label="State"
                  name="state"
                  placeholder="Enter state"
                  value={formData.state}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Lead Information */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Lead Information</h2>
              
              <div className="mb-4">
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
                
                {/* Show input for other lead source if "Other" is selected */}
                {formData.lead_source === "Other" && (
                  <Input
                    className="mt-2"
                    isRequired
                    label="Specify Lead Source"
                    name="other_lead_source"
                    placeholder="Enter lead source"
                    value={formData.other_lead_source}
                    onChange={handleChange}
                  />
                )}
              </div>
              
              <div className="mb-4">
                <Select
                  label="Main Subject/Domain"
                  placeholder="Select subject"
                  selectedKeys={formData.main_subject ? [formData.main_subject] : []}
                  onChange={(e) => handleSelectChange("main_subject", e.target.value)}
                >
                  {subjects.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </Select>
                
                {/* Show input for other subject if "Other" is selected */}
                {formData.main_subject === "Other" && (
                  <Input
                    className="mt-2"
                    isRequired
                    label="Specify Subject/Domain"
                    name="other_main_subject"
                    placeholder="Enter subject or domain"
                    value={formData.other_main_subject}
                    onChange={handleChange}
                  />
                )}
              </div>
              
              <div className="mb-4">
                <Select
                  label="Service"
                  placeholder="Select service"
                  selectedKeys={formData.service ? [formData.service] : []}
                  onChange={(e) => handleSelectChange("service", e.target.value)}
                >
                  {services.map((service) => (
                    <SelectItem key={service} value={service}>
                      {service}
                    </SelectItem>
                  ))}
                </Select>
              </div>

              <div className="mb-4">
                <Input
                  type="date"
                  label="Follow-up Date"
                  name="followup_date"
                  startContent={<CalendarDaysIcon className="h-4 w-4 text-default-400" />}
                  value={formData.followup_date}
                  onChange={handleChange}
                />
              </div>
              
              <div className="mb-4">
                <Input
                  type="date"
                  label="Date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
          
          <Divider className="my-6" />
          
          {/* Requirements and Remarks */}
          <div className="mb-6">
            <Textarea
              label="Brief Requirements"
              placeholder="Enter brief requirement summary"
              name="requirements"
              value={formData.requirements}
              onChange={handleChange}
              minRows={2}
            />
          </div>
          
          <div className="mb-6">
            <Textarea
              label="Detailed Requirements"
              placeholder="Enter detailed client requirements"
              name="detailed_requirement"
              value={formData.detailed_requirement}
              onChange={handleChange}
              minRows={3}
            />
          </div>
          
          <div className="mb-6">
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
          </div>
          
          <div className="mb-6">
            <Textarea
              label="Remarks"
              placeholder="Add any additional remarks"
              name="customer_remarks"
              value={formData.customer_remarks}
              onChange={handleChange}
              minRows={2}
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button
              color="danger"
              variant="flat"
              onClick={() => router.push("/business/leads")}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              color="primary"
              type="submit"
              isLoading={loading}
            >
              {loading ? "Adding Lead..." : "Add Lead"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default AddLeadPage;
