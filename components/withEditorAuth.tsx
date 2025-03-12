"use client"
import React from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from "@heroui/react";
import { checkAuth } from '@/utils/authCheck';
import { PageLoadingSpinner } from "@/components/LoadingSpinner";
import { currentUserHasPermission, PERMISSIONS } from '@/utils/permissions';

export function withEditorAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requiredPermission?: string
) {
  return function ProtectedRoute(props: P) {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = React.useState(false);
    const [hasPermission, setHasPermission] = React.useState(true);
    const [isLoading, setIsLoading] = React.useState(true);
    
    React.useEffect(() => {
      const verifyAuth = async () => {
        const isAuthed = checkAuth(router, 'editor');
        setIsAuthenticated(isAuthed);
        
        if (isAuthed && requiredPermission) {
          const hasRequiredPermission = currentUserHasPermission(requiredPermission);
          setHasPermission(hasRequiredPermission);
          
          if (!hasRequiredPermission) {
            // If dashboard permission is missing, go to assigned page if they have access
            if (requiredPermission === PERMISSIONS.VIEW_DASHBOARD_EDITOR) {
              if (currentUserHasPermission(PERMISSIONS.SHOW_ASSIGNED_TABLE)) {
                router.replace('/business/editor/assigned');
              } else if (currentUserHasPermission(PERMISSIONS.SHOW_JOURNAL_TABLE)) {
                router.replace('/business/editor/journals');
              }
            }
            // If assigned table permission is missing, try journal table
            else if (requiredPermission === PERMISSIONS.SHOW_ASSIGNED_TABLE) {
              if (currentUserHasPermission(PERMISSIONS.SHOW_JOURNAL_TABLE)) {
                router.replace('/business/editor/journals');
              } else if (currentUserHasPermission(PERMISSIONS.VIEW_DASHBOARD_EDITOR)) {
                router.replace('/business/editor');
              }
            }
            // If journal table permission is missing, try assigned table or dashboard
            else if (requiredPermission === PERMISSIONS.SHOW_JOURNAL_TABLE) {
              if (currentUserHasPermission(PERMISSIONS.SHOW_ASSIGNED_TABLE)) {
                router.replace('/business/editor/assigned');
              } else if (currentUserHasPermission(PERMISSIONS.VIEW_DASHBOARD_EDITOR)) {
                router.replace('/business/editor');
              }
            }
          }
        }
        
        setIsLoading(false);
      };

      verifyAuth();
    }, [router, requiredPermission]);

    if (isLoading) {
      return <PageLoadingSpinner text="Loading contents..." />;
    }

    if (!isAuthenticated || (requiredPermission && !hasPermission)) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };
}

// Helper function for dashboard-specific auth
export function withDashboardAuth<P extends object>(WrappedComponent: React.ComponentType<P>) {
  return withEditorAuth(WrappedComponent, PERMISSIONS.VIEW_DASHBOARD_EDITOR);
}
