import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { Eye, EyeOff, Shield, Lock, Mail, ArrowRight } from "lucide-react";

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
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });
      console.log('Redirecting to home page...');
      // Small delay to ensure state is updated before redirect
      setTimeout(() => {
        setLocation('/');
      }, 100);
    } catch (error) {
      console.error('Login error in component:', error);
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-background opacity-50"></div>
      <div className="absolute top-20 right-20 w-96 h-96 bg-plus500-blue opacity-5 rounded-full blur-3xl animate-pulse-slow"></div>
      <div className="absolute bottom-20 left-20 w-64 h-64 bg-plus500-light-blue opacity-5 rounded-full blur-3xl animate-float"></div>
      
      <Card className="w-full max-w-md relative z-10 neo-card border-0 shadow-2xl">
        <CardHeader className="text-center pb-8">
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl plus500-gradient flex items-center justify-center glow-plus500">
            <span className="text-2xl font-bold text-white">500</span>
            <span className="text-lg font-bold text-white">+</span>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-plus500-blue to-plus500-light-blue bg-clip-text text-transparent mb-2">
            Welcome to Plus500
          </CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            VIP Investors - Premium Trading Platform
          </CardDescription>
          
          {/* Security indicators */}
          <div className="flex items-center justify-center gap-4 mt-4">
            <div className="flex items-center gap-2 glass-card px-3 py-1 rounded-xl">
              <Shield className="w-4 h-4 text-emerald" />
              <span className="text-xs text-emerald font-medium">Bank-Level Security</span>
            </div>
            <div className="flex items-center gap-2 glass-card px-3 py-1 rounded-xl">
              <Lock className="w-4 h-4 text-plus500-blue" />
              <span className="text-xs text-sapphire font-medium">256-bit SSL</span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email address"
                  className="pl-12 h-12 rounded-xl border-border bg-card hover:border-bitcoin focus:border-bitcoin transition-all duration-300"
                />
              </div>
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="password" className="text-sm font-medium text-foreground">Password</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  className="pl-12 pr-12 h-12 rounded-xl border-border bg-card hover:border-bitcoin focus:border-bitcoin transition-all duration-300"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-lg hover:bg-muted"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Eye className="w-4 h-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-12 gradient-primary text-black font-semibold rounded-xl hover:scale-105 transition-all duration-300 shadow-lg group"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
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
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-border"></div>
              <span className="text-sm text-muted-foreground">New to CoreX?</span>
              <div className="flex-1 h-px bg-border"></div>
            </div>
            
            <Link href="/register">
              <Button 
                variant="outline" 
                className="w-full h-12 rounded-xl border-bitcoin text-bitcoin hover:bg-bitcoin hover:text-black transition-all duration-300"
              >
                Create Account
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
