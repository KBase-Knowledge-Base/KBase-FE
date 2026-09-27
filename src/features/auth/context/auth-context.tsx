import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { UserResponse, LoginRequest, LoginResponse } from '@/shared/api/types';
import { authApi } from '@/features/auth/api/auth';
import { accountApi } from '@/features/account/api/account';
import { apiClient } from '@/shared/api/client';
import { useQueryClient } from '@tanstack/react-query';

export type AuthStatus = 'bootstrapping' | 'authenticated' | 'anonymous' | 'temporarily-unavailable';

interface AuthContextType {
  status: AuthStatus;
  user: UserResponse | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (data: LoginRequest) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  updateUser: (user: UserResponse) => void;
  bootstrapSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<AuthStatus>('bootstrapping');
  const [user, setUser] = useState<UserResponse | null>(null);
  const queryClient = useQueryClient();

  const handleUnauthorized = useCallback(() => {
    setUser(null);
    setStatus('anonymous');
    queryClient.clear();
  }, [queryClient]);

  const bootstrapSession = useCallback(async () => {
    setStatus('bootstrapping');
    try {
      // 1. Attempt token refresh using HttpOnly cookie
      const token = await apiClient.refreshToken();
      if (!token) {
        setUser(null);
        setStatus('anonymous');
        return;
      }

      // 2. Fetch current user profile
      const currentUser = await accountApi.getCurrentUser();
      setUser(currentUser);
      setStatus('authenticated');
    } catch {
      // Network or server error
      setUser(null);
      setStatus('anonymous');
    }
  }, []);

  useEffect(() => {
    apiClient.setOnUnauthorized(handleUnauthorized);
    bootstrapSession();
  }, [bootstrapSession, handleUnauthorized]);

  const login = async (data: LoginRequest): Promise<LoginResponse> => {
    const res = await authApi.login(data);
    apiClient.setAccessToken(res.accessToken);

    // Fetch full user profile
    const currentUser = await accountApi.getCurrentUser();
    setUser(currentUser);
    setStatus('authenticated');
    return res;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore server logout errors, always clear local session
    } finally {
      apiClient.clearSession(true);
      setUser(null);
      setStatus('anonymous');
      queryClient.clear();
    }
  };

  const updateUser = (updated: UserResponse) => {
    setUser(updated);
  };

  const value: AuthContextType = {
    status,
    user,
    isAuthenticated: status === 'authenticated' && !!user,
    isAdmin: user?.systemRole === 'ADMIN',
    login,
    logout,
    updateUser,
    bootstrapSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
