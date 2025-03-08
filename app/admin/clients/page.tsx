"use client"
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ClientsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/clients/prospects');
  }, [router]);

  return null; // Return null as we're redirecting
}
