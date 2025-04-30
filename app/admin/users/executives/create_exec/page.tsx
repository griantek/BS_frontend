"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import api, { Role } from '../../../../../services/api';
import { useRouter } from 'next/navigation';
import {
  Input,
  Button,
  Card,
  CardHeader,
  CardBody,
  Divider,
  Select,
  SelectItem,
  Spinner
} from "@heroui/react";
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

interface ExecutiveFormData {
  username: string;
  password: string;
  email: string;
  role: string;
}

export default function CreateExecutive() {
  const router = useRouter();
  const [roles, setRoles] = React.useState<Role[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedRole, setSelectedRole] = React.useState(new Set<string>([]));
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<ExecutiveFormData>();

  React.useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await api.getAllRoles();
        setRoles(response.data);
      } catch (error) {
        toast.error('Failed to load roles');
        console.error('Error loading roles:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoles();
  }, []);

  const onSubmit = async (data: ExecutiveFormData) => {
    try {
      const executiveData = {
        username: data.username.trim(),
        password: data.password,
        email: data.email.trim().toLowerCase(),
        role: data.role?.trim() || 'executive'
      };
      
      await api.createExecutive(executiveData);
      
      toast.success('Executive created successfully!');
      setTimeout(() => {
        router.push('/admin/users/executives');
      }, 1500);
    } catch (err) {
      toast.error(api.handleError(err).error || 'Failed to create executive');
      console.error(err);
    }
  };

  const handleBack = () => {
    router.push('/admin/users/executives');
  };

  const handleRoleChange = (keys: any) => {
    const selectedKey = Array.from(keys)[0] as string;
    setSelectedRole(new Set([selectedKey]));
    setValue('role', selectedKey); // Update form value
  };

  const renderSelectValue = (role: Role) => {
    return role.name; // Only show role name when selected
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-3xl mx-auto">
        <Button
          variant="light"
          startContent={<ArrowLeftIcon className="w-4 h-4" />}
          onPress={handleBack}
          className="mb-4"
        >
          Back to Executives
        </Button>
        <Card>
          <CardHeader>
            <h2 className="text-2xl font-bold">Create Executive Account</h2>
          </CardHeader>
          <Divider />
          <CardBody>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <Input
                type="text"
                label="Username"
                isRequired
                {...register('username', { required: 'Username is required' })}
                isInvalid={!!errors.username}
                errorMessage={errors.username?.message}
              />

              <Input
                type="email"
                label="Email"
                isRequired
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
                isInvalid={!!errors.email}
                errorMessage={errors.email?.message}
              />

              <Select
                label="Role"
                placeholder="Select a role"
                selectedKeys={selectedRole}
                onSelectionChange={handleRoleChange}
                isRequired
                isInvalid={!!errors.role}
                errorMessage={errors.role?.message}
                classNames={{
                    value: "truncate"
                }}
                renderValue={(items) => {
                    const foundRole = roles.find(role => role.id.toString() === Array.from(selectedRole)[0]);
                    return foundRole ? renderSelectValue(foundRole) : null;
                }}
              >
                {roles.map((role) => (
                  <SelectItem key={role.id.toString()} value={role.id.toString()}>
                    {role.name} ({role.entity_type})
                  </SelectItem>
                ))}
              </Select>

              <Input
                type="password"
                label="Password"
                isRequired
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters'
                  }
                })}
                isInvalid={!!errors.password}
                errorMessage={errors.password?.message}
              />

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="flat"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button
                  color="primary"
                  type="submit"
                >
                  Create Executive
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
      <ToastContainer />
    </div>
  );
}
