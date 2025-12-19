import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// User roles - easy to extend later
export type UserRole = 'admin' | 'employee' | 'client';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, name: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Storage key - change this when connecting real backend
const STORAGE_KEY = 'agency_dashboard_user';
const USERS_KEY = 'agency_dashboard_users';

// Mock user database - in production, this would be your backend
const getStoredUsers = (): Record<string, { password: string; user: User }> => {
  const stored = localStorage.getItem(USERS_KEY);
  return stored ? JSON.parse(stored) : {};
};

const saveUsers = (users: Record<string, { password: string; user: User }>) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setUser(JSON.parse(stored));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const users = getStoredUsers();
    const userRecord = users[email.toLowerCase()];

    if (!userRecord) {
      return { success: false, error: 'No account found with this email' };
    }

    if (userRecord.password !== password) {
      return { success: false, error: 'Incorrect password' };
    }

    setUser(userRecord.user);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userRecord.user));
    return { success: true };
  };

  const signup = async (
    email: string,
    password: string,
    name: string,
    role: UserRole
  ): Promise<{ success: boolean; error?: string }> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const users = getStoredUsers();
    const emailLower = email.toLowerCase();

    if (users[emailLower]) {
      return { success: false, error: 'An account with this email already exists' };
    }

    const newUser: User = {
      id: crypto.randomUUID(),
      email: emailLower,
      name,
      role,
    };

    users[emailLower] = { password, user: newUser };
    saveUsers(users);

    setUser(newUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
