import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AuthState, LoginRequest, RegisterRequest, AuthResponse } from '../types';
import { apiGet, apiPost, setAccessToken, getAccessToken } from '../utils/api';

interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!accessToken;
  const isPremium = user?.status === 'PREMIUM';

  // Update access token in both state and api client
  const updateAccessToken = (token: string | null) => {
    setAccessTokenState(token);
    setAccessToken(token);
  };

  // Check if user is already logged in on mount
  const checkAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      // Try to get current user using refresh token
      const response = await apiGet<{ user: User }>('/auth/me');
      setUser(response.user);
      
      // Access token should already be set by the interceptor
      const currentToken = getAccessToken();
      if (currentToken) {
        setAccessTokenState(currentToken);
      }
    } catch (error) {
      console.log('Not authenticated');
      setUser(null);
      updateAccessToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize auth state on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Listen for logout events (triggered by API client when refresh fails)
  useEffect(() => {
    const handleLogout = () => {
      setUser(null);
      updateAccessToken(null);
    };

    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  const login = async (credentials: LoginRequest) => {
    try {
      const response = await apiPost<AuthResponse & { refreshToken?: string }>(
        '/auth/login',
        credentials,
        { skipAuth: true }
      );
      
      setUser(response.user);
      updateAccessToken(response.accessToken);
      
      // Refresh token is automatically stored in httpOnly cookie by backend
    } catch (error: any) {
      throw new Error(error.message || 'Login failed');
    }
  };

  const register = async (data: RegisterRequest) => {
    try {
      const response = await apiPost<AuthResponse & { refreshToken?: string }>(
        '/auth/register',
        data,
        { skipAuth: true }
      );
      
      setUser(response.user);
      updateAccessToken(response.accessToken);
    } catch (error: any) {
      throw new Error(error.message || 'Registration failed');
    }
  };

  const logout = async () => {
    try {
      await apiPost('/auth/logout', {});
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      updateAccessToken(null);
    }
  };

  const refreshUser = async () => {
    try {
      const response = await apiGet<{ user: User }>('/auth/me');
      setUser(response.user);
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated,
        isPremium,
        login,
        register,
        logout,
        refreshUser,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
