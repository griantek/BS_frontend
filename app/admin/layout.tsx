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
        // Get user data and set permission in a global context
        const userData = localStorage.getItem('user');
        if (userData) {
          const parsedUser = JSON.parse(userData);
          const hasUsersNavPermission = parsedUser.role?.entity_type === 'SupAdmin' || 
                                         currentUserHasPermission(PERMISSIONS.SHOW_USERS_NAV);
          
          // Dispatch a custom event to notify navbar of permission changes
          window.dispatchEvent(new CustomEvent('nav-permissions-change', {
            detail: {
              showUsersNav: hasUsersNavPermission
            }
          }));
        }
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

  return <>{children}</>;
}
