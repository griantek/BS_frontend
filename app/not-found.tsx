"use client"
import React, { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@heroui/react";

function NotFoundContent() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold text-primary">404</h1>
        <h2 className="text-2xl font-semibold">Page Not Found</h2>
        <p className="text-default-500">The page you're looking for doesn't exist or has been moved.</p>
        <Button
          color="primary"
          variant="shadow"
          onClick={() => router.push('/')}
        >
          Go to Home
        </Button>
      </div>
    </div>
  );
}

export default function NotFound() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NotFoundContent />
    </Suspense>
  );
}
