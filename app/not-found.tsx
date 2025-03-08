"use client";
import React from "react";
import { Button } from "@heroui/react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold text-primary">404</h1>
        <h2 className="text-2xl font-semibold">Page Not Found</h2>
        <p className="text-default-500">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Button 
          color="primary" 
          variant="shadow" 
          href="/"
        >
          Go to Home
        </Button>
      </div>
    </div>
  );
}
