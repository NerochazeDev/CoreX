import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User } from '@shared/schema';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (registrationData: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    country: string;
    password: string;
    acceptMarketing: boolean;
    captchaToken: string;
  }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored user data
    const storedUser = localStorage.getItem('corex_user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        
        // Only validate session if user has been inactive for more than 30 minutes
        const lastActivity = localStorage.getItem('corex_last_activity');
        const now = Date.now();
        const thirtyMinutes = 30 * 60 * 1000;
        
        if (lastActivity && (now - parseInt(lastActivity)) < thirtyMinutes) {
          // Session is recent, just update last activity
          localStorage.setItem('corex_last_activity', now.toString());
        }
      } catch (error) {
        localStorage.removeItem('corex_user');
        localStorage.removeItem('corex_last_activity');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    console.log('Attempting login for:', email);

    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    console.log('Login response status:', response.status);

    if (!response.ok) {
      const error = await response.json();
      console.error('Login failed:', error);
      throw new Error(error.message);
    }

    const userData = await response.json();
    console.log('Login successful for user:', userData.email);

    // Store in localStorage with activity timestamp
    localStorage.setItem('corex_user', JSON.stringify(userData));
    localStorage.setItem('corex_last_activity', Date.now().toString());
    // Then update state synchronously
    setUser(userData);

    console.log('User state updated:', userData.email);

    // Force a re-render by updating loading state
    setIsLoading(false);
  };

  const register = async (registrationData: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    country: string;
    password: string;
    acceptMarketing: boolean;
    captchaToken: string;
  }) => {
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registrationData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const userData = await response.json();
    setUser(userData);
    localStorage.setItem('corex_user', JSON.stringify(userData));
  };

  const refreshUser = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/user/${user.id}`);
      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        localStorage.setItem('corex_user', JSON.stringify(updatedUser));
        localStorage.setItem('corex_last_activity', Date.now().toString());
      } else {
        // Only clear session if it's an authentication error
        if (response.status === 401 || response.status === 403) {
          console.error('Authentication failed, clearing session');
          logout();
        }
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      // On network error, don't clear session
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('corex_user');
    localStorage.removeItem('corex_last_activity');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, refreshUser, isLoading }}>
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