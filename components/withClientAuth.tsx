"use client"
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { Spinner } from "@nextui-org/react";
import { PageLoadingSpinner } from "@/components/LoadingSpinner";
import { checkAuth } from "@/utils/authCheck";

export function withClientAuth<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return function WithClientAuthComponent(props: P) {
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      // Use the same checkAuth function that other auth HOCs use
      // with 'clients' as the required role
      const isAuthed = checkAuth(router, 'clients');
      setIsAuthorized(isAuthed);
      setIsLoading(false);
      
      if (!isAuthed) {
        toast.error("Please log in to access this page");
      }
    }, [router]);

    if (isLoading) {
      return <PageLoadingSpinner text="Verifying your access..." />;
    }

    if (!isAuthorized) {
      return null; // This will render nothing while redirecting
    }

    return <Component {...props} />;
  };
}

export default withClientAuth;
