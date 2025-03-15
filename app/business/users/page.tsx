'use client';
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, Divider, Spinner, Input } from "@nextui-org/react";
import { checkAuth } from "@/utils/authCheck";
import { useAuth } from "@/contexts/AuthContext";
import { UsersIcon, UserPlusIcon, KeyIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";

const UsersPage = () => {
    const router = useRouter();
    const { isLoggedIn, isClients } = useAuth();
    
    useEffect(() => {
        // Verify this page can only be accessed by users role
        checkAuth(router, 'clients');
    }, [router]);
    
    if (!isLoggedIn || !isClients) {
        return <div className="flex justify-center items-center h-screen"><Spinner size="lg" /></div>;
    }

    return (
        <div className="container mx-auto p-6 max-w-7xl">
            <h1 className="text-2xl font-bold mb-2">User Management</h1>
            <p className="text-default-500 mb-6">Manage system users and permissions</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* Dashboard Cards */}
                <Card className="p-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-primary/10">
                            <UsersIcon className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <p className="text-default-500">Total Users</p>
                            <h3 className="text-2xl font-bold">67</h3>
                        </div>
                    </div>
                </Card>
                
                <Card className="p-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-secondary/10">
                            <ShieldCheckIcon className="w-6 h-6 text-secondary" />
                        </div>
                        <div>
                            <p className="text-default-500">Active Sessions</p>
                            <h3 className="text-2xl font-bold">42</h3>
                        </div>
                    </div>
                </Card>
                
                <Card className="p-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-warning/10">
                            <KeyIcon className="w-6 h-6 text-warning" />
                        </div>
                        <div>
                            <p className="text-default-500">Pending Invites</p>
                            <h3 className="text-2xl font-bold">3</h3>
                        </div>
                    </div>
                </Card>
            </div>
            
            {/* Action buttons and search */}
            <div className="flex flex-col md:flex-row gap-3 justify-between mb-6">
                <div className="flex flex-wrap gap-3">
                    <Button color="primary" startContent={<UserPlusIcon className="w-4 h-4" />}>
                        Add User
                    </Button>
                    <Button variant="flat">
                        Manage Roles
                    </Button>
                </div>
                <div className="w-full md:w-72">
                    <Input
                        placeholder="Search users..."
                        size="sm"
                    />
                </div>
            </div>
            
            {/* Users Table */}
            <Card className="p-4">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-default-500 text-xs">
                                <th className="text-left p-2">NAME</th>
                                <th className="text-left p-2">EMAIL</th>
                                <th className="text-left p-2">ROLE</th>
                                <th className="text-left p-2">STATUS</th>
                                <th className="text-left p-2">LAST LOGIN</th>
                                <th className="text-right p-2">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {[
                                { name: "John Smith", email: "john@example.com", role: "Administrator", status: "Active", lastLogin: "Today" },
                                { name: "Emma Davis", email: "emma@example.com", role: "Executive", status: "Active", lastLogin: "Yesterday" },
                                { name: "Michael Johnson", email: "michael@example.com", role: "Editor", status: "Active", lastLogin: "Apr 15, 2024" },
                                { name: "Sarah Williams", email: "sarah@example.com", role: "Executive", status: "Inactive", lastLogin: "Mar 28, 2024" },
                                { name: "Robert Brown", email: "robert@example.com", role: "Leads", status: "Active", lastLogin: "Apr 16, 2024" },
                            ].map((user, index) => (
                                <tr key={index} className="border-b border-divider">
                                    <td className="p-2 font-medium">{user.name}</td>
                                    <td className="p-2">{user.email}</td>
                                    <td className="p-2">{user.role}</td>
                                    <td className="p-2">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            user.status === "Active" ? "bg-success/10 text-success" : "bg-default/20 text-default-500"
                                        }`}>
                                            {user.status}
                                        </span>
                                    </td>
                                    <td className="p-2">{user.lastLogin}</td>
                                    <td className="p-2 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button size="sm" variant="light">Edit</Button>
                                            <Button size="sm" variant="light" color="danger">Disable</Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default UsersPage;