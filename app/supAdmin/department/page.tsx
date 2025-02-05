'use client'
import React from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Card,
  CardHeader,
  CardBody,
  Spinner
} from "@heroui/react";
import api from '@/services/api';
import type { Department } from '@/services/api';

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export default function DepartmentsPage() {
  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await api.getAllDepartments();
        setDepartments(response.data);
      } catch (error) {
        console.error('Error fetching departments:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDepartments();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-4rem)]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex justify-between items-center px-6 py-4">
        <h1 className="text-2xl font-bold">Departments</h1>
      </CardHeader>
      <CardBody>
        <Table aria-label="Departments table">
          <TableHeader>
            <TableColumn>Name</TableColumn>
            <TableColumn>Created At</TableColumn>
            <TableColumn>Executive ID</TableColumn>
          </TableHeader>
          <TableBody>
            {departments.map((dept) => (
              <TableRow key={dept.id}>
                <TableCell>{dept.name}</TableCell>
                <TableCell>{formatDate(dept.created_at)}</TableCell>
                <TableCell>{dept.exec_id}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardBody>
    </Card>
  );
}
