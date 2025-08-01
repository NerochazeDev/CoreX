import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { BottomNavigation } from "@/components/bottom-navigation";
import { Copy, User, Bitcoin, Key, ExternalLink, Shield, ArrowLeft, TrendingUp, Activity, Calendar, Mail, Hash, Award, Wallet, Eye, EyeOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useCurrency } from "@/hooks/use-currency";
import { formatBitcoin, formatCurrency } from "@/lib/utils";
import { useBitcoinPrice } from "@/hooks/use-bitcoin-price";
import { useQuery } from "@tanstack/react-query";
import type { Investment, Transaction } from "@shared/schema";
import { ProtectedRoute } from "@/components/protected-route";

function ProfileContent() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const { currency } = useCurrency();
  const { data: price } = useBitcoinPrice();
  const [showSensitiveInfo, setShowSensitiveInfo] = useState(false);
  const [displayUserId, setDisplayUserId] = useState(0);

  useEffect(() => {
    // Generate user ID between 3455 and 9999
    const userId = Math.floor(Math.random() * (9999 - 3455 + 1)) + 3455;
    setDisplayUserId(userId);
  }, []);

  const { data: investments } = useQuery<Investment[]>({
    queryKey: ['/api/investments/user', user?.id],
    enabled: !!user?.id,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: transactions } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions'],
    enabled: !!user,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const fiatValue = parseFloat(user.balance) * (currency === 'USD' ? (price?.usd.price || 0) : (price?.gbp.price || 0));
  const totalInvested = investments?.reduce((sum, inv) => sum + parseFloat(inv.amount || '0'), 0) || 0;
  const totalProfit = investments?.reduce((sum, inv) => sum + parseFloat(inv.currentProfit || '0'), 0) || 0;
  const activeInvestments = investments?.filter(inv => inv.isActive === true).length || 0;
  const completedInvestments = investments?.filter(inv => inv.isActive === false).length || 0;
  const userTransactions = transactions?.filter(tx => tx.userId === user.id).length || 0;

  const accountAge = Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24));

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: `${label} copied to clipboard`,
    });
  };

  return (
    <div className="min-h-screen dark-bg">
      {/* Navigation Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b dark-border">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold dark-text">Profile</h1>
              <p className="text-muted-foreground text-sm">Your account overview</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-sm mx-auto p-4 pb-20">
        {/* Profile Header Card */}
        <Card className="dark-card dark-border mb-6 overflow-hidden">
          <div className="bitcoin-gradient p-6 text-white relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{user.email.split('@')[0]}</h2>
                  <p className="text-orange-100 text-sm">ID: #{displayUserId}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {user.isAdmin ? (
                      <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                        <Shield className="w-3 h-3 mr-1" />
                        Admin
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                        Member
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-orange-100 text-xs">Account Age</p>
                  <p className="text-white font-semibold">{accountAge} days</p>
                </div>
                <div>
                  <p className="text-orange-100 text-xs">Total Transactions</p>
                  <p className="text-white font-semibold">{userTransactions}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Balance Overview */}
        <Card className="dark-card dark-border mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark-text">
              <Wallet className="w-5 h-5 text-bitcoin" />
              Balance Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current Balance</p>
                <p className="text-2xl font-bold dark-text">{formatBitcoin(user.balance)} BTC</p>
                <p className="text-sm text-muted-foreground">≈ {price ? formatCurrency(fiatValue, currency) : 'Loading...'}</p>
              </div>
              <div className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSensitiveInfo(!showSensitiveInfo)}
                  className="mb-2"
                >
                  {showSensitiveInfo ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {showSensitiveInfo && (
              <>
                <Separator />
                <div className="grid grid-cols-1 gap-4 text-center">
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground">Account Type</p>
                    <p className="text-sm dark-text">{user.isAdmin ? 'Administrator' : 'Standard Member'}</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Investment Statistics */}
        <Card className="dark-card dark-border mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between dark-text">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                Investment Statistics
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  // Force refresh the data
                  window.location.reload();
                }}
                className="h-8 w-8 p-0"
              >
                <Activity className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <Activity className="w-5 h-5 mx-auto mb-2 text-blue-500" />
                <p className="text-lg font-bold dark-text">{activeInvestments}</p>
                <p className="text-xs text-muted-foreground">Active Plans</p>
              </div>
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <Award className="w-5 h-5 mx-auto mb-2 text-green-500" />
                <p className="text-lg font-bold dark-text">{completedInvestments}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Invested</span>
                <span className="font-semibold dark-text">{formatBitcoin(totalInvested.toString())} BTC</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Profit</span>
                <span className="font-semibold text-green-500">+{formatBitcoin(totalProfit.toString())} BTC</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Portfolio Value</span>
                <span className="font-bold dark-text">{formatBitcoin((totalInvested + totalProfit).toString())} BTC</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card className="dark-card dark-border mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark-text">
              <User className="w-5 h-5" />
              Account Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Email</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm dark-text">{user.email}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(user.email, 'Email')}
                  className="h-6 w-6 p-0"
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Member Since</span>
              </div>
              <span className="text-sm dark-text">
                {new Date(user.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Security Level</span>
              </div>
              <Badge variant="outline" className="text-green-600 border-green-600">
                High Security
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Security Information */}
        <Card className="dark-card dark-border mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark-text">
              <Shield className="w-5 h-5 text-green-500" />
              Platform Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <h4 className="font-medium dark-text mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-600" />
                Custodial Security System
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Your Bitcoin is secured in our institutional-grade vault</li>
                <li>• Multi-signature security protocols</li>
                <li>• Cold storage for maximum protection</li>
                <li>• 24/7 monitoring and threat detection</li>
                <li>• Insurance coverage for digital assets</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Link href="/settings">
            <Button variant="outline" className="w-full h-12">
              <User className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </Link>
          <Button
            onClick={logout}
            variant="outline"
            className="w-full h-12 text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}

export default function Profile() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}