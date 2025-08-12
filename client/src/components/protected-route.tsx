
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-bitcoin border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginRedirect message={message} redirectPath={redirectPath} />;
  }

  return <>{children}</>;
}
