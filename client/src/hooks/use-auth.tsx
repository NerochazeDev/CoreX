import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User } from '@shared/schema';
import { toast } from '@/components/ui/toast'; // Assuming toast is available from a local path
import { useLocation } from 'react-router-dom'; // Assuming useLocation is used for navigation

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
  const navigate = useLocation(); // Placeholder for navigation function

  // Helper function for navigation (replace with actual routing logic if needed)
  const setLocation = (path: string) => {
    // In a real React Router setup, you'd use useHistory or useNavigate
    console.log(`Navigating to ${path}`);
    // Example: history.push(path);
  };

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
      if (process.env.NODE_ENV === 'development') {
        console.error('Error checking auth status:', error);
      }
      // On network error, check localStorage as fallback
      const storedUser = localStorage.getItem('bitvault_user');
      const lastActivity = localStorage.getItem('bitvault_last_activity');

      // Only use localStorage if recent (within 1 hour)
      if (storedUser && lastActivity && (Date.now() - parseInt(lastActivity)) < 3600000) {
        try {
          const userData = JSON.parse(storedUser);
          setUser(userData);
        } catch (e) {
          // Clean up corrupted localStorage data
          localStorage.removeItem('bitvault_user');
          localStorage.removeItem('bitvault_auth_token');
          localStorage.removeItem('bitvault_last_activity');
        }
      } else {
        // Clear expired localStorage data
        localStorage.removeItem('bitvault_user');
        localStorage.removeItem('bitvault_auth_token');
        localStorage.removeItem('bitvault_last_activity');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log("Starting login process...");

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      }).catch((networkError) => {
        console.error("Network error during login:", networkError);
        throw new Error("Network connection failed. Please check your internet connection.");
      });

      if (!response.ok) {
        let errorMessage = "Login failed";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          console.error("Error parsing response:", parseError);
          errorMessage = `Server error (${response.status})`;
        }
        throw new Error(errorMessage);
      }

      const userData = await response.json().catch((parseError) => {
        console.error("Error parsing login response:", parseError);
        throw new Error("Invalid response from server");
      });

      console.log("Login completed, showing success toast...");

      setUser(userData.user);

      toast({
        title: "Welcome back!",
        description: `Successfully signed in as ${userData.user.email}`,
      });

      console.log("Redirecting to home page...");
      setLocation('/');

      return userData;
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Login Failed",
        description: error.message || "An error occurred during login",
        variant: "destructive",
      });
      throw error;
    }
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
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registrationData),
        credentials: 'include',
      }).catch((networkError) => {
        console.error("Network error during registration:", networkError);
        throw new Error("Network connection failed. Please check your internet connection.");
      });

      if (!response.ok) {
        let errorMessage = "Registration failed";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          console.error("Error parsing response:", parseError);
          errorMessage = `Server error (${response.status})`;
        }
        throw new Error(errorMessage);
      }

      const userData = await response.json().catch((parseError) => {
        console.error("Error parsing registration response:", parseError);
        throw new Error("Invalid response from server");
      });

      setUser(userData.user);

      toast({
        title: "Account Created!",
        description: `Welcome to BitVault Pro, ${userData.user.email}!`,
      });

      setLocation('/');

      return userData;
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        title: "Registration Failed",
        description: error.message || "An error occurred during registration",
        variant: "destructive",
      });
      throw error;
    }
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
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: 'include',
      }).catch((error) => {
        console.error("Network error during logout:", error);
        // Continue with logout process even if server request fails
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Always clear local state regardless of server response
      setUser(null);
      setLocation('/login');
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