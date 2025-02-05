'use client'
import { SectionTabs } from '@/components/section-tabs';

const sections = [
  { key: "transactions", label: "Transactions", href: "/supAdmin/finance/transactions" },
  { key: "banks", label: "Bank Accounts", href: "/supAdmin/finance/banks" }
];

export default function FinanceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <SectionTabs sections={sections} basePath="/supAdmin/finance" />
      <div className="flex-grow">
        {children}
      </div>
    </div>
  );
}
