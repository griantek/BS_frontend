"use client";
import React from 'react';
import { withEditorAuth } from '@/components/withEditorAuth';
import { 
  Card, 
  CardBody, 
  CardHeader, 
  Divider, 
  Chip, 
  Button,
  Progress
} from "@heroui/react";
import { format } from 'date-fns';
import api from '@/services/api';
import { useRouter } from "next/navigation";
import type { JournalData } from '@/services/api';
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { currentUserHasPermission, PERMISSIONS } from '@/utils/permissions';
import { 
  DocumentTextIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  ArrowPathIcon,
  ChevronRightIcon,
  PencilIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';

// Define local interfaces to replace the non-existent API interfaces
interface DashboardStats {
  total_journals: number;
  published_count: number;
  pending_count: number;
  under_review_count: number;
  approved_count: number;
  rejected_count: number;
  total_assigned: number;
}

interface ActivityItem {
  id: number;
  journal_id: number;
  journal_name: string;
  client_name: string;
  action: 'created' | 'updated' | 'status_changed';
  old_status?: string;
  new_status?: string;
  timestamp: string;
}

const EditorPage = () => {
    const router = useRouter();
    const [stats, setStats] = React.useState<DashboardStats | null>(null);
    const [activities, setActivities] = React.useState<ActivityItem[]>([]);
    const [assignedJournals, setAssignedJournals] = React.useState<JournalData[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isRefreshing, setIsRefreshing] = React.useState(false);
    
    // We'll use assigned registrations for a section
    const [registrationsCount, setRegistrationsCount] = React.useState(0);
    const [canViewAllJournals, setCanViewAllJournals] = React.useState(false);

    const fetchDashboardData = async () => {
        try {
            setIsRefreshing(true);
            const user = api.getStoredUser();
            if (!user || !user.id) {
                throw new Error("User data not found");
            }
            
            // Fetch journals and calculate stats
            const journalsResponse = await api.getJournalDataByEditor(user.id);
            if (journalsResponse.success) {
                const journals = journalsResponse.data;
                
                // Fetch assigned registrations count
                const regsResponse = await api.getAssignedRegistrations(user.id);
                const registrationsCount = regsResponse.success ? regsResponse.data.length : 0;
                setRegistrationsCount(registrationsCount);
                
                // Calculate stats from journals
                const calculatedStats: DashboardStats = {
                    total_journals: journals.length, // Use journals assigned to this editor
                    published_count: journals.filter(j => j.status === 'approved').length,
                    pending_count: journals.filter(j => j.status === 'pending').length,
                    under_review_count: journals.filter(j => j.status === 'under review').length,
                    approved_count: journals.filter(j => j.status === 'approved').length,
                    rejected_count: journals.filter(j => j.status === 'rejected').length,
                    total_assigned: registrationsCount
                };
                
                setStats(calculatedStats);
                
                // Set assigned journals (first 3)
                setAssignedJournals(journals.slice(0, 3));
                
                // Create synthetic activities from journal updates
                const syntheticActivities: ActivityItem[] = journals
                    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
                    .slice(0, 5)
                    .map((journal, index) => ({
                        id: index + 1,
                        journal_id: journal.id,
                        journal_name: journal.journal_name,
                        client_name: journal.client_name,
                        action: 'status_changed',
                        new_status: journal.status,
                        timestamp: journal.updated_at
                    }));
                
                setActivities(syntheticActivities);
            }
            
            // Check permission for viewing all journals
            setCanViewAllJournals(
                currentUserHasPermission(PERMISSIONS.SHOW_JOURNAL_TABLE)
            );
            
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            toast.error('Failed to load dashboard data');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    React.useEffect(() => {
        fetchDashboardData();
    }, []);

    const handleRefresh = () => {
        fetchDashboardData();
    };

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return format(date, 'MMM dd, yyyy HH:mm');
        } catch (error) {
            return dateString;
        }
    };

    const getFormattedDate = () => {
        return format(new Date(), "EEEE, MMMM d, yyyy");
    };

    const getStatusColor = (status: string) => {
        switch(status?.toLowerCase()) {
            case 'approved':
                return 'success';
            case 'rejected':
                return 'danger';
            case 'under review':
                return 'warning';
            case 'pending':
                return 'primary';
            default:
                return 'default';
        }
    };
    
    const getStatusIcon = (status: string) => {
        switch(status?.toLowerCase()) {
            case 'approved':
                return <CheckCircleIcon className="h-5 w-5 text-success" />;
            case 'rejected':
                return <ExclamationTriangleIcon className="h-5 w-5 text-danger" />;
            case 'under review':
                return <ClockIcon className="h-5 w-5 text-warning" />;
            case 'pending':
                return <ClockIcon className="h-5 w-5 text-primary" />;
            default:
                return <DocumentTextIcon className="h-5 w-5 text-default-500" />;
        }
    };

    if (isLoading) {
        return <LoadingSpinner text="Loading dashboard..." />;
    }

    return (
        <div className="min-h-screen p-6 space-y-6">
            {/* Header */}
            <Card>
                <CardHeader className="flex justify-between items-center px-6 py-4">
                    <div>
                        <h1 className="text-2xl font-bold">Editor Dashboard</h1>
                        <p className="text-default-500 text-sm">{getFormattedDate()}</p>
                    </div>
                    <Button
                        isIconOnly
                        variant="light"
                        onClick={handleRefresh}
                        isLoading={isRefreshing}
                    >
                        <ArrowPathIcon className={`h-5 w-5 ${isRefreshing ? "animate-spin" : ""}`} />
                    </Button>
                </CardHeader>
            </Card>

            {/* Quick Access Panel */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Assigned Journals */}
                <Card className="col-span-1">
                    <CardHeader className="flex justify-between px-6 py-4">
                        <h2 className="text-lg font-bold">Journals Overview</h2>
                        {canViewAllJournals && (
                            <Button
                                variant="light"
                                color="primary"
                                size="sm"
                                endContent={<ChevronRightIcon className="h-4 w-4" />}
                                onClick={() => router.push('/business/editor/journals')}
                            >
                                View All
                            </Button>
                        )}
                    </CardHeader>
                    <CardBody>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <StatsCard
                                title="Total Journal Submissions"
                                value={stats?.total_journals || 0}
                                color="default"
                                icon={<DocumentTextIcon className="h-8 w-8 text-default-500" />}
                            />
                            <StatsCard
                                title="Pending Submissions"
                                value={stats?.total_assigned || 0}
                                color="primary"
                                icon={<ClipboardDocumentListIcon className="h-8 w-8 text-primary" />}
                            />
                        </div>
                        
                        <Divider className="my-4" />
                        
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Pending</span>
                                <span className="text-sm font-semibold">{stats?.pending_count || 0}</span>
                            </div>
                            <Progress 
                                value={stats?.pending_count || 0} 
                                maxValue={stats?.total_journals || 1} 
                                color="primary"
                                className="h-2"
                            />
                            
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Under Review</span>
                                <span className="text-sm font-semibold">{stats?.under_review_count || 0}</span>
                            </div>
                            <Progress 
                                value={stats?.under_review_count || 0} 
                                maxValue={stats?.total_journals || 1} 
                                color="warning"
                                className="h-2"
                            />
                            
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Approved</span>
                                <span className="text-sm font-semibold">{stats?.approved_count || 0}</span>
                            </div>
                            <Progress 
                                value={stats?.approved_count || 0} 
                                maxValue={stats?.total_journals || 1} 
                                color="success"
                                className="h-2"
                            />
                            
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Rejected</span>
                                <span className="text-sm font-semibold">{stats?.rejected_count || 0}</span>
                            </div>
                            <Progress 
                                value={stats?.rejected_count || 0} 
                                maxValue={stats?.total_journals || 1} 
                                color="danger"
                                className="h-2"
                            />
                        </div>
                    </CardBody>
                </Card>

                {/* Assigned Registrations */}
                <Card className="col-span-1">
                    <CardHeader className="flex justify-between px-6 py-4">
                        <h2 className="text-lg font-bold">Pending Submissions</h2>
                        <Button
                            variant="light"
                            color="primary"
                            size="sm"
                            endContent={<ChevronRightIcon className="h-4 w-4" />}
                            onClick={() => router.push('/business/editor/assigned')}
                        >
                            View All
                        </Button>
                    </CardHeader>
                    <CardBody>
                        <div className="flex flex-col items-center justify-center h-48">
                            <div className="bg-primary/10 p-4 rounded-full mb-4">
                                <ClipboardDocumentListIcon className="h-12 w-12 text-primary" />
                            </div>
                            <h3 className="text-2xl font-bold">{registrationsCount}</h3>
                            <p className="text-default-500">Pending Journal Submissions</p>
                            <Button
                                color="primary"
                                className="mt-4"
                                onClick={() => router.push('/business/editor/assigned')}
                            >
                                Manage Submissions
                            </Button>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Recent Journals */}
            <Card>
                <CardHeader className="flex justify-between px-6 py-4">
                    <h2 className="text-lg font-bold">Recent Assigned Journals</h2>
                    {canViewAllJournals && (
                        <Button
                            variant="light"
                            color="primary"
                            size="sm"
                            endContent={<ChevronRightIcon className="h-4 w-4" />}
                            onClick={() => router.push('/business/editor/journals')}
                        >
                            View All Journals
                        </Button>
                    )}
                </CardHeader>
                <Divider />
                <CardBody>
                    {assignedJournals.length > 0 ? (
                        <div className="space-y-4">
                            {assignedJournals.map((journal) => (
                                <div 
                                    key={journal.id} 
                                    className="p-4 bg-default-50 rounded-lg hover:bg-default-100 transition-colors cursor-pointer"
                                    onClick={() => router.push(`/business/editor/view/journal/${journal.id}`)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            router.push(`/business/editor/view/journal/${journal.id}`);
                                        }
                                    }}
                                >
                                    <div className="flex justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            {getStatusIcon(journal.status)}
                                            <h3 className="font-semibold">{journal.journal_name}</h3>
                                        </div>
                                        <Chip 
                                            size="sm" 
                                            color={getStatusColor(journal.status)}
                                        >
                                            {journal.status}
                                        </Chip>
                                    </div>
                                    <div className="flex flex-col md:flex-row md:justify-between text-sm text-default-500">
                                        <span>Client: {journal.client_name}</span>
                                        <span>Last updated: {formatDate(journal.updated_at)}</span>
                                    </div>
                                    <div className="mt-2 flex justify-end gap-2">
                                        <Button
                                            size="sm"
                                            variant="flat"
                                            color="primary"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                router.push(`/business/editor/view/journal/${journal.id}`);
                                            }}
                                        >
                                            View Details
                                        </Button>
                                        {currentUserHasPermission(PERMISSIONS.SHOW_EDIT_BUTTON_EDITOR) && (
                                            <Button
                                                size="sm"
                                                variant="flat"
                                                color="secondary"
                                                startContent={<PencilIcon className="h-4 w-4" />}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    router.push(`/business/editor/edit/journal/${journal.id}`);
                                                }}
                                            >
                                                Edit
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-4 text-default-500">
                            No journals have been assigned to you yet.
                        </div>
                    )}
                </CardBody>
            </Card>

            {/* Recent Activity */}
            {/* <Card>
                <CardHeader>
                    <h2 className="text-lg font-bold">Recent Activity</h2>
                </CardHeader>
                <Divider />
                <CardBody>
                    {activities.length > 0 ? (
                        <div className="space-y-4">
                            {activities.map((activity) => (
                                <ActivityItem 
                                    key={activity.id} 
                                    activity={activity} 
                                    onClickJournal={(journalId) => router.push(`/business/editor/view/journal/${journalId}`)} 
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-4 text-default-500">
                            No recent activity
                        </div>
                    )}
                </CardBody>
            </Card> */}
        </div>
    );
};

