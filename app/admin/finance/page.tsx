"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { WithAdminAuth } from "@/components/withAdminAuth";
import { Spinner } from "@heroui/react";
import { currentUserHasPermission, PERMISSIONS } from '@/utils/permissions';

function FinancePage() {
  const router = useRouter();

  useEffect(() => {
    const redirectToAvailableTab = () => {
      const hasTransactionsPermission = currentUserHasPermission(PERMISSIONS.SHOW_TRANSACTIONS_TAB);
      const hasBankAccountsPermission = currentUserHasPermission(PERMISSIONS.SHOW_BANK_ACCOUNTS_TAB);
      
      // Redirect to first available tab
      if (hasTransactionsPermission) {
        router.replace("/admin/finance/transactions", { scroll: false });
      } else if (hasBankAccountsPermission) {
        router.replace("/admin/finance/banks", { scroll: false });
      } else {
        // If no tabs are accessible, redirect to admin home
        router.replace("/admin", { scroll: false });
      }
    };
    
    // Use a short timeout to ensure proper execution
    const redirectTimer = setTimeout(() => {
      redirectToAvailableTab();
    }, 100);
    
    return () => {
      clearTimeout(redirectTimer);
    };
  }, [router]);

  // Return a loading indicator with proper styling
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Spinner size="lg" />
      <p>Loading finance data...</p>
    </div>
  );
}

// Wrap with admin auth to ensure protection
export default WithAdminAuth(FinancePage);
