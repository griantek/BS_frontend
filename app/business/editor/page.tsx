'use client';
import React from 'react';
import { withEditorAuth } from '@/components/withEditorAuth';
import { Card, CardBody, CardHeader, Divider, Chip } from "@nextui-org/react";
import { format } from 'date-fns';
import api from '@/services/api';
import { useRouter } from "next/navigation";
import type { DashboardStats, ActivityItem } from '@/services/api'; // Change to type-only import
import { LoadingSpinner } from "@/components/LoadingSpinner";

// Mock data
const MOCK_STATS: DashboardStats = {
    total_journals: 45,
    published_count: 12,
    pending_count: 15,
    under_review_count: 8,
    approved_count: 18,
    rejected_count: 4,
    total_assigned: 25
};

const MOCK_ACTIVITIES: ActivityItem[] = [
    {
        id: 1,
        journal_id: 101,
        journal_name: "International Journal of Science",
        client_name: "John Doe",
        action: "status_changed",
        old_status: "pending",
        new_status: "under review",
        timestamp: new Date().toISOString()
    },
    {
        id: 2,
        journal_id: 102,
        journal_name: "Research Quarterly",
        client_name: "Jane Smith",
        action: "created",
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    },
    {
        id: 3,
        journal_id: 103,
        journal_name: "Technology Review",
        client_name: "Mike Johnson",
        action: "status_changed",
        old_status: "under review",
        new_status: "approved",
        timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
    }
];

const EditorPage = () => {
    const router = useRouter();
    const [stats, setStats] = React.useState<DashboardStats | null>(null);
    const [activities, setActivities] = React.useState<ActivityItem[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const user = api.getStoredUser();
                
                // Simulate API call with mock data
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Set mock data
                setStats(MOCK_STATS);
                setActivities(MOCK_ACTIVITIES);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (isLoading) {
        return <LoadingSpinner text="Loading dashboard..." />;
    }

    return (
        <div className="min-h-screen p-6 space-y-6">
            {/* Header */}
            <Card>
                <CardHeader className="px-6 py-4">
                    <h1 className="text-2xl font-bold">Editor Dashboard</h1>
                </CardHeader>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    title="Total Journals"
                    value={stats?.total_journals || 0}
                    color="default"
                />
                <StatsCard
                    title="Under Review"
                    value={stats?.under_review_count || 0}
                    color="warning"
                />
                <StatsCard
                    title="Approved"
                    value={stats?.approved_count || 0}
                    color="success"
                />
                <StatsCard
                    title="Pending"
                    value={stats?.pending_count || 0}
                    color="primary"
                />
            </div>

            {/* Recent Activity */}
            <Card>
                <CardHeader>
                    <h2 className="text-xl font-semibold">Recent Activity</h2>
                </CardHeader>
                <Divider />
                <CardBody>
                    {activities.length > 0 ? (
                        <div className="space-y-4">
                            {activities.map((activity) => (
                                <ActivityItem key={activity.id} activity={activity} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-4 text-gray-500">
                            No recent activity
                        </div>
                    )}
                </CardBody>
            </Card>
        </div>
    );
};

// Helper Components
const StatsCard = ({ title, value, color }: { 
    title: string; 
    value: number; 
    color: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' 
}) => (
    <Card>
        <CardBody className="p-6">
            <p className="text-sm text-default-500">{title}</p>
            <h3 className={`text-3xl font-bold mt-2 text-${color}`}>{value}</h3>
        </CardBody>
    </Card>
);

const ActivityItem = ({ activity }: { activity: ActivityItem }) => (
    <div className="flex items-center justify-between p-3 rounded-lg bg-default-50">
        <div className="space-y-1">
            <div className="flex items-center gap-2">
                <p className="font-medium">{activity.journal_name}</p>
                <Chip size="sm" variant="flat">
                    {activity.client_name}
                </Chip>
            </div>
            <p className="text-sm text-default-500">
                {activity.action === 'status_changed' ? (
                    <>Status changed from {activity.old_status} to {activity.new_status}</>
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

export default withEditorAuth(EditorPage);