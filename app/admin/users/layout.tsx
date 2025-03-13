"use client"
import { Tabs, Tab } from "@heroui/react";
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { currentUserHasPermission, PERMISSIONS, isSuperAdmin } from '@/utils/permissions';
import api from '@/services/api';

export default function UsersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [showExecutives, setShowExecutives] = useState(true);
  const [showRoles, setShowRoles] = useState(true);
  const [userIsSuperAdmin, setUserIsSuperAdmin] = useState(false);

  useEffect(() => {
    // Check if user is SuperAdmin (they have all permissions implicitly)
    const userData = api.getStoredUser();
    // Store isSuperAdmin result in state
    setUserIsSuperAdmin(userData?.role?.entity_type === 'SupAdmin');
    
    // SuperAdmin always has all permissions, only check for non-superadmins
    if (userData?.role?.entity_type !== 'SupAdmin') {
      setShowExecutives(currentUserHasPermission(PERMISSIONS.SHOW_EXECUTIVES_TAB));
      setShowRoles(currentUserHasPermission(PERMISSIONS.SHOW_ROLES));
    }
  }, []);

  // Preload both routes
  useEffect(() => {
    router.prefetch('/admin/users/executives');
    router.prefetch('/admin/users/roles');
  }, [router]);

  const handleTabChange = (key: string) => {
    // Use replace instead of push for smoother transitions
    router.replace(`/admin/users/${key}`, { scroll: false });
  };

  // Get the selected tab from pathname
  const selectedTab = pathname.includes('/executives') ? 'executives' : 'roles';
  
  // Update the redirect logic to consider both tab permissions
  useEffect(() => {
    // If on executives tab but no permission, try to redirect to roles if that's available
    if (!userIsSuperAdmin && !showExecutives && selectedTab === 'executives') {
      if (showRoles) {
        router.replace('/admin/users/roles', { scroll: false });
      } else {
        // If neither tab is accessible, go to admin dashboard
        router.replace('/admin', { scroll: false });
      }
    }
    
    // If on roles tab but no permission, try to redirect to executives if that's available
    if (!userIsSuperAdmin && !showRoles && selectedTab === 'roles') {
      if (showExecutives) {
        router.replace('/admin/users/executives', { scroll: false });
      } else {
        // If neither tab is accessible, go to admin dashboard
        router.replace('/admin', { scroll: false });
      }
    }
  }, [userIsSuperAdmin, showExecutives, showRoles, selectedTab, router]);

  // If neither tab is accessible and not SuperAdmin, don't render anything
  if (!userIsSuperAdmin && !showExecutives && !showRoles) {
    return null;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-y-auto">
      <div className="w-full sticky top-0 bg-background z-10 px-6 pt-4">
        <Tabs
          selectedKey={selectedTab}
          onSelectionChange={handleTabChange as any}
          aria-label="User Management"
        >
          {/* SuperAdmins always see executives tab, others need permission */}
          {(userIsSuperAdmin || showExecutives) && (
            <Tab key="executives" title="Executives" />
          )}
          
          {/* SuperAdmins always see roles tab, others need permission */}
          {(userIsSuperAdmin || showRoles) && (
            <Tab key="roles" title="Roles" />
          )}
        </Tabs>
      </div>
      <div className="flex-grow">
        {children}
      </div>
    </div>
  );
}
