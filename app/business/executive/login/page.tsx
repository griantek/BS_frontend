"use client";
import React, { Suspense } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Input,
  Button,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Divider,
  Spinner,
} from "@heroui/react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";
import { HeartFilledIcon } from '@/components/icons';
import api from '@/services/api';
import { redirectToDashboard, isLoggedIn } from '@/utils/authCheck';

interface LoginFormData {
  username: string;
  password: string;
}

function BusinessLoginContent() {
  const [isVisible, setIsVisible] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    if (isLoggedIn()) {
      redirectToDashboard(router);
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
      document.body.style.cursor = 'wait';
      const response = await api.loginExecutive({
        username: data.username,
        password: data.password
      });

      if (!response.success) {
        toast.error('Login failed');
        return;
      }

      console.log('Login response:', response);

      // Get the entity data from the new response structure
      const entityData = response.entities;
      
      // Convert entity_type to lowercase for consistency
      const entityType = entityData.entity_type.toLowerCase();
      const userRole = entityData.role.name.toLowerCase();

      // Store auth data including role information and permissions
      api.setStoredAuth(
        response.token, 
        {
          ...entityData,
          role: entityData.role,
          permissions: entityData.role.permissions, // Store permissions for RBAC
          entity_type: entityType
        }, 
        entityType as 'editor' | 'executive'
      );

      // Route based on entity_type
      if (entityType === 'editor') {
        await router.replace('/business/editor');
      } else {
        await router.replace('/business/executive');
      }

    } catch (error) {
      const errorMessage = api.handleError(error);
      toast.error(errorMessage.error || 'Invalid credentials');
    } finally {
      setIsLoading(false);
      document.body.style.cursor = 'default';
    }
  };

  return (
    <div className=" flex items-center justify-center bg-gradient-to-br p-4">
      <ToastContainer />
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col gap-3 items-center pt-8 pb-4">
          <div className="rounded-full bg-primary/10 p-4 shadow-lg">
            <HeartFilledIcon size={48} className="text-primary" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold">Business Development Login</h1>
            <p className="text-sm text-default-500 mt-1">Please enter your credentials to continue</p>
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
                <button type="button" onClick={toggleVisibility} className="focus:outline-none">
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

export default function BusinessLogin() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BusinessLoginContent />
    </Suspense>
  );
}