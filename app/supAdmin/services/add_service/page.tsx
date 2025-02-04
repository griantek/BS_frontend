'use client'
import React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast, ToastContainer } from 'react-toastify';
import {
  Input,
  Textarea,
  Button,
  Card,
  CardHeader,
  CardBody,
  Divider,
} from "@heroui/react";
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import api, { CreateServiceRequest } from '@/services/api';
import { checkAuth } from '@/utils/authCheck';

// Update FormData interface to match Service type
interface FormData {
  service_name: string;
  service_type: string | null;
  description: string | null;
  fee: number;
  min_duration: string | null;
  max_duration: string | null;
}

export default function AddService() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
    //   api.setAuthToken(token);
    }
  }, [router]);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      await api.createService({
        service_name: data.service_name,
        service_type: data.service_type || null,
        description: data.description || null,
        fee: Number(data.fee),
        min_duration: data.min_duration || null,
        max_duration: data.max_duration || null
      });
      
      toast.success('Service added successfully!');
      setTimeout(() => {
        router.push('/supAdmin/services');
      }, 1500);
    } catch (error) {
      const errorMessage = api.handleError(error);
      toast.error(errorMessage.error || 'Failed to create service');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button
        isIconOnly
        variant="light"
        className="fixed top-4 left-4 z-50"
        onClick={() => router.push('/supAdmin/services')}
      >
        <ArrowLeftIcon className="h-5 w-5" />
      </Button>

      <div className="w-full p-6">
        <ToastContainer />
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <h2 className="text-2xl font-bold">Add New Service</h2>
          </CardHeader>
          <Divider />
          <CardBody>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <Input
                label="Service Name"
                isRequired
                {...register('service_name', { required: 'Service name is required' })}
                isInvalid={!!errors.service_name}
                errorMessage={errors.service_name?.message}
              />

              <Input
                label="Service Type"
                {...register('service_type')}
              />

              <Textarea
                label="Description"
                {...register('description')}
                minRows={3}
              />

              <Input
                type="number"
                label="Fee (₹)"
                isRequired
                {...register('fee', { 
                  required: 'Fee is required',
                  min: { value: 0, message: 'Fee must be positive' }
                })}
                isInvalid={!!errors.fee}
                errorMessage={errors.fee?.message}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Minimum Duration"
                  placeholder="e.g., 3 months"
                  {...register('min_duration')}
                />

                <Input
                  label="Maximum Duration"
                  placeholder="e.g., 12 months"
                  {...register('max_duration')}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="flat"
                  onClick={() => router.back()}
                  isDisabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  color="primary"
                  type="submit"
                  isLoading={isSubmitting}
                >
                  Add Service
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
