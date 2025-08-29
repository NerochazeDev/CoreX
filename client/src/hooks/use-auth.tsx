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
    // Validate session with server on app load
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Always include credentials for session-based auth
      const authToken = localStorage.getItem('bitvault_auth_token');
      const headers: Record<string, string> = {};

      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }

      // Add retry logic for Google OAuth users
      const response = await fetch('/api/me', {
        method: 'GET',
        credentials: 'include', // Critical for Google OAuth session cookies
        headers
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        // Update localStorage for offline reference
        localStorage.setItem('bitvault_user', JSON.stringify(userData));
        localStorage.setItem('bitvault_last_activity', Date.now().toString());
      } else if (response.status === 401) {
        // Clear any stale localStorage data only on auth failure
        localStorage.removeItem('bitvault_user');
        localStorage.removeItem('bitvault_auth_token');
        localStorage.removeItem('bitvault_last_activity');
        setUser(null);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      // On network error, check localStorage as fallback
      const storedUser = localStorage.getItem('bitvault_user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setUser(userData);
        } catch (e) {
          localStorage.removeItem('bitvault_user');
          localStorage.removeItem('bitvault_auth_token');
          localStorage.removeItem('bitvault_last_activity');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {


    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Ensure cookies are sent with requests
      mode: 'cors', // Enable CORS with credentials
      body: JSON.stringify({ email, password }),
    });



    if (!response.ok) {
      const error = await response.json();

      throw new Error(error.message);
    }

    const userData = await response.json();


    // Store auth token if provided
    if (userData.authToken) {
      localStorage.setItem('bitvault_auth_token', userData.authToken);

    }

    // Store in localStorage with activity timestamp
    localStorage.setItem('bitvault_user', JSON.stringify(userData));
    localStorage.setItem('bitvault_last_activity', Date.now().toString());

    // Set user state
    setUser(userData);

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
      credentials: 'include', // Ensure cookies are sent with requests
      body: JSON.stringify(registrationData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const userData = await response.json();
    setUser(userData);
    localStorage.setItem('bitvault_user', JSON.stringify(userData));
    localStorage.setItem('bitvault_last_activity', Date.now().toString());
  };

  const refreshUser = async () => {
    try {
      const authToken = localStorage.getItem('bitvault_auth_token');
      const headers: Record<string, string> = {};

      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }

      const response = await fetch('/api/me', {
        method: 'GET',
        credentials: 'include', // Ensure cookies are sent
        mode: 'cors', // Enable CORS with credentials
        headers
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        localStorage.setItem('bitvault_user', JSON.stringify(updatedUser));
        localStorage.setItem('bitvault_last_activity', Date.now().toString());
      } else {
        // Only clear session if it's an authentication error
        if (response.status === 401 || response.status === 403) {
          logout();
        }
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      // On network error, don't clear session
    }
  };

  const logout = async () => {
    try {
      // Call server logout endpoint to destroy session
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      // Always clear local state regardless of server response
      setUser(null);
      localStorage.removeItem('bitvault_user');
      localStorage.removeItem('bitvault_last_activity');
    }
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