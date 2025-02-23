'use client';
import React from 'react';
import { withEditorAuth } from '@/components/withEditorAuth';

const EditorPage = () => {
    return (
        <div className="min-h-screen ">
            {/* Header */}
            <header className=" shadow-sm p-4">
                <h1 className="text-2xl font-bold text-gray-800">Editor Dashboard</h1>
            </header>

            {/* Main Content */}
            <main className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Stats Card */}
                    <div className=" rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold mb-2">Total Articles</h2>
                        <p className="text-3xl font-bold text-blue-600">0</p>
                    </div>

                    {/* Stats Card */}
                    <div className="rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold mb-2">Published</h2>
                        <p className="text-3xl font-bold text-green-600">0</p>
                    </div>

                    {/* Stats Card */}
                    <div className="rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold mb-2">Drafts</h2>
                        <p className="text-3xl font-bold text-yellow-600">0</p>
                    </div>
                </div>

                {/* Recent Activity Section */}
                <div className="mt-8 rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
                    <div className="border-t">
                        <p className="py-4 text-gray-500">No recent activity</p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default withEditorAuth(EditorPage);