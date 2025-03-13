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
  const [userIsSuperAdmin, setUserIsSuperAdmin] = useState(false);

  useEffect(() => {
    // Check if user is SuperAdmin (they have all permissions implicitly)
    const userData = api.getStoredUser();
    // Store isSuperAdmin result in state
    setUserIsSuperAdmin(userData?.role?.entity_type === 'SupAdmin');
    
    // SuperAdmin always has all permissions, only check for non-superadmins
    if (userData?.role?.entity_type !== 'SupAdmin') {
      setShowExecutives(currentUserHasPermission(PERMISSIONS.SHOW_EXECUTIVES_TAB));
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

  // If user doesn't have permission to see executives and they're on the executives page, redirect to roles
  useEffect(() => {
    if (!userIsSuperAdmin && !showExecutives && selectedTab === 'executives') {
      router.replace('/admin/users/roles', { scroll: false });
    }
  }, [userIsSuperAdmin, showExecutives, selectedTab, router]);

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
          <Tab key="roles" title="Roles" />
        </Tabs>
      </div>
      <div className="flex-grow">
        {children}
      </div>
    </div>
  );
}
