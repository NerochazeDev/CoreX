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
      // Get stored user data first to check if we already have a stable session
      const storedUser = localStorage.getItem('bitvault_user');
      const authToken = localStorage.getItem('bitvault_auth_token');
      const headers: Record<string, string> = {};

      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }

      const response = await fetch('/api/me', {
        method: 'GET',
        credentials: 'include', // Always include cookies for session consistency
        headers
      });

      if (response.ok) {
        const userData = await response.json();
        
        // Only update user data if the ID matches stored data or if no stored data exists
        if (storedUser) {
          const stored = JSON.parse(storedUser);
          if (stored.id === userData.id) {
            // Same user ID - update data while maintaining consistency
            setUser(userData);
            localStorage.setItem('bitvault_user', JSON.stringify(userData));
            localStorage.setItem('bitvault_last_activity', Date.now().toString());
          } else {
            // User ID changed unexpectedly - clear and restart auth
            console.warn('User ID mismatch detected, clearing session');
            localStorage.removeItem('bitvault_user');
            localStorage.removeItem('bitvault_auth_token');
            localStorage.removeItem('bitvault_last_activity');
            setUser(null);
          }
        } else {
          // No stored user - first time login
          setUser(userData);
          localStorage.setItem('bitvault_user', JSON.stringify(userData));
          localStorage.setItem('bitvault_last_activity', Date.now().toString());
        }
      } else {
        // Auth failed - clear stale data
        localStorage.removeItem('bitvault_user');
        localStorage.removeItem('bitvault_auth_token');
        localStorage.removeItem('bitvault_last_activity');
        setUser(null);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      // On network error, use stored data as fallback (don't clear)
      const storedUser = localStorage.getItem('bitvault_user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          console.log('Using cached user data due to network error');
        } catch (e) {
          localStorage.removeItem('bitvault_user');
          localStorage.removeItem('bitvault_auth_token');
          localStorage.removeItem('bitvault_last_activity');
          setUser(null);
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

    // Store stable auth token (won't change during session)
    if (userData.authToken) {
      localStorage.setItem('bitvault_auth_token', userData.authToken);
      console.log(`Stable auth token stored for user ID: ${userData.id}`);
    }

    // Store user data with consistent ID
    localStorage.setItem('bitvault_user', JSON.stringify(userData));
    localStorage.setItem('bitvault_last_activity', Date.now().toString());

    // Set user state with stable ID
    setUser(userData);
    console.log(`User session established with stable ID: ${userData.id}`);

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
      const currentUser = localStorage.getItem('bitvault_user');
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
        
        // Verify user ID consistency
        if (currentUser) {
          const stored = JSON.parse(currentUser);
          if (stored.id !== updatedUser.id) {
            console.error('User ID mismatch during refresh - forcing logout');
            logout();
            return;
          }
        }
        
        // Update user data while maintaining stable ID
        setUser(updatedUser);
        localStorage.setItem('bitvault_user', JSON.stringify(updatedUser));
        localStorage.setItem('bitvault_last_activity', Date.now().toString());
        console.log(`User data refreshed for stable ID: ${updatedUser.id}`);
      } else {
        // Only clear session if it's an authentication error
        if (response.status === 401 || response.status === 403) {
          console.log('Authentication error during refresh - logging out');
          logout();
        }
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      // On network error, don't clear session to maintain stability
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