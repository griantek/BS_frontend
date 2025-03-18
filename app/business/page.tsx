"use client"
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
    switch (userRole) {
      case 'editor':
        router.replace('/business/editor');
        break;
      case 'executive':
        router.replace('/business/executive');
        break;
      case 'leads':
        router.replace('/business/leads');
        break;
      case 'clients':
        router.replace('/business/clients');
        break;
      default:
        router.replace('/business/executive/login');
    }
  }, [router]);

  return null; // This page won't render anything, it just handles routing
}
