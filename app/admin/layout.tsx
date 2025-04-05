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
            
            // SupAdmin always has access to all features
            const isSuperAdmin = parsedUser.role?.entity_type === 'SupAdmin';
            
            if (!isSuperAdmin) {
              // Check if user has at least one clients-related tab permission
              const hasProspectsPermission = currentUserHasPermission(PERMISSIONS.SHOW_PROSPECTS_TAB);
              const hasRegistrationsPermission = currentUserHasPermission(PERMISSIONS.SHOW_REGISTRATIONS_TAB_ADMIN);
              const hasJournalsPermission = currentUserHasPermission(PERMISSIONS.SHOW_JOURNALS_TAB_ADMIN);
              
              // Only show clients tab if at least one subtab is accessible
              const shouldShowClientsTab = hasProspectsPermission || hasRegistrationsPermission || hasJournalsPermission;
              
              // Check if user has at least one finance-related tab permission
              const hasTransactionsPermission = currentUserHasPermission(PERMISSIONS.SHOW_TRANSACTIONS_TAB);
              const hasBankAccountsPermission = currentUserHasPermission(PERMISSIONS.SHOW_BANK_ACCOUNTS_TAB);
              
              // Only show finance tab if at least one subtab is accessible
              const shouldShowFinanceTab = hasTransactionsPermission || hasBankAccountsPermission;
              
              // Check for department tab permission
              const hasDepartmentTabPermission = currentUserHasPermission(PERMISSIONS.SHOW_DEPARTMENT_TAB);
              
              // Check for approval tab permission explicitly
              const hasApprovalPermission = currentUserHasPermission(PERMISSIONS.SHOW_APPROVAL_NAV);
              
              // Send explicit permission states for tabs we care about
              const navPermissions = {
                showUsersNav: currentUserHasPermission(PERMISSIONS.SHOW_USERS_NAV),
                showServicesTab: currentUserHasPermission(PERMISSIONS.SHOW_SERVICES_TAB),
                showClientsTab: shouldShowClientsTab ? currentUserHasPermission(PERMISSIONS.SHOW_CLIENTS_TAB) : false,
                showFinanceTab: shouldShowFinanceTab ? currentUserHasPermission(PERMISSIONS.SHOW_FINANCE_TAB) : false,
                showDepartmentTab: hasDepartmentTabPermission,
                showApprovalNav: hasApprovalPermission
              };
              
              // Dispatch a custom event to notify navbar of permission changes
              window.dispatchEvent(new CustomEvent('nav-permissions-change', {
                detail: navPermissions
              }));
            } else {
              // For SuperAdmin, explicitly set all permissions to true
              window.dispatchEvent(new CustomEvent('nav-permissions-change', {
                detail: {
                  showUsersNav: true,
                  showServicesTab: true,
                  showClientsTab: true,
                  showFinanceTab: true,
                  showDepartmentTab: true,
                  showApprovalNav: true
                }
              }));
            }
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
