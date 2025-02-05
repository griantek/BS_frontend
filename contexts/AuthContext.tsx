'use client'
import React, { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  isLoggedIn: boolean;
  isSupAdmin: boolean;
  isAdmin: boolean;
  updateAuthState: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSupAdmin, setIsSupAdmin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const updateAuthState = () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    const userRole = localStorage.getItem('userRole');
    
    const loggedIn = Boolean(token && user);
    setIsLoggedIn(loggedIn);
    
    if (loggedIn) {
      setIsSupAdmin(userRole === 'supAdmin');
      setIsAdmin(userRole === 'admin');
    } else {
      setIsSupAdmin(false);
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    updateAuthState();
    window.addEventListener('auth-change', updateAuthState);
    window.addEventListener('storage', updateAuthState);
    
    return () => {
      window.removeEventListener('auth-change', updateAuthState);
      window.removeEventListener('storage', updateAuthState);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, isSupAdmin, isAdmin, updateAuthState }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
