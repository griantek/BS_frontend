'use client'
import { SectionTabs } from '@/components/section-tabs';

const sections = [
  { key: "executives", label: "Executives", href: "/supAdmin/users/executives" },
  { key: "roles", label: "Roles", href: "/supAdmin/users/roles" }
];

export default function UsersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <SectionTabs sections={sections} basePath="/supAdmin/users" />
      <div className="flex-grow">
        {children}
      </div>
    </div>
  );
}
