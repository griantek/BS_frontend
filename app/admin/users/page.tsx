"use client"
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Spinner } from "@heroui/react";

export default function UsersPage() {
  const router = useRouter();

  useEffect(() => {
    // Add a small delay to ensure the layout renders first
    const redirectTimer = setTimeout(() => {
      router.push('/admin/users/executives');
    }, 100);

    return () => clearTimeout(redirectTimer);
  }, [router]);

  return (
    <div className="flex justify-center items-center h-[200px]">
      <Spinner size="lg" />
    </div>
  );
}
