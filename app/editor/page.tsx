'use client';
import React from 'react';
import { withEditorAuth } from '@/components/withEditorAuth';

const EditorPage = () => {
    return (
        <div className="min-h-screen p-4">
            <h1 className="text-2xl font-bold mb-4">Editor Dashboard</h1>
            <div className="border rounded-lg p-4">
                <p>Editor content will go here</p>
            </div>
        </div>
    );
};

export default withEditorAuth(EditorPage);