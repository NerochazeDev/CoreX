
import { useAuth } from "@/hooks/use-auth";
import { LoginRedirect } from "./login-redirect";
import { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  message?: string;
  redirectPath?: string;
}

export function ProtectedRoute({ 
  children, 
  message = "Please sign in to access this page",
  redirectPath = "/login"
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  console.log('ProtectedRoute render - isLoading:', isLoading, 'user:', user ? 'exists' : 'null');

  // Show loading only for initial auth check, not for subsequent updates
  if (isLoading && !localStorage.getItem('bitvault_user')) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-bitcoin border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-muted-foreground">Loading your account...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('No user found, redirecting to login');
    return <LoginRedirect message={message} redirectPath={redirectPath} />;
  }

  console.log('User authenticated, rendering protected content');
  return <>{children}</>;
}
