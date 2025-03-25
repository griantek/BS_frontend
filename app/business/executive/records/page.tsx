"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { withExecutiveAuth } from '@/components/withExecutiveAuth';
import { Spinner } from "@nextui-org/react";

function RecordsRedirectPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the prospects page by default
    router.replace("/business/executive/records/prospectus");
  }, [router]);

  return (
    <div className="flex justify-center items-center h-[400px]">
      <Spinner size="lg" label="Loading..." />
    </div>
  );
}

export default withExecutiveAuth(RecordsRedirectPage);
