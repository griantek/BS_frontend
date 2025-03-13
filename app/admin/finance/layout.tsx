"use client"
import { Tabs, Tab } from "@heroui/react";
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { currentUserHasPermission, PERMISSIONS, isSuperAdmin } from '@/utils/permissions';
import api from '@/services/api';

export default function FinanceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [showTransactions, setShowTransactions] = useState(false); // Default to false
  const [showBankAccounts, setShowBankAccounts] = useState(false); // Default to false
  const [userIsSuperAdmin, setUserIsSuperAdmin] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Check if user is SuperAdmin (they have all permissions implicitly)
    const userData = api.getStoredUser();
    // Store isSuperAdmin result in state
    const isSuperAdminUser = userData?.role?.entity_type === 'SupAdmin';
    setUserIsSuperAdmin(isSuperAdminUser);
    
    // SuperAdmin always has all permissions, otherwise check for specific permissions
    if (isSuperAdminUser) {
      setShowTransactions(true);
      setShowBankAccounts(true);
    } else {
      setShowTransactions(currentUserHasPermission(PERMISSIONS.SHOW_TRANSACTIONS_TAB));
      setShowBankAccounts(currentUserHasPermission(PERMISSIONS.SHOW_BANK_ACCOUNTS_TAB));
    }
    
    setInitialized(true);
  }, []);

  // Preload routes
  useEffect(() => {
    router.prefetch('/admin/finance/transactions');
    router.prefetch('/admin/finance/banks');
  }, [router]);

  const handleTabChange = (key: string) => {
    // Use replace instead of push for smoother transitions
    router.replace(`/admin/finance/${key}`, { scroll: false });
  };

  // Get the selected tab from pathname
  const getSelectedTab = () => {
    if (pathname.includes('/transactions')) return 'transactions';
    if (pathname.includes('/banks')) return 'banks';
    
    // If we're at /admin/finance, determine which tab to show first
    if (showTransactions) return 'transactions';
    if (showBankAccounts) return 'banks';
    
    // Fallback default - should not happen if permissions are checked correctly
    return 'transactions'; 
  };
  
  const selectedTab = getSelectedTab();

  // Redirect logic based on permissions
  useEffect(() => {
    if (!initialized) return;
    
    // If neither tab is accessible, redirect to admin dashboard
    if (!userIsSuperAdmin && !showTransactions && !showBankAccounts) {
      router.replace('/admin');
      return;
    }
    
    // We are at the base "/admin/finance" route, redirect to the selected tab
    if (pathname === '/admin/finance') {
      const targetTab = getSelectedTab();
      router.replace(`/admin/finance/${targetTab}`, { scroll: false });
      return;
    }
    
    // If current tab is not accessible, redirect to the other available tab
    if (!userIsSuperAdmin) {
      if (selectedTab === 'transactions' && !showTransactions) {
        if (showBankAccounts) {
          router.replace('/admin/finance/banks', { scroll: false });
        } else {
          router.replace('/admin', { scroll: false });
        }
      } 
      else if (selectedTab === 'banks' && !showBankAccounts) {
        if (showTransactions) {
          router.replace('/admin/finance/transactions', { scroll: false });
        } else {
          router.replace('/admin', { scroll: false });
        }
      }
    }
  }, [userIsSuperAdmin, showTransactions, showBankAccounts, selectedTab, pathname, router, initialized]);

  // If no tabs are accessible and not SuperAdmin, don't render anything
  // This is needed to prevent flash of content before redirect
  if (!userIsSuperAdmin && !showTransactions && !showBankAccounts) {
    return null;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-y-auto">
      <div className="w-full sticky top-0 bg-background z-10 px-6 pt-4">
        <Tabs
          selectedKey={selectedTab}
          onSelectionChange={handleTabChange as any}
          aria-label="Finance Management"
        >
          {/* Only show tabs the user has permission to view */}
          {showTransactions && (
            <Tab key="transactions" title="Transactions" />
          )}
          
          {showBankAccounts && (
            <Tab key="banks" title="Bank Accounts" />
          )}
        </Tabs>
      </div>
      <div className="flex-grow">
        {children}
      </div>
    </div>
  );
}
