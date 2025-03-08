'use client'
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';

export default function BusinessPage() {
  const router = useRouter();

  useEffect(() => {
    const userRole = localStorage.getItem('userRole');
    if (!userRole) {
      router.replace('/business/executive/login');
      return;
    }

    // Redirect based on role
    if (userRole === 'editor') {
      router.replace('/business/editor');
    } else if (userRole === 'executive') {
      router.replace('/business/executive');
    } else {
      router.replace('/business/executive/login');
    }
  }, [router]);

  return null; // This page won't render anything, it just handles routing
}
