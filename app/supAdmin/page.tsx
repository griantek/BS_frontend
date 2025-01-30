'use client'
import React from 'react';
import { useRouter } from 'next/navigation';
import { checkAuth } from '@/utils/authCheck';
import {
  Card,
  CardBody,
  CardHeader,
} from "@heroui/react";

const DashboardPage: React.FC = () => {
    return (
        <div>
            <h1>Dashboard</h1>
            <p>Welcome to the Super Admin Dashboard.</p>
        </div>
    );
};

export default function SupAdminDashboard() {
  const router = useRouter();

  // No need for auth check here as it's handled by the layout
  return (
    <div className="w-full p-6">
      <Card className="mb-6">
        <CardHeader className="flex justify-between items-center px-6 py-4">
          <h1 className="text-2xl font-bold">Super Admin Dashboard</h1>
        </CardHeader>
        <CardBody>
          {/* Add your dashboard content here */}
        </CardBody>
      </Card>
    </div>
  );
}