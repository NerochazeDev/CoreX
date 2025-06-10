import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User } from '@shared/schema';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
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
    console.log('AuthProvider initializing, stored user:', storedUser ? 'found' : 'not found');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        console.log('Restoring user from localStorage:', userData.email);
        setUser(userData);
        
        // Verify the user session is still valid
        fetch(`/api/user/${userData.id}`)
          .then(response => {
            if (!response.ok) {
              throw new Error('Session expired');
            }
            return response.json();
          })
          .then(refreshedUser => {
            setUser(refreshedUser);
            localStorage.setItem('corex_user', JSON.stringify(refreshedUser));
          })
          .catch(error => {
            console.error('Session validation failed:', error);
            localStorage.removeItem('corex_user');
            setUser(null);
          });
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('corex_user');
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

    // Store in localStorage first
    localStorage.setItem('corex_user', JSON.stringify(userData));
    // Then update state synchronously
    setUser(userData);

    console.log('User state updated:', userData.email);

    // Force a re-render by updating loading state
    setIsLoading(false);
  };

  const register = async (email: string, password: string) => {
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
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
      } else {
        // If user fetch fails, clear the session
        console.error('Failed to refresh user, clearing session');
        logout();
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      // On network error, don't clear session
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('corex_user');
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