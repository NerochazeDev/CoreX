import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, Shield, Key, Mail, User, Lock, AlertTriangle } from "lucide-react";
import { signupSchema, loginSchema, type SignupData, type LoginData } from "@shared/schema";
import { useSecureAuth } from "@/hooks/use-auth-secure";

export default function AuthPage() {
  const [, navigate] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState<string>("");
  const { user, loginMutation, signupMutation } = useSecureAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const signupForm = useForm<SignupData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
    },
  });

  const onLogin = async (data: LoginData) => {
    await loginMutation.mutateAsync(data);
    navigate("/");
  };

  const onSignup = async (data: SignupData) => {
    const result = await signupMutation.mutateAsync(data);
    if (result?.recoveryCode) {
      setRecoveryCode(result.recoveryCode);
    }
    // Don't navigate immediately - let user see recovery code first
  };

  if (user) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        
        {/* Left Column - Auth Forms */}
        <div className="w-full max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center">
                <Shield className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
              BitVault Pro
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Secure Bitcoin Investment Platform
            </p>
          </div>

          {/* Recovery Code Display */}
          {recoveryCode && (
            <Alert className="mb-6 border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
              <Key className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800 dark:text-orange-200">
                <strong>IMPORTANT: Save your recovery code securely!</strong>
                <div className="mt-2 p-3 bg-white dark:bg-gray-800 border rounded font-mono text-lg text-center tracking-wider">
                  {recoveryCode}
                </div>
                <p className="text-sm mt-2">
                  This code will never be shown again. You'll need it to recover your account if you forget your password.
                </p>
                <Button 
                  onClick={() => {setRecoveryCode(""); navigate("/");}} 
                  className="mt-3 w-full"
                  data-testid="button-continue-after-signup"
                >
                  I've Saved My Recovery Code - Continue
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <Card className="shadow-2xl border-orange-100 dark:border-orange-900">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login" data-testid="tab-login">Sign In</TabsTrigger>
                <TabsTrigger value="signup" data-testid="tab-signup">Create Account</TabsTrigger>
              </TabsList>
              
              {/* Login Tab */}
              <TabsContent value="login">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="w-5 h-5" />
                    Sign In to Your Account
                  </CardTitle>
                  <CardDescription>
                    Enter your credentials to access BitVault Pro
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="Enter your email"
                          className="pl-10"
                          {...loginForm.register("email")}
                          data-testid="input-login-email"
                        />
                      </div>
                      {loginForm.formState.errors.email && (
                        <p className="text-sm text-red-500">{loginForm.formState.errors.email.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="login-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          className="pl-10 pr-10"
                          {...loginForm.register("password")}
                          data-testid="input-login-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                          data-testid="button-toggle-password"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {loginForm.formState.errors.password && (
                        <p className="text-sm text-red-500">{loginForm.formState.errors.password.message}</p>
                      )}
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700"
                      disabled={loginMutation.isPending}
                      data-testid="button-login-submit"
                    >
                      {loginMutation.isPending ? "Signing In..." : "Sign In"}
                    </Button>
                  </form>
                  
                  <div className="mt-4 text-center">
                    <Button
                      variant="link"
                      onClick={() => navigate("/forgot-password")}
                      data-testid="link-forgot-password"
                    >
                      Forgot your password?
                    </Button>
                  </div>
                </CardContent>
              </TabsContent>
              
              {/* Signup Tab */}
              <TabsContent value="signup">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Create Your Account
                  </CardTitle>
                  <CardDescription>
                    Join BitVault Pro and start your Bitcoin investment journey
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={signupForm.handleSubmit(onSignup)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-firstName">First Name</Label>
                        <Input
                          id="signup-firstName"
                          placeholder="First name"
                          {...signupForm.register("firstName")}
                          data-testid="input-signup-firstName"
                        />
                        {signupForm.formState.errors.firstName && (
                          <p className="text-sm text-red-500">{signupForm.formState.errors.firstName.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-lastName">Last Name</Label>
                        <Input
                          id="signup-lastName"
                          placeholder="Last name"
                          {...signupForm.register("lastName")}
                          data-testid="input-signup-lastName"
                        />
                        {signupForm.formState.errors.lastName && (
                          <p className="text-sm text-red-500">{signupForm.formState.errors.lastName.message}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="Enter your email"
                          className="pl-10"
                          {...signupForm.register("email")}
                          data-testid="input-signup-email"
                        />
                      </div>
                      {signupForm.formState.errors.email && (
                        <p className="text-sm text-red-500">{signupForm.formState.errors.email.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="signup-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a strong password"
                          className="pl-10 pr-10"
                          {...signupForm.register("password")}
                          data-testid="input-signup-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {signupForm.formState.errors.password && (
                        <p className="text-sm text-red-500">{signupForm.formState.errors.password.message}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        Must contain uppercase, lowercase, number, and special character
                      </p>
                    </div>
                    
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Security Notice:</strong> You'll receive a unique recovery code after signup. 
                        Save it securely - it's your only way to recover your account if you forget your password.
                      </AlertDescription>
                    </Alert>
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700"
                      disabled={signupMutation.isPending}
                      data-testid="button-signup-submit"
                    >
                      {signupMutation.isPending ? "Creating Account..." : "Create Account"}
                    </Button>
                  </form>
                </CardContent>
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        {/* Right Column - Hero Section */}
        <div className="hidden lg:block">
          <div className="text-center space-y-6">
            <div className="w-32 h-32 mx-auto bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center shadow-2xl">
              <Shield className="w-16 h-16 text-white" />
            </div>
            
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white">
              Secure Bitcoin Investment Platform
            </h2>
            
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              Join thousands of investors who trust BitVault Pro for professional Bitcoin investment management with institutional-grade security.
            </p>
            
            <div className="grid grid-cols-1 gap-4 max-w-md mx-auto mt-8">
              <div className="flex items-center gap-3 p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg backdrop-blur-sm">
                <Shield className="w-6 h-6 text-orange-500" />
                <span className="text-gray-700 dark:text-gray-300">Military-grade encryption</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg backdrop-blur-sm">
                <Key className="w-6 h-6 text-orange-500" />
                <span className="text-gray-700 dark:text-gray-300">Recovery code protection</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg backdrop-blur-sm">
                <Lock className="w-6 h-6 text-orange-500" />
                <span className="text-gray-700 dark:text-gray-300">Advanced authentication</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}