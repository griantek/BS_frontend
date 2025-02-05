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
          <a className="flex justify-start items-center gap-1" href="#" onClick={handleLogoClick}>
            <Logo />
            <p className="font-bold text-inherit">GRIANTEK</p>
          </a>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent
        className="hidden sm:flex basis-1/5 sm:basis-full"
        justify="end"
      >
        {isLoggedIn && isSupAdmin && (
          <NavbarItem className="hidden sm:flex gap-4">
            <NextLink
              className={clsx(
                linkStyles({ color: "foreground" }),
                "data-[active=true]:text-primary data-[active=true]:font-medium",
                isActiveLink('/supAdmin') && "text-primary font-medium"
              )}
              color="foreground"
              href="/supAdmin"
            >
              Dashboard
            </NextLink>
            <NextLink
              className={clsx(
                linkStyles({ color: "foreground" }),
                "data-[active=true]:text-primary data-[active=true]:font-medium",
                isActiveLink('/supAdmin/services') && "text-primary font-medium"
              )}
              color="foreground"
              href="/supAdmin/services"
            >
              Services
            </NextLink>
            <NextLink
              className={clsx(
                linkStyles({ color: "foreground" }),
                "data-[active=true]:text-primary data-[active=true]:font-medium",
                isActiveLink('/supAdmin/executives') && "text-primary font-medium"
              )}
              color="foreground"
              href="/supAdmin/executives"
            >
              Executives
            </NextLink>
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
          <NavbarMenuItem>
            <NextLink 
              className={clsx(
                linkStyles(),
                isActiveLink('/supAdmin') && "text-primary font-medium"
              )} 
              href="/supAdmin"
            >
              Dashboard
            </NextLink>
          </NavbarMenuItem>
          <NavbarMenuItem>
            <NextLink 
              className={clsx(
                linkStyles(),
                isActiveLink('/supAdmin/services') && "text-primary font-medium"
              )} 
              href="/supAdmin/services"
            >
              Services
            </NextLink>
          </NavbarMenuItem>
          <NavbarMenuItem>
            <NextLink 
              className={clsx(
                linkStyles(),
                isActiveLink('/supAdmin/executives') && "text-primary font-medium"
              )} 
              href="/supAdmin/executives"
            >
              Executives
            </NextLink>
          </NavbarMenuItem>
        </NavbarMenu>
      )}
    </HeroUINavbar>
  );
};
