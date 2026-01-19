import { createContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '@/services/api';
import { Admin } from '@/types';

interface AuthContextType {
  user: Admin | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isDemo: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Only these emails are allowed to access admin
const ALLOWED_ADMINS = [
  'jinni.chirag.mua101@gmail.com',
  'poudelrupace@gmail.com'
];

// Demo credentials for testing
const DEMO_CREDENTIALS = [
  { email: 'poudelrupace@gmail.com', password: 'poudelrupace@gmail.com' },
  { email: 'jinni.chirag.mua101@gmail.com', password: 'jinni.chirag.mua101@gmail.com' },
];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    verifyToken();
  }, []);

  const verifyToken = async () => {
    const token = localStorage.getItem('admin_token');
    const storedUser = localStorage.getItem('admin_user');
    
    if (!token) {
      setIsLoading(false);
      return;
    }

    // Check if it's a demo token
    if (token === 'demo_token' && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setIsDemo(true);
      } catch {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
      }
      setIsLoading(false);
      return;
    }

    try {
      const response = await authApi.verifyToken();
      const userData = response.data;
      
      // Check if user is in allowed list
      if (!ALLOWED_ADMINS.includes(userData.email.toLowerCase())) {
        throw new Error('Unauthorized');
      }
      
      setUser(userData);
      setIsDemo(false);
    } catch (error) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    // Check if email is in allowed list
    if (!ALLOWED_ADMINS.includes(email.toLowerCase())) {
      throw new Error('Invalid credentials');
    }

    // Check for demo credentials first
    const demoUser = DEMO_CREDENTIALS.find(
      (cred) => cred.email.toLowerCase() === email.toLowerCase() && cred.password === password
    );

    if (demoUser) {
      // Demo mode - simulate login without API
      const userData = { email: demoUser.email, role: 'admin' };
      localStorage.setItem('admin_token', 'demo_token');
      localStorage.setItem('admin_user', JSON.stringify(userData));
      setUser(userData);
      setIsDemo(true);
      return;
    }

    // Real API login
    try {
      const response = await authApi.login(email, password);
      const { access_token, email: userEmail, role } = response.data;
      
      localStorage.setItem('admin_token', access_token);
      localStorage.setItem('admin_user', JSON.stringify({ email: userEmail, role }));
      setUser({ email: userEmail, role });
      setIsDemo(false);
    } catch (error) {
      throw new Error('Invalid credentials');
    }
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setUser(null);
    setIsDemo(false);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, isDemo }}>
      {children}
    </AuthContext.Provider>
  );
};
