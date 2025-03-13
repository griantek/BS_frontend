"use client"
import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Spinner } from "@heroui/react";
import { checkAuth } from '@/utils/authCheck';
import { currentUserHasPermission, PERMISSIONS } from '@/utils/permissions';
import { 
  HomeIcon, 
  UsersIcon, 
  BuildingOfficeIcon 
} from "@heroicons/react/24/outline";

export default function SAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = React.useState(true);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);

  // Check authentication on mount
  React.useEffect(() => {
    // Skip check for login page
    if (pathname === '/admin/login') {
      setIsLoading(false);
      return;
    }

    const verifyAuth = () => {
      const isAuthed = checkAuth(router, 'admin');
      setIsAuthenticated(isAuthed);
      setIsLoading(false);
    };

    verifyAuth();
  }, [pathname, router]);

  // Create a global state update for navigation permissions
  React.useEffect(() => {
    if (isAuthenticated) {
      try {
        const setupNavPermissions = () => {
          // Get user data and set permission in a global context
          const userData = localStorage.getItem('user');
          if (userData) {
            const parsedUser = JSON.parse(userData);
            
            // SupAdmin always has access to Users nav
            const isSuperAdmin = parsedUser.role?.entity_type === 'SupAdmin';
            
            // For regular admins, check the specific permission
            const hasUsersNavPermission = isSuperAdmin || 
                                          currentUserHasPermission(PERMISSIONS.SHOW_USERS_NAV);
            
            console.log('Setting showUsersNav permission:', {
              isSuperAdmin,
              hasUsersNavPermission
            });
            
            // Dispatch a custom event to notify navbar of permission changes
            window.dispatchEvent(new CustomEvent('nav-permissions-change', {
              detail: {
                showUsersNav: hasUsersNavPermission
              }
            }));
          }
        };
        
        // Setup permissions immediately, then again after a delay to ensure it's processed
        setupNavPermissions();
        // Small delay to ensure the event is processed after navbar is mounted
        setTimeout(setupNavPermissions, 100);
      } catch (e) {
        console.error('Error setting navigation permissions:', e);
      }
    }
  }, [isAuthenticated]);

  // Login page doesn't need the layout
  if (pathname === '/admin/login') {
    return children;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // No need for the admin layout to handle navigation, let the navbar do that
  return <>{children}</>;
}
