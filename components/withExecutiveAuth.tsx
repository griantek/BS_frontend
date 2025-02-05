'use client'
import React from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from "@heroui/react";
import { checkAuth } from '@/utils/authCheck';

export function withExecutiveAuth<P extends object>(  // Renamed from withExecutiveAuth
  WrappedComponent: React.ComponentType<P>
) {
  return function ProtectedRoute(props: P) {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
      const verifyAuth = () => {
        const isAuthed = checkAuth(router, 'executive');  // Changed from 'admin'
        setIsAuthenticated(isAuthed);
        setIsLoading(false);
      };

      verifyAuth();
    }, [router]);

    if (isLoading) {
      return (
        <div className="flex justify-center items-center min-h-screen">
          <Spinner size="lg" />
        </div>
      );
    }

    if (!isAuthenticated) {
      return null; // Return null as the checkAuth will handle the redirect
    }

    return <WrappedComponent {...props} />;
  };
}
