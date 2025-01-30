'use client'
import React from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    // Skip check for login page
    if (pathname === '/supAdmin/login') return;

    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    const isLoggedIn = localStorage.getItem('isLoggedIn');

    if (!token || !isLoggedIn || userRole !== 'supAdmin') {
      window.location.href = '/supAdmin/login';
    }
  }, [pathname]);

  return <>{children}</>;
}
