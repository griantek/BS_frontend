"use client";
import { Tabs, Tab } from "@heroui/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const tabs = [
  { id: "prospects", label: "Prospects", href: "/admin/clients/prospects" },
  { id: "registrations", label: "Registrations", href: "/admin/clients/registrations" },
  { id: "journals", label: "Journals", href: "/admin/clients/journals" }, // Add new journals tab
];

export default function ClientsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const navigationInProgressRef = useRef(false);
  
  // Extract the base tab from pathname
  const isDetailsPage = pathname?.includes('/registrations/') || 
                        pathname?.includes('/prospects/') || 
                        pathname?.includes('/journals/'); // Add journals to details pages
  
  const currentTab = isDetailsPage
    ? pathname?.includes('/registrations/') ? 'registrations' 
    : pathname?.includes('/journals/') ? 'journals' 
    : 'prospects'
    : pathname?.split('/').pop() || 'prospects';

  // If we're on a details page, we shouldn't perform a tab selection redirect
  const shouldAllowTabNavigation = !isDetailsPage;
  
  // Prevent tab navigation from redirecting when on a detail page
  const handleSelectionChange = (key: React.Key) => {
    // Skip navigation if we're in a details page
    if (navigationInProgressRef.current || !shouldAllowTabNavigation) return;
    
    const tab = tabs.find(t => t.id === key);
    if (tab) {
      navigationInProgressRef.current = true;
      router.push(tab.href);
      
      // Reset flag after navigation
      setTimeout(() => {
        navigationInProgressRef.current = false;
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
      <div className="flex-grow">{children}</div>
    </div>
  );
}
