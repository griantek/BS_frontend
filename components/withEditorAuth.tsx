'use client'
import React from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from "@heroui/react";
import { checkAuth } from '@/utils/authCheck';
import { PageLoadingSpinner } from "@/components/LoadingSpinner";

export function withEditorAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  return function ProtectedRoute(props: P) {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
      const verifyAuth = () => {
        const isAuthed = checkAuth(router, 'editor');
        setIsAuthenticated(isAuthed);
        setIsLoading(false);
      };

      verifyAuth();
    }, [router]);

    if (isLoading) {
      return <PageLoadingSpinner text="Loading contents..." />;
    }

    if (!isAuthenticated) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };
}
