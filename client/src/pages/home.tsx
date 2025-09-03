
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BitVaultLogo } from "@/components/bitvault-logo";
import { WalletBalance } from "@/components/wallet-balance";
import { BitcoinPrice } from "@/components/bitcoin-price";
import { BottomNavigation } from "@/components/bottom-navigation";
import type { Investment, InvestmentPlan } from "@shared/schema";
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  TrendingUp, 
  Bell, 
  User, 
  RefreshCw,
  Eye,
  EyeOff,
  Menu,
  Plus,
  ChevronRight,
  Activity,
  Wallet,
  PieChart,
  BarChart3,
  DollarSign,
  Clock,
  Star,
  Search,
  Settings,
  Download,
  Upload,
  Zap,
  Send,
  ArrowDownToLine,
  ArrowUpFromLine
} from "lucide-react";
import { formatBitcoin, formatBitcoinWithFiat, formatDate, formatCurrency } from "@/lib/utils";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { useCurrency } from "@/hooks/use-currency";
import { useBitcoinPrice } from "@/hooks/use-bitcoin-price";

export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showBalances, setShowBalances] = useState(true);
  const { currency } = useCurrency();
  const { data: bitcoinPrice } = useBitcoinPrice();

  // Handle login success messages
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.get('login') === 'success' && user) {
      setTimeout(() => {
        toast({
          title: "Welcome back!",
          description: "You've successfully signed in.",
          variant: "default",
        });
        window.history.replaceState({}, '', '/');
      }, 100);
    }
  }, [user, toast]);

  // Redirect to login if not authenticated
  if (!user) {
    setLocation('/login');
    return null;
  }

  const { data: unreadCount } = useQuery<{ count: number }>({
    queryKey: ['/api/notifications', user.id, 'unread-count'],
    queryFn: () => fetch(`/api/notifications/${user.id}/unread-count`).then(res => {
      if (!res.ok) throw new Error('Failed to fetch unread count');
      return res.json();
    }),
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  const { data: activeInvestments } = useQuery<Investment[]>({
    queryKey: ['/api/investments/user', user.id],
    queryFn: () => fetch(`/api/investments/user/${user.id}`, {
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('bitvault_auth_token') || ''}`,
      }
    }).then(res => {
      if (!res.ok) {
        if (res.status === 401) return [];
        throw new Error('Failed to fetch investments');
      }
      return res.json();
    }),
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  const { data: investmentPlans } = useQuery<InvestmentPlan[]>({
    queryKey: ['/api/investment-plans'],
    queryFn: () => fetch('/api/investment-plans', {
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('bitvault_auth_token') || ''}`,
      }
    }).then(res => {
      if (!res.ok) {
        if (res.status === 401) return [];
        throw new Error('Failed to fetch investment plans');
      }
      return res.json();
    }),
    enabled: !!user,
    refetchInterval: 60000,
  });

  // Calculate investment metrics
  const actualActiveInvestments = activeInvestments?.filter(inv => inv.isActive === true) || [];
  const totalInvestedAmount = actualActiveInvestments.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
  const totalProfit = actualActiveInvestments.reduce((sum, inv) => sum + parseFloat(inv.currentProfit), 0);
  const totalValue = totalInvestedAmount + totalProfit;
  const profitMargin = totalInvestedAmount > 0 ? (totalProfit / totalInvestedAmount) * 100 : 0;

  // Generate chart data
  const generateChartData = () => {
    const data = [];
    const baseAmount = Math.max(totalValue || 0.1, 0.01);
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const randomVariation = (Math.random() - 0.5) * 0.02;
      const trendGrowth = (6 - i) * 0.005;
      const growthFactor = 1 + trendGrowth + randomVariation;
      const value = baseAmount * growthFactor;

      data.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        value: parseFloat(value.toFixed(8)),
        usdValue: bitcoinPrice ? parseFloat((value * bitcoinPrice.usd.price).toFixed(2)) : 0
      });
    }
    return data;
  };

  const chartData = generateChartData();

  const handleRefreshBalance = async () => {
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ['/api/me'] });
      toast({
        title: "Balance Updated",
        description: "Your balance has been refreshed",
      });
    } catch (error) {
      toast({
        title: "Refresh Failed", 
        description: "Could not refresh balance. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/20 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-gradient-to-r from-white/95 via-orange-50/80 to-white/95 dark:from-gray-900/95 dark:via-orange-900/20 dark:to-gray-900/95 border-b border-orange-200/60 dark:border-orange-700/40 shadow-xl shadow-orange-500/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-orange-400 to-orange-600 rounded-2xl blur opacity-25"></div>
                <div className="relative bg-gradient-to-br from-orange-500 to-orange-600 p-2 sm:p-3 rounded-2xl shadow-lg">
                  <BitVaultLogo variant="light" size="sm" showPro={false} />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent truncate">
                  BitVault Pro
                </h1>
                <p className="text-xs sm:text-sm text-orange-600/80 dark:text-orange-400/80 font-medium truncate">
                  Welcome back, {user.username || user.email?.split('@')[0]}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowBalances(!showBalances)}
                className="hidden sm:flex h-11 w-11 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 dark:hover:from-orange-800/40 dark:hover:to-orange-700/40 text-orange-700 hover:text-orange-800 dark:text-orange-300 dark:hover:text-orange-200 border border-orange-200/50 dark:border-orange-700/50 shadow-md transition-all duration-200"
              >
                {showBalances ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLocation('/notifications')}
                className="relative h-11 w-11 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 dark:hover:from-orange-800/40 dark:hover:to-orange-700/40 text-orange-700 hover:text-orange-800 dark:text-orange-300 dark:hover:text-orange-200 border border-orange-200/50 dark:border-orange-700/50 shadow-md transition-all duration-200"
              >
                <Bell className="w-5 h-5" />
                {unreadCount && unreadCount.count > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-gradient-to-br from-orange-500 to-orange-600 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-lg animate-pulse">
                    {unreadCount.count}
                  </span>
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLocation('/profile')}
                className="h-11 w-11 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 dark:hover:from-orange-800/40 dark:hover:to-orange-700/40 border border-orange-200/50 dark:border-orange-700/50 shadow-md transition-all duration-200 p-1"
              >
                <Avatar className="w-9 h-9 border-2 border-orange-300/50 dark:border-orange-600/50">
                  {user.avatar && !user.avatar.startsWith('gradient-') ? (
                    <AvatarImage src={user.avatar} className="object-cover" />
                  ) : user.avatar && user.avatar.startsWith('gradient-') ? (
                    <div className={`w-full h-full bg-gradient-to-br ${user.avatar.replace('gradient-', '')} flex items-center justify-center rounded-full`}>
                      <span className="text-sm font-bold text-white">
                        {(user.username || user.email || 'U').charAt(0).toUpperCase()}
                      </span>
                    </div>
                  ) : (
                    <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-white font-bold text-sm">
                      {(user.username || user.email || 'U').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24 lg:pb-8">
        {/* Main Balance Card - Lighter Orange Theme */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            {/* 3D Shadow Base */}
            <div className="absolute top-3 left-3 w-full h-full bg-gradient-to-br from-orange-500/30 to-orange-600/40 rounded-3xl blur-lg"></div>
            
            {/* Main Card */}
            <Card className="relative bg-gradient-to-br from-orange-500 via-orange-600/90 to-orange-700 dark:from-orange-600 dark:via-orange-700/90 dark:to-orange-800 border border-orange-400/60 dark:border-orange-500/50 rounded-3xl shadow-2xl shadow-orange-600/30 backdrop-blur-xl overflow-hidden">
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-orange-400/20 via-orange-500/10 to-orange-600/25 pointer-events-none"></div>
              
              <CardContent className="relative p-8 text-center">
                <div className="space-y-6">
                  {/* Balance Display */}
                  <div className="space-y-3">
                    <p className="text-lg font-medium text-orange-100">Total Portfolio</p>
                    <div className="space-y-2">
                      <h1 className="text-5xl lg:text-6xl font-bold text-white tracking-tight">
                        {showBalances ? formatBitcoin(totalValue.toString()) : '••••••••'}
                      </h1>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-xl font-medium text-orange-200">BTC</span>
                        {bitcoinPrice && showBalances && (
                          <>
                            <span className="text-orange-300">≈</span>
                            <span className="text-xl font-semibold text-orange-100">
                              {formatCurrency(totalValue * bitcoinPrice.usd.price, 'USD')}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Profit Indicator */}
                  <div className="inline-flex items-center gap-2 bg-green-600/20 px-4 py-2 rounded-full border border-green-500/30 shadow-lg shadow-green-600/10 backdrop-blur-sm">
                    <TrendingUp className="w-5 h-5 text-green-300" />
                    <span className="text-green-200 font-semibold">
                      +{profitMargin.toFixed(2)}% return
                    </span>
                  </div>

                  {/* Quick Actions */}
                  <div className="grid grid-cols-4 gap-3 pt-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-16 flex flex-col gap-1 bg-gradient-to-br from-green-600/20 to-green-700/20 hover:from-green-600/30 hover:to-green-700/30 border border-green-400/30 rounded-2xl shadow-lg shadow-green-600/10 text-green-200 hover:text-green-100"
                      onClick={() => setLocation('/deposit')}
                    >
                      <ArrowDownToLine className="w-6 h-6" />
                      <span className="text-xs font-medium">Receive</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-16 flex flex-col gap-1 bg-gradient-to-br from-blue-600/20 to-blue-700/20 hover:from-blue-600/30 hover:to-blue-700/30 border border-blue-400/30 rounded-2xl shadow-lg shadow-blue-600/10 text-blue-200 hover:text-blue-100"
                      onClick={() => setLocation('/withdraw')}
                    >
                      <ArrowUpFromLine className="w-6 h-6" />
                      <span className="text-xs font-medium">Send</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-16 flex flex-col gap-1 bg-gradient-to-br from-orange-600/20 to-orange-700/20 hover:from-orange-600/30 hover:to-orange-700/30 border border-orange-400/30 rounded-2xl shadow-lg shadow-orange-600/10 text-orange-200 hover:text-orange-100"
                      onClick={() => setLocation('/investment')}
                    >
                      <Zap className="w-6 h-6" />
                      <span className="text-xs font-medium">Invest</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-16 flex flex-col gap-1 bg-gradient-to-br from-purple-600/20 to-purple-700/20 hover:from-purple-600/30 hover:to-purple-700/30 border border-purple-400/30 rounded-2xl shadow-lg shadow-purple-600/10 text-purple-200 hover:text-purple-100"
                      onClick={() => setLocation('/history')}
                    >
                      <BarChart3 className="w-6 h-6" />
                      <span className="text-xs font-medium">Portfolio</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        

        {/* Stats Overview - Orange Theme Design */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="relative">
            <div className="absolute top-2 left-2 w-full h-full bg-gradient-to-br from-orange-500/20 to-orange-600/30 rounded-2xl blur-sm"></div>
            <Card className="relative bg-gradient-to-br from-orange-500/10 via-orange-600/5 to-orange-700/10 dark:from-orange-600/20 dark:via-orange-700/15 dark:to-orange-800/20 backdrop-blur-xl border border-orange-400/30 dark:border-orange-500/30 rounded-2xl shadow-xl shadow-orange-600/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-700 dark:text-orange-300 mb-1">Active Investments</p>
                    <p className="text-3xl font-bold text-orange-800 dark:text-orange-100">
                      {actualActiveInvestments.length}
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                      Earning daily
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-400/30 to-orange-500/40 dark:from-orange-500/30 dark:to-orange-600/40 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30">
                    <Activity className="w-6 h-6 text-orange-700 dark:text-orange-300" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="relative">
            <div className="absolute top-2 left-2 w-full h-full bg-gradient-to-br from-orange-500/20 to-orange-600/30 rounded-2xl blur-sm"></div>
            <Card className="relative bg-gradient-to-br from-orange-500/10 via-orange-600/5 to-orange-700/10 dark:from-orange-600/20 dark:via-orange-700/15 dark:to-orange-800/20 backdrop-blur-xl border border-orange-400/30 dark:border-orange-500/30 rounded-2xl shadow-xl shadow-orange-600/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-700 dark:text-orange-300 mb-1">Total Profit</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {showBalances ? `+${formatBitcoin(totalProfit.toString())}` : '••••••'}
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                      +{profitMargin.toFixed(2)}% return
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-400/30 to-orange-500/40 dark:from-orange-500/30 dark:to-orange-600/40 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30">
                    <TrendingUp className="w-6 h-6 text-orange-700 dark:text-orange-300" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="relative">
            <div className="absolute top-2 left-2 w-full h-full bg-gradient-to-br from-orange-500/20 to-orange-600/30 rounded-2xl blur-sm"></div>
            <Card className="relative bg-gradient-to-br from-orange-500/10 via-orange-600/5 to-orange-700/10 dark:from-orange-600/20 dark:via-orange-700/15 dark:to-orange-800/20 backdrop-blur-xl border border-orange-400/30 dark:border-orange-500/30 rounded-2xl shadow-xl shadow-orange-600/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-700 dark:text-orange-300 mb-1">Invested</p>
                    <p className="text-3xl font-bold text-orange-800 dark:text-orange-100">
                      {showBalances ? formatBitcoin(totalInvestedAmount.toString()) : '••••••'}
                    </p>
                    <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                      Total invested
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-400/30 to-orange-500/40 dark:from-orange-500/30 dark:to-orange-600/40 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30">
                    <Wallet className="w-6 h-6 text-orange-700 dark:text-orange-300" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Active Investments */}
        {actualActiveInvestments.length > 0 && (
          <div className="mt-8">
            <div className="relative">
              <div className="absolute top-2 left-2 w-full h-full bg-gradient-to-br from-orange-500/20 to-orange-600/30 rounded-2xl blur-sm"></div>
              <Card className="relative bg-gradient-to-br from-orange-500/10 via-orange-600/5 to-orange-700/10 dark:from-orange-600/20 dark:via-orange-700/15 dark:to-orange-800/20 backdrop-blur-xl border border-orange-400/30 dark:border-orange-500/30 rounded-2xl shadow-xl shadow-orange-600/20">
                <CardHeader className="border-b border-orange-400/20 dark:border-orange-500/30">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-bold text-orange-800 dark:text-orange-100">Active Investments</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setLocation('/investment')} className="text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 font-medium">
                      View All <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {actualActiveInvestments.slice(0, 4).map((investment) => {
                      const plan = investmentPlans?.find(p => p.id === investment.planId);
                      return (
                        <div key={investment.id} className="relative group">
                          <div className="absolute top-1 left-1 w-full h-full bg-gradient-to-br from-orange-500/10 to-orange-600/15 rounded-xl blur-sm group-hover:blur-md transition-all duration-200"></div>
                          <div className="relative flex items-center justify-between p-4 bg-gradient-to-br from-orange-50/80 to-orange-100/60 dark:from-orange-900/20 dark:to-orange-800/30 rounded-xl border border-orange-300/50 dark:border-orange-600/30 backdrop-blur-sm hover:shadow-lg transition-all duration-200">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-orange-400/30 to-orange-500/40 dark:from-orange-500/30 dark:to-orange-600/40 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
                                <TrendingUp className="w-6 h-6 text-orange-700 dark:text-orange-300" />
                              </div>
                              <div>
                                <h4 className="font-bold text-orange-800 dark:text-orange-100">
                                  {plan?.name || 'Investment Plan'}
                                </h4>
                                <p className="text-sm text-orange-600 dark:text-orange-400">
                                  {formatBitcoin(investment.amount)} BTC
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-green-600 dark:text-green-400">
                                +{formatBitcoin(investment.currentProfit)} BTC
                              </p>
                              <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-700/50">
                                Active
                              </Badge>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Get Started CTA (if no investments) */}
        {actualActiveInvestments.length === 0 && (
          <div className="mt-8 max-w-md mx-auto">
            <div className="relative">
              <div className="absolute top-2 left-2 w-full h-full bg-gradient-to-br from-orange-500/20 to-orange-600/30 rounded-2xl blur-sm"></div>
              <Card className="relative bg-gradient-to-br from-orange-500/10 via-orange-600/5 to-orange-700/10 dark:from-orange-600/20 dark:via-orange-700/15 dark:to-orange-800/20 border border-orange-400/30 dark:border-orange-500/30 rounded-2xl shadow-xl shadow-orange-600/20 backdrop-blur-xl">
                <CardContent className="p-8 text-center">
                  <div className="space-y-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-orange-500/25">
                      <Star className="w-8 h-8 text-white" />
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-2xl font-bold text-orange-800 dark:text-orange-100">
                        Start Investing
                      </h3>
                      <p className="text-orange-700 dark:text-orange-300 leading-relaxed">
                        Begin earning with automated Bitcoin strategies. Join thousands of investors already earning daily returns.
                      </p>
                    </div>
                    <Button 
                      size="lg"
                      className="w-full h-14 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold rounded-xl shadow-xl shadow-orange-500/25 border-0 transition-all duration-200"
                      onClick={() => setLocation('/investment')}
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Start Investing
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
}
