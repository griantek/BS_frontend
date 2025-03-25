"use client"
import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { checkAuth } from '@/utils/authCheck';
import { PageLoadingSpinner } from "@/components/LoadingSpinner";
import { currentUserHasPermission, PERMISSIONS } from '@/utils/permissions';

export function withLeadsAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requiredPermission?: string
) {
  return function ProtectedRoute(props: P) {
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthenticated, setIsAuthenticated] = React.useState(false);
    const [hasPermission, setHasPermission] = React.useState(true);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
      const verifyAuth = () => {
        const isAuthed = checkAuth(router, 'leads');
        setIsAuthenticated(isAuthed);
        
        if (isAuthed && requiredPermission) {
          const hasRequiredPermission = currentUserHasPermission(requiredPermission);
          setHasPermission(hasRequiredPermission);
          
          if (!hasRequiredPermission) {
            router.replace('/business/conversion');
          }
        }
        
        // Check for specific route permissions
        if (isAuthed) {
          // For example, you could check if the user has permission to access the followup page
          const isFollowupRoute = pathname === '/business/conversion/followup';
          if (isFollowupRoute && !currentUserHasPermission(PERMISSIONS.VIEW_FOLLOWUPS)) {
            router.replace('/business/conversion');
            return;
          }
          
          // Add other route-specific permission checks as needed
        }
        
        setIsLoading(false);
      };

      verifyAuth();
    }, [router, pathname, requiredPermission]);

    if (isLoading) {
      // Return the improved PageLoadingSpinner that fully covers the viewport
      return <PageLoadingSpinner text="Loading contents..." />;
    }

    if (!isAuthenticated || (requiredPermission && !hasPermission)) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };
}

// Helper function for leads dashboard-specific auth
export function withLeadsDashboardAuth<P extends object>(WrappedComponent: React.ComponentType<P>) {
  return withLeadsAuth(WrappedComponent, PERMISSIONS.VIEW_DASHBOARD_LEADS);
}

// Helper function for follow-ups page auth
export function withFollowupsAuth<P extends object>(WrappedComponent: React.ComponentType<P>) {
  return withLeadsAuth(WrappedComponent, PERMISSIONS.VIEW_FOLLOWUPS);
}
