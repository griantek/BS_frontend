"use client"
import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Spinner } from "@heroui/react";
import { checkAuth } from '@/utils/authCheck';
import { PageLoadingSpinner } from "@/components/LoadingSpinner";
import { currentUserHasPermission, PERMISSIONS, currentUserHasRecordsAccess } from '@/utils/permissions';

export function withExecutiveAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  return function ProtectedRoute(props: P) {
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthenticated, setIsAuthenticated] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
      const verifyAuth = () => {
        const isAuthed = checkAuth(router, 'executive');
        setIsAuthenticated(isAuthed);
        
        if (isAuthed) {
          // Check for dashboard permission when on the executive dashboard route
          const isDashboardRoute = pathname === '/business/executive';
          const hasDashboardPermission = currentUserHasPermission(PERMISSIONS.VIEW_DASHBOARD_EXECUTIVE);
          const hasRecordsAccess = currentUserHasRecordsAccess();
          
          if (isDashboardRoute && !hasDashboardPermission && hasRecordsAccess) {
            // If user doesn't have dashboard permission but has records access, redirect to records
            router.replace('/business/executive/records');
            return;
          }
        }
        
        setIsLoading(false);
      };

      verifyAuth();
    }, [router, pathname]);

    if (isLoading) {
      return <PageLoadingSpinner text="Loading contents..." />;
    }

    if (!isAuthenticated) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };
}
