'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format, parse, isValid } from 'date-fns'
import { Button, Card, Spinner, Divider, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Select, SelectItem, Textarea } from '@heroui/react'
// Remove Badge import
import { 
  ArrowLeftIcon, 
  CalendarDaysIcon, 
  PhoneIcon, 
  MapPinIcon,
  PencilIcon,
  UserIcon,
  ChatBubbleLeftRightIcon,
  CheckIcon,
  ClockIcon,
  ExclamationCircleIcon,
  BellAlertIcon
} from '@heroicons/react/24/outline'
import api, { Lead, UpdateLeadRequest } from '@/services/api'
import { checkAuth } from '@/utils/authCheck'

const LeadDetailPage = () => {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  
  const [lead, setLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Add state for status update
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [updating, setUpdating] = useState(false)
  const [updateSuccess, setUpdateSuccess] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)
  
  // Add state for form fields
  const [formData, setFormData] = useState({
    prospectus_type: '',
    followup_date: '',
    remarks: '',
    needsFollowup: false  // Add new field to track followup status explicitly
  })
  
  // Add list of prospectus types
  const prospectusTypes = [
    "Leads",
    "Not a prospect",
    "Later prospect",
    "Prospect"
  ]

  useEffect(() => {
    checkAuth(router, 'leads')
    if (id) {
      fetchLead(parseInt(id))
    }
  }, [id, router])
  
  // Add effect to initialize form data when lead is loaded
  useEffect(() => {
    if (lead) {
      setFormData({
        prospectus_type: lead.prospectus_type || '',
        followup_date: lead.followup_date || '',
        remarks: lead.remarks || '',
        // Set initial state of needsFollowup based on current followup_status
        needsFollowup: lead.followup_status?.toLowerCase() === 'pending'
      })
    }
  }, [lead])

  const fetchLead = async (leadId: number) => {
    try {
      setLoading(true)
      const response = await api.getLeadById(leadId)
      
      if (response && response.data) {
        setLead(response.data)
      } else {
        setError('Lead not found')
      }
    } catch (err) {
      console.error('Error fetching lead:', err)
      // setError('Failed to load lead details. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return 'N/A'
    
    try {
      // For YYYY-MM-DD format (e.g., "2024-10-12")
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const parsedDate = parse(dateString, 'yyyy-MM-dd', new Date())
        if (isValid(parsedDate)) {
          return format(parsedDate, 'MMMM dd, yyyy')
        }
      }
      
      // For ISO date strings
      const date = new Date(dateString)
      if (isValid(date)) {
        return format(date, 'MMMM dd, yyyy')
      }
      
      return dateString // Return original if parsing fails
    } catch (e) {
      return dateString // Return original on error
    }
  }

  const handleBack = () => {
    router.push('/business/leads')
  }
  
  // Handle form input changes
  const handleChange = (name: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  // Handle status update submission
  const handleUpdateStatus = async () => {
    try {
      setUpdating(true)
      setUpdateError(null)
      setUpdateSuccess(false)
      
      if (!lead) return
      
      // Use the needsFollowup toggle to determine followup_status
      const followupStatus = formData.needsFollowup ? 'pending' : 'completed'
      
      const updateData: UpdateLeadRequest = {
        prospectus_type: formData.prospectus_type,
        followup_date: formData.followup_date,
        remarks: formData.remarks,
        followup_status: followupStatus
      }
      
      // Call the status update API endpoint
      const response = await api.updateLeadStatus(lead.id, updateData)
      
      if (response && response.data) {
        // Update the local lead data with the new values
        setLead({
          ...lead,
          ...response.data
        })
        setUpdateSuccess(true)
        
        // Close the modal after a short delay
        setTimeout(() => {
          onClose()
          setUpdateSuccess(false)
        }, 1500)
      }
    } catch (err) {
      console.error('Error updating lead status:', err)
      setUpdateError('Failed to update lead status. Please try again.')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !lead) {
    return (
      <div className="p-4">
        <Button 
          onClick={handleBack}
          variant="light" 
          startContent={<ArrowLeftIcon className="h-4 w-4" />}
        >
          Back to Leads
        </Button>
        <div className="mt-8 text-center text-danger">
          <h2 className="text-xl font-bold">{error || "Lead not found"}</h2>
          <p className="mt-2">Could not find the requested lead information</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 min-h-screen bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Button 
            onClick={handleBack}
            variant="light" 
            startContent={<ArrowLeftIcon className="h-4 w-4" />}
          >
            Back to Leads
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Lead Details</h1>
          <div></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main info */}
          <Card className="p-6 col-span-2 bg-content1">
            {/* Client header with profile-like display */}
            <div className="flex items-start gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <UserIcon className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">{lead.client_name}</h2>
                <div className="flex items-center mt-2 text-foreground-500">
                  <PhoneIcon className="h-4 w-4 mr-2" />
                  <span>{lead.phone_number || 'No contact number'}</span>
                </div>
                {(lead.country || lead.state) && (
                  <div className="flex items-center mt-2 text-foreground-500">
                    <MapPinIcon className="h-4 w-4 mr-2" />
                    <span>{[lead.state, lead.country].filter(Boolean).join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
          
            <Divider className="my-4" />
            
            {/* Remarks section - removed badge */}
            {lead.remarks && (
              <div className="mb-6 p-4 bg-default-50 dark:bg-default-100/10 rounded-lg border border-divider">
                <div className="flex items-center mb-2">
                  <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2 text-foreground-500" />
                  <h3 className="text-md font-medium text-foreground-600">Remarks</h3>
                </div>
                <p className="text-foreground whitespace-pre-wrap">
                  {lead.remarks}
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-sm font-medium text-foreground-400 mb-1">Domain / Subject</h3>
                <p className="text-foreground text-lg font-medium">{lead.domain || 'Not specified'}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-foreground-400 mb-1">Lead Source</h3>
                <p className="text-foreground text-lg font-medium">{lead.lead_source || 'Not specified'}</p>
              </div>
            </div>
          
            <div className="mb-4">
              <h3 className="text-sm font-medium text-foreground-400 mb-1">Requirements</h3>
              <div className="bg-default-50 dark:bg-default-100/5 p-4 rounded-lg border border-divider mt-2">
                <p className="whitespace-pre-wrap text-foreground">
                  {lead.requirement || 'No requirements specified'}
                </p>
              </div>
            </div>

            {/* Optional: Add detailed requirements if available */}
            {lead.detailed_requirement && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-foreground-400 mb-1">Detailed Requirements</h3>
                <div className="bg-default-50 dark:bg-default-100/5 p-4 rounded-lg border border-divider mt-2">
                  <p className="whitespace-pre-wrap text-foreground">
                    {lead.detailed_requirement}
                  </p>
                </div>
              </div>
            )}
          </Card>

          {/* Side info */}
          <Card className="p-6 h-fit bg-content1">
            <h3 className="text-xl font-medium mb-4 text-foreground">Lead Information</h3>
            
            <div className="space-y-4">
              <div className="bg-default-50 dark:bg-default-100/5 p-3 rounded-lg">
                <h4 className="text-xs font-medium text-foreground-400">Lead ID</h4>
                <p className="text-foreground">{lead.id}</p>
              </div>
              
              <div className="bg-default-50 dark:bg-default-100/5 p-3 rounded-lg">
                <h4 className="text-xs font-medium text-foreground-400">Prospect Type</h4>
                <p className="text-foreground">{lead.prospectus_type || 'Standard'}</p>
              </div>
              
              <div className="bg-default-50 dark:bg-default-100/5 p-3 rounded-lg">
                <h4 className="text-xs font-medium text-foreground-400">Added Date</h4>
                <p className="flex items-center gap-2 text-foreground">
                  <CalendarDaysIcon className="h-4 w-4" />
                  {formatDate(lead.date)}
                </p>
              </div>
              
              <div className="bg-default-50 dark:bg-default-100/5 p-3 rounded-lg">
                <h4 className="text-xs font-medium text-foreground-400">Follow-up Date</h4>
                <p className="flex items-center gap-2 text-foreground">
                  <CalendarDaysIcon className="h-4 w-4" />
                  {formatDate(lead.followup_date) || 'Not scheduled'}
                </p>
              </div>
              
              {lead.assigned_to && (
                <div className="bg-default-50 dark:bg-default-100/5 p-3 rounded-lg">
                  <h4 className="text-xs font-medium text-foreground-400">Assigned To</h4>
                  <p className="text-foreground">{lead.assigned_to}</p>
                </div>
              )}
              
              {/* <div className="bg-default-50 dark:bg-default-100/5 p-3 rounded-lg">
                <h4 className="text-xs font-medium text-foreground-400">Created</h4>
                <p className="text-foreground">{formatDate(lead.created_at)}</p>
              </div> */}
              
              <div className="bg-default-50 dark:bg-default-100/5 p-3 rounded-lg">
                <h4 className="text-xs font-medium text-foreground-400">Last Updated</h4>
                <p className="text-foreground">{formatDate(lead.updated_at)}</p>
              </div>
            </div>

            <Divider className="my-6" />
            
            <div className="flex flex-col gap-2">
              <Button 
                color="primary" 
                startContent={<PencilIcon className="h-4 w-4" />}
                className="w-full"
                onClick={() => {
                  // This will be implemented in future
                  console.log("Edit lead clicked")
                }}
              >
                Edit Lead
              </Button>
              
              {/* Add the Update Status button */}
              <Button 
                color="secondary" 
                startContent={<ClockIcon className="h-4 w-4" />}
                className="w-full"
                onClick={onOpen}
              >
                Update Status
              </Button>
            </div>
          </Card>
        </div>
      </div>
      
      {/* Status Update Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Update Lead Status
              </ModalHeader>
              <ModalBody>
                {updateSuccess ? (
                  <div className="bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-300 p-4 rounded-lg flex items-center gap-2">
                    <CheckIcon className="h-5 w-5" />
                    <span>Lead status updated successfully!</span>
                  </div>
                ) : updateError ? (
                  <div className="bg-danger-50 dark:bg-danger-900/20 text-danger-700 dark:text-danger-300 p-4 rounded-lg flex items-center gap-2">
                    <ExclamationCircleIcon className="h-5 w-5" />
                    <span>{updateError}</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Select
                      label="Prospect Type"
                      selectedKeys={formData.prospectus_type ? [formData.prospectus_type] : []}
                      onChange={(e) => handleChange("prospectus_type", e.target.value)}
                    >
                      {prospectusTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </Select>
                    
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="followup_date" className="text-sm font-medium text-foreground-600">
                        Follow-up Date
                      </label>
                      <input
                        id="followup_date"
                        type="date"
                        value={formData.followup_date}
                        onChange={(e) => handleChange("followup_date", e.target.value)}
                        className="form-input w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-background focus:border-primary focus:outline-none dark:text-white"
                      />
                    </div>
                    
                    {/* Add the followup toggle */}
                    <div className="mt-2 px-1">
                      {/* Replace the problematic checkbox implementation */}
                      <div className="flex items-center">
                        <input 
                          type="checkbox"
                          id="followup-checkbox"
                          checked={formData.needsFollowup}
                          onChange={(e) => handleChange("needsFollowup", e.target.checked)}
                          className="form-checkbox h-5 w-5 text-warning-500 rounded border-gray-300 focus:ring-warning-500"
                        />
                        <label htmlFor="followup-checkbox" className="ml-2 flex items-center cursor-pointer">
                          <BellAlertIcon className="h-4 w-4 text-warning mr-1" />
                          <span className="text-sm font-medium">Remind for followup</span>
                        </label>
                      </div>
                      <p className="text-xs text-foreground-500 mt-1 ml-6">
                        {formData.needsFollowup ? 
                          "This lead will appear in your followup reminders" : 
                          "This lead will be marked as completed"
                        }
                      </p>
                    </div>
                    
                    <Textarea
                      label="Remarks"
                      placeholder="Add any remarks or notes about this lead"
                      value={formData.remarks}
                      onChange={(e) => handleChange("remarks", e.target.value)}
                      minRows={3}
                    />
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button 
                  color="default" 
                  variant="flat" 
                  onPress={onClose}
                  disabled={updating}
                >
                  Close
                </Button>
                <Button 
                  color="primary" 
                  onPress={handleUpdateStatus}
                  isLoading={updating}
                  isDisabled={updateSuccess}
                >
                  {updating ? "Updating..." : "Update Status"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  )
}

// Add the missing InfoIcon component
const InfoIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    {...props}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4" />
    <path d="M12 8h.01" />
  </svg>
)

export default LeadDetailPage;