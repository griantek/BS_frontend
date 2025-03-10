"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { WithAdminAuth } from "@/components/withAdminAuth";

function ClientsPage() {
  const router = useRouter();

  useEffect(() => {
    // Use a short timeout to ensure this runs after component mount
    const redirectTimer = setTimeout(() => {
      router.replace("/admin/clients/prospects");
    }, 100);
    
    console.log('Redirecting to prospects...');
    return () => {
      clearTimeout(redirectTimer);
    };
  }, [router]);

  // Return a loading indicator instead of null to prevent flashing
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Redirecting to prospects...</p>
    </div>
  );
}

// Wrap with admin auth to ensure protection
export default WithAdminAuth(ClientsPage);
