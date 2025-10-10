
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { Eye, EyeOff, Shield, Lock, Mail, ArrowRight } from "lucide-react";
import { BitVaultLogo } from "@/components/bitvault-logo";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('Starting login process...');
      await login(email, password);
      console.log('Login completed, showing success toast...');
      toast({
        title: "🎉 Welcome Back!",
        description: "You've successfully signed in to your BitVault Pro account. Your investments await!",
        variant: "default",
      });
      console.log('Redirecting to homepage...');
      setTimeout(() => {
        setLocation('/');
      }, 100);
    } catch (error) {
      console.error('Login error in component:', error);
      const errorMessage = error instanceof Error ? error.message : "Invalid credentials provided";
      
      let title = "Login Failed";
      let description = "Please check your email and password and try again.";
      
      if (errorMessage.toLowerCase().includes("email")) {
        description = "The email address you entered is not registered. Please check your email or create a new account.";
      } else if (errorMessage.toLowerCase().includes("password")) {
        description = "Incorrect password. Please try again or reset your password if you've forgotten it.";
      } else if (errorMessage.toLowerCase().includes("network") || errorMessage.toLowerCase().includes("connection")) {
        title = "Connection Issue";
        description = "Unable to connect to our servers. Please check your internet connection and try again.";
      }
      
      toast({
        title,
        description,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/20 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        {/* Main Login Card - Match Home Page Style */}
        <div className="relative">
          {/* 3D Shadow Base */}
          <div className="absolute top-3 left-3 w-full h-full bg-gradient-to-br from-orange-500/30 to-orange-600/40 rounded-3xl blur-lg"></div>

          {/* Main Card */}
          <Card className="relative bg-gradient-to-br from-orange-500 via-orange-600/90 to-orange-700 dark:from-orange-600 dark:via-orange-700/90 dark:to-orange-800 border border-orange-400/60 dark:border-orange-500/50 rounded-3xl shadow-2xl shadow-orange-600/30 backdrop-blur-xl overflow-hidden">
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-orange-400/20 via-orange-500/10 to-orange-600/25 pointer-events-none"></div>

            <CardHeader className="relative text-center pb-6 pt-8">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="absolute -inset-2 bg-white/20 rounded-2xl blur-xl"></div>
                  <div className="relative bg-white/90 dark:bg-gray-900/90 p-3 rounded-2xl shadow-xl">
                    <BitVaultLogo size="lg" showPro={true} />
                  </div>
                </div>
              </div>
              <CardTitle className="text-3xl font-bold text-white mb-2">
                Welcome Back
              </CardTitle>
              <CardDescription className="text-lg text-orange-100">
                Access your BitVault Pro investment platform
              </CardDescription>
              
              {/* Security indicators */}
              <div className="flex items-center justify-center gap-4 mt-4">
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-lg border border-white/30">
                  <Shield className="w-4 h-4 text-white" />
                  <span className="text-xs text-white font-medium">Bank-Level Security</span>
                </div>
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-lg border border-white/30">
                  <Lock className="w-4 h-4 text-white" />
                  <span className="text-xs text-white font-medium">256-bit SSL</span>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="relative space-y-6 pb-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-sm font-medium text-white">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-orange-600" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="Enter your email address"
                      className="pl-12 h-12 rounded-xl border-white/30 bg-white/90 dark:bg-gray-900/90 text-gray-900 dark:text-white placeholder:text-gray-500 focus:border-white focus:ring-white/50 transition-all duration-300"
                    />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="password" className="text-sm font-medium text-white">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-orange-600" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="Enter your password"
                      className="pl-12 pr-12 h-12 rounded-xl border-white/30 bg-white/90 dark:bg-gray-900/90 text-gray-900 dark:text-white placeholder:text-gray-500 focus:border-white focus:ring-white/50 transition-all duration-300"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-lg hover:bg-white/20"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 text-orange-600" />
                      ) : (
                        <Eye className="w-4 h-4 text-orange-600" />
                      )}
                    </Button>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-12 font-semibold bg-white hover:bg-gray-100 text-orange-600 hover:text-orange-700 rounded-xl shadow-lg transition-all duration-300 group"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>Sign In</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  )}
                </Button>
              </form>
              
              <div className="text-center space-y-4">
                <div className="text-center">
                  <Link href="/forgot-password">
                    <Button 
                      variant="link" 
                      className="text-sm text-orange-100 hover:text-white underline"
                    >
                      Forgot your password?
                    </Button>
                  </Link>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-white/30"></div>
                  <span className="text-sm text-orange-100">or</span>
                  <div className="flex-1 h-px bg-white/30"></div>
                </div>
                
                {/* Google OAuth Login */}
                <Button 
                  type="button"
                  variant="outline"
                  className="w-full h-12 rounded-xl border-white/30 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white transition-all duration-300"
                  onClick={() => window.location.href = '/api/auth/google'}
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span>Continue with Google</span>
                  </div>
                </Button>
                
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-white/30"></div>
                  <span className="text-sm text-orange-100">New to BitVault Pro?</span>
                  <div className="flex-1 h-px bg-white/30"></div>
                </div>
                
                <Link href="/register">
                  <Button 
                    variant="outline" 
                    className="w-full h-12 rounded-xl border-white/30 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white transition-all duration-300"
                  >
                    Create Account
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
