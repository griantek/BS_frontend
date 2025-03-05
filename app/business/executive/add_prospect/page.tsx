'use client'
import React from 'react';
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

function AddProspect() {
  const router = useRouter();
  const [userId, setUserId] = React.useState<string>('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [isLoadingDepartments, setIsLoadingDepartments] = React.useState(true);

  React.useEffect(() => {
    if (!checkAuth(router)) return;
    
    // Get user data from localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const userData = JSON.parse(userStr);
      setUserId(userData.id || 'Unknown');
    }
  }, [router]);

  React.useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setIsLoadingDepartments(true);
        const response = await api.getAllDepartments();
        setDepartments(response.data);
      } catch (error) {
        console.error('Error fetching departments:', error);
        toast.error('Failed to load departments');
      } finally {
        setIsLoadingDepartments(false);
      }
    };

    fetchDepartments();
  }, []);

  const generateRegId = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `REG${year}${month}${day}${hours}${minutes}`;
  };

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    getValues,
    formState: { errors }
  } = useForm<FormDataType>({
    defaultValues: {
      clientId: userId || 'Loading...', // Use userId here
      date: format(new Date(), 'yyyy-MM-dd'),
      regId: generateRegId(),
      clientName: '',
      phone: '',
      clientEmail: '',
      department: '',
      otherDepartment: '',
      state: '',
      techPerson: '',
      requirement: '',
      proposedService: '',
      period: '',
      notes: '',
      nextFollowUp: '', // Will be filled with current date in the form
    },
    mode: 'onSubmit',
    reValidateMode: 'onChange'
  });

  // Update form value when userId changes
  React.useEffect(() => {
    if (userId) {
      // Update the clientId field when userId is available
      const values = getValues();
      if (values.clientId === 'Loading...') {
        register('clientId', { value: userId });
      }
    }
  }, [userId, register, getValues]);

  const selectedDepartment = watch('department') as string;

  const checkEmptyFields = () => {
    const values = getValues();
    return Object.entries(values).some(([key, value]) => {
      if (key === 'otherDepartment') {
        return selectedDepartment === 'Other' && !value;
      }
      return !value;
    });
  };

  const onSubmit = async (data: FormDataType) => {
    if (isSubmitting) return; // Prevent duplicate submissions
    
    const isValid = await trigger();
    if (!isValid) return;

    try {
      setIsSubmitting(true); // Start submission
      
      const prospectusData: ProspectusCreateRequest = {
        ...data,
        regId: generateRegId(),
        clientId: userId, // Use the userId here
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

      // Log request data for debugging
      console.log('Sending request with data:', prospectusData);
      
      await api.createProspectus(prospectusData);
      toast.success('Prospect added successfully!');
      router.replace('/business/executive'); // Immediate routing after success
      
    } catch (error: any) {
      setIsSubmitting(false); // Reset submission state on error
      console.error('Submission error details:', error.response?.data || error);
      const errorMessage = api.handleError(error);
      toast.error(errorMessage.error, {
        position: "top-center",
        autoClose: 3000,
      });
    }
  };

  const sectionHeaderClass = "text-lg font-semibold border-l-4 border-primary pl-2";

  return (
    <>
      {/* Back button */}
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
              <h2 className="text-2xl font-bold">Add New Prospect</h2>
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
                    // isInvalid={!!errors.date}
                    // errorMessage={errors.date?.message}
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
                    // isInvalid={!!errors.clientName}
                    // errorMessage={errors.clientName?.message}
                  />
                  <Input
                    type="tel"
                    label="Phone"
                    isRequired
                    {...register('phone', { required: 'Phone is required' })}
                    // isInvalid={!!errors.phone}
                    // errorMessage={errors.phone?.message}
                  />
                  <Input
                    type="email"
                    label="Client Email"
                    isRequired
                    {...register('clientEmail', { required: 'Email is required' })}
                    // isInvalid={!!errors.clientEmail}
                    // errorMessage={errors.clientEmail?.message}
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
                      disabled={isLoadingDepartments}
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
                        // isInvalid={!!errors.otherDepartment}
                        // errorMessage={errors.otherDepartment?.message}
                      />
                    )}
                  </div>
                  <Input
                    label="State"
                    isRequired
                    {...register('state', { required: 'State is required' })}
                    // isInvalid={!!errors.state}
                    // errorMessage={errors.state?.message}
                  />
                  <Input
                    label="Tech Person"
                    {...register('techPerson')}
                  />
                  <Textarea
                    label="Requirement"
                    isRequired
                    {...register('requirement', { required: 'Requirement is required' })}
                    // isInvalid={!!errors.requirement}
                    // errorMessage={errors.requirement?.message}
                    // minRows={2}
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
                  {isSubmitting ? 'Adding Prospect...' : 'Add Prospect'}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </>
  );
}

export default withExecutiveAuth(AddProspect);
