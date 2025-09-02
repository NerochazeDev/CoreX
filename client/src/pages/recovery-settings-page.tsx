import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Shield, Key, RefreshCw, AlertTriangle, Copy, CheckCircle, ArrowLeft } from "lucide-react";
import { useSecureAuth } from "@/hooks/use-auth-secure";
import { useLocation } from "wouter";

export default function RecoverySettingsPage() {
  const [, navigate] = useLocation();
  const [copiedRecoveryCode, setCopiedRecoveryCode] = useState(false);
  const { user, regenerateRecoveryMutation } = useSecureAuth();

  if (!user) {
    navigate("/auth");
    return null;
  }

  const handleCopyRecoveryCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedRecoveryCode(true);
    setTimeout(() => setCopiedRecoveryCode(false), 3000);
  };

  const handleRegenerateRecovery = () => {
    if (confirm("Are you sure you want to regenerate your recovery code? Your current recovery code will no longer work.")) {
      regenerateRecoveryMutation.mutate();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
            Recovery Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage your account recovery options
          </p>
        </div>

        {/* Recovery Code Management */}
        <Card className="shadow-2xl border-orange-100 dark:border-orange-900 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              Recovery Code Management
            </CardTitle>
            <CardDescription>
              Your recovery code is essential for account recovery if you forget your password
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Security Warning */}
            <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                <strong>Important Security Information:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                  <li>Your recovery code is never stored in plain text on our servers</li>
                  <li>We cannot retrieve your recovery code if you lose it</li>
                  <li>Store your recovery code in a secure location (password manager recommended)</li>
                  <li>Do not share your recovery code with anyone</li>
                </ul>
              </AlertDescription>
            </Alert>

            <Separator />

            {/* Current Recovery Code Status */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-500" />
                Recovery Code Status: Active
              </h3>
              
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Your account is protected with a recovery code that was generated when you signed up or last reset your password.
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Format:</strong> XXXX-XXXX-XXXX (12 characters in 3 groups of 4)
                </p>
              </div>
            </div>

            <Separator />

            {/* Recovery Code Actions */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Recovery Code Actions</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">Generate New Recovery Code</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Create a new recovery code and invalidate the current one
                    </p>
                  </div>
                  <Button
                    onClick={handleRegenerateRecovery}
                    disabled={regenerateRecoveryMutation.isPending}
                    className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700"
                    data-testid="button-regenerate-recovery"
                  >
                    {regenerateRecoveryMutation.isPending ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Regenerate Code
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Usage Instructions */}
            <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
              <Key className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 dark:text-blue-200">
                <strong>How to Use Your Recovery Code:</strong>
                <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                  <li>If you forget your password, go to the "Forgot Password" page</li>
                  <li>Enter your email address</li>
                  <li>Enter your recovery code when prompted</li>
                  <li>Set a new password for your account</li>
                  <li>You'll receive a new recovery code after resetting</li>
                </ol>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Account Security Overview */}
        <Card className="shadow-2xl border-orange-100 dark:border-orange-900 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Account Security Overview
            </CardTitle>
            <CardDescription>
              Current security status and recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-500" />
                <div>
                  <p className="font-medium text-green-800 dark:text-green-200">Password Protected</p>
                  <p className="text-sm text-green-600 dark:text-green-400">Strong password requirement enforced</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-500" />
                <div>
                  <p className="font-medium text-green-800 dark:text-green-200">Recovery Code Active</p>
                  <p className="text-sm text-green-600 dark:text-green-400">Account recovery method available</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-500" />
                <div>
                  <p className="font-medium text-green-800 dark:text-green-200">Rate Limited</p>
                  <p className="text-sm text-green-600 dark:text-green-400">Brute force protection enabled</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-500" />
                <div>
                  <p className="font-medium text-green-800 dark:text-green-200">Secure Sessions</p>
                  <p className="text-sm text-green-600 dark:text-green-400">Session-based authentication</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back Button */}
        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            data-testid="button-back-to-dashboard"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}