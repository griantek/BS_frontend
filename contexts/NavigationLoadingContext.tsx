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
  const prevPathRef = React.useRef(pathname);

  useEffect(() => {
    if (prevPathRef.current !== pathname) {
      setIsNavigating(false);
    }
    prevPathRef.current = pathname;
  }, [pathname, searchParams]);

  const contextValue = React.useMemo(() => ({
    isNavigating, 
    setIsNavigating: (value: boolean) => {
      setIsNavigating(value);
    }
  }), [isNavigating]);

  return (
    <NavigationLoadingContext.Provider value={contextValue}>
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
