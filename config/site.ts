import { Home, Users, Building2, Banknote, Briefcase, BookOpen } from "lucide-react";
import {
  NewspaperIcon,
  TableCellsIcon
} from '@heroicons/react/24/outline';

export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Griantek Business Management",
  description: "Manage your business operations",
  
  // Super Admin Navigation
  adminLinks: [
    {
      label: "Dashboard",
      href: "/admin",
      icon: Home
    },
    {
      label: "Users",
      href: "/admin/users/executives",
      icon: Users
    },
    {
      label: "Services",
      href: "/admin/services",
      icon: Briefcase
    },
    {
      label: "Clients",
      href: "/admin/clients",
      icon: Building2
    },
    {
      label: "Finance",
      href: "/admin/finance",
      icon: Banknote
    },
    {
      label: "Departments",
      href: "/admin/department",
      icon: BookOpen
    }
  ],

  // Executive Navigation
  executiveLinks: [
    {
      label: "Dashboard",
      href: "/business/executive",
      icon: Home,
    },
    {
      label: "Records",
      href: "/business/executive/records",
      icon: TableCellsIcon,
    }
  ],

  // Editor Navigation
  editorLinks: [
    {
      label: "Dashboard",
      href: "/business/editor",
      icon: Home,
    },
    {
      label: "Journals",
      href: "/business/editor/journals",
      icon: NewspaperIcon,
    }
  ],

  navItems: [
    {
      label: "Home",
      href: "/",
    },
    {
      label: "Docs",
      href: "/docs",
    },
    {
      label: "Pricing",
      href: "/pricing",
    },
    {
      label: "Blog",
      href: "/blog",
    },
    {
      label: "About",
      href: "/about",
    },
  ],
  navMenuItems: [
    {
      label: "Profile",
      href: "/profile",
    },
    {
      label: "Dashboard",
      href: "/dashboard",
    },
    {
      label: "Projects",
      href: "/projects",
    },
    {
      label: "Team",
      href: "/team",
    },
    {
      label: "Calendar",
      href: "/calendar",
    },
    {
      label: "Settings",
      href: "/settings",
    },
    {
      label: "Help & Feedback",
      href: "/help-feedback",
    },
    {
      label: "Logout",
      href: "/logout",
    },
  ],
  links: {
    github: "https://github.com/heroui-inc/heroui",
    twitter: "https://twitter.com/hero_ui",
    docs: "https://heroui.com",
    discord: "https://discord.gg/9b6yyZKmH4",
    sponsor: "https://patreon.com/jrgarciadev",
  },
};
