"use client"
import React from 'react';
import { useRouter } from 'next/navigation';
import { 
  Dropdown, 
  DropdownTrigger, 
  DropdownMenu, 
  DropdownItem, 
  Button, 
  User 
} from "@heroui/react";
import { 
  UserCircleIcon, 
  ArrowRightStartOnRectangleIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import api from '@/services/api';

interface ProfileMenuProps {
  username: string;
  isMobile?: boolean;
  userRole?: string;
}

export const ProfileMenu = ({ username, isMobile = false, userRole = '' }: ProfileMenuProps) => {
  const router = useRouter();

  const handleLogout = () => {
    const storedUserRole = localStorage.getItem('userRole') || userRole;
    api.clearStoredAuth();
    
    if (storedUserRole === 'SupAdmin') {
      router.replace('/admin/login');
    } else if (storedUserRole === 'admin') {
      router.replace('/business/executive/login');
    } else if (storedUserRole === 'clients') {
      router.replace('/business/clients/login');
    } else {
      router.replace('/business/executive/login');
    }
  };

  // Only show icon for mobile version
  if (isMobile) {
    return (
      <Dropdown placement="bottom-end">
        <DropdownTrigger>
          <Button 
            isIconOnly 
            variant="light" 
            aria-label="Profile options"
            className="text-default-600"
          >
            <UserCircleIcon className="h-5 w-5" />
          </Button>
        </DropdownTrigger>
        <DropdownMenu aria-label="Profile Actions">
          <DropdownItem key="profile" textValue="Profile" className="opacity-100">
            <div className="flex items-center gap-2 py-1">
              <UserCircleIcon className="h-4 w-4" />
              <span className="font-medium">{username}</span>
            </div>
          </DropdownItem>
          <DropdownItem 
            key="logout" 
            startContent={<ArrowRightStartOnRectangleIcon className="h-4 w-4" />}
            description="Sign out of your account"
            color="danger"
            onPress={handleLogout}
          >
            Logout
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    );
  }

  // Desktop version with more details
  return (
    <Dropdown placement="bottom-end">
      <DropdownTrigger>
        <Button 
          variant="light" 
          className="flex items-center gap-2 text-default-600"
          endContent={<AdjustmentsHorizontalIcon className="h-4 w-4" />}
        >
          <UserCircleIcon className="h-5 w-5" />
          <span className="font-medium">{username}</span>
        </Button>
      </DropdownTrigger>
      <DropdownMenu aria-label="Profile Actions">
        <DropdownItem key="profile_info" textValue="Profile Info" className="opacity-90">
          <User
            name={username}
            description={userRole || "User"}
            avatarProps={{
              fallback: username?.charAt(0)?.toUpperCase() || "U",
            }}
          />
        </DropdownItem>
        <DropdownItem 
          key="logout" 
          startContent={<ArrowRightStartOnRectangleIcon className="h-4 w-4" />}
          description="Sign out of your account"
          color="danger"
          onPress={handleLogout}
        >
          Logout
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
};
