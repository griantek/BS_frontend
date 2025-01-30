import { useRouter } from 'next/navigation';

type Router = ReturnType<typeof useRouter>;

const TOKEN_KEY = process.env.NEXT_PUBLIC_TOKEN_KEY;
const USER_KEY = process.env.NEXT_PUBLIC_USER_KEY;
const LOGIN_STATUS_KEY = process.env.NEXT_PUBLIC_LOGIN_STATUS_KEY;
const USER_ROLE_KEY = process.env.NEXT_PUBLIC_USER_ROLE_KEY || 'defaultRole';

export const checkAuth = (router: Router, requiredRole?: 'admin' | 'supAdmin') => {
  const token = localStorage.getItem(TOKEN_KEY);
  const isLoggedIn = localStorage.getItem(LOGIN_STATUS_KEY);
  const user = localStorage.getItem(USER_KEY);
  const userRole = localStorage.getItem(USER_ROLE_KEY);

  if (!token || !user || isLoggedIn !== 'true') {
    window.location.href = userRole === 'supAdmin' ? '/supAdmin/login' : '/admin';
    return false;
  }

  if (requiredRole && userRole !== requiredRole) {
    window.location.href = userRole === 'supAdmin' ? '/supAdmin' : '/business';
    return false;
  }

  return true;
};
