import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

const TOKEN_KEY = process.env.NEXT_PUBLIC_TOKEN_KEY || 'token';
const USER_KEY = process.env.NEXT_PUBLIC_USER_KEY || 'user';
const USER_ROLE_KEY = process.env.NEXT_PUBLIC_USER_ROLE_KEY || 'userRole';

export const getUserRole = (): 'editor' | 'executive' | 'admin' | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(USER_ROLE_KEY) as 'editor' | 'executive' | 'admin' | null;
};

export const isLoggedIn = (): boolean => {
  if (typeof window === 'undefined') return false;
  const token = localStorage.getItem(TOKEN_KEY);
  const user = localStorage.getItem(USER_KEY);
  return !!token && !!user;
};

export const redirectToLogin = (router: AppRouterInstance, userRole?: string) => {
  if (typeof window === 'undefined') return;
  const path = userRole === 'admin' ? '/admin/login' : '/business/executive/login';
  router.replace(path);
};

export const checkAuth = (router: AppRouterInstance, requiredRole?: 'editor' | 'executive' | 'admin'): boolean => {
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
  if (requiredRole && userRole !== requiredRole) {
    switch(userRole) {
      case 'editor':
        router.push('/business/editor');
        break;
      case 'executive':
        router.push('/business/executive');
        break;
      case 'admin':
        router.push('/admin');
        break;
      default:
        router.push('/');
    }
    return false;
  }

  return true;
};

export const redirectToDashboard = (router: AppRouterInstance) => {
  const userRole = getUserRole();
  switch(userRole) {
    case 'editor':
      router.replace('/business/editor');
      break;
    case 'executive':
      router.replace('/business/executive');
      break;
    case 'admin':
      router.replace('/admin');
      break;
    default:
      router.replace('/');
  }
};
