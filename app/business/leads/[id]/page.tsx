'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format, parse, isValid } from 'date-fns'
import { Button, Card, Spinner, Badge, Divider } from '@heroui/react'
import { ArrowLeftIcon, CalendarDaysIcon, PhoneIcon, MapPinIcon } from '@heroicons/react/24/outline'
import api, { Lead } from '@/services/api'
import { checkAuth } from '@/utils/authCheck'

const LeadDetailPage = () => {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  
  const [lead, setLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkAuth(router, 'leads')
    if (id) {
      fetchLead(parseInt(id))
    }
  }, [id, router])

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
      setError('Failed to load lead details. Please try again later.')
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

  // Helper function to determine badge color based on status
  const getBadgeColor = (status: string): "default" | "primary" | "secondary" | "success" | "warning" | "danger" => {
    if (!status) return 'default';
    
    const lowerStatus = status.toLowerCase();
    
    if (lowerStatus.includes('no reply') || 
        lowerStatus.includes('no response') || 
        lowerStatus.includes('not interested')) {
      return 'danger';
    }
    
    if (lowerStatus.includes('register') || 
        lowerStatus.includes('confirmed')) {
      return 'success';
    }
    
    if (lowerStatus.includes('paid') || 
        lowerStatus.includes('payment')) {
      return 'warning';
    }
    
    if (lowerStatus.includes('followup') || 
        lowerStatus.includes('follow up') || 
        lowerStatus.includes('pending')) {
      return 'primary';
    }
    
    return 'default';
  }

  const handleBack = () => {
    router.push('/business/leads')
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
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <Button 
          onClick={handleBack}
          variant="light" 
          startContent={<ArrowLeftIcon className="h-4 w-4" />}
        >
          Back to Leads
        </Button>
        <h1 className="text-2xl font-bold">Lead Details</h1>
        <div className="flex items-center gap-2">
          <Badge 
            color={getBadgeColor(lead.customer_remarks || '')}
            size="lg"
            variant="flat"
          >
            {lead.customer_remarks || 'No remarks'}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <Card className="p-6 col-span-2">
          <div className="mb-4">
            <h2 className="text-2xl font-bold">{lead.client_name }</h2>
            <div className="flex items-center mt-2 text-default-500">
              <PhoneIcon className="h-4 w-4 mr-2" />
              <span>{lead.phone_number || 'No contact number'}</span>
            </div>
            {(lead.country || lead.state) && (
              <div className="flex items-center mt-2 text-default-500">
                <MapPinIcon className="h-4 w-4 mr-2" />
                <span>{[lead.state, lead.country].filter(Boolean).join(', ')}</span>
              </div>
            )}
          </div>
          
          <Divider className="my-4" />
          
          <div className="mb-4">
            <h3 className="font-medium text-default-500">Domain / Subject</h3>
            <p className="text-lg">{lead.domain || lead.main_subject || 'Not specified'}</p>
          </div>
          
          <div className="mb-4">
            <h3 className="font-medium text-default-500">Service</h3>
            <p className="text-lg">{lead.service || 'Not specified'}</p>
          </div>
          
          <div className="mb-4">
            <h3 className="font-medium text-default-500">Requirements</h3>
            <p className="whitespace-pre-wrap">
              {lead.requirement || 'No requirements specified'}
            </p>
          </div>
        </Card>

        {/* Side info */}
        <Card className="p-6 h-fit">
          <h3 className="text-xl font-medium mb-4">Lead Information</h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-default-500">Lead ID</h4>
              <p>{lead.id}</p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-default-500">Lead Source</h4>
              <p>{lead.lead_source || 'Not specified'}</p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-default-500">Prospect Type</h4>
              <p>{lead.prospectus_type || 'Standard'}</p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-default-500">Registration Date</h4>
              <p className="flex items-center gap-2">
                <CalendarDaysIcon className="h-4 w-4" />
                {formatDate(lead.date)}
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-default-500">Follow-up Date</h4>
              <p className="flex items-center gap-2">
                <CalendarDaysIcon className="h-4 w-4" />
                {formatDate(lead.followup_date) || 'Not scheduled'}
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-default-500">Created At</h4>
              <p>{formatDate(lead.created_at)}</p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-default-500">Updated At</h4>
              <p>{formatDate(lead.updated_at)}</p>
            </div>
            
            {lead.assigned_to && (
              <div>
                <h4 className="text-sm font-medium text-default-500">Assigned To</h4>
                <p>{lead.assigned_to}</p>
              </div>
            )}
          </div>

          <Divider className="my-4" />
          
          <div className="flex gap-2 mt-4">
            <Button 
              color="primary" 
              onClick={() => {
                // This will be implemented in future
                console.log("Edit lead clicked")
              }}
            >
              Edit Lead
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default LeadDetailPage