// Helper Components
const StatsCard = ({ title, value, color, icon }: { 
    title: string; 
    value: number; 
    color: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
    icon: React.ReactNode;
}) => (
    <div className={`p-4 bg-${color}-50 border border-${color}-200 rounded-lg`}>
        <div className="flex justify-between items-center">
            <div>
                <p className="text-sm text-default-500">{title}</p>
                <h3 className={`text-2xl font-bold mt-1 text-${color}`}>{value}</h3>
            </div>
            <div>
                {icon}
            </div>
        </div>
    </div>
);

const ActivityItem = ({ 
    activity, 
    onClickJournal 
}: { 
    activity: ActivityItem;
    onClickJournal: (journalId: number) => void;
}) => (
    <div 
        className="flex items-center justify-between p-3 rounded-lg bg-default-50 hover:bg-default-100 transition-colors cursor-pointer"
        onClick={() => onClickJournal(activity.journal_id)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                onClickJournal(activity.journal_id);
            }
        }}
    >
        <div className="space-y-1">
            <div className="flex items-center gap-2">
                <p className="font-medium">{activity.journal_name}</p>
                <Chip size="sm" variant="flat">
                    {activity.client_name}
                </Chip>
            </div>
            <p className="text-sm text-default-500">
                {activity.action === 'status_changed' ? (
                    <>Status changed {activity.old_status ? `from ${activity.old_status}` : ""} to {activity.new_status}</>
                ) : activity.action === 'created' ? (
                    'New journal created'
                ) : (
                    'Journal updated'
                )}
            </p>
        </div>
        <p className="text-sm text-default-400">
            {format(new Date(activity.timestamp), 'MMM dd, yyyy HH:mm')}
        </p>
    </div>
);

// Use the withEditorAuth HOC with dashboard permission check
export default withEditorAuth(EditorPage, PERMISSIONS.VIEW_DASHBOARD_EDITOR);