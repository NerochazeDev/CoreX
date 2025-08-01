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
    <div className="min-h-screen flex items-center justify-center p-6" style={{background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'}}>
      {/* Professional gradient background like authentic Plus500 */}
      
      <Card className="w-full max-w-md plus500-professional shadow-xl">
        <CardHeader className="text-center pb-8">
          <div className="flex justify-center mb-6">
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                <span className="font-black tracking-tight text-plus500-blue text-3xl">Plus</span>
                <div className="w-8 h-8 bg-plus500-blue rounded-sm flex items-center justify-center mx-1">
                  <span className="text-white font-black text-xl leading-none">+</span>
                </div>
                <span className="font-black tracking-tight text-plus500-blue text-3xl">500</span>
              </div>
              <span className="font-bold text-plus500-blue bg-plus500-blue/10 px-3 py-1 rounded-md text-lg ml-2">VIP</span>
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-plus500-blue mb-2">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-lg text-gray-600">
            Sign in to your Plus500 VIP account
          </CardDescription>
          
          {/* Security indicators */}
          <div className="flex items-center justify-center gap-4 mt-4">
            <div className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded-lg border border-green-200">
              <Shield className="w-4 h-4 text-green-600" />
              <span className="text-xs text-green-700 font-medium">Bank-Level Security</span>
            </div>
            <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200">
              <Lock className="w-4 h-4 text-plus500-blue" />
              <span className="text-xs text-plus500-blue font-medium">256-bit SSL</span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="email" className="text-sm font-medium text-plus500-dark-blue">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
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
              className="w-full plus500-btn h-12 font-semibold"
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
              <span className="text-sm text-muted-foreground">New to Plus500 VIP?</span>
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
