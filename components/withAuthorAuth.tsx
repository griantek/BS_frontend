"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageLoadingSpinner } from '@/components/LoadingSpinner';
import api from '@/services/api';

// Higher Order Component for Author-specific authenticated pages
const withAuthorAuth = (Component: React.ComponentType<any>) => {
  const AuthWrapper = (props: any) => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
      const checkAuth = async () => {
        try {
          // Get token from storage
          const token = api.getStoredToken();
          
          // Get user role
          const userRole = localStorage.getItem('userRole');
          
          if (!token || userRole !== 'author') {
            // Redirect to login if not authenticated or not an author
            router.push('/business/executive/login');
            return;
          }
          
          // User is authenticated and is an author
          setIsAuthorized(true);
        } catch (error) {
          console.error('Auth check error:', error);
          router.push('/business/executive/login');
        } finally {
          setIsLoading(false);
        }
      };

      checkAuth();
    }, [router]);

    if (isLoading) {
      return <PageLoadingSpinner text="Checking authentication..." />;
    }

    if (!isAuthorized) {
      return null; // Will be redirected by the useEffect
    }

    return <Component {...props} />;
  };

  return AuthWrapper;
};

export default withAuthorAuth;
