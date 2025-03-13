"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { WithAdminAuth } from "@/components/withAdminAuth";
import { currentUserHasPermission, PERMISSIONS, isSuperAdmin } from '@/utils/permissions';
import api from '@/services/api';

function ClientsPage() {
  const router = useRouter();

  useEffect(() => {
    const redirectToAvailableTab = async () => {
      const userData = api.getStoredUser();
      const userIsSuperAdmin = userData?.role?.entity_type === 'SupAdmin';
      
      // SuperAdmins can access all tabs, redirect to prospects
      if (userIsSuperAdmin) {
        router.replace("/admin/clients/prospects", { scroll: false });
        return;
      }
      
      // For non-SuperAdmins, check permissions and redirect to first available tab
      const hasProspectsPermission = currentUserHasPermission(PERMISSIONS.SHOW_PROSPECTS_TAB);
      const hasRegistrationsPermission = currentUserHasPermission(PERMISSIONS.SHOW_REGISTRATIONS_TAB_ADMIN);
      const hasJournalsPermission = currentUserHasPermission(PERMISSIONS.SHOW_JOURNALS_TAB_ADMIN);
      
      // Redirect to first available tab
      if (hasProspectsPermission) {
        router.replace("/admin/clients/prospects", { scroll: false });
      } else if (hasRegistrationsPermission) {
        router.replace("/admin/clients/registrations", { scroll: false });
      } else if (hasJournalsPermission) {
        router.replace("/admin/clients/journals", { scroll: false });
      } else {
        // If no tab is accessible, redirect to admin home
        router.replace("/admin", { scroll: false });
      }
    };
    
    // Use a short timeout to ensure this runs after component mount
    const redirectTimer = setTimeout(() => {
      redirectToAvailableTab();
    }, 100);
    
    return () => {
      clearTimeout(redirectTimer);
    };
  }, [router]);

  // Return a loading indicator instead of null to prevent flashing
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Redirecting...</p>
    </div>
  );
}

// Wrap with admin auth to ensure protection, but don't set a specific permission
// as the component will handle permission checks and redirections internally
export default WithAdminAuth(ClientsPage);
