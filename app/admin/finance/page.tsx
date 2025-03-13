"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { WithAdminAuth } from "@/components/withAdminAuth";
import { Spinner } from "@heroui/react";

function FinancePage() {
  const router = useRouter();

  useEffect(() => {
    // Use a short timeout to ensure this runs after component mount
    const redirectTimer = setTimeout(() => {
      router.replace("/admin/finance/transactions", { scroll: false });
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
