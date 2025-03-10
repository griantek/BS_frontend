"use client";
import { Card } from "@heroui/react";
import { Tabs, Tab } from "@heroui/react";
import { useRouter, usePathname } from "next/navigation";

const tabs = [
  { id: "prospects", label: "Prospects", href: "/admin/clients/prospects" },
  { id: "registrations", label: "Registrations", href: "/admin/clients/registrations" },
];

export default function ClientsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const currentTab = pathname?.split('/').pop() || 'prospects';

  return (
    <div className="flex flex-col min-h-screen p-6">
        <div className="px-4">
          <Tabs 
            selectedKey={currentTab}
            onSelectionChange={(key) => {
              const tab = tabs.find(t => t.id === key);
              if (tab) router.push(tab.href);
            }}
          >
            {tabs.map((tab) => (
              <Tab key={tab.id} title={tab.label} />
            ))}
          </Tabs>
        </div>
      <div className="flex-grow">{children}</div>
    </div>
  );
}
