import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Mail, Shield, Key, Lock, Eye, EyeOff, CheckCircle } from "lucide-react";
import { resetPasswordSchema, type ResetPasswordData } from "@shared/schema";
import { useSecureAuth } from "@/hooks/use-auth-secure";

export default function ResetPasswordPage() {
  const [, navigate] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const { resetPasswordMutation } = useSecureAuth();

  const form = useForm<ResetPasswordData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: "",
      recoveryCode: "",
      newPassword: "",
    },
  });

  const onSubmit = async (data: ResetPasswordData) => {
    await resetPasswordMutation.mutateAsync(data);
  };

  const isSuccess = resetPasswordMutation.isSuccess;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
            Reset Password
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Enter your recovery code and new password
          </p>
        </div>

        <Card className="shadow-2xl border-orange-100 dark:border-orange-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              Password Reset
            </CardTitle>
            <CardDescription>
              Use your recovery code to set a new password
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isSuccess ? (
              <div className="space-y-4 text-center">
                <div className="flex items-center justify-center mb-4">
                  <CheckCircle className="w-16 h-16 text-green-500" />
                </div>
                
                <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    <strong>Password Reset Successful!</strong>
                    <p className="mt-2">
                      Your password has been updated and you've received a new recovery code. 
                      Please save your new recovery code securely.
                    </p>
                  </AlertDescription>
                </Alert>
                
                <Button 
                  onClick={() => navigate("/auth")}
                  className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700"
                  data-testid="button-continue-to-login"
                >
                  Continue to Login
                </Button>
              </div>
            ) : (
              <>
                <Alert className="mb-6 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
                  <Key className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800 dark:text-amber-200">
                    <strong>Recovery Code Required:</strong>
                    <p className="text-sm mt-1">
                      Enter the recovery code that was provided when you created your account. 
                      This code is required to verify your identity and reset your password.
                    </p>
                  </AlertDescription>
                </Alert>
                
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email address"
                        className="pl-10"
                        {...form.register("email")}
                        data-testid="input-reset-email"
                      />
                    </div>
                    {form.formState.errors.email && (
                      <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="recoveryCode">Recovery Code</Label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="recoveryCode"
                        type="text"
                        placeholder="ABCD-1234-XYZ9"
                        className="pl-10 font-mono text-center tracking-wider uppercase"
                        {...form.register("recoveryCode")}
                        onChange={(e) => {
                          const value = e.target.value.toUpperCase();
                          form.setValue("recoveryCode", value);
                        }}
                        data-testid="input-recovery-code"
                      />
                    </div>
                    {form.formState.errors.recoveryCode && (
                      <p className="text-sm text-red-500">{form.formState.errors.recoveryCode.message}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      Format: XXXX-XXXX-XXXX (e.g., ABCD-1234-XYZ9)
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="newPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a strong password"
                        className="pl-10 pr-10"
                        {...form.register("newPassword")}
                        data-testid="input-new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        data-testid="button-toggle-new-password"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {form.formState.errors.newPassword && (
                      <p className="text-sm text-red-500">{form.formState.errors.newPassword.message}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      Must contain uppercase, lowercase, number, and special character
                    </p>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700"
                    disabled={resetPasswordMutation.isPending}
                    data-testid="button-reset-submit"
                  >
                    {resetPasswordMutation.isPending ? "Resetting Password..." : "Reset Password"}
                  </Button>
                </form>
              </>
            )}
            
            <div className="mt-6 text-center">
              <Button
                variant="ghost"
                onClick={() => navigate("/forgot-password")}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                data-testid="link-back-to-forgot"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Email Entry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}