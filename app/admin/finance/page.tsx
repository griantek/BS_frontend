'use client'
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FinanceDefaultPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to transactions page by default
    router.replace('/admin/finance/transactions');
  }, [router]);

  return null; // No need to render anything as we're redirecting
}
