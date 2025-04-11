"use client";

import React from 'react';
import { Card, Button, Divider, Badge } from "@heroui/react";
import { usePathname, useRouter } from 'next/navigation';
import {
    HomeIcon,
    NewspaperIcon,
    ChartBarIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ClipboardDocumentListIcon,
    UsersIcon,
    BellAlertIcon,
    CheckIcon,
    TableCellsIcon,
    UserPlusIcon,
    DocumentTextIcon,
    UserGroupIcon as UserGroupIconOutline,
    DocumentDuplicateIcon
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useNavigationLoading } from '@/contexts/NavigationLoadingContext';
import { currentUserHasPermission, PERMISSIONS } from '@/utils/permissions';
import { getUserRole } from '@/utils/authCheck';
import api from '@/services/api';

// Define an interface for sidebar items to fix type errors
interface SidebarItem {
    name: string;
    icon: React.ForwardRefExoticComponent<any>;
    path: string;
    badge?: boolean;
    count?: number;
}

export const Sidebar = () => {
    const [isCollapsed, setIsCollapsed] = React.useState(true);
    const [isHovering, setIsHovering] = React.useState(false);
    const sidebarRef = React.useRef<HTMLDivElement>(null);
    const hoverTimerRef = React.useRef<NodeJS.Timeout | null>(null);
    const router = useRouter();
    const pathname = usePathname();
    const { setIsNavigating } = useNavigationLoading();
    const [hasDashboardPermission, setHasDashboardPermission] = React.useState(true);
    const [showAssignedTable, setShowAssignedTable] = React.useState(true);
    const [showJournalTable, setShowJournalTable] = React.useState(true);
    const [pendingSubmissionsCount, setPendingSubmissionsCount] = React.useState(0);

    const role = getUserRole();

    const isEditorPath = pathname?.startsWith('/business/editor');
    const isLeadsPath = pathname?.startsWith('/business/conversion/leads');
    const isExecutiveLeadsPath = pathname?.startsWith('/business/executive/leads');
    const isConversionPath = pathname === '/business/conversion';
    const isRecordsPath = pathname?.startsWith('/business/executive/records');
    const isAuthorPath = pathname?.startsWith('/business/author');

    React.useEffect(() => {
        setHasDashboardPermission(currentUserHasPermission(PERMISSIONS.VIEW_DASHBOARD_EDITOR));
        setShowAssignedTable(currentUserHasPermission(PERMISSIONS.SHOW_ASSIGNED_TABLE));
        setShowJournalTable(currentUserHasPermission(PERMISSIONS.SHOW_JOURNAL_TABLE));
    }, []);

    const fetchPendingSubmissionsCount = async () => {
        try {
            if (role === 'editor') {
                const user = api.getStoredUser();
                if (user && user.id) {
                    const response = await api.getAssignedRegistrations(user.id);
                    if (response && response.data) {
                        setPendingSubmissionsCount(response.data.length);
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching pending submissions count:', error);
        }
    };

    React.useEffect(() => {
        fetchPendingSubmissionsCount();

        const intervalId = setInterval(fetchPendingSubmissionsCount, 5 * 60 * 1000);

        return () => clearInterval(intervalId);
    }, [role]);

    const getLeadsSidebarItems = (): SidebarItem[] => {
        return [
            { name: 'All Leads', icon: TableCellsIcon, path: '/business/conversion/leads/all' },
            { name: 'Followups', icon: BellAlertIcon, path: '/business/conversion/leads/followup' },
        ];
    };

    const getExecutiveLeadsSidebarItems = (): SidebarItem[] => {
        return [
            { name: 'All Leads', icon: TableCellsIcon, path: '/business/executive/leads/all' },
            { name: 'Followups', icon: BellAlertIcon, path: '/business/executive/leads/followup' },
        ];
    };

    const getExecutiveRecordsSidebarItems = (): SidebarItem[] => {
        return [
            { name: 'Prospects', icon: UserGroupIconOutline, path: '/business/executive/records/prospectus' },
            { name: 'Registrations', icon: DocumentDuplicateIcon, path: '/business/executive/records/registration' },
        ];
    };

    const getEditorSidebarItems = (): SidebarItem[] => {
        const items: SidebarItem[] = [];

        if (hasDashboardPermission) {
            items.push({ name: 'Dashboard', icon: HomeIcon, path: '/business/editor', badge: false });
        }

        if (showAssignedTable) {
            items.push({
                name: 'Pending Submissions',
                icon: ClipboardDocumentListIcon,
                path: '/business/editor/assigned',
                badge: true,
                count: pendingSubmissionsCount
            });
        }

        if (showJournalTable) {
            items.push({ name: 'Journal Submissions', icon: NewspaperIcon, path: '/business/editor/journals', badge: false });
        }

        return items;
    };

    const getClientSidebarItems = (): SidebarItem[] => {
        return [
            { name: 'All Journals', icon: NewspaperIcon, path: '/business/clients/journals' },
            { name: 'Submissions', icon: ClipboardDocumentListIcon, path: '/business/clients/journals/submissions' },
            { name: 'Quotations', icon: DocumentTextIcon, path: '/business/clients/journals/quotations' },
        ];
    };

    const getAuthorSidebarItems = (): SidebarItem[] => {
        return [
            { name: 'Dashboard', icon: HomeIcon, path: '/business/author' },
            { name: 'Assigned Tasks', icon: ClipboardDocumentListIcon, path: '/business/author/tasks' },
            { name: 'Completed Work', icon: CheckIcon, path: '/business/author/completed' },
        ];
    };

    const toggleSidebar = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem('sidebarCollapsed', newState.toString());
    };

    const handleMouseEnter = () => {
        if (hoverTimerRef.current) {
            clearTimeout(hoverTimerRef.current);
        }

        setIsHovering(true);
    };

    const handleMouseLeave = () => {
        if (hoverTimerRef.current) {
            clearTimeout(hoverTimerRef.current);
        }

        setIsHovering(false);

        hoverTimerRef.current = setTimeout(() => {
            const isManuallyExpanded = localStorage.getItem('sidebarCollapsed') === 'false';
            if (!isManuallyExpanded) {
                setIsCollapsed(true);
            }
        }, 300);
    };

    const isActive = (path: string) => {
        if (path === '/business/editor/journals') {
            return pathname === path ||
                pathname.startsWith('/business/editor/view/journal/') ||
                pathname.startsWith('/business/editor/edit/journal/') ||
                pathname.startsWith('/business/editor/view/journal/byEmail/');
        }
        if (path === '/business/editor/journals/analysis') {
            return pathname === '/business/editor/journals/analysis' ||
                pathname.startsWith('/business/editor/view/journal/byEmail');
        }

        if (path === '/business/conversion/leads/all') {
            return pathname === path ||
                pathname.match(/^\/business\/conversion\/leads\/\d+$/) ||
                pathname === '/business/conversion/leads/add';
        }
        if (path === '/business/conversion/leads/followup') {
            return pathname === path || pathname.startsWith('/business/conversion/leads/followup');
        }

        if (path === '/business/executive/leads/all') {
            return pathname === path ||
                pathname.match(/^\/business\/executive\/leads\/\d+$/) ||
                pathname === '/business/executive/leads/add';
        }
        if (path === '/business/executive/leads/followup') {
            return pathname === path || pathname.startsWith('/business/executive/leads/followup');
        }

        if (path === '/business/executive/records/prospectus') {
            return pathname === path || pathname.startsWith('/business/executive/records/prospectus');
        }
        if (path === '/business/executive/records/registration') {
            return pathname === path || pathname.startsWith('/business/executive/records/registration');
        }

        if (path === '/business/clients/journals') {
            return pathname === path ||
                pathname.startsWith('/business/clients/journals/') &&
                !pathname.includes('submissions') &&
                !pathname.includes('quotations');
        }

        if (path === '/business/clients/journals/submissions') {
            return pathname.includes('/business/clients/journals/submissions');
        }

        if (path === '/business/clients/journals/quotations') {
            return pathname.includes('/business/clients/journals/quotations');
        }

        if (path === '/business/author/tasks') {
            return pathname === path ||
                pathname.startsWith('/business/author/tasks/');
        }
        if (path === '/business/author/completed') {
            return pathname === path ||
                pathname.startsWith('/business/author/completed/');
        }

        return pathname === path;
    };

    const handleNavigation = (path: string) => {
        // Only set navigating state and push to router if we're not already on this path
        if (pathname !== path) {
            setIsNavigating(true);
            router.push(path);
        }
    };

    React.useEffect(() => {
        const savedState = localStorage.getItem('sidebarCollapsed');
        if (savedState !== null) {
            setIsCollapsed(savedState === 'true');
        }

        document.documentElement.style.setProperty(
            '--sidebar-width',
            isCollapsed && !isHovering ? '4rem' : '16rem'
        );

        return () => {
            if (hoverTimerRef.current) {
                clearTimeout(hoverTimerRef.current);
            }
        };
    }, [isCollapsed, isHovering]);

    if (isConversionPath && role === 'leads') {
        return null;
    }

    const sidebarItems = isLeadsPath && role === 'leads'
        ? getLeadsSidebarItems()
        : isExecutiveLeadsPath && role === 'executive'
            ? getExecutiveLeadsSidebarItems()
            : isRecordsPath && role === 'executive'
                ? getExecutiveRecordsSidebarItems()
                : isEditorPath && role === 'editor'
                    ? getEditorSidebarItems()
                    : pathname?.startsWith('/business/clients/journals') && role === 'clients'
                        ? getClientSidebarItems()
                        : isAuthorPath && role === 'author'
                            ? getAuthorSidebarItems()
                            : [];

    if (sidebarItems.length === 0) {
        return null;
    }

    const sidebarTitle = isLeadsPath || isExecutiveLeadsPath
        ? "Lead Management"
        : isRecordsPath
            ? "Records Management"
            : pathname?.startsWith('/business/clients/journals')
                ? "Journal Management"
                : "Navigation";

    return (
        <Card
            ref={sidebarRef}
            className={clsx(
                "fixed top-16 left-0 h-[calc(100vh-4rem)] transition-all duration-300 z-20",
                isCollapsed && !isHovering ? "w-16" : "w-64",
                "border-t-0 rounded-none bg-background/80 backdrop-blur-md",
                "shadow-sm border-r border-divider"
            )}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div className="flex flex-col h-full p-3">
                <div className="flex items-center justify-between mb-4">
                    {(!isCollapsed || isHovering) && (
                        <p className="font-semibold text-foreground">{sidebarTitle}</p>
                    )}
                    <Button
                        isIconOnly
                        variant="light"
                        onClick={toggleSidebar}
                        className="ml-auto"
                        title={isCollapsed && !isHovering ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        {isCollapsed && !isHovering ?
                            <ChevronRightIcon className="h-4 w-4" /> :
                            <ChevronLeftIcon className="h-4 w-4" />
                        }
                    </Button>
                </div>

                <Divider className="my-2" />

                <div className="flex flex-col gap-2">
                    {sidebarItems.map((item) => (
                        <div key={item.path} className="relative">
                            <Button
                                variant={isActive(item.path) ? "solid" : "light"}
                                color={isActive(item.path) ? "primary" : "default"}
                                className={clsx(
                                    "justify-start w-full",
                                    isCollapsed && !isHovering ? "px-2" : "px-4",
                                    "h-10"
                                )}
                                startContent={
                                    <div className="relative">
                                        <item.icon className={clsx(
                                            "h-5 w-5 flex-shrink-0",
                                            isActive(item.path) ? "text-primary-foreground" : "text-foreground"
                                        )} />
                                        {/* Show badge next to icon when collapsed */}
                                        {isCollapsed && !isHovering && item.badge && item.count && item.count > 0 && (
                                            <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-xs text-white">
                                                {item.count > 99 ? "99+" : item.count}
                                            </span>
                                        )}
                                    </div>
                                }
                                onClick={() => handleNavigation(item.path)}
                            >
                                {(!isCollapsed || isHovering) && (
                                    <div className="flex items-center">
                                        <span>{item.name}</span>
                                        {/* Show badge next to text when expanded */}
                                        {item.badge && item.count && item.count > 0 && (
                                            <span className="ml-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1.5 text-xs text-white">
                                                {item.count > 99 ? "99+" : item.count}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        </Card>
    );
};
