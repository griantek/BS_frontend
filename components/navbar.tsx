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

export const Navbar = () => {
  const pathname = usePathname();  // Add this hook
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [isSupAdmin, setIsSupAdmin] = React.useState(false);
  const [isAdmin, setIsAdmin] = React.useState(false);

  React.useEffect(() => {
    // More comprehensive check for login status
    const checkLoginStatus = () => {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      const loginStatus = localStorage.getItem('isLoggedIn');
      const userRole = localStorage.getItem('userRole');
      
      const loggedIn = !!(token && user && loginStatus === 'true');
      setIsLoggedIn(loggedIn);
      setIsSupAdmin(userRole === 'supAdmin');
      setIsAdmin(loggedIn && userRole !== 'supAdmin'); // Admin is logged in but not supAdmin
    };

    // Check immediately
    checkLoginStatus();

    // Also listen for storage events to handle changes
    window.addEventListener('storage', checkLoginStatus);
    
    return () => {
      window.removeEventListener('storage', checkLoginStatus);
    };
  }, []);

  const handleLogout = () => {
    // Clear all auth data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userRole');
    setIsLoggedIn(false);
    setIsSupAdmin(false);
    setIsAdmin(false);
    // Use window.location for hard redirect
    window.location.href = '/admin';
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
          <NextLink className="flex justify-start items-center gap-1" href="/">
            <Logo />
            <p className="font-bold text-inherit">ACME</p>
          </NextLink>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent
        className="hidden sm:flex basis-1/5 sm:basis-full"
        justify="end"
      >
        {isSupAdmin && (
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
        <NavbarItem className="hidden sm:flex gap-2">
          <ThemeSwitch />
          {isLoggedIn && (isSupAdmin || isAdmin) && (
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
        {isLoggedIn && (isSupAdmin || isAdmin) && (
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
