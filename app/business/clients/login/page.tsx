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
import { EyeIcon, EyeSlashIcon, UserIcon } from "@heroicons/react/24/solid";
import api from '@/services/api';
import { redirectToDashboard, isLoggedIn } from '@/utils/authCheck';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from "framer-motion";

interface LoginFormData {
  email: string;
  password: string;
}

function ClientLoginContent() {
  const [isVisible, setIsVisible] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const router = useRouter();
  const { updateAuthState } = useAuth();

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
      
      // Call the client login API endpoint
      const response = await api.clientLogin(data.email, data.password);
      
      if (response.success && response.token) {
        toast.success('Login successful');
        
        // Store auth data using the standard pattern from other logins
        api.setStoredAuth(
          response.token, 
          response.data, // This is the client object
          'clients' // Use 'clients' as the role
        );
        
        // Update auth context
        updateAuthState();
        
        // Navigate to the client dashboard
        router.push('/business/clients');
      } else {
        toast.error('Invalid credentials');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.error || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
      document.body.style.cursor = 'default';
    }
  };

  return (
    <div className="h-[calc(100vh-64px)] w-full flex flex-col items-center justify-center bg-gradient-to-br from-background to-background/90 p-4 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 right-1/3 w-[400px] h-[400px] rounded-full bg-success/5 blur-3xl"></div>
        <div className="absolute bottom-0 left-1/3 w-[500px] h-[500px] rounded-full bg-success/10 blur-3xl"></div>
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]"></div>
      </div>

      <ToastContainer />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-full max-w-md z-10"
      >
        <Card className="bg-background/70 backdrop-blur-lg border border-success/10 shadow-xl shadow-success/5">
          <CardBody className="px-6 py-8">
            <div className="flex justify-center mb-6">
              <div className="p-3 rounded-full bg-gradient-to-br from-success/20 to-success/5">
                <UserIcon className="w-8 h-8 text-success" />
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <h1 className="text-3xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-success to-success-600">
                Journal Portal
              </h1>
              <Input
                label="Email"
                placeholder="Enter your email"
                {...register('email', { 
                  required: 'Email is required',
                  pattern: {
                    value: /\S+@\S+\.\S+/,
                    message: 'Email is invalid'
                  }
                })}
                isInvalid={!!errors.email}
                errorMessage={errors.email?.message}
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
                color="success"
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
                Journal Management & Submission Access
              </p>
            </div>
          </CardBody>
        </Card>
      </motion.div>
    </div>
  );
}

export default function ClientLogin() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <Spinner size="lg" color="success" />
      </div>
    }>
      <ClientLoginContent />
    </Suspense>
  );
}
