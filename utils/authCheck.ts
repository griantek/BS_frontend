import { useRouter } from 'next/navigation';

type Router = ReturnType<typeof useRouter>;

const TOKEN_KEY = process.env.NEXT_PUBLIC_TOKEN_KEY;
const USER_KEY = process.env.NEXT_PUBLIC_USER_KEY;
const LOGIN_STATUS_KEY = process.env.NEXT_PUBLIC_LOGIN_STATUS_KEY;

export const checkAuth = (router: Router) => {
  const token = localStorage.getItem(TOKEN_KEY);
  const isLoggedIn = localStorage.getItem(LOGIN_STATUS_KEY);
  const user = localStorage.getItem(USER_KEY);

  if (!token || !user || isLoggedIn !== 'true') {
    console.log('Auth check failed:', { token, isLoggedIn, user });
    // Don't use router.replace here as it can cause loops
    window.location.href = '/admin';
    return false;
  }
  return true;
};
