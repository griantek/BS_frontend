import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

const TOKEN_KEY = process.env.NEXT_PUBLIC_TOKEN_KEY || 'token';
const USER_KEY = process.env.NEXT_PUBLIC_USER_KEY || 'user';
const USER_ROLE_KEY = process.env.NEXT_PUBLIC_USER_ROLE_KEY || 'userRole';

export const getUserRole = (): 'executive' | 'supAdmin' | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(USER_ROLE_KEY) as 'executive' | 'supAdmin' | null;
};

export const isLoggedIn = (): boolean => {
  if (typeof window === 'undefined') return false;
  const token = localStorage.getItem(TOKEN_KEY);
  const user = localStorage.getItem(USER_KEY);
  return !!token && !!user;
};

export const redirectToLogin = (router: AppRouterInstance, userRole?: string) => {
  if (typeof window === 'undefined') return;
  const path = userRole === 'supAdmin' ? '/supAdmin/login' : '/business/login';
  router.replace(path);
};

export const checkAuth = (router: AppRouterInstance, requiredRole?: 'executive' | 'supAdmin'): boolean => {
  if (typeof window === 'undefined') return false;
  
  const token = localStorage.getItem(TOKEN_KEY);
  const user = localStorage.getItem(USER_KEY);
  const userRole = localStorage.getItem(USER_ROLE_KEY);

  // Not logged in
  if (!token || !user) {
    redirectToLogin(router, userRole || requiredRole);
    return false;
  }

  // Check role-specific access
  if (requiredRole) {
    if (requiredRole === 'supAdmin' && userRole !== 'supAdmin') {
      router.push('/business');
      return false;
    }
    if (requiredRole === 'executive' && userRole === 'supAdmin') {
      router.push('/supAdmin');
      return false;
    }
  }

  return true;
};

export const redirectToDashboard = (router: AppRouterInstance) => {
  const userRole = getUserRole();
  if (userRole === 'supAdmin') {
    router.replace('/supAdmin');
  } else if (userRole === 'executive') {
    router.replace('/business');
  }
};
