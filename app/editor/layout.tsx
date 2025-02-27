'use client';

import React from 'react';
import { Sidebar } from '@/components/sidebar';

export default function EditorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen pt-16">
            <Sidebar />
            <div className="transition-all duration-300 md:pl-[var(--sidebar-width,16rem)]">
                {children}
            </div>
        </div>
    );
}
