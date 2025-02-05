'use client'
import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Spinner } from "@heroui/react";
import { checkAuth } from '@/utils/authCheck';

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = React.useState(true);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);

  React.useEffect(() => {
    // Skip check for login page
    if (pathname === '/supAdmin/login') {
      setIsLoading(false);
      return;
    }

    const verifyAuth = () => {
      const isAuthed = checkAuth(router, 'supAdmin');
      setIsAuthenticated(isAuthed);
      setIsLoading(false);
    };

    verifyAuth();
  }, [pathname, router]);

  if (pathname === '/supAdmin/login') {
    return children;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
