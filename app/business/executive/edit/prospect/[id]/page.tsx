'use client'
import React, { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  Input,
  Select,
  SelectItem,
  Textarea,
  Button,
  Card,
  CardHeader,
  CardBody,
  Divider
} from "@heroui/react";
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import api from '@/services/api';
import type { ProspectusCreateRequest, Department } from '@/services/api';
import { checkAuth } from '@/utils/authCheck';
import { withExecutiveAuth } from '@/components/withExecutiveAuth';

// Use the same FormDataType as add_prospect
interface FormDataType {
  clientId: string;
  date: string;
  regId: string;
  clientName: string;
  phone: string;
  clientEmail: string;
  department: string;
  otherDepartment?: string;
  state: string;
  techPerson?: string;
  requirement: string;
  proposedService: string;
  period: string;
  notes: string;
  nextFollowUp: string;
}

function EditProspectContent({ regId }: { regId: string }) {
  const router = useRouter();
  const [userId, setUserId] = React.useState<string>('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [prospectData, setProspectData] = React.useState<any>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    getValues,
    formState: { errors }
  } = useForm<FormDataType>();

  // Get user ID and fetch data
  React.useEffect(() => {
    if (!checkAuth(router)) return;
    
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const userData = JSON.parse(userStr);
      setUserId(userData.id || 'Unknown');
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [departmentsResponse, prospectResponse] = await Promise.all([
          api.getAllDepartments(),
          api.getProspectusByRegId(regId)
        ]);

        setDepartments(departmentsResponse.data);
        setProspectData(prospectResponse.data);

        // Pre-fill form with prospect data
        const data = prospectResponse.data;
        setValue('clientId', data.executive_id);
        setValue('date', format(new Date(data.date), 'yyyy-MM-dd'));
        setValue('regId', data.reg_id);
        setValue('clientName', data.client_name);
        setValue('phone', data.phone);
        setValue('clientEmail', data.email);
        setValue('department', data.department);
        setValue('state', data.state);
        setValue('techPerson', data.tech_person);
        setValue('requirement', data.requirement);
        setValue('proposedService', data.services);
        setValue('period', data.proposed_service_period);
        setValue('notes', data.notes || '');
        setValue('nextFollowUp', data.next_follow_up ? format(new Date(data.next_follow_up), 'yyyy-MM-dd') : '');

      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data');
        router.push('/business/executive');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router, regId, setValue]);

  const selectedDepartment = watch('department') as string;

  const onSubmit = async (data: FormDataType) => {
    if (isSubmitting || !prospectData) return;
    
    try {
      setIsSubmitting(true);
      
      const updateData: Partial<ProspectusCreateRequest> = {
        clientId: userId,
        date: format(new Date(data.date), 'yyyy-MM-dd'),
        clientName: data.clientName.trim(),
        phone: data.phone.trim(),
        clientEmail: data.clientEmail.trim(),
        department: data.department,
        otherDepartment: data.otherDepartment?.trim(),
        state: data.state.trim(),
        techPerson: data.techPerson?.trim() || '',
        requirement: data.requirement.trim(),
        proposedService: data.proposedService.trim(),
        period: data.period.trim(),
        notes: data.notes.trim(),
        nextFollowUp: data.nextFollowUp ? format(new Date(data.nextFollowUp), 'yyyy-MM-dd') : undefined,
      };

      await api.updateProspectus(prospectData.id, updateData);
      toast.success('Prospect updated successfully!');
    router.replace(`/business/executive/view/prospect/${regId}`);
      
    } catch (error: any) {
      setIsSubmitting(false);
      console.error('Update error:', error);
      toast.error('Failed to update prospect');
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (!prospectData) return <div>No data found</div>;

  const sectionHeaderClass = "text-lg font-semibold border-l-4 border-primary pl-2";

  return (
    <>
      <Button
        isIconOnly
        variant="light"
        className="fixed top-4 left-4 z-50"
        onClick={() => router.push('/business/executive')}
      >
        <ArrowLeftIcon className="h-5 w-5" />
      </Button>

      <div className="w-full p-6">
        <ToastContainer />
        <Card className="max-w-4xl mx-auto">
          <CardHeader className="flex gap-3">
            <div className="flex flex-col">
              <h2 className="text-2xl font-bold">Edit Prospect</h2>
            </div>
          </CardHeader>
          <Divider />
          <CardBody>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className={sectionHeaderClass}>Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    type="text"
                    label="Executive ID"
                    value={userId}
                    isDisabled
                  />
                  <Input
                    type="date"
                    label="Date"
                    isRequired
                    {...register('date', { required: 'Date is required' })}
                  />
                </div>
              </div>

              {/* Client Details */}
              <div className="space-y-4">
                <h3 className={sectionHeaderClass}>Client Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    type="text"
                    label="Registration ID"
                    value={getValues('regId')}
                    isDisabled
                  />
                  <Input
                    type="text"
                    label="Client Name"
                    isRequired
                    {...register('clientName', { required: 'Client name is required' })}
                  />
                  <Input
                    type="tel"
                    label="Phone"
                    isRequired
                    {...register('phone', { required: 'Phone is required' })}
                  />
                  <Input
                    type="email"
                    label="Client Email"
                    isRequired
                    {...register('clientEmail', { required: 'Email is required' })}
                  />
                </div>
              </div>

              {/* Technical Details */}
              <div className="space-y-4">
                <h3 className={sectionHeaderClass}>Technical Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <select
                      className="w-full p-2 rounded-lg border border-gray-300"
                      {...register('department')}
                      disabled={isLoading}
                    >
                      <option value="">Select department</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.name}>
                          {dept.name}
                        </option>
                      ))}
                      <option key="other" value="Other">Other</option>
                    </select>
                    
                    {selectedDepartment === 'Other' && (
                      <Input
                        label="Other Department"
                        isRequired
                        {...register('otherDepartment', { required: 'Other department is required' })}
                      />
                    )}
                  </div>
                  <Input
                    label="State"
                    isRequired
                    {...register('state', { required: 'State is required' })}
                  />
                  <Input
                    label="Tech Person"
                    {...register('techPerson')}
                  />
                  <Textarea
                    label="Requirement"
                    isRequired
                    {...register('requirement', { required: 'Requirement is required' })}
                  />
                </div>
              </div>

              {/* Service Details */}
              <div className="space-y-4">
                <h3 className={sectionHeaderClass}>Service Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Proposed Service"
                    isRequired
                    {...register('proposedService')}
                  />
                  <Input
                    label="Period"
                    isRequired
                    {...register('period')}
                  />                
                </div>              
              </div>

              {/* Follow-up Details */}
              <div className="space-y-4">
                <h3 className={sectionHeaderClass}>Follow-up Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Textarea
                    label="Notes"
                    placeholder="Add any additional notes here"
                    {...register('notes')}
                    minRows={3}
                  />
                  <Input
                    type="date"
                    label="Next Follow-up Date"
                    placeholder="Select date"
                    {...register('nextFollowUp')}
                    min={new Date().toISOString().split('T')[0]} // Prevent past dates
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  color="danger"
                  variant="light"
                  onClick={() => router.back()}
                  isDisabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  color="primary" 
                  type="submit"
                  isDisabled={isSubmitting}
                  isLoading={isSubmitting}
                >
                  {isSubmitting ? 'Updating Prospect...' : 'Update Prospect'}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </>
  );
}

interface PageProps {
  params: Promise<{ id: string }>;
}

function EditProspectPage({ params }: PageProps) {
  const resolvedParams = React.use(params);
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EditProspectContent regId={resolvedParams.id} />
    </Suspense>
  );
}

export default withExecutiveAuth(EditProspectPage);
