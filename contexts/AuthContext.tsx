'use client'
import React, { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  isLoggedIn: boolean;
  isSupAdmin: boolean;
  isExecutive: boolean;  // Changed from isAdmin
  updateAuthState: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSupAdmin, setIsSupAdmin] = useState(false);
  const [isExecutive, setIsExecutive] = useState(false);  // Changed from isAdmin

  const updateAuthState = () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    const userRole = localStorage.getItem('userRole');
    
    const loggedIn = Boolean(token && user);
    setIsLoggedIn(loggedIn);
    
    if (loggedIn) {
      setIsSupAdmin(userRole === 'supAdmin');
      setIsExecutive(userRole === 'executive');  // Changed from 'admin'
    } else {
      setIsSupAdmin(false);
      setIsExecutive(false);
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
    <AuthContext.Provider value={{ isLoggedIn, isSupAdmin, isExecutive, updateAuthState }}>
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
