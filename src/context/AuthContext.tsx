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
    } catch {
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
    } catch {
      throw new Error('Invalid credentials');
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
