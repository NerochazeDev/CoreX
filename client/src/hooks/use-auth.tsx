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
      // First check localStorage for immediate user state restoration
      const storedUser = localStorage.getItem('bitvault_user');
      const lastActivity = localStorage.getItem('bitvault_last_activity');
      
      if (storedUser && lastActivity) {
        try {
          const userData = JSON.parse(storedUser);
          const activityTime = parseInt(lastActivity);
          const now = Date.now();
          
          // If last activity was within 24 hours, restore user immediately
          if (now - activityTime < 24 * 60 * 60 * 1000) {
            console.log('Restoring user from localStorage for instant load');
            setUser(userData);
            setIsLoading(false);
            
            // Then verify with server in background
            verifyUserInBackground();
            return;
          }
        } catch (e) {
          console.error('Error parsing stored user data:', e);
          // Clear bad data
          localStorage.removeItem('bitvault_user');
          localStorage.removeItem('bitvault_last_activity');
        }
      }

      // If no valid stored user, check with server
      await verifyUserWithServer();
    } catch (error) {
      console.error('Error in checkAuthStatus:', error);
      setIsLoading(false);
    }
  };

  const verifyUserInBackground = async () => {
    try {
      const authToken = localStorage.getItem('bitvault_auth_token');
      const headers: Record<string, string> = {};

      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }

      const response = await fetch('/api/me', {
        method: 'GET',
        credentials: 'include',
        headers
      });

      if (response.ok) {
        const userData = await response.json();
        // Update stored data silently
        localStorage.setItem('bitvault_user', JSON.stringify(userData));
        localStorage.setItem('bitvault_last_activity', Date.now().toString());
        setUser(userData);
      } else {
        // Server says no - clear everything
        localStorage.removeItem('bitvault_user');
        localStorage.removeItem('bitvault_auth_token');
        localStorage.removeItem('bitvault_last_activity');
        setUser(null);
      }
    } catch (error) {
      console.error('Background verification failed:', error);
      // Keep current user state on network error
    }
  };

  const verifyUserWithServer = async () => {
    try {
      const authToken = localStorage.getItem('bitvault_auth_token');
      const headers: Record<string, string> = {};

      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }

      const response = await fetch('/api/me', {
        method: 'GET',
        credentials: 'include',
        headers
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        localStorage.setItem('bitvault_user', JSON.stringify(userData));
        localStorage.setItem('bitvault_last_activity', Date.now().toString());
      } else {
        localStorage.removeItem('bitvault_user');
        localStorage.removeItem('bitvault_auth_token');
        localStorage.removeItem('bitvault_last_activity');
        setUser(null);
      }
    } catch (error) {
      console.error('Server verification failed:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    console.log('Starting login API call...');
    
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Ensure cookies are sent with requests
      body: JSON.stringify({ email, password }),
    });

    console.log('Login API response status:', response.status);

    if (!response.ok) {
      const error = await response.json();
      console.error('Login API error:', error);
      throw new Error(error.message);
    }

    const userData = await response.json();
    console.log('Login API success, user data:', userData);

    // Store auth token if provided
    if (userData.authToken) {
      localStorage.setItem('bitvault_auth_token', userData.authToken);
      console.log('Auth token stored');
    }

    // Store in localStorage with activity timestamp
    localStorage.setItem('bitvault_user', JSON.stringify(userData));
    localStorage.setItem('bitvault_last_activity', Date.now().toString());
    console.log('User data stored in localStorage');

    // Set user state immediately
    setUser(userData);
    console.log('User state updated');

    // Force a re-render by updating loading state
    setIsLoading(false);
    console.log('Loading state set to false');
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
      const response = await fetch('/api/me', {
        method: 'GET',
        credentials: 'include',
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