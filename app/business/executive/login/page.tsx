"use client";
import React, { Suspense } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import Image from "next/image";
import "react-toastify/dist/ReactToastify.css";
import {
  Input,
  Button,
  Card,
  CardBody,
  Spinner,
} from "@heroui/react";
import { EyeIcon, EyeSlashIcon, UserGroupIcon } from "@heroicons/react/24/solid";
import api from '@/services/api';
import { redirectToDashboard, isLoggedIn } from '@/utils/authCheck';
import { motion } from "framer-motion";

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

      // Get the entity data from the response
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
          permissions: entityData.role.permissions,
          entity_type: entityType
        }, 
        entityType as 'editor' | 'executive' | 'leads' | 'clients'
      );

      // Route based on entity_type
      switch(entityType) {
        case 'editor':
          await router.replace('/business/editor');
          break;
        case 'executive':
          await router.replace('/business/executive');
          break;
        case 'leads':
          await router.replace('/business/leads');
          break;
        case 'clients':
          await router.replace('/business/clients');
          break;
        default:
          // Fallback to executive dashboard
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
    <div className="h-[calc(100vh-64px)] w-full flex flex-col items-center justify-center bg-gradient-to-br from-background to-background/90 p-4 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 right-1/3 w-[400px] h-[400px] rounded-full bg-secondary/5 blur-3xl"></div>
        <div className="absolute bottom-0 left-1/3 w-[500px] h-[500px] rounded-full bg-secondary/10 blur-3xl"></div>
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]"></div>
      </div>

      <ToastContainer />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-full max-w-md z-10"
      >
        <Card className="bg-background/70 backdrop-blur-lg border border-secondary/10 shadow-xl shadow-secondary/5">
          <CardBody className="px-6 py-8">
            <div className="flex justify-center mb-6">
              <div className="p-3 rounded-full bg-gradient-to-br from-secondary/20 to-secondary/5">
                <UserGroupIcon className="w-8 h-8 text-secondary" />
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <h1 className="text-3xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-secondary to-secondary-600">
          Business Portal
        </h1>
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
                  <button type="button" onClick={toggleVisibility} className="focus:outline-none p-1">
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
                color="secondary"
                className="w-full font-medium"
                size="lg"
                variant="shadow"
                isLoading={isLoading}
                spinner={<Spinner color="current" size="sm" />}
                disabled={isLoading}
              >
                {isLoading ? 'Authenticating...' : 'Sign In'}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-xs text-default-500">
                Business Operations & Management Access
              </p>
            </div>
          </CardBody>
        </Card>
      </motion.div>
    </div>
  );
}

export default function BusinessLogin() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <Spinner size="lg" color="secondary" />
      </div>
    }>
      <BusinessLoginContent />
    </Suspense>
  );
}