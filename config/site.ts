import { Home, Users, Building2, Banknote, Briefcase, BookOpen } from "lucide-react";
import {
  NewspaperIcon,
  TableCellsIcon,
  UserGroupIcon,
  ClipboardDocumentCheckIcon,
  UserCircleIcon,
  CogIcon,
  UserPlusIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { 
  ChartPieIcon, 
  UsersIcon, 
  ClipboardDocumentCheckIcon as ClipboardDocumentCheckIconHero, 
  CubeIcon, 
  CreditCardIcon, 
  BookOpenIcon,
  WrenchScrewdriverIcon,
  UserGroupIcon as UserGroupIconHero,
  NewspaperIcon as NewspaperIconHero,
  BuildingOfficeIcon,
  DocumentTextIcon,
  UserIcon,
  TableCellsIcon as TableCellsIconHero,
  UserPlusIcon as UserPlusIconHero,
  BellAlertIcon,
  ClipboardDocumentListIcon,
  ChatBubbleLeftRightIcon,
  CheckIcon,
  CurrencyDollarIcon
} from "@heroicons/react/24/outline";

export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Griantek Business Management System",
  description: "A comprehensive solution for managing your business operations.",
  
  // Super Admin Navigation
  adminLinks: [
    {
      label: "Dashboard",
      href: "/admin",
      icon: ChartPieIcon
    },
    {
      label: "Users",
      href: "/admin/users",
      icon: UserGroupIcon
    },
    {
      label: "Services",
      href: "/admin/services",
      icon: WrenchScrewdriverIcon
    },
    {
      label: "Approval",
      href: "/admin/approval",
      icon: ClipboardDocumentCheckIcon
    },
    {
      label: "Finance",
      href: "/admin/finance",
      icon: CurrencyDollarIcon
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
      icon: ChartPieIcon,
    },
    {
      label: "Leads", // New tab for leads in executive section
      href: "/business/executive/leads/all",
      icon: UserPlusIcon,
    },
    {
      label: "Records",
      href: "/business/executive/records",
      icon: DocumentTextIcon,
    },
    {
      label: "Journals",
      href: "/business/executive/journals",
      icon: NewspaperIconHero,
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
    },
  ],

  // Leads Navigation - Add navigation for the leads role
  leadsLinks: [
    {
      label: "Dashboard",
      href: "/business/conversion",
      icon: ChartPieIcon
    },
    {
      label: "All Leads",
      href: "/business/conversion/leads/all",
      icon: TableCellsIconHero,
    },
    {
      label: "Follow-ups",
      href: "/business/conversion/followup",
      icon: BellAlertIcon
    }
  ],

  // Users Navigation - Add navigation for the users role
  clientsLinks: [
    {
      label: "Dashboard",
      href: "/business/clients",
      icon: ChartPieIcon, 
    },
    {
      label: "Journals", // Single main journal entry point
      href: "/business/clients/journals", 
      icon: NewspaperIconHero,
    },
    {
      label: "Support",
      href: "/business/clients/support",
      icon: ChatBubbleLeftRightIcon,
    },
  ],

  // Author Navigation - Add navigation for the author role
  authorLinks: [
    {
      label: "Dashboard",
      href: "/business/author",
      icon: ChartPieIcon
    },
    {
      label: "Assigned Tasks",
      href: "/business/author/tasks",
      icon: ClipboardDocumentListIcon
    },
    {
      label: "Completed Work",
      href: "/business/author/completed",
      icon: CheckIcon
    },
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
