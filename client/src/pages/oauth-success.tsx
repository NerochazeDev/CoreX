import { useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export default function OAuthSuccess() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { refreshUser } = useAuth();

  useEffect(() => {
    const handleOAuthSuccess = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      const userParam = urlParams.get('user');

      if (token && userParam) {
        try {
          // Parse user data
          const userData = JSON.parse(decodeURIComponent(userParam));
          
          // Store auth token and user data (same as regular login)
          localStorage.setItem('bitvault_auth_token', token);
          localStorage.setItem('bitvault_user', JSON.stringify(userData));
          localStorage.setItem('bitvault_last_activity', Date.now().toString());
          
          console.log('Google OAuth success - auth data stored');
          
          // Force refresh auth status to update React context
          await refreshUser();
          
          // Show success message
          toast({
            title: "🎉 Welcome Back!",
            description: "You've successfully signed in with Google. Your dashboard is ready!",
            variant: "default",
          });
          
          // Navigate to homepage (same as regular login)
          setTimeout(() => {
            setLocation('/');
          }, 100);
          
        } catch (error) {
          console.error('OAuth success page error:', error);
          toast({
            title: "Login Error",
            description: "There was an issue completing your Google login. Please try again.",
            variant: "destructive",
          });
          setLocation('/login');
        }
      } else {
        // Missing parameters - redirect to login
        console.error('OAuth success page: missing token or user data');
        setLocation('/login');
      }
    };

    handleOAuthSuccess();
  }, [setLocation, toast, refreshUser]);

  // Show loading state while processing
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-orange-50/30 dark:from-slate-900 dark:to-slate-800">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-bitcoin border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-lg text-muted-foreground">Completing Google sign in...</p>
      </div>
    </div>
  );
}