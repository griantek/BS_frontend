import {
  ChartBarIcon,
  UsersIcon,
  WrenchScrewdriverIcon,
  UserGroupIcon,
  BanknotesIcon,
  BuildingOfficeIcon,
  NewspaperIcon,
  HomeIcon
} from '@heroicons/react/24/outline';

export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Business suite",
  
  // Super Admin Navigation
  adminLinks: [
    {
      label: "Dashboard",
      href: "/admin",
      icon: ChartBarIcon,
    },
    {
      label: "Users",
      href: "/admin/users/executives",
      icon: UsersIcon,
    },
    {
      label: "Services",
      href: "/admin/services",
      icon: WrenchScrewdriverIcon,
    },
    {
      label: "Clients",
      href: "/admin/clients",
      icon: UserGroupIcon,
    },
    {
      label: "Finance",
      href: "/admin/finance",
      icon: BanknotesIcon,
    },
    {
      label: "Departments",
      href: "/admin/department",
      icon: BuildingOfficeIcon,
    }
  ],

  // Executive Navigation
  executiveLinks: [
    {
      label: "Dashboard",
      href: "/business/executive",
      icon: HomeIcon,
    }
  ],

  // Editor Navigation
  editorLinks: [
    {
      label: "Dashboard",
      href: "/business/editor",
      icon: HomeIcon,
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
