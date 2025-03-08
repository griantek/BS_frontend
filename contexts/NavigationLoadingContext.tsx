"use client";
import React, { createContext, useContext, useState, useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { PageLoadingSpinner } from '@/components/LoadingSpinner';

interface NavigationLoadingContextType {
  isNavigating: boolean;
  setIsNavigating: (value: boolean) => void;
}

const NavigationLoadingContext = createContext<NavigationLoadingContextType | undefined>(undefined);

function NavigationLoadingContent({ children }: { children: React.ReactNode }) {
  const [isNavigating, setIsNavigating] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    setIsNavigating(false);
  }, [pathname, searchParams]);

  return (
    <NavigationLoadingContext.Provider value={{ isNavigating, setIsNavigating }}>
      {isNavigating && <PageLoadingSpinner text="Loading page..." />}
      {children}
    </NavigationLoadingContext.Provider>
  );
}

export function NavigationLoadingProvider({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<PageLoadingSpinner text="Loading..." />}>
      <NavigationLoadingContent>{children}</NavigationLoadingContent>
    </Suspense>
  );
}

export const useNavigationLoading = () => {
  const context = useContext(NavigationLoadingContext);
  if (context === undefined) {
    throw new Error('useNavigationLoading must be used within a NavigationLoadingProvider');
  }
  return context;
};
