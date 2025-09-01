import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, AlertTriangle, Lock, ArrowLeft } from "lucide-react";
import Management from "./admin";

export default function SecureAdmin() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [accessGranted, setAccessGranted] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      // Not logged in at all
      setAccessDenied(true);
      return;
    }

    if (!user.isAdmin) {
      // Logged in but not admin
      setAccessDenied(true);
      return;
    }

    // User is admin, grant access
    setAccessGranted(true);
  }, [user, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-slate-900 to-black flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-red-500/20 bg-slate-900/80">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <CardTitle className="text-red-400 text-xl">Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-400 mb-2">
                <Lock className="w-5 h-5" />
                <span className="font-semibold">Unauthorized Access Attempt</span>
              </div>
              <p className="text-red-300 text-sm">
                This route is restricted to authorized BitVault Pro administrators only.
                {!user && " Please log in with an admin account."}
                {user && !user.isAdmin && " Your account does not have admin privileges."}
              </p>
            </div>
            
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
              <div className="flex items-center gap-2 text-orange-400 mb-2">
                <Shield className="w-5 h-5" />
                <span className="font-semibold">Security Notice</span>
              </div>
              <p className="text-slate-300 text-sm">
                All access attempts to this route are logged and monitored for security purposes.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => setLocation('/')}
                variant="outline"
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Return Home
              </Button>
              {!user && (
                <Button
                  onClick={() => setLocation('/login')}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Admin Login
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (accessGranted) {
    // User is verified admin, render the actual admin panel
    return <Management />;
  }

  return null;
}