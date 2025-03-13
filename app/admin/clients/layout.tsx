"use client"
import { Tabs, Tab } from "@heroui/react";
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { currentUserHasPermission, PERMISSIONS, isSuperAdmin } from '@/utils/permissions';
import api from '@/services/api';

export default function ClientsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [showProspects, setShowProspects] = useState(true);
  const [showRegistrations, setShowRegistrations] = useState(true);
  const [showJournals, setShowJournals] = useState(true);
  const [userIsSuperAdmin, setUserIsSuperAdmin] = useState(false);
  const [shouldRedirectToAdmin, setShouldRedirectToAdmin] = useState(false);

  // Check user permissions
  useEffect(() => {
    // Check if user is SuperAdmin (they have all permissions implicitly)
    const userData = api.getStoredUser();
    // Store isSuperAdmin result in state
    const isSuperAdminUser = userData?.role?.entity_type === 'SupAdmin';
    setUserIsSuperAdmin(isSuperAdminUser);
    
    // SuperAdmin always has all permissions, only check for non-superadmins
    if (!isSuperAdminUser) {
      const hasProspectsAccess = currentUserHasPermission(PERMISSIONS.SHOW_PROSPECTS_TAB);
      const hasRegistrationsAccess = currentUserHasPermission(PERMISSIONS.SHOW_REGISTRATIONS_TAB_ADMIN);
      const hasJournalsAccess = currentUserHasPermission(PERMISSIONS.SHOW_JOURNALS_TAB_ADMIN);
      
      setShowProspects(hasProspectsAccess);
      setShowRegistrations(hasRegistrationsAccess);
      setShowJournals(hasJournalsAccess);
      
      // If no tabs are accessible, set redirect flag
      if (!hasProspectsAccess && !hasRegistrationsAccess && !hasJournalsAccess) {
        setShouldRedirectToAdmin(true);
      }
    }
  }, []);

  // Redirect to admin home if no tabs are accessible
  useEffect(() => {
    if (shouldRedirectToAdmin) {
      router.replace('/admin');
    }
  }, [shouldRedirectToAdmin, router]);

  // Preload routes
  useEffect(() => {
    router.prefetch('/admin/clients/prospects');
    router.prefetch('/admin/clients/registrations');
    router.prefetch('/admin/clients/journals');
  }, [router]);

  const handleTabChange = (key: string) => {
    // Use replace instead of push for smoother transitions
    router.replace(`/admin/clients/${key}`, { scroll: false });
  };

  // Get the selected tab from pathname
  const getSelectedTab = () => {
    if (pathname.includes('/prospects')) return 'prospects';
    if (pathname.includes('/registrations')) return 'registrations';
    if (pathname.includes('/journals')) return 'journals';
    // Default to the first available tab
    if (userIsSuperAdmin || showProspects) return 'prospects';
    if (showRegistrations) return 'registrations';
    if (showJournals) return 'journals';
    return 'prospects'; // Fallback default
  };
  
  const selectedTab = getSelectedTab();

  // Redirect logic based on permissions
  useEffect(() => {
    // If current tab is not accessible, redirect to the first available tab
    let shouldRedirect = false;
    let targetTab = '';
    
    // Check if current tab is not accessible
    if (!userIsSuperAdmin) {
      if (selectedTab === 'prospects' && !showProspects) shouldRedirect = true;
      else if (selectedTab === 'registrations' && !showRegistrations) shouldRedirect = true;
      else if (selectedTab === 'journals' && !showJournals) shouldRedirect = true;
    }
    
    // Find the first available tab to redirect to
    if (shouldRedirect) {
      if (showProspects) targetTab = 'prospects';
      else if (showRegistrations) targetTab = 'registrations';
      else if (showJournals) targetTab = 'journals';
      else targetTab = ''; // No tabs available, redirect to admin root
      
      if (targetTab) {
        router.replace(`/admin/clients/${targetTab}`, { scroll: false });
      } else {
        // If no tabs are accessible, redirect to admin homepage
        router.replace('/admin', { scroll: false });
      }
    }
  }, [userIsSuperAdmin, showProspects, showRegistrations, showJournals, selectedTab, router]);

  // If no permissions and redirect flag is set, render nothing while redirect happens
  if (shouldRedirectToAdmin) {
    return null;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-y-auto">
      <div className="w-full sticky top-0 bg-background z-10 px-6 pt-4">
        <Tabs
          selectedKey={selectedTab}
          onSelectionChange={handleTabChange as any}
          aria-label="Client Management"
        >
          {/* SuperAdmins always see all tabs, others need permission */}
          {(userIsSuperAdmin || showProspects) && (
            <Tab key="prospects" title="Prospects" />
          )}
          
          {(userIsSuperAdmin || showRegistrations) && (
            <Tab key="registrations" title="Registrations" />
          )}
          
          {(userIsSuperAdmin || showJournals) && (
            <Tab key="journals" title="Journals" />
          )}
        </Tabs>
      </div>
      <div className="flex-grow">
        {children}
      </div>
    </div>
  );
}
