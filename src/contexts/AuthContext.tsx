import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, usersApi, getToken, removeToken, User as ApiUser } from '@/lib/api';
import { emailSchema, passwordSchema, nameSchema, formatValidationErrors } from '@/lib/validation';

// User roles - easy to extend later
export type UserRole = 'admin' | 'employee' | 'client';

export interface UserProfile {
  phone?: string;
  address?: string;
  companyName?: string;
  profilePicture?: string;
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
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  signup: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  logout: () => void;
  getAllUsers: () => Promise<User[]>;
  updateUserRole: (userId: string, newRole: UserRole) => Promise<boolean>;
  toggleUserStatus: (userId: string) => Promise<boolean>;
  updateProfile: (updates: { name?: string; profile?: UserProfile }) => Promise<boolean>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Storage key for cached user data
const USER_CACHE_KEY = 'agency_dashboard_user_cache';

function mapApiUserToUser(apiUser: ApiUser): User {
  return {
    id: apiUser.id,
    email: apiUser.email,
    name: apiUser.name,
    role: apiUser.role,
    disabled: apiUser.disabled,
    profile: apiUser.profile ? {
      phone: apiUser.profile.phone ?? undefined,
      address: apiUser.profile.address ?? undefined,
      companyName: apiUser.profile.companyName ?? undefined,
      profilePicture: apiUser.profile.profilePicture ?? undefined,
    } : undefined,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  // Initialize on mount - check for existing token
  useEffect(() => {
    const initAuth = async () => {
      const token = getToken();
      if (token) {
        try {
          const { user: apiUser } = await authApi.me();
          const mappedUser = mapApiUserToUser(apiUser);
          setUser(mappedUser);
          localStorage.setItem(USER_CACHE_KEY, JSON.stringify(mappedUser));
        } catch {
          // Token invalid, clear it
          removeToken();
          localStorage.removeItem(USER_CACHE_KEY);
        }
      }
      setIsLoading(false);
    };
    
    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string; user?: User }> => {
    // Validate inputs
    const emailValidation = emailSchema.safeParse(email);
    if (!emailValidation.success) {
      return { success: false, error: formatValidationErrors(emailValidation.error) };
    }

    if (!password || password.length === 0) {
      return { success: false, error: 'Password is required' };
    }

    try {
      const { user: apiUser } = await authApi.login(email, password);
      const mappedUser = mapApiUserToUser(apiUser);
      setUser(mappedUser);
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(mappedUser));
      return { success: true, user: mappedUser };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Login failed' };
    }
  };

  const signup = async (
    email: string,
    password: string,
    name: string
  ): Promise<{ success: boolean; error?: string; user?: User }> => {
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

    try {
      const { user: apiUser } = await authApi.signup(email, password, name);
      const mappedUser = mapApiUserToUser(apiUser);
      setUser(mappedUser);
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(mappedUser));
      return { success: true, user: mappedUser };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Signup failed' };
    }
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
    localStorage.removeItem(USER_CACHE_KEY);
  };

  // Admin functions
  const getAllUsers = async (): Promise<User[]> => {
    if (!user || user.role !== 'admin') return [];
    
    try {
      const { users } = await usersApi.getAll();
      const mappedUsers = users.map(mapApiUserToUser);
      setAllUsers(mappedUsers);
      return mappedUsers;
    } catch {
      return allUsers; // Return cached users on error
    }
  };

  const updateUserRole = async (userId: string, newRole: UserRole): Promise<boolean> => {
    if (!user || user.role !== 'admin') return false;

    try {
      await usersApi.update(userId, { role: newRole });
      // Refresh users list
      await getAllUsers();
      return true;
    } catch {
      return false;
    }
  };

  const toggleUserStatus = async (userId: string): Promise<boolean> => {
    if (!user || user.role !== 'admin') return false;
    
    // Prevent disabling yourself
    if (user.id === userId) return false;

    try {
      // Find current status
      const targetUser = allUsers.find(u => u.id === userId);
      if (!targetUser) return false;
      
      await usersApi.update(userId, { disabled: !targetUser.disabled });
      // Refresh users list
      await getAllUsers();
      return true;
    } catch {
      return false;
    }
  };

  const updateProfile = async (updates: { name?: string; profile?: UserProfile }): Promise<boolean> => {
    if (!user) return false;

    // Validate name if provided
    if (updates.name) {
      const nameValidation = nameSchema.safeParse(updates.name);
      if (!nameValidation.success) {
        return false;
      }
    }

    try {
      const profileUpdates: Record<string, unknown> = {};
      if (updates.name) profileUpdates.name = updates.name;
      if (updates.profile) {
        if (updates.profile.phone) profileUpdates.phone = updates.profile.phone;
        if (updates.profile.address) profileUpdates.address = updates.profile.address;
        if (updates.profile.companyName) profileUpdates.companyName = updates.profile.companyName;
        if (updates.profile.profilePicture) profileUpdates.profilePicture = updates.profile.profilePicture;
      }
      
      const { user: apiUser } = await authApi.updateProfile(profileUpdates);
      const mappedUser = mapApiUserToUser(apiUser);
      setUser(mappedUser);
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(mappedUser));
      return true;
    } catch {
      return false;
    }
  };

  const changePassword = async (oldPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not logged in' };

    // Validate new password
    const passwordValidation = passwordSchema.safeParse(newPassword);
    if (!passwordValidation.success) {
      return { success: false, error: formatValidationErrors(passwordValidation.error) };
    }

    try {
      await authApi.changePassword(oldPassword, newPassword);
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Password change failed' };
    }
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
