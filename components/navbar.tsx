"use client"
import React from 'react';
import { usePathname } from 'next/navigation';  // Add this import
import { getUserRole } from '@/utils/authCheck';  // Add this import
import {
  Navbar as HeroUINavbar,
  NavbarContent,
  NavbarMenu,
  NavbarMenuToggle,
  NavbarBrand,
  NavbarItem,
  NavbarMenuItem,
} from "@heroui/navbar";
import { Button } from "@heroui/button";
import { Kbd } from "@heroui/kbd";
import { Input } from "@heroui/input";
import { link as linkStyles } from "@heroui/theme";
import NextLink from "next/link";
import clsx from "clsx";
import { useRouter } from 'next/navigation';
import { ArrowRightStartOnRectangleIcon } from '@heroicons/react/24/outline'; // Updated import
import { Badge } from "@heroui/badge";
import { BellIcon } from "@heroicons/react/24/outline";

import { siteConfig } from "@/config/site";
import { ThemeSwitch } from "@/components/theme-switch";
import {
  SearchIcon,
  Logo,
} from "@/components/icons";
import api from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigationLoading } from '@/contexts/NavigationLoadingContext';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<any>;
  isActive: boolean;
}

export const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoggedIn, isAdmin, isExecutive } = useAuth();  // Changed from isAdmin
  const [notificationCount, setNotificationCount] = React.useState(5); // Example count
  const { setIsNavigating } = useNavigationLoading();
  
  // Add this line to declare isEditorPath
  const isEditorPath = pathname?.startsWith('/business/editor');

  const handleLogout = () => {
    const userRole = localStorage.getItem('userRole');
    api.clearStoredAuth();
    
    if (userRole === 'admin') {
      router.replace('/admin/login');
    } else {
      router.replace('/business/executive/login');
    }
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const path = isAdmin ? '/admin' : isExecutive ? '/business/executive' : '/';
    setIsNavigating(true);
    router.push(path);
  };

  const handleNavigation = (path: string) => {
    setIsNavigating(true);
    router.push(path);
  };

  const isActiveLink = (path: string) => {
    return pathname === path;
  };

  const isActiveMainPath = (path: string) => {
    // For dashboard pages, only match exact path
    if (path === '/admin' || path === '/business/executive' || path === '/business/editor') {
      return pathname === path;
    }
  
    // Special handling for admin sections
    if (path.startsWith('/admin/')) {
      const section = path.split('/')[2]; // Get 'users', 'clients', etc.
      return pathname.startsWith('/admin/' + section);
    }
  
    // For other sections, match the section prefix
    return pathname.startsWith(path) && !pathname.match(/^\/(admin|executive|editor)$/);
  };

  const getNavigationLinks = () => {
    // Now using the properly declared isEditorPath variable
    if (isAdmin) {
      return siteConfig.adminLinks;
    }
    if (isExecutive) {
      return siteConfig.executiveLinks;
    }
    const role = getUserRole();
    if (role === 'editor') {
      // Only return links if we're in mobile view or not in editor section
      return !isEditorPath ? siteConfig.editorLinks : [];
    }
    return [];
  };

  // Add notification button component
  const NotificationButton = () => (
    <Button
      isIconOnly
      variant="light"
      className="relative"
      aria-label="Notifications"
    >
      <BellIcon 
        className={clsx(
          "h-5 w-5 transition-colors",
          notificationCount > 0 && "text-danger animate-pulse"
        )} 
      />
      {notificationCount > 0 && (
        <Badge
          className="absolute -top-2 -right-2"
          color="danger"
          size="sm"
        >
          {notificationCount}
        </Badge>
      )}
    </Button>
  );

  const searchInput = (
    <Input
      aria-label="Search"
      classNames={{
        inputWrapper: "bg-default-100",
        input: "text-sm",
      }}
      endContent={
        <Kbd className="hidden lg:inline-block" keys={["command"]}>
          K
        </Kbd>
      }
      labelPlacement="outside"
      placeholder="Search..."
      startContent={
        <SearchIcon className="text-base text-default-400 pointer-events-none flex-shrink-0" />
      }
      type="search"
    />
  );

  return (
    <HeroUINavbar maxWidth="xl" position="sticky">
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarBrand as="li" className="gap-3 max-w-fit">
          <Button
            className="flex justify-start items-center gap-1"
            onClick={handleLogoClick}
            variant="light"
          >
            <Logo />
            <p className="font-bold text-inherit">GRIANTEK</p>
          </Button>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent
        className="hidden sm:flex basis-1/5 sm:basis-full"
        justify="end"
      >
        {isLoggedIn && (
          <NavbarItem className="hidden sm:flex gap-4">
            {getNavigationLinks().map((link) => (
              <NextLink
                key={link.href}
                className={clsx(
                  linkStyles({ color: "foreground" }),
                  "data-[active=true]:text-primary data-[active=true]:font-medium flex items-center gap-2",
                  isActiveMainPath(link.href) && "text-primary font-medium"
                )}
                color="foreground"
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavigation(link.href);
                }}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </NextLink>
            ))}
            {/* {isEditorPath && <NotificationButton />} */}
          </NavbarItem>
        )}
        <NavbarItem className="hidden sm:flex gap-2">
          {isEditorPath && <NotificationButton />}
          <ThemeSwitch />
          {isLoggedIn && (
            <Button
              color="danger"
              variant="light"
              onClick={handleLogout}
              startContent={<ArrowRightStartOnRectangleIcon className="h-5 w-5" />}
            >
              Logout
            </Button>
          )}
        </NavbarItem>
      </NavbarContent>

      <NavbarContent className="sm:hidden basis-1 pl-4" justify="end">
        {isEditorPath && <NotificationButton />}
        <ThemeSwitch />
        {isLoggedIn && (
          <Button
            isIconOnly
            color="danger"
            variant="light"
            onClick={handleLogout}
            title="Logout"
          >
            <ArrowRightStartOnRectangleIcon className="h-5 w-5" />
          </Button>
        )}
        <NavbarMenuToggle />
      </NavbarContent>

      <NavbarMenu>
        {/* Show all navigation links in mobile menu, including editor links */}
        {isLoggedIn && (getUserRole() === 'editor' ? siteConfig.editorLinks : getNavigationLinks()).map((link) => (
          <NavbarMenuItem key={link.href}>
            <NextLink 
              className={clsx(
                linkStyles(),
                "flex items-center gap-2",
                isActiveMainPath(link.href) && "text-primary font-medium"
              )} 
              href={link.href}
            >
              <link.icon className="w-4 h-4" />
              {link.label}
            </NextLink>
          </NavbarMenuItem>
        ))}
      </NavbarMenu>
    </HeroUINavbar>
  );
};
