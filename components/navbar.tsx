'use client'
import React from 'react';
import { usePathname } from 'next/navigation';  // Add this import
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
import { Link } from "@heroui/link";
import { Input } from "@heroui/input";
import { link as linkStyles } from "@heroui/theme";
import NextLink from "next/link";
import clsx from "clsx";
import { useRouter } from 'next/navigation';
import { ArrowRightStartOnRectangleIcon } from '@heroicons/react/24/outline'; // Updated import
import {
  ChartBarIcon,
  UsersIcon,
  WrenchScrewdriverIcon,
  UserGroupIcon,
  BanknotesIcon,
  BuildingOfficeIcon,
  ChartPieIcon
} from '@heroicons/react/24/outline';

import { siteConfig } from "@/config/site";
import { ThemeSwitch } from "@/components/theme-switch";
import {
  TwitterIcon,
  GithubIcon,
  DiscordIcon,
  HeartFilledIcon,
  SearchIcon,
  Logo,
} from "@/components/icons";
import api from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<any>;
  isActive: boolean;
}

const navLinks: NavItem[] = [
  {
    label: "Dashboard",
    href: "/supAdmin",
    icon: ChartBarIcon,
    isActive: false,
  },
  {
    label: "Users",
    href: "/supAdmin/users/executives",
    icon: UsersIcon,
    isActive: false,
  },
  {
    label: "Services",
    href: "/supAdmin/services",
    icon: WrenchScrewdriverIcon,
    isActive: false,
  },
  {
    label: "Clients",
    href: "/supAdmin/clients",
    icon: UserGroupIcon,
    isActive: false,
  },
  {
    label: "Finance",
    href: "/supAdmin/finance",
    icon: BanknotesIcon,
    isActive: false,
  },
  {
    label: "Departments",
    href: "/supAdmin/department",
    icon: BuildingOfficeIcon,
    isActive: false,
  }
];

export const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoggedIn, isSupAdmin, isExecutive } = useAuth();  // Changed from isAdmin

  const handleLogout = () => {
    const userRole = localStorage.getItem('userRole');
    api.clearStoredAuth();
    
    if (userRole === 'supAdmin') {
      router.replace('/supAdmin/login');
    } else {
      router.replace('/business/login');  // Changed from '/admin'
    }
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isSupAdmin) {
      router.push('/supAdmin');
    } else if (isExecutive) {
      router.push('/business');
    } else {
      router.push('/');
    }
  };

  const isActiveLink = (path: string) => {
    return pathname === path;
  };

  const isActiveMainPath = (path: string) => {
    // For dashboard, only match exact path
    if (path === '/supAdmin') {
      return pathname === '/supAdmin';
    }
    // For other sections, match the section prefix
    return pathname.startsWith(path) && pathname !== '/supAdmin';
  };

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
        {isLoggedIn && isSupAdmin && (
          <NavbarItem className="hidden sm:flex gap-4">
            {navLinks.map((link) => (
              <NextLink
                key={link.href}
                className={clsx(
                  linkStyles({ color: "foreground" }),
                  "data-[active=true]:text-primary data-[active=true]:font-medium flex items-center gap-2",
                  isActiveMainPath(link.href) && "text-primary font-medium"
                )}
                color="foreground"
                href={link.href}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </NextLink>
            ))}
          </NavbarItem>
        )}
        {isLoggedIn && isExecutive && (
          <NavbarItem className="hidden sm:flex gap-4">
            <NextLink
              className={clsx(
                linkStyles({ color: "foreground" }),
                "data-[active=true]:text-primary data-[active=true]:font-medium",
                isActiveLink('/business') && "text-primary font-medium"
              )}
              color="foreground"
              href="/business"
            >
              Dashboard
            </NextLink>
            {/* Add any other executive-specific navigation items here */}
          </NavbarItem>
        )}
        <NavbarItem className="hidden sm:flex gap-2">
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

      {isSupAdmin && (
        <NavbarMenu>
          {navLinks.map((link) => (
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
      )}
    </HeroUINavbar>
  );
};
