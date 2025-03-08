"use client"
import React from 'react';
import { Tabs, Tab } from "@heroui/react";
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

interface Section {
  key: string;
  label: string;
  href: string;
}

interface SectionTabsProps {
  sections: Section[];
  basePath: string;
}

export function SectionTabs({ sections, basePath }: SectionTabsProps) {
  const pathname = usePathname();
  const currentKey = sections.find(section => pathname.startsWith(section.href))?.key || sections[0].key;

  return (
    <div className="border-b border-divider">
      <Tabs 
        selectedKey={currentKey}
        aria-label="Sections"
        classNames={{
          base: "w-full",
          tabList: "gap-6 w-full relative px-6",
        }}
      >
        {sections.map((section) => (
          <Tab
            key={section.key}
            title={
              <Link href={section.href} className="px-4 py-2">
                {section.label}
              </Link>
            }
          />
        ))}
      </Tabs>
    </div>
  );
}
