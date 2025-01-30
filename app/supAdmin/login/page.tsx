'use client'
import React from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { toast, ToastContainer } from 'react-toastify';
import {
  Input,
  Button,
  Card,
  CardHeader,
  CardBody,
  Divider,
} from "@heroui/react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";
import { HeartFilledIcon } from '@/components/icons';
import api from '@/services/api';

interface LoginFormData {
  username: string;
  password: string;
}

export default function SupAdminLogin() {
  const [isVisible, setIsVisible] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    api.clearStoredAuth();
    const token = api.getStoredToken();
    const userRole = localStorage.getItem('userRole');
    
    if (token) {
      window.location.href = userRole === 'supAdmin' ? '/supAdmin' : '/business';
    }
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormData>();

  const toggleVisibility = () => setIsVisible(!isVisible);

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      // Hardcoded credential check
      if (data.username === 'griantekAdmin' && data.password === 'gtk1234') {
        // Mock successful login
        const mockResponse = {
          token: 'mock-token-123',
          user: { username: 'griantekAdmin', role: 'supAdmin' }
        };
        
        api.setStoredAuth(mockResponse.token, mockResponse.user);
        api.setAuthToken(mockResponse.token);
        localStorage.setItem('userRole', 'supAdmin');

        toast.success('Login successful!');
        setTimeout(() => window.location.href = '/supAdmin', 1500);
        return;
      }

      // If credentials don't match, show error
      toast.error('Invalid credentials');
    } catch (error) {
      const errorMessage = api.handleError(error);
      toast.error(errorMessage.error || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center bg-gradient-to-br p-4">
      <ToastContainer />
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col gap-3 items-center pt-8 pb-4">
          <div className="rounded-full bg-primary/10 p-4 shadow-lg">
            <HeartFilledIcon size={48} className="text-primary" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold">Super Admin Login</h1>
            <p className="text-sm text-default-500 mt-1">
              Access the super admin dashboard
            </p>
          </div>
        </CardHeader>
        <Divider/>
        <CardBody>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Input
              label="Username"
              placeholder="Enter your username"
              {...register('username', { required: 'Username is required' })}
              isInvalid={!!errors.username}
              errorMessage={errors.username?.message}
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              type={isVisible ? "text" : "password"}
              {...register('password', { required: 'Password is required' })}
              isInvalid={!!errors.password}
              errorMessage={errors.password?.message}
              endContent={
                <button type="button" onClick={toggleVisibility}>
                  {isVisible ? (
                    <EyeSlashIcon className="w-4 h-4 text-default-500" />
                  ) : (
                    <EyeIcon className="w-4 h-4 text-default-500" />
                  )}
                </button>
              }
            />

            <Button
              type="submit"
              color="primary"
              className="w-full"
              size="lg"
              isLoading={isLoading}
            >
              Sign In
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
