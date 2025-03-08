"use client"
import { Tabs, Tab } from "@heroui/react";
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function UsersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter();
  const pathname = usePathname();

  // Preload both routes
  useEffect(() => {
    router.prefetch('/admin/users/executives');
    router.prefetch('/admin/users/roles');
  }, [router]);

  const handleTabChange = (key: string) => {
    // Use replace instead of push for smoother transitions
    router.replace(`/admin/users/${key}`, { scroll: false });
  };

  const selectedTab = pathname.includes('/executives') ? 'executives' : 'roles';

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-y-auto">
      <div className="w-full sticky top-0 bg-background z-10 px-6 pt-4">
        <Tabs
          selectedKey={selectedTab}
          onSelectionChange={handleTabChange as any}
          aria-label="User Management"
        >
          <Tab key="executives" title="Executives" />
          <Tab key="roles" title="Roles" />
        </Tabs>
      </div>
      <div className="flex-grow">
        {children}
      </div>
    </div>
  );
}
