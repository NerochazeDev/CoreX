
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, ArrowRight, LogIn } from "lucide-react";
import { Link } from "wouter";

interface LoginRedirectProps {
  message?: string;
  redirectPath?: string;
}

export function LoginRedirect({ 
  message = "Please sign in to continue", 
  redirectPath = "/login" 
}: LoginRedirectProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-background opacity-50"></div>
      <div className="absolute top-20 right-20 w-96 h-96 bg-bitcoin opacity-5 rounded-full blur-3xl animate-pulse-slow"></div>
      <div className="absolute bottom-20 left-20 w-64 h-64 bg-emerald opacity-5 rounded-full blur-3xl animate-float"></div>
      
      <Card className="w-full max-w-md relative z-10 neo-card border-0 shadow-2xl">
        <CardHeader className="text-center pb-8">
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl gradient-primary flex items-center justify-center animate-glow">
            <span className="text-3xl font-bold text-black">₿</span>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-bitcoin to-gold bg-clip-text text-transparent mb-2">
            Authentication Required
          </CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            {message}
          </CardDescription>
          
          {/* Security indicators */}
          <div className="flex items-center justify-center gap-4 mt-4">
            <div className="flex items-center gap-2 glass-card px-3 py-1 rounded-xl">
              <Shield className="w-4 h-4 text-emerald" />
              <span className="text-xs text-emerald font-medium">Secure Access</span>
            </div>
            <div className="flex items-center gap-2 glass-card px-3 py-1 rounded-xl">
              <Lock className="w-4 h-4 text-sapphire" />
              <span className="text-xs text-sapphire font-medium">Protected</span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              You need to be signed in to access this feature. Please log in to your Plus500 VIP account to continue.
            </p>
            
            <Link href={redirectPath}>
              <Button 
                className="w-full h-12 gradient-primary text-black font-semibold rounded-xl hover:scale-105 transition-all duration-300 shadow-lg group"
              >
                <div className="flex items-center gap-2">
                  <LogIn className="w-5 h-5" />
                  <span>Sign In to Plus500 VIP</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Button>
            </Link>
            
            <div className="flex items-center gap-4 mt-6">
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
