'use client'
import React from 'react';
import { Tabs, Tab } from "@heroui/react";
import { useRouter, usePathname } from 'next/navigation';
import { Key } from 'react'; // Add this import

interface TabSection {
  key: string;
  label: string;
  href: string;
}

interface SectionTabsProps {
  sections: TabSection[];
  basePath: string;
}

export const SectionTabs = ({ sections, basePath }: SectionTabsProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const [selected, setSelected] = React.useState<Key | null>(null);

  React.useEffect(() => {
    const currentSection = sections.find(section => 
      pathname === section.href || pathname.startsWith(section.href + '/')
    );
    if (currentSection) {
      setSelected(currentSection.key);
    }
  }, [pathname, sections]);

  const handleTabChange = (key: Key) => {
    setSelected(key);
    const section = sections.find(s => s.key === key.toString());
    if (section) {
      router.push(section.href);
    }
  };

  return (
    <div className="w-full border-b border-divider bg-default-50">
      <div className="max-w-[90rem] mx-auto px-6">
        <Tabs 
          selectedKey={selected as any}
          onSelectionChange={handleTabChange}
          aria-label="Section tabs"
          color="primary"
          variant="underlined"
          classNames={{
            base: "w-full",
            tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider",
            cursor: "w-full",
            tab: "max-w-fit px-0 h-12",
            tabContent: "group-data-[selected=true]:text-primary"
          }}
        >
          {sections.map((section) => (
            <Tab key={section.key} title={section.label} />
          ))}
        </Tabs>
      </div>
    </div>
  );
};
