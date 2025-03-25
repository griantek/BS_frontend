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

export const Sidebar = () => {
    // Initialize sidebar as collapsed by default
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
    
    // Check for user role
    const role = getUserRole();

    // Check if we're in different sections
    const isEditorPath = pathname?.startsWith('/business/editor');
    const isLeadsPath = pathname?.startsWith('/business/conversion/leads');
    const isExecutiveLeadsPath = pathname?.startsWith('/business/executive/leads');
    const isConversionPath = pathname === '/business/conversion';
    const isRecordsPath = pathname?.startsWith('/business/executive/records');

    React.useEffect(() => {
        // Check if the user has permissions for the various sections
        setHasDashboardPermission(currentUserHasPermission(PERMISSIONS.VIEW_DASHBOARD_EDITOR));
        setShowAssignedTable(currentUserHasPermission(PERMISSIONS.SHOW_ASSIGNED_TABLE));
        setShowJournalTable(currentUserHasPermission(PERMISSIONS.SHOW_JOURNAL_TABLE));
    }, []);

    // Generate Leads sidebar items (original conversion/leads path)
    const getLeadsSidebarItems = () => {
        return [
            { name: 'All Leads', icon: TableCellsIcon, path: '/business/conversion/leads/all' },
            { name: 'Followups', icon: BellAlertIcon, path: '/business/conversion/leads/followup' },
        ];
    };

    // Generate Executive Leads sidebar items (new executive/leads path)
    const getExecutiveLeadsSidebarItems = () => {
        return [
            { name: 'All Leads', icon: TableCellsIcon, path: '/business/executive/leads/all' },
            { name: 'Followups', icon: BellAlertIcon, path: '/business/executive/leads/followup' },
        ];
    };

    // Generate Executive Records sidebar items
    const getExecutiveRecordsSidebarItems = () => {
        return [
            { name: 'Prospects', icon: UserGroupIconOutline, path: '/business/executive/records/prospectus' },
            { name: 'Registrations', icon: DocumentDuplicateIcon, path: '/business/executive/records/registration' },
        ];
    };

    // Generate editor sidebar items
    const getEditorSidebarItems = () => {
        const items = [];
        
        // Only add Dashboard if user has permission
        if (hasDashboardPermission) {
            items.push({ name: 'Dashboard', icon: HomeIcon, path: '/business/editor' });
        }
        
        // Only add Assigned to me if user has permission
        if (showAssignedTable) {
            items.push({ name: 'Assigned to me', icon: ClipboardDocumentListIcon, path: '/business/editor/assigned' });
        }
        
        // Only add Journal Details if user has permission
        if (showJournalTable) {
            items.push({ name: 'Journal Details', icon: NewspaperIcon, path: '/business/editor/journals' });
        }
        
        return items;
    };

    // Generate client sidebar items
    const getClientSidebarItems = () => {
        return [
            { name: 'All Journals', icon: NewspaperIcon, path: '/business/clients/journals' },
            { name: 'Submissions', icon: ClipboardDocumentListIcon, path: '/business/clients/journals/submissions' },
            { name: 'Quotations', icon: DocumentTextIcon, path: '/business/clients/journals/quotations' },
        ];
    };

    // Toggle sidebar state manually (when button is clicked)
    const toggleSidebar = () => {
        // When manually toggled, update the persisted state
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        // Store preference in localStorage to persist the manual choice
        localStorage.setItem('sidebarCollapsed', newState.toString());
    };

    // Handle mouse enter - expand immediately on hover
    const handleMouseEnter = () => {
        // Clear any existing timer
        if (hoverTimerRef.current) {
            clearTimeout(hoverTimerRef.current);
        }
        
        // Set hovering state immediately
        setIsHovering(true);
    };

    // Handle mouse leave - collapse with slight delay
    const handleMouseLeave = () => {
        // Clear any existing timer
        if (hoverTimerRef.current) {
            clearTimeout(hoverTimerRef.current);
        }
        
        // Set hovering state to false immediately
        setIsHovering(false);
        
        // Using a short delay to prevent accidental collapse on quick mouse movements
        hoverTimerRef.current = setTimeout(() => {
            // Only auto-collapse if not manually expanded
            const isManuallyExpanded = localStorage.getItem('sidebarCollapsed') === 'false';
            if (!isManuallyExpanded) {
                setIsCollapsed(true);
            }
        }, 300);
    };

    const isActive = (path: string) => {
        // For editor paths
        if (path === '/business/editor/journals') {
            return pathname === path || 
                   pathname.startsWith('/business/editor/view/journal/') || 
                   pathname.startsWith('/business/editor/edit/journal/');
        }
        if (path === '/business/editor/assigned') {
            return pathname === path || 
                   pathname.startsWith('/business/editor/view/assigned/') ||
                   pathname.startsWith('/business/editor/assigned/');
        }
        
        // For leads paths (original conversion path)
        if (path === '/business/conversion/leads/all') {
            return pathname === path || 
                   pathname.match(/^\/business\/conversion\/leads\/\d+$/) ||
                   pathname === '/business/conversion/leads/add';
        }
        if (path === '/business/conversion/leads/followup') {
            return pathname === path || pathname.startsWith('/business/conversion/leads/followup');
        }

        // For executive leads paths (new path)
        if (path === '/business/executive/leads/all') {
            return pathname === path || 
                   pathname.match(/^\/business\/executive\/leads\/\d+$/) ||
                   pathname === '/business/executive/leads/add';
        }
        if (path === '/business/executive/leads/followup') {
            return pathname === path || pathname.startsWith('/business/executive/leads/followup');
        }

        // For executive records paths
        if (path === '/business/executive/records/prospectus') {
            return pathname === path || pathname.startsWith('/business/executive/records/prospectus');
        }
        if (path === '/business/executive/records/registration') {
            return pathname === path || pathname.startsWith('/business/executive/records/registration');
        }

        // For client journal paths
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
        
        return pathname === path;
    };

    const handleNavigation = (path: string) => {
        setIsNavigating(true);
        router.push(path);
    };

    // Add an effect to dispatch a custom event when sidebar state changes
    React.useEffect(() => {
        // Check if there's a saved preference
        const savedState = localStorage.getItem('sidebarCollapsed');
        if (savedState !== null) {
            setIsCollapsed(savedState === 'true');
        }
        
        // Update the CSS variable based on current state
        document.documentElement.style.setProperty(
            '--sidebar-width',
            isCollapsed && !isHovering ? '4rem' : '16rem'
        );
        
        // Clean up timers on unmount
        return () => {
            if (hoverTimerRef.current) {
                clearTimeout(hoverTimerRef.current);
            }
        };
    }, [isCollapsed, isHovering]);

    // Only show dashboard for conversion path - don't show sidebar
    if (isConversionPath && role === 'leads') {
        return null;
    }

    // Get appropriate sidebar items based on the path
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
                        : [];

    // If no sidebar items to show, don't render the sidebar
    if (sidebarItems.length === 0) {
        return null;
    }

    // Get title based on section
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
                "fixed top-16 left-0 h-[calc(100vh-4rem)] transition-all duration-300 z-50",
                isCollapsed && !isHovering ? "w-16" : "w-64",
                "hidden md:block",
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
                        <Button
                            key={item.path}
                            variant={isActive(item.path) ? "solid" : "light"}
                            color={isActive(item.path) ? "primary" : "default"}
                            className={clsx(
                                "justify-start w-full",
                                isCollapsed && !isHovering ? "px-2" : "px-4",
                                "h-10"
                            )}
                            startContent={
                                <item.icon className={clsx(
                                    "h-5 w-5 flex-shrink-0",
                                    isActive(item.path) ? "text-primary-foreground" : "text-foreground"
                                )} />
                            }
                            onClick={() => handleNavigation(item.path)}
                        >
                            {(!isCollapsed || isHovering) && <span>{item.name}</span>}
                        </Button>
                    ))}
                </div>
            </div>
        </Card>
    );
};
