import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Mail, Shield, Info } from "lucide-react";
import { forgotPasswordSchema, type ForgotPasswordData } from "@shared/schema";
import { useSecureAuth } from "@/hooks/use-auth-secure";

export default function ForgotPasswordPage() {
  const [, navigate] = useLocation();
  const { forgotPasswordMutation } = useSecureAuth();

  const form = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordData) => {
    await forgotPasswordMutation.mutateAsync(data);
  };

  const isSuccess = forgotPasswordMutation.isSuccess;

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
            Password Recovery
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Use your recovery code to reset your password
          </p>
        </div>

        <Card className="shadow-2xl border-orange-100 dark:border-orange-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Forgot Your Password?
            </CardTitle>
            <CardDescription>
              Enter your email address to proceed with password recovery
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isSuccess ? (
              <div className="space-y-4">
                <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                  <Info className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    If an account with that email exists, you can now proceed to reset your password using your recovery code.
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-3">
                  <Button 
                    onClick={() => navigate("/reset-password")}
                    className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700"
                    data-testid="button-proceed-reset"
                  >
                    Reset Password with Recovery Code
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => navigate("/auth")}
                    className="w-full"
                    data-testid="button-back-to-login"
                  >
                    Back to Login
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <Alert className="mb-6 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800 dark:text-blue-200">
                    <strong>Recovery Process:</strong>
                    <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                      <li>Enter your email address below</li>
                      <li>You'll be directed to enter your recovery code</li>
                      <li>Set a new password for your account</li>
                      <li>You'll receive a new recovery code</li>
                    </ol>
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
                        data-testid="input-forgot-email"
                      />
                    </div>
                    {form.formState.errors.email && (
                      <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
                    )}
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700"
                    disabled={forgotPasswordMutation.isPending}
                    data-testid="button-forgot-submit"
                  >
                    {forgotPasswordMutation.isPending ? "Processing..." : "Continue with Recovery"}
                  </Button>
                </form>
              </>
            )}
            
            <div className="mt-6 text-center">
              <Button
                variant="ghost"
                onClick={() => navigate("/auth")}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                data-testid="link-back-to-auth"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}