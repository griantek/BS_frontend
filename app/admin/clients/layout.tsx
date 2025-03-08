"use client"
import { SectionTabs } from '@/components/section-tabs';

const sections = [
  { key: "prospects", label: "Prospects", href: "/admin/clients/prospects" },
  { key: "registrations", label: "Registrations", href: "/admin/clients/registrations" }
];

export default function ClientsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <SectionTabs sections={sections} basePath="/admin/clients" />
      <div className="flex-grow">
        {children}
      </div>
    </div>
  );
}
