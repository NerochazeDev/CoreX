
import { useState, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, Shield, UserCheck, Globe, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { countries } from "@/lib/countries";
import { CustomCaptcha } from "@/components/custom-captcha";
import { BitVaultLogo } from "@/components/bitvault-logo";

export default function Register() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    country: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptMarketing, setAcceptMarketing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const { register } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const onCaptchaVerify = useCallback((isValid: boolean, token: string) => {
    if (isValid) {
      setCaptchaToken(token);
    } else {
      setCaptchaToken(null);
    }
  }, []);

  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const handlePasswordChange = (password: string) => {
    setFormData(prev => ({ ...prev, password }));
    setPasswordStrength(calculatePasswordStrength(password));
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 1) return "bg-red-500";
    if (passwordStrength <= 2) return "bg-orange-500";
    if (passwordStrength <= 3) return "bg-yellow-500";
    if (passwordStrength <= 4) return "bg-green-500";
    return "bg-green-500";
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 1) return "Weak";
    if (passwordStrength <= 2) return "Fair";
    if (passwordStrength <= 3) return "Good";
    if (passwordStrength <= 4) return "Strong";
    return "Very Strong";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "The passwords you entered don't match. Please ensure both password fields contain the same value.",
        variant: "destructive",
      });
      return;
    }

    if (passwordStrength < 3) {
      toast({
        title: "Password Security Requirements",
        description: "Your password doesn't meet our security standards. Please create a stronger password with at least 8 characters, including uppercase letters, lowercase letters, and numbers.",
        variant: "destructive",
      });
      return;
    }

    if (!acceptTerms) {
      toast({
        title: "Agreement Required",
        description: "Please read and accept our Terms of Service and Privacy Policy to create your BitVault Pro account.",
        variant: "destructive",
      });
      return;
    }

    if (!captchaToken) {
      toast({
        title: "Security Verification Required",
        description: "Please complete the security verification to confirm you're not a robot and continue with account creation.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        country: formData.country,
        password: formData.password,
        acceptMarketing,
        captchaToken: captchaToken || ''
      });
      toast({
        title: "🎉 Welcome to BitVault Pro!",
        description: "Your account has been created successfully and your secure Bitcoin wallet is ready. You can now start investing!",
        variant: "default",
      });
      setLocation('/dashboard');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Registration failed";
      
      let title = "Registration Failed";
      let description = "We couldn't create your account at this time. Please try again or contact support if the issue persists.";
      
      if (errorMessage.toLowerCase().includes("email")) {
        title = "Email Already Registered";
        description = "This email address is already associated with a BitVault Pro account. Please use a different email or try logging in instead.";
      } else if (errorMessage.toLowerCase().includes("network")) {
        title = "Connection Error";
        description = "Unable to connect to our servers. Please check your internet connection and try again.";
      } else if (errorMessage.toLowerCase().includes("validation")) {
        title = "Invalid Information";
        description = "Please check that all required fields are filled out correctly and try again.";
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/20 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-2xl mx-2 sm:mx-4">
        {/* Main Register Card - Match Home Page Style */}
        <div className="relative">
          {/* 3D Shadow Base */}
          <div className="absolute top-3 left-3 w-full h-full bg-gradient-to-br from-orange-500/30 to-orange-600/40 rounded-3xl blur-lg"></div>

          {/* Main Card */}
          <Card className="relative bg-gradient-to-br from-orange-500 via-orange-600/90 to-orange-700 dark:from-orange-600 dark:via-orange-700/90 dark:to-orange-800 border border-orange-400/60 dark:border-orange-500/50 rounded-3xl shadow-2xl shadow-orange-600/30 backdrop-blur-xl overflow-hidden">
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-orange-400/20 via-orange-500/10 to-orange-600/25 pointer-events-none"></div>

            <CardHeader className="relative text-center space-y-4 pt-8">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <div className="absolute -inset-2 bg-white/20 rounded-2xl blur-xl"></div>
                  <div className="relative bg-white/90 dark:bg-gray-900/90 p-3 rounded-2xl shadow-xl">
                    <BitVaultLogo size="lg" showPro={true} />
                  </div>
                </div>
              </div>
              <div>
                <CardTitle className="text-3xl font-bold text-white">
                  Join BitVault Pro
                </CardTitle>
                <CardDescription className="text-lg mt-2 text-orange-100">
                  Create your premium investment account
                </CardDescription>
              </div>
              <div className="flex justify-center gap-2">
                <Badge variant="outline" className="text-xs bg-white/20 backdrop-blur-sm border-white/30 text-white">
                  <Shield className="w-3 h-3 mr-1" />
                  Bank-Grade Security
                </Badge>
                <Badge variant="outline" className="text-xs bg-white/20 backdrop-blur-sm border-white/30 text-white">
                  <UserCheck className="w-3 h-3 mr-1" />
                  Instant Verification
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="relative pb-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-white" />
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-white">First Name *</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                        required
                        placeholder="John"
                        className="h-12 border-white/30 bg-white/90 dark:bg-gray-900/90 text-gray-900 dark:text-white placeholder:text-gray-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-white">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                        required
                        placeholder="Doe"
                        className="h-12 border-white/30 bg-white/90 dark:bg-gray-900/90 text-gray-900 dark:text-white placeholder:text-gray-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-white">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        required
                        placeholder="john@example.com"
                        className="h-12 border-white/30 bg-white/90 dark:bg-gray-900/90 text-gray-900 dark:text-white placeholder:text-gray-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-white">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+1 (555) 000-0000"
                        className="h-12 border-white/30 bg-white/90 dark:bg-gray-900/90 text-gray-900 dark:text-white placeholder:text-gray-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country" className="text-white">Country/Region *</Label>
                    <Select onValueChange={(value) => setFormData(prev => ({ ...prev, country: value }))}>
                      <SelectTrigger className="h-12 border-white/30 bg-white/90 dark:bg-gray-900/90 text-gray-900 dark:text-white">
                        <SelectValue placeholder="Select your country" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {countries.map((country) => (
                          <SelectItem key={country} value={country}>
                            <div className="flex items-center gap-2">
                              <Globe className="w-4 h-4" />
                              {country}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Security */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Shield className="w-5 h-5 text-white" />
                    Security Setup
                  </h3>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-white">Password *</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => handlePasswordChange(e.target.value)}
                        required
                        placeholder="Create a strong password"
                        className="h-12 pr-12 border-white/30 bg-white/90 dark:bg-gray-900/90 text-gray-900 dark:text-white placeholder:text-gray-500"
                        minLength={8}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-white/20"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4 text-orange-600" /> : <Eye className="h-4 w-4 text-orange-600" />}
                      </Button>
                    </div>
                    {formData.password && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-white">Password Strength:</span>
                          <span className={`font-medium ${
                            passwordStrength <= 2 ? 'text-red-300' : 
                            passwordStrength <= 3 ? 'text-yellow-300' : 'text-green-300'
                          }`}>
                            {getPasswordStrengthText()}
                          </span>
                        </div>
                        <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                            style={{ width: `${(passwordStrength / 5) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-white">Confirm Password *</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        required
                        placeholder="Confirm your password"
                        className="h-12 pr-12 border-white/30 bg-white/90 dark:bg-gray-900/90 text-gray-900 dark:text-white placeholder:text-gray-500"
                        minLength={8}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-white/20"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4 text-orange-600" /> : <Eye className="h-4 w-4 text-orange-600" />}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Security Verification */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Shield className="w-5 h-5 text-white" />
                    Security Verification
                  </h3>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <CustomCaptcha onVerify={onCaptchaVerify} />
                  </div>
                </div>

                {/* Terms and Conditions */}
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Checkbox 
                      id="terms" 
                      checked={acceptTerms}
                      onCheckedChange={(checked) => setAcceptTerms(checked === true)}
                      className="mt-1 border-white/50 data-[state=checked]:bg-white data-[state=checked]:text-orange-600"
                    />
                    <div className="space-y-1">
                      <Label htmlFor="terms" className="text-sm leading-5 text-white">
                        I agree to the{" "}
                        <Link href="/terms" className="text-orange-200 hover:text-white underline font-medium">
                          Terms of Service
                        </Link>{" "}
                        and{" "}
                        <Link href="/privacy" className="text-orange-200 hover:text-white underline font-medium">
                          Privacy Policy
                        </Link>
                        <span className="text-red-300 ml-1">*</span>
                      </Label>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Checkbox 
                      id="marketing" 
                      checked={acceptMarketing}
                      onCheckedChange={(checked) => setAcceptMarketing(checked === true)}
                      className="border-white/50 data-[state=checked]:bg-white data-[state=checked]:text-orange-600"
                    />
                    <Label htmlFor="marketing" className="text-sm leading-5 text-white">
                      I want to receive market updates, investment insights, and promotional offers via email
                    </Label>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-14 text-lg font-bold bg-white hover:bg-gray-100 text-orange-600 hover:text-orange-700 rounded-xl shadow-lg transition-all duration-300 group"
                  disabled={isLoading || !acceptTerms || !captchaToken}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                      Creating Your Account...
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <UserCheck className="w-6 h-6" />
                      Create Account & Generate Wallet
                    </div>
                  )}
                </Button>
              </form>

              <div className="mt-8 text-center space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-white/30"></div>
                  <span className="text-sm text-orange-100">or</span>
                  <div className="flex-1 h-px bg-white/30"></div>
                </div>
                
                {/* Google OAuth Register */}
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
                    <span>Sign Up with Google</span>
                  </div>
                </Button>
                
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-white/30"></div>
                  <span className="text-sm text-orange-100">Already have an account?</span>
                  <div className="flex-1 h-px bg-white/30"></div>
                </div>
                
                <Link href="/login">
                  <Button 
                    variant="outline" 
                    className="w-full h-12 rounded-xl border-white/30 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white transition-all duration-300"
                  >
                    Sign In to Existing Account
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
