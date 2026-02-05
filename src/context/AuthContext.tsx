// src/context/AuthContext.tsx
import { createContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '@/services/api';
import { Admin } from '@/types';

interface AuthContextType {
  user: Admin | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    verifyToken();
  }, []);

  const verifyToken = async () => {
    const token = localStorage.getItem('admin_token');
    const storedUser = localStorage.getItem('admin_user');

    if (!token || !storedUser) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await authApi.verifyToken();
      setUser(response.data);
    } catch (error: any) {
      // Clear invalid tokens
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login(email, password);
      const { access_token, email: userEmail, role } = response.data;

      localStorage.setItem('admin_token', access_token);
      localStorage.setItem(
        'admin_user',
        JSON.stringify({ email: userEmail, role })
      );

      setUser({ email: userEmail, role });
    } catch (error: any) {
      // Handle timeout errors (from axios interceptor)
      if (error.isTimeout || error.code === 'TIMEOUT') {
        throw new Error('Connection timeout - the server is taking too long to respond. Please try again.');
      }
      
      // Handle network errors (from axios interceptor)
      if (error.isNetworkError || error.code === 'NETWORK_ERROR') {
        throw new Error('Network error - please check your internet connection and try again.');
      }

      // Handle API error responses
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.detail || error.response.data?.message;

        // 401 or 403 - Invalid credentials
        if (status === 401 || status === 403) {
          throw new Error('Invalid email or password. Please try again.');
        }

        // 422 - Validation error
        if (status === 422) {
          throw new Error('Invalid input. Please check your email and password.');
        }

        // 429 - Too many requests
        if (status === 429) {
          throw new Error('Too many login attempts. Please wait a few minutes and try again.');
        }

        // 500+ - Server errors
        if (status >= 500) {
          throw new Error('Server error - please try again later or contact support.');
        }

        // Other errors with message from backend
        if (message) {
          throw new Error(message);
        }

        throw new Error('Login failed. Please try again.');
      }

      // Generic error fallback
      throw new Error('An unexpected error occurred. Please try again.');
    }
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};