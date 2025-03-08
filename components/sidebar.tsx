"use client";

import React from 'react';
import { Card, Button, Divider } from "@heroui/react";
import { usePathname, useRouter } from 'next/navigation';
import {
    HomeIcon,
    NewspaperIcon,
    ChartBarIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ClipboardDocumentListIcon // Add this import
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useNavigationLoading } from '@/contexts/NavigationLoadingContext';

const sidebarItems = [
    { name: 'Dashboard', icon: HomeIcon, path: '/business/editor' },
    { name: 'Assigned to me', icon: ClipboardDocumentListIcon, path: '/business/editor/assigned' }, 
    { name: 'Journal Details', icon: NewspaperIcon, path: '/business/editor/journals' },
    // { name: 'Reports', icon: ChartBarIcon, path: '/editor/reports' },
];

export const Sidebar = () => {
    const [isCollapsed, setIsCollapsed] = React.useState(false);
    const router = useRouter();
    const pathname = usePathname();
    const { setIsNavigating } = useNavigationLoading();

    const toggleSidebar = () => setIsCollapsed(!isCollapsed);

    const isActive = (path: string) => {
        if (path === '/business/editor/journals') {
            return pathname === path || 
                   pathname.startsWith('/business/editor/view/journal/') || 
                   pathname.startsWith('/business/editor/edit/journal/');
        }
        if (path === '/business/editor/assigned') {
            return pathname === path || 
                   pathname.startsWith('/business/editor/view/assigned/') ||  // Add this line
                   pathname.startsWith('/business/editor/assigned/');
        }
        return pathname === path;
    };

    const handleNavigation = (path: string) => {
        setIsNavigating(true);
        router.push(path);
    };

    // Add an effect to dispatch a custom event when sidebar state changes
    React.useEffect(() => {
        document.documentElement.style.setProperty(
            '--sidebar-width',
            isCollapsed ? '4rem' : '16rem'
        );
    }, [isCollapsed]);

    return (
        <Card 
            className={clsx(
                "fixed top-16 left-0 h-[calc(100vh-4rem)] transition-all duration-300 z-50", // Increased z-index
                isCollapsed ? "w-16" : "w-64",
                "hidden md:block",
                "border-t-0 rounded-none bg-background/80 backdrop-blur-md", // Added blur effect
                "shadow-sm border-r border-divider"
            )}
        >
            <div className="flex flex-col h-full p-3">
                <div className="flex items-center justify-between mb-4">
                    {!isCollapsed && (
                        <p className="font-semibold text-foreground">Navigation</p>
                    )}
                    <Button
                        isIconOnly
                        variant="light"
                        onClick={toggleSidebar}
                        className="ml-auto"
                    >
                        {isCollapsed ? 
                            <ChevronRightIcon className="h-4 w-4" /> : 
                            <ChevronLeftIcon className="h-4 w-4" />
                        }
                    </Button>
                </div>

                <Divider className="my-2" />

                <div className="flex flex-col gap-2">
                    {sidebarItems.map((item) => (
                        <Button
                            key={item.path}
                            variant={isActive(item.path) ? "solid" : "light"}
                            color={isActive(item.path) ? "primary" : "default"}
                            className={clsx(
                                "justify-start w-full",
                                isCollapsed ? "px-2" : "px-4",
                                "h-10" // Match navbar button height
                            )}
                            startContent={
                                <item.icon className={clsx(
                                    "h-5 w-5 flex-shrink-0",
                                    isActive(item.path) ? "text-primary-foreground" : "text-foreground"
                                )} />
                            }
                            onClick={() => handleNavigation(item.path)}
                        >
                            {!isCollapsed && <span>{item.name}</span>}
                        </Button>
                    ))}
                </div>
            </div>
        </Card>
    );
};
