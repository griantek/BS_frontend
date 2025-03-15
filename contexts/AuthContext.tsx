"use client"
import React, { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  isLoggedIn: boolean;
  isAdmin: boolean;
  isExecutive: boolean;
  isEditor: boolean;
  isLeads: boolean;  // New role state
  isClients: boolean;  // New role state
  updateAuthState: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isExecutive, setIsExecutive] = useState(false);
  const [isEditor, setIsEditor] = useState(false);
  const [isLeads, setIsLeads] = useState(false);  // Initialize new role states
  const [isClients, setIsClients] = useState(false);  // Initialize new role states

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
      setIsLeads(userRole === 'leads');  // Set new role states
      setIsClients(userRole === 'clients');  // Set new role states
    } else {
      setIsAdmin(false);
      setIsExecutive(false);
      setIsEditor(false);
      setIsLeads(false);  // Reset on logout
      setIsClients(false);  // Reset on logout
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
      isLoggedIn, isAdmin, isExecutive, isEditor, isLeads, isClients, updateAuthState 
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
