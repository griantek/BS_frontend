"use client"
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardBody, Input, Button, Divider, Link, Spinner } from "@nextui-org/react";
import { EyeIcon, EyeSlashIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import api from '@/services/api';

export default function ClientLoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({ email: '', password: '' });

  const toggleVisibility = () => setIsVisible(!isVisible);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear errors when user types
    if (errors[name as keyof typeof errors]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validateForm = () => {
    const newErrors = { email: '', password: '' };
    let isValid = true;

    if (!formData.email) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setIsLoading(true);
      
      // Call the client login API endpoint
      const response = await api.clientLogin(formData.email, formData.password);
      
      if (response.success && response.data) {
        toast.success('Login successful');
        
        // Store token and user data
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.client));
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userRole', 'clients');
        
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
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-background to-background/60 flex items-center justify-center p-4">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl opacity-50"></div>
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl opacity-50"></div>
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]"></div>
      </div>
      
      <Button
        isIconOnly
        variant="light"
        className="fixed top-4 left-4 z-50"
        onClick={() => router.push('/')}
      >
        <ArrowLeftIcon className="h-5 w-5" />
      </Button>

      <div className="relative z-10 w-full max-w-md mx-auto">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="backdrop-filter backdrop-blur-sm bg-background/70 border border-white/10 shadow-xl">
            <CardBody className="p-6 sm:p-8 flex flex-col items-center">
              {/* Logo */}
              <div className="mb-6 flex justify-center">
                <div className="relative w-16 h-16 flex items-center justify-center">
                  <div className="absolute inset-0 bg-primary/15 rounded-2xl filter blur-xl animate-pulse-slow"></div>
                  <Image
                    src="/logo.png"
                    alt="Griantek Logo"
                    width={56}
                    height={56}
                    className="drop-shadow-glow object-contain"
                    priority
                  />
                </div>
              </div>
              
              <h1 className="text-2xl font-bold text-center mb-1">Client Portal</h1>
              <p className="text-default-500 text-center text-sm mb-6">
                Access your account to manage your projects
              </p>
              
              <form className="w-full space-y-4" onSubmit={handleSubmit}>
                <Input
                  label="Email"
                  placeholder="Enter your email"
                  type="email"
                  name="email"
                  size="lg"
                  value={formData.email}
                  onChange={handleInputChange}
                  isInvalid={!!errors.email}
                  errorMessage={errors.email}
                  className="mb-4"
                />
                
                <Input
                  label="Password"
                  placeholder="Enter your password"
                  name="password"
                  size="lg"
                  value={formData.password}
                  onChange={handleInputChange}
                  isInvalid={!!errors.password}
                  errorMessage={errors.password}
                  endContent={
                    <button 
                      className="focus:outline-none" 
                      type="button" 
                      onClick={toggleVisibility}
                    >
                      {isVisible ? (
                        <EyeSlashIcon className="h-4 w-4 text-default-400" />
                      ) : (
                        <EyeIcon className="h-4 w-4 text-default-400" />
                      )}
                    </button>
                  }
                  type={isVisible ? "text" : "password"}
                />
                
                <div className="flex justify-end">
                  <Link 
                    href="/business/clients/forgot-password" 
                    size="sm" 
                    className="text-primary"
                  >
                    Forgot password?
                  </Link>
                </div>
                
                <Button 
                  color="primary" 
                  className="w-full font-medium"
                  type="submit"
                  size="lg"
                  isDisabled={isLoading}
                  isLoading={isLoading}
                  spinner={<Spinner size="sm" color="white" />}
                >
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </form>
              
              <Divider className="my-6" />
              
              <p className="text-default-500 text-center text-sm">
                Don&apos;t have an account? Please contact your executive for access.
              </p>
            </CardBody>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
