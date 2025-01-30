'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import api from '../../../services/api';
import { useRouter } from 'next/navigation';
import {
  Input,
  Button,
  Card,
  CardHeader,
  CardBody,
  Divider,
  Select,
  SelectItem
} from "@heroui/react";

// Add mock roles list
const MOCK_ROLES = [
  { value: 'executive', label: 'Business Executive' },
  { value: 'manager', label: 'Business Manager' },
  { value: 'admin', label: 'Administrator' },
  { value: 'supervisor', label: 'Business Supervisor' }
] as const;

interface ExecutiveFormData {
  username: string;
  password: string;
  email: string;
  role: string;
}

export default function CreateExecutive() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ExecutiveFormData>();

  const onSubmit = async (data: ExecutiveFormData) => {
    try {
      // Ensure the data matches the DB schema
      const executiveData = {
        username: data.username.trim(),
        password: data.password,
        email: data.email.trim().toLowerCase(),
        role: data.role?.trim() || 'executive' // Default role if not specified
      };

      console.log('Creating executive with data:', executiveData);
      await api.createExecutive(executiveData);
      
      toast.success('Executive created successfully!');
      setTimeout(() => {
        router.push('/supAdmin/dashboard');
      }, 1500);
    } catch (err) {
      toast.error(api.handleError(err).error || 'Failed to create executive');
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen p-4">
      <ToastContainer />
      <Card className="max-w-3xl mx-auto">
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

            {/* Add Role Selection before the password field */}
            <Select
              label="Role"
              placeholder="Select a role"
              isRequired
              {...register('role', { required: 'Role is required' })}
              isInvalid={!!errors.role}
              errorMessage={errors.role?.message}
            >
              {MOCK_ROLES.map((role) => (
                <SelectItem key={role.value} value={role.value}>
                  {role.label}
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
  );
}
