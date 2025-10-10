
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BitVaultLogo } from "@/components/bitvault-logo";
import { Shield, TrendingUp, Lock, Zap, ArrowRight, ExternalLink, CheckCircle, BarChart3, Wallet, Users, Clock, DollarSign } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export default function Landing() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (user) {
      setLocation('/dashboard');
    }
  }, [user, setLocation]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/20 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BitVaultLogo size="md" showPro={true} />
            </div>
            <div className="flex items-center gap-4">
              <a 
                href="https://t.me/BitVault_PRO" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-orange-500/30 hover:bg-orange-500/10 transition-colors"
              >
                <svg className="w-5 h-5 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                </svg>
                <span className="text-sm font-medium">Join Telegram</span>
              </a>
              <Link href="/login">
                <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-amber-500/10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl sm:text-6xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-6">
              Professional Bitcoin Investment Platform
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              BitVault Pro is an institutional-grade Bitcoin investment platform that combines cutting-edge security with automated portfolio management. Our advanced algorithms and professional-grade infrastructure enable investors to grow their Bitcoin holdings with confidence and transparency.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/login">
                <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white h-14 px-8 text-lg group">
                  <span>Start Investing Today</span>
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <a href="https://t.me/BitVault_PRO" target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-lg border-orange-500 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950">
                  <svg className="mr-2 w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                  </svg>
                  <span>Join Community</span>
                  <ExternalLink className="ml-2 w-4 h-4" />
                </Button>
              </a>
            </div>

            {/* Trust Indicators */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 mb-1">10,000+</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Active Investors</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 mb-1">256-bit</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">SSL Encryption</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 mb-1">24/7</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Support Available</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 mb-1">99.9%</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Uptime Guarantee</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What We Do Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              What BitVault Pro Does For You
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              We provide a comprehensive Bitcoin investment solution that handles everything from secure storage to automated profit generation, allowing you to focus on your financial goals.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <Card className="border-orange-500/20">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <Wallet className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-center">Secure Bitcoin Storage</h3>
                <p className="text-gray-600 dark:text-gray-400 text-center">
                  Your Bitcoin is stored in institutional-grade cold wallets with multi-signature protection, ensuring maximum security against theft and unauthorized access.
                </p>
              </CardContent>
            </Card>

            <Card className="border-orange-500/20">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-center">Automated Trading</h3>
                <p className="text-gray-600 dark:text-gray-400 text-center">
                  Our advanced algorithms execute strategic trades 24/7, capitalizing on market opportunities to generate consistent returns on your Bitcoin investment.
                </p>
              </CardContent>
            </Card>

            <Card className="border-orange-500/20">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-center">Daily Profit Distribution</h3>
                <p className="text-gray-600 dark:text-gray-400 text-center">
                  Watch your portfolio grow with daily profit distributions directly to your wallet. Track real-time performance and withdrawal anytime without penalties.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              How BitVault Pro Works
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              A simple, transparent process from signup to profit
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mb-4 mx-auto">
                <span className="text-2xl font-bold text-orange-600">1</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Create Account</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Sign up with secure authentication and complete KYC verification in minutes
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mb-4 mx-auto">
                <span className="text-2xl font-bold text-orange-600">2</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Choose Investment Plan</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Select from our range of investment plans starting from as low as $10
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mb-4 mx-auto">
                <span className="text-2xl font-bold text-orange-600">3</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Deposit Bitcoin</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Securely deposit Bitcoin to your investment wallet using our encrypted system
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mb-4 mx-auto">
                <span className="text-2xl font-bold text-orange-600">4</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Earn Daily Profits</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Watch your investment grow with automated daily returns distributed to your wallet
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Security Features Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Enterprise-Grade Security
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Your investment protection is our top priority
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Cold Wallet Storage</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  95% of funds stored offline in secure cold wallets, protected from online threats
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Multi-Signature Protection</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Multiple authorization levels required for all transactions and withdrawals
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">256-bit SSL Encryption</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Bank-level encryption for all data transmission and storage
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Two-Factor Authentication</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Advanced 2FA and biometric authentication for account access
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Real-Time Monitoring</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  24/7 security monitoring and fraud detection systems
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Recovery Protection</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Secure recovery codes and backup systems for account restoration
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Investment Plans Preview */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Flexible Investment Plans
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Choose the plan that matches your investment goals
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-orange-500/20 hover:border-orange-500/40 transition-colors">
              <CardContent className="pt-6">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">Starter</h3>
                  <div className="text-3xl font-bold text-orange-600 mb-2">$10 - $100</div>
                  <p className="text-gray-600 dark:text-gray-400">Perfect for beginners</p>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Daily profit distribution</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Flexible withdrawal</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>24/7 support access</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-orange-500/20 hover:border-orange-500/40 transition-colors relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <span className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  POPULAR
                </span>
              </div>
              <CardContent className="pt-6">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">Professional</h3>
                  <div className="text-3xl font-bold text-orange-600 mb-2">$300 - $1,000</div>
                  <p className="text-gray-600 dark:text-gray-400">For serious investors</p>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Higher daily returns</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Priority withdrawals</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Advanced analytics</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Dedicated support</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-orange-500/20 hover:border-orange-500/40 transition-colors">
              <CardContent className="pt-6">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">VIP</h3>
                  <div className="text-3xl font-bold text-orange-600 mb-2">$3,000+</div>
                  <p className="text-gray-600 dark:text-gray-400">Maximum returns</p>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Premium profit rates</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Instant withdrawals</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Personal account manager</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Exclusive market insights</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why Investors Choose BitVault Pro
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="border-orange-500/20 hover:border-orange-500/40 transition-colors">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Proven Security</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Military-grade encryption and multi-layer security protocols protecting your assets 24/7
                </p>
              </CardContent>
            </Card>

            <Card className="border-orange-500/20 hover:border-orange-500/40 transition-colors">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg flex items-center justify-center mb-4">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Transparent Returns</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Real-time tracking of your investments with clear, daily profit distributions
                </p>
              </CardContent>
            </Card>

            <Card className="border-orange-500/20 hover:border-orange-500/40 transition-colors">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">24/7 Automation</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Advanced algorithms working around the clock to maximize your investment potential
                </p>
              </CardContent>
            </Card>

            <Card className="border-orange-500/20 hover:border-orange-500/40 transition-colors">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Expert Support</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Professional support team and active community helping you succeed every step
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-orange-500 to-amber-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Start Your Bitcoin Investment Journey Today
          </h2>
          <p className="text-xl text-orange-100 mb-8">
            Join thousands of successful investors who trust BitVault Pro with their Bitcoin investments. Get started in minutes with our secure, transparent, and professional platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" className="w-full sm:w-auto bg-white text-orange-600 hover:bg-gray-100 h-14 px-8 text-lg">
                Create Free Account
              </Button>
            </Link>
            <a href="https://t.me/BitVault_PRO" target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-lg border-white text-white hover:bg-white/10">
                Learn More in Community
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <BitVaultLogo size="sm" showPro={true} />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                © 2025 BitVault Pro. Professional Bitcoin Investment Platform.
              </span>
            </div>
            <div className="flex items-center gap-6">
              <a href="https://t.me/BitVault_PRO" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-orange-600 dark:text-gray-400 dark:hover:text-orange-500 transition-colors">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
