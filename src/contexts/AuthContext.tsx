import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { hashPassword, verifyPassword } from '@/lib/crypto';
import { emailSchema, passwordSchema, nameSchema, formatValidationErrors } from '@/lib/validation';

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

interface StoredUserRecord {
  passwordHash: string;
  salt: string;
  user: User;
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

/**
 * SECURITY NOTE: This application uses client-side authentication with localStorage.
 * This is suitable for demos/prototypes only. For production:
 * - Use a proper backend with server-side authentication
 * - Store passwords hashed with bcrypt/argon2 on the server
 * - Use HTTP-only cookies for session management
 * - Implement proper CSRF protection
 * 
 * Enable Lovable Cloud for proper authentication.
 */

// Helper to get stored users with type safety
const getStoredUsers = (): Record<string, StoredUserRecord> => {
  const stored = localStorage.getItem(USERS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return {};
    }
  }
  return {};
};

const saveUsers = (users: Record<string, StoredUserRecord>) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize on mount
  useEffect(() => {
    // Ensure specific admin user
    const users = getStoredUsers();
    const adminEmail = 'rusafhasan547@gmail.com';
    if (users[adminEmail] && users[adminEmail].user.role !== 'admin') {
      users[adminEmail].user.role = 'admin';
      saveUsers(users);
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsedUser = JSON.parse(stored);
        // Update session if this is the admin user
        if (parsedUser.email === adminEmail) {
          parsedUser.role = 'admin';
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsedUser));
        }
        setUser(parsedUser);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Validate inputs
    const emailValidation = emailSchema.safeParse(email);
    if (!emailValidation.success) {
      return { success: false, error: formatValidationErrors(emailValidation.error) };
    }

    if (!password || password.length === 0) {
      return { success: false, error: 'Password is required' };
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    const users = getStoredUsers();
    const validatedEmail = emailValidation.data;
    const userRecord = users[validatedEmail];

    if (!userRecord) {
      return { success: false, error: 'No account found with this email' };
    }

    // Verify password hash
    const isValid = await verifyPassword(password, userRecord.passwordHash, userRecord.salt);
    if (!isValid) {
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
    // Validate all inputs
    const emailValidation = emailSchema.safeParse(email);
    if (!emailValidation.success) {
      return { success: false, error: formatValidationErrors(emailValidation.error) };
    }

    const passwordValidation = passwordSchema.safeParse(password);
    if (!passwordValidation.success) {
      return { success: false, error: formatValidationErrors(passwordValidation.error) };
    }

    const nameValidation = nameSchema.safeParse(name);
    if (!nameValidation.success) {
      return { success: false, error: formatValidationErrors(nameValidation.error) };
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    const users = getStoredUsers();
    const emailLower = emailValidation.data;

    if (users[emailLower]) {
      return { success: false, error: 'An account with this email already exists' };
    }

    // Hash the password before storing
    const { hash, salt } = await hashPassword(password);

    // First user becomes admin, all others are clients by default
    const isFirstUser = Object.keys(users).length === 0;
    
    const newUser: User = {
      id: crypto.randomUUID(),
      email: emailLower,
      name: nameValidation.data,
      role: isFirstUser ? 'admin' : 'client',
      disabled: false,
    };

    users[emailLower] = { passwordHash: hash, salt, user: newUser };
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

    // Validate name if provided
    if (updates.name) {
      const nameValidation = nameSchema.safeParse(updates.name);
      if (!nameValidation.success) {
        return false;
      }
      updates.name = nameValidation.data;
    }

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

    // Validate new password
    const passwordValidation = passwordSchema.safeParse(newPassword);
    if (!passwordValidation.success) {
      return { success: false, error: formatValidationErrors(passwordValidation.error) };
    }

    const users = getStoredUsers();
    const userRecord = users[user.email];

    if (!userRecord) {
      return { success: false, error: 'User not found' };
    }

    // Verify old password
    const isValid = await verifyPassword(oldPassword, userRecord.passwordHash, userRecord.salt);
    if (!isValid) {
      return { success: false, error: 'Current password is incorrect' };
    }

    // Hash and save new password
    const { hash, salt } = await hashPassword(newPassword);
    users[user.email].passwordHash = hash;
    users[user.email].salt = salt;
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
