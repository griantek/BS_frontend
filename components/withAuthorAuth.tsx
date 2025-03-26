"use client";
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Spinner } from '@heroui/react';
import { checkAuth } from '@/utils/authCheck';

// Higher Order Component for Author-specific authenticated pages
export default function withAuthorAuth<P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> {
  return function AuthorProtectedComponent(props: P) {
    const router = useRouter();
    const { isLoggedIn, isAuthor } = useAuth();
    const [loading, setLoading] = React.useState(true);

    useEffect(() => {
      const checkAuthentication = () => {
        // Use the checkAuth utility to verify author role access
        if (!checkAuth(router, 'author')) {
          return;
        }
        setLoading(false);
      };

      checkAuthentication();
    }, [router, isLoggedIn, isAuthor]);

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <Spinner size="lg" color="secondary" />
        </div>
      );
    }

    // Render the component once authentication is confirmed
    return <Component {...props} />;
  };
}
