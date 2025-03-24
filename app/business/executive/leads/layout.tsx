"use client";

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/sidebar';

export default function LeadsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarWidth, setSidebarWidth] = useState('4rem'); // Start with collapsed width

  // Add effect to listen for CSS variable changes that control sidebar width
  useEffect(() => {
    // Function to get the current sidebar width from CSS variable
    const updateSidebarWidth = () => {
      const width = getComputedStyle(document.documentElement)
        .getPropertyValue('--sidebar-width').trim();
      setSidebarWidth(width || '4rem');
    };

    // Initial update
    updateSidebarWidth();

    // Create a MutationObserver to watch for changes to the style attribute
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'style') {
          updateSidebarWidth();
        }
      });
    });

    // Start observing
    observer.observe(document.documentElement, { attributes: true });

    // Add an event listener for resize events to handle responsive behavior
    const handleResize = () => updateSidebarWidth();
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div>
      <Sidebar />
      <main 
        className="transition-all duration-300"
        style={{ 
          paddingLeft: `var(--sidebar-width, ${sidebarWidth})` 
        }}
      >
        {children}
      </main>
    </div>
  );
}
