import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// User roles - easy to extend later
export type UserRole = 'admin' | 'employee' | 'client';

export interface UserProfile {
  phone?: string;
  address?: string;
  companyName?: string;
  profilePicture?: string; // base64 data URL for demo purposes
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  disabled?: boolean;
  profile?: UserProfile;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  getAllUsers: () => User[];
  updateUserRole: (userId: string, newRole: UserRole) => boolean;
  toggleUserStatus: (userId: string) => boolean;
  updateProfile: (updates: { name?: string; profile?: UserProfile }) => boolean;
  changePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Storage keys
const STORAGE_KEY = 'agency_dashboard_user';
const USERS_KEY = 'agency_dashboard_users';

// Pre-seeded admin account
const ADMIN_EMAIL = 'rusafhasan544@gmail.com';
const ADMIN_PASSWORD = 'rusafhasan544@gmail.com';
const ADMIN_USER: User = {
  id: 'admin-001',
  email: ADMIN_EMAIL,
  name: 'Admin',
  role: 'admin',
  disabled: false,
};

// Initialize users with admin account
const initializeUsers = (): Record<string, { password: string; user: User }> => {
  const stored = localStorage.getItem(USERS_KEY);
  if (stored) {
    const users = JSON.parse(stored);
    // Ensure admin always exists
    if (!users[ADMIN_EMAIL]) {
      users[ADMIN_EMAIL] = { password: ADMIN_PASSWORD, user: ADMIN_USER };
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }
    return users;
  }
  // First time - create with admin
  const initialUsers = {
    [ADMIN_EMAIL]: { password: ADMIN_PASSWORD, user: ADMIN_USER }
  };
  localStorage.setItem(USERS_KEY, JSON.stringify(initialUsers));
  return initialUsers;
};

const getStoredUsers = (): Record<string, { password: string; user: User }> => {
  return initializeUsers();
};

const saveUsers = (users: Record<string, { password: string; user: User }>) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize on mount
  useEffect(() => {
    initializeUsers(); // Ensure admin exists
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setUser(JSON.parse(stored));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    await new Promise(resolve => setTimeout(resolve, 500));

    const users = getStoredUsers();
    const userRecord = users[email.toLowerCase()];

    if (!userRecord) {
      return { success: false, error: 'No account found with this email' };
    }

    if (userRecord.password !== password) {
      return { success: false, error: 'Incorrect password' };
    }

    if (userRecord.user.disabled) {
      return { success: false, error: 'Your account has been disabled. Please contact an administrator.' };
    }

    setUser(userRecord.user);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userRecord.user));
    return { success: true };
  };

  const signup = async (
    email: string,
    password: string,
    name: string
  ): Promise<{ success: boolean; error?: string }> => {
    await new Promise(resolve => setTimeout(resolve, 500));

    const users = getStoredUsers();
    const emailLower = email.toLowerCase();

    if (users[emailLower]) {
      return { success: false, error: 'An account with this email already exists' };
    }

    // All new signups are clients by default - only admin can change roles
    const newUser: User = {
      id: crypto.randomUUID(),
      email: emailLower,
      name,
      role: 'client',
      disabled: false,
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

  // Admin functions
  const getAllUsers = (): User[] => {
    const users = getStoredUsers();
    return Object.values(users).map(u => u.user);
  };

  const updateUserRole = (userId: string, newRole: UserRole): boolean => {
    if (!user || user.role !== 'admin') return false;

    const users = getStoredUsers();
    for (const email in users) {
      if (users[email].user.id === userId) {
        users[email].user.role = newRole;
        saveUsers(users);
        return true;
      }
    }
    return false;
  };

  const toggleUserStatus = (userId: string): boolean => {
    if (!user || user.role !== 'admin') return false;
    
    // Prevent disabling yourself
    if (user.id === userId) return false;

    const users = getStoredUsers();
    for (const email in users) {
      if (users[email].user.id === userId) {
        users[email].user.disabled = !users[email].user.disabled;
        saveUsers(users);
        return true;
      }
    }
    return false;
  };

  const updateProfile = (updates: { name?: string; profile?: UserProfile }): boolean => {
    if (!user) return false;

    const users = getStoredUsers();
    for (const email in users) {
      if (users[email].user.id === user.id) {
        if (updates.name) {
          users[email].user.name = updates.name;
        }
        if (updates.profile) {
          users[email].user.profile = { ...users[email].user.profile, ...updates.profile };
        }
        saveUsers(users);
        
        // Update current user state
        const updatedUser = { ...users[email].user };
        setUser(updatedUser);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
        return true;
      }
    }
    return false;
  };

  const changePassword = async (oldPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not logged in' };

    const users = getStoredUsers();
    const userRecord = users[user.email];

    if (!userRecord) {
      return { success: false, error: 'User not found' };
    }

    if (userRecord.password !== oldPassword) {
      return { success: false, error: 'Current password is incorrect' };
    }

    if (newPassword.length < 6) {
      return { success: false, error: 'New password must be at least 6 characters' };
    }

    users[user.email].password = newPassword;
    saveUsers(users);
    return { success: true };
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      login, 
      signup, 
      logout, 
      getAllUsers, 
      updateUserRole, 
      toggleUserStatus,
      updateProfile,
      changePassword,
    }}>
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
