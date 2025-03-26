"use client"
import React, { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  isLoggedIn: boolean;
  isAdmin: boolean;
  isExecutive: boolean;
  isEditor: boolean;
  isLeads: boolean;
  isClients: boolean;
  isAuthor: boolean;
  updateAuthState: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isExecutive, setIsExecutive] = useState(false);
  const [isEditor, setIsEditor] = useState(false);
  const [isLeads, setIsLeads] = useState(false);
  const [isClients, setIsClients] = useState(false);
  const [isAuthor, setIsAuthor] = useState(false);

  const updateAuthState = () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    const userRole = localStorage.getItem('userRole');
    
    const loggedIn = Boolean(token && user);
    setIsLoggedIn(loggedIn);
    
    if (loggedIn) {
      setIsAdmin(userRole === 'admin');
      setIsExecutive(userRole === 'executive');
      setIsEditor(userRole === 'editor');
      setIsLeads(userRole === 'leads');
      setIsClients(userRole === 'clients');
      setIsAuthor(userRole === 'author');
    } else {
      setIsAdmin(false);
      setIsExecutive(false);
      setIsEditor(false);
      setIsLeads(false);
      setIsClients(false);
      setIsAuthor(false);
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
    <AuthContext.Provider value={{ 
      isLoggedIn, isAdmin, isExecutive, isEditor, isLeads, isClients, isAuthor, updateAuthState 
    }}>
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
