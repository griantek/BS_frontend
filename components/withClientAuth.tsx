"use client"
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { Spinner } from "@nextui-org/react";

export function withClientAuth<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return function WithClientAuthComponent(props: P) {
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      // Check if client is authenticated
      const token = localStorage.getItem("client_token");
      const userStr = localStorage.getItem("client_user");

      if (!token || !userStr) {
        toast.error("Please login to access this page");
        router.push("/business/clients/login");
        return;
      }

      // Additional validation could be added here, like token expiry check
      // or API call to validate token on the server

      setIsAuthorized(true);
      setIsLoading(false);
    }, [router]);

    if (isLoading) {
      return (
        <div className="h-screen w-full flex items-center justify-center">
          <Spinner size="lg" label="Authorizing..." />
        </div>
      );
    }

    if (!isAuthorized) {
      return null; // This will render nothing while redirecting
    }

    return <Component {...props} />;
  };
}
