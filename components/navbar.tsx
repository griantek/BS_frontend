"use client"
import React from 'react';
import { usePathname } from 'next/navigation';
import { getUserRole } from '@/utils/authCheck';
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
import { BellIcon } from "@heroicons/react/24/outline";
import { Badge } from "@heroui/badge";

import { siteConfig } from "@/config/site";
import { ThemeSwitch } from "@/components/theme-switch";
import { SearchIcon, Logo } from "@/components/icons";
import api from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigationLoading } from '@/contexts/NavigationLoadingContext';
import { ProfileMenu } from '@/components/ProfileMenu';
import { currentUserHasRecordsAccess, currentUserHasPermission, getCurrentUser, PERMISSIONS } from '@/utils/permissions';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<any>;
  isActive: boolean;
}

export const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoggedIn, isAdmin, isExecutive, isEditor, isLeads, isClients } = useAuth();
  const [notificationCount, setNotificationCount] = React.useState(5);
  const { setIsNavigating } = useNavigationLoading();
  const [username, setUsername] = React.useState<string>("");
  const [userRole, setUserRole] = React.useState<string>("");
  const [hasRecordsAccess, setHasRecordsAccess] = React.useState(false);
  const [hasDashboardPermission, setHasDashboardPermission] = React.useState(false);
  const [hasNotificationsPermission, setHasNotificationsPermission] = React.useState(false);
  const [showUsersNav, setShowUsersNav] = React.useState(false); 
  const [showServicesTab, setShowServicesTab] = React.useState(false); 
  const [showClientsTab, setShowClientsTab] = React.useState(false); 
  const [showFinanceTab, setShowFinanceTab] = React.useState(false);
  const [showDepartmentTab, setShowDepartmentTab] = React.useState(false);
  
  const isEditorPath = pathname?.startsWith('/business/editor');
  const isLeadsPath = pathname?.startsWith('/business/leads');
  const isClientsPath = pathname?.startsWith('/business/clients');

  React.useEffect(() => {
    // Get username from stored auth data
    if (isLoggedIn) {
      const userData = api.getStoredAuth()?.user;
      if (userData?.username) {
        setUsername(userData.username);
      }
      
      // Get role information
      const roleInfo = userData?.role?.name || localStorage.getItem('userRole') || '';
      setUserRole(roleInfo);
      
      // Check permissions
      setHasRecordsAccess(currentUserHasRecordsAccess());
      setHasDashboardPermission(currentUserHasPermission(PERMISSIONS.VIEW_DASHBOARD_EXECUTIVE));
      // Check for notification permission
      setHasNotificationsPermission(currentUserHasPermission(PERMISSIONS.VIEW_NOTIFICATIONS));
    }
  }, [isLoggedIn]);

  React.useEffect(() => {
    // Initialize the permission state when component mounts
    const initializePermissions = () => {
      const userData = api.getStoredUser();
      
      // Check if user is superadmin first
      if (userData?.role?.entity_type === 'SupAdmin') {
        // SuperAdmin has access to everything
        setShowUsersNav(true);
        setShowServicesTab(true);
        setShowClientsTab(true);
        setShowFinanceTab(true);  // SuperAdmin has finance tab access
        setShowDepartmentTab(true);  // SuperAdmin has department tab access
        return;
      }
      
      // For regular admins, default to false and only enable when permission is confirmed
      if (userData?.role?.entity_type === 'Admin') {
        // Check for users nav permission
        setShowUsersNav(currentUserHasPermission(PERMISSIONS.SHOW_USERS_NAV));
        
        // Check for services tab permission
        setShowServicesTab(currentUserHasPermission(PERMISSIONS.SHOW_SERVICES_TAB));
        
        // Check for clients tab permission
        setShowClientsTab(currentUserHasPermission(PERMISSIONS.SHOW_CLIENTS_TAB));

        // Check for finance tab permission
        setShowFinanceTab(currentUserHasPermission(PERMISSIONS.SHOW_FINANCE_TAB));

        // Check for department tab permission
        setShowDepartmentTab(currentUserHasPermission(PERMISSIONS.SHOW_DEPARTMENT_TAB));
      }
    };
    
    // Call initialization function
    initializePermissions();
    
    // Listen for permission changes
    const handleNavPermissionsChange = (event: CustomEvent) => {
      if (event.detail) {
        if (typeof event.detail.showUsersNav === 'boolean') {
          setShowUsersNav(event.detail.showUsersNav);
        }
        if (typeof event.detail.showServicesTab === 'boolean') {
          setShowServicesTab(event.detail.showServicesTab);
        }
        if (typeof event.detail.showClientsTab === 'boolean') {
          setShowClientsTab(event.detail.showClientsTab);
        }
        // Add handlers for new permission states
        if (typeof event.detail.showFinanceTab === 'boolean') {
          setShowFinanceTab(event.detail.showFinanceTab);
        }
        if (typeof event.detail.showDepartmentTab === 'boolean') {
          setShowDepartmentTab(event.detail.showDepartmentTab);
        }
      }
    };

    window.addEventListener('nav-permissions-change', 
      handleNavPermissionsChange as EventListener);

    return () => {
      window.removeEventListener('nav-permissions-change', 
        handleNavPermissionsChange as EventListener);
    };
  }, []);

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    let path = '/';
    
    if (isAdmin) {
      path = '/admin';
    } else if (isExecutive) {
      path = hasDashboardPermission 
        ? '/business/executive'
        : hasRecordsAccess 
          ? '/business/executive/records'
          : '/business/executive'; 
    } else if (isEditor) {
      path = '/business/editor';
    } else if (isLeads) {
      path = '/business/leads';
    } else if (isClients) {
      path = '/business/clients';
    }
    
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
    // Get role from localStorage for more reliable role detection
    const role = getUserRole();
    
    if (role === 'executive') {
      return siteConfig.executiveLinks.filter(link => {
        if (link.href === '/business/executive') {
          return hasDashboardPermission;
        }
        
        if (link.href === '/business/executive/records') {
          return hasRecordsAccess;
        }
        
        return true;
      });
    }
    
    if (role === 'admin') {
      const adminLinks = [...siteConfig.adminLinks];
      
      return adminLinks.filter(link => {
        if (link.href.includes('/admin/users')) {
          return showUsersNav;
        }
        
        if (link.href.includes('/admin/services')) {
          return showServicesTab;
        }
        
        if (link.href.includes('/admin/clients')) {
          return showClientsTab;
        }
        
        if (link.href.includes('/admin/finance')) {
          return showFinanceTab;
        }
        
        if (link.href.includes('/admin/department')) {
          return showDepartmentTab;
        }
        
        return true;
      });
    }
    
    if (role === 'editor') {
      return !isEditorPath ? siteConfig.editorLinks : [];
    }
    
    // Add navigation for new roles
    if (role === 'leads') {
      return !isLeadsPath ? siteConfig.leadsLinks : [];
    }
    
    if (role === 'clients') {
      return !isClientsPath ? siteConfig.clientsLinks : [];
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
              // Add null check for link before rendering
              link && (
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
              )
            ))}
          </NavbarItem>
        )}
        <NavbarItem className="hidden sm:flex gap-2 items-center">
          {isEditorPath && hasNotificationsPermission && <NotificationButton />}
          <ThemeSwitch />
          {isLoggedIn && username && (
            <ProfileMenu username={username} userRole={userRole} />
          )}
        </NavbarItem>
      </NavbarContent>

      <NavbarContent className="sm:hidden basis-1 pl-4" justify="end">
        {isEditorPath && hasNotificationsPermission && <NotificationButton />}
        <ThemeSwitch />
        {isLoggedIn && username && (
          <ProfileMenu username={username} userRole={userRole} isMobile={true} />
        )}
        <NavbarMenuToggle />
      </NavbarContent>

      <NavbarMenu>
        {/* Filter the navigation links for mobile menu as well */}
        {isLoggedIn && (() => {
          const role = getUserRole();
          switch (role) {
            case 'editor':
              return siteConfig.editorLinks;
            case 'executive':
              return getNavigationLinks();
            case 'admin':
              return getNavigationLinks();
            case 'leads':
              return siteConfig.leadsLinks;
            case 'clients':
              return siteConfig.clientsLinks;
            default:
              return [];
          }
        })().map((link) => (
          // Add null check for link before rendering
          link && (
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
          )
        ))}
      </NavbarMenu>
    </HeroUINavbar>
  );
};
