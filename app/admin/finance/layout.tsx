"use client"
import { Tabs, Tab } from "@heroui/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LoadingSpinner } from "@/components/LoadingSpinner";

const tabs = [
  { id: "transactions", label: "Transactions", href: "/admin/finance/transactions" },
  { id: "banks", label: "Bank Accounts", href: "/admin/finance/banks" }
];

export default function FinanceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter();
  const pathname = usePathname();
  const navigationInProgressRef = useRef(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Extract the base tab from pathname
  const isDetailsPage = pathname?.includes('/transactions/') || 
                        pathname?.includes('/banks/');
  
  const currentTab = isDetailsPage
    ? pathname?.includes('/banks/') ? 'banks' 
    : 'transactions'
    : pathname?.split('/').pop() || 'transactions';

  // If we're on a details page, we shouldn't perform a tab selection redirect
  const shouldAllowTabNavigation = !isDetailsPage;
  
  // Prevent tab navigation from redirecting when on a detail page
  const handleSelectionChange = (key: React.Key) => {
    // Skip navigation if we're in a details page
    if (navigationInProgressRef.current || !shouldAllowTabNavigation) return;
    
    const tab = tabs.find(t => t.id === key);
    if (tab) {
      navigationInProgressRef.current = true;
      setIsLoading(true);
      router.push(tab.href);
      
      // Reset flags after navigation
      setTimeout(() => {
        navigationInProgressRef.current = false;
        setIsLoading(false);
      }, 500);
    }
  };

  return (
    <div className="flex flex-col min-h-screen p-6">
      {/* Do not render tabs on detail pages */}
      {!isDetailsPage && (
        <div className="px-4 mb-6">
          <Tabs 
            selectedKey={currentTab}
            onSelectionChange={handleSelectionChange}
          >
            {tabs.map((tab) => (
              <Tab key={tab.id} title={tab.label} />
            ))}
          </Tabs>
        </div>
      )}
      {isLoading ? (
        <LoadingSpinner text="Loading finance data..." />
      ) : (
        <div className="flex-grow">{children}</div>
      )}
    </div>
  );
}
