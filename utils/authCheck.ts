import { useRouter } from 'next/navigation';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

type Router = ReturnType<typeof useRouter>;

const TOKEN_KEY = process.env.NEXT_PUBLIC_TOKEN_KEY;
const USER_KEY = process.env.NEXT_PUBLIC_USER_KEY;
const LOGIN_STATUS_KEY = process.env.NEXT_PUBLIC_LOGIN_STATUS_KEY;
const USER_ROLE_KEY = process.env.NEXT_PUBLIC_USER_ROLE_KEY || 'defaultRole';

export const checkAuth = (router: AppRouterInstance, role?: 'admin' | 'supAdmin'): boolean => {
  const token = localStorage.getItem(TOKEN_KEY);
  const user = localStorage.getItem(USER_KEY);
  const isLoggedIn = localStorage.getItem(LOGIN_STATUS_KEY);
  const userRole = localStorage.getItem(USER_ROLE_KEY);

  if (!token || !user || isLoggedIn !== 'true') {
    router.replace(role === 'supAdmin' ? '/supAdmin/login' : '/admin');
    return false;
  }

  if (role) {
    if (role === 'supAdmin' && userRole !== 'supAdmin') {
      router.replace('/admin');
      return false;
    }
    if (role === 'admin' && userRole === 'supAdmin') {
      router.replace('/supAdmin');
      return false;
    }
  }

  return true;
};
