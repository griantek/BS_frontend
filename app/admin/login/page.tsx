"use client"
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
  Spinner,
} from "@heroui/react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";
import { HeartFilledIcon } from '@/components/icons';
import api from '@/services/api';
import { redirectToDashboard, isLoggedIn, getUserRole } from '@/utils/authCheck';
import { useAuth } from '@/contexts/AuthContext';

interface LoginFormData {
  username: string;
  password: string;
}

export default function AdminLogin() {
  const [isVisible, setIsVisible] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const router = useRouter();
  const { updateAuthState } = useAuth();

  React.useEffect(() => {
    // Check if user is already logged in
    if (isLoggedIn()) {
      const userRole = getUserRole();
      if (userRole === 'admin') {
        router.replace('/admin');
      } else {
        router.replace('/business');
      }
    }
  }, [router]);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormData>();

  const toggleVisibility = () => setIsVisible(!isVisible);

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const response = await api.loginAdmin(data);
      if (response.success && response.token && response.admin) {
        api.setStoredAuth(response.token, response.admin, 'admin');
        updateAuthState();
        document.body.style.cursor = 'wait';
        await router.replace('/admin');
      }
    } catch (error: any) {
      // Directly use the error message from the response
      const errorMsg = error.response?.data?.error || 'Failed to login';
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
      document.body.style.cursor = 'default';
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
              spinner={<Spinner color="current" size="sm" />}
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
