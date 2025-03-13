"use client"
import React from 'react';
import { useRouter } from 'next/navigation';
import { checkAuth } from '@/utils/authCheck';
import { PageLoadingSpinner } from "@/components/LoadingSpinner";
import { currentUserHasPermission, isSuperAdmin } from '@/utils/permissions';

// Add generic type parameter P with a constraint
export function WithAdminAuth<P extends Record<string, any>>(
  WrappedComponent: React.ComponentType<P>,
  requiredPermission?: string
) {
  // Return a component that accepts props of type P
  return function ProtectedRoute(props: P) {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = React.useState(false);
    const [hasPermission, setHasPermission] = React.useState(true);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
      const verifyAuth = () => {
        // Check basic authentication
        const isAuthed = checkAuth(router, 'admin');
        setIsAuthenticated(isAuthed);
        
        if (isAuthed) {
          try {
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            
            // If user is SuperAdmin, they automatically have all permissions
            if (isSuperAdmin(userData)) {
              setHasPermission(true);
            } 
            // Otherwise, check the specific permission
            else if (requiredPermission) {
              const hasRequiredPermission = currentUserHasPermission(requiredPermission);
              setHasPermission(hasRequiredPermission);
              
              // If permission is missing, redirect to admin dashboard
              if (!hasRequiredPermission) {
                router.replace('/admin');
              }
            }
          } catch (error) {
            console.error('Error checking admin type:', error);
            
            // If there was an error and a permission is required, be safe and deny access
            if (requiredPermission) {
              setHasPermission(false);
              router.replace('/admin');
            }
          }
        }
        
        setIsLoading(false);
      };

      verifyAuth();
    }, [router, requiredPermission]);

    return isLoading ? (
      <PageLoadingSpinner text="Loading contents..." />
    ) : isAuthenticated && (requiredPermission ? hasPermission : true) ? (
      <WrappedComponent {...props} />
    ) : null;
  };
}
