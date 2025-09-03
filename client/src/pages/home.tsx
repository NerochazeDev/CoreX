
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Zap
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
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200/60 dark:border-gray-700/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Brand */}
            <div className="flex items-center">
              <BitVaultLogo variant="light" size="md" showPro={true} />
            </div>

            {/* Navigation Links - Desktop */}
            <div className="hidden md:flex items-center space-x-8">
              <Button variant="ghost" className="text-gray-900 dark:text-gray-100 font-medium">
                Home
              </Button>
              <Button variant="ghost" onClick={() => setLocation('/investment')} className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 font-medium">
                Invest
              </Button>
              <Button variant="ghost" onClick={() => setLocation('/history')} className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 font-medium">
                Portfolio
              </Button>
              <Button variant="ghost" onClick={() => setLocation('/transactions')} className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 font-medium">
                Activity
              </Button>
            </div>

            {/* Right side actions */}
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowBalances(!showBalances)}
                className="hidden sm:flex text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              >
                {showBalances ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLocation('/notifications')}
                className="relative text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              >
                <Bell className="w-5 h-5" />
                {unreadCount && unreadCount.count > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount.count}
                  </span>
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLocation('/profile')}
                className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              >
                <User className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 lg:pb-8">
        {/* Hero Section */}
        <div className="py-8 lg:py-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Welcome back, {user.username}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Track your investments, manage your portfolio, and earn with automated Bitcoin strategies
            </p>
          </div>

          {/* Main Balance Display */}
          <div className="max-w-4xl mx-auto">
            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 border-0 text-white mb-8">
              <CardContent className="p-8">
                <div className="text-center">
                  <p className="text-orange-100 text-lg mb-2">Total Portfolio Value</p>
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <h2 className="text-5xl lg:text-6xl font-bold">
                      {showBalances ? formatBitcoin(totalValue.toString()) : '••••••••'}
                    </h2>
                    <span className="text-2xl text-orange-100">BTC</span>
                  </div>
                  {bitcoinPrice && showBalances && (
                    <p className="text-2xl text-orange-100">
                      ≈ {formatCurrency(totalValue * bitcoinPrice.usd.price, 'USD')}
                    </p>
                  )}
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <TrendingUp className="w-5 h-5 text-green-300" />
                    <span className="text-green-300 text-lg font-semibold">
                      +{profitMargin.toFixed(2)}% return
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
              <Button 
                size="lg"
                className="h-20 flex flex-col gap-2 bg-green-600 hover:bg-green-700 text-white border-0"
                onClick={() => setLocation('/deposit')}
              >
                <Download className="w-6 h-6" />
                <span className="font-semibold">Deposit</span>
              </Button>

              <Button 
                size="lg"
                className="h-20 flex flex-col gap-2 bg-blue-600 hover:bg-blue-700 text-white border-0"
                onClick={() => setLocation('/withdraw')}
              >
                <Upload className="w-6 h-6" />
                <span className="font-semibold">Withdraw</span>
              </Button>

              <Button 
                size="lg"
                className="h-20 flex flex-col gap-2 bg-orange-600 hover:bg-orange-700 text-white border-0"
                onClick={() => setLocation('/investment')}
              >
                <Zap className="w-6 h-6" />
                <span className="font-semibold">Invest</span>
              </Button>

              <Button 
                size="lg"
                className="h-20 flex flex-col gap-2 bg-purple-600 hover:bg-purple-700 text-white border-0"
                onClick={() => setLocation('/history')}
              >
                <BarChart3 className="w-6 h-6" />
                <span className="font-semibold">Analytics</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-8 space-y-8">
            {/* Portfolio Performance Chart */}
            <Card className="border border-gray-200 dark:border-gray-700">
              <CardHeader className="border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-semibold">Portfolio Performance</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRefreshBalance}
                      disabled={isRefreshing}
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        formatter={(value: any) => [`${parseFloat(value).toFixed(6)} BTC`, 'Value']}
                        labelFormatter={(label) => `${label}`}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#f97316" 
                        fillOpacity={1} 
                        fill="url(#colorValue)"
                        strokeWidth={3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border border-gray-200 dark:border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Active Investments</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {actualActiveInvestments.length}
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                        Earning daily
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                      <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200 dark:border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Profit</p>
                      <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                        {showBalances ? `+${formatBitcoin(totalProfit.toString())}` : '••••••'}
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                        +{profitMargin.toFixed(2)}% return
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200 dark:border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Invested Amount</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {showBalances ? formatBitcoin(totalInvestedAmount.toString()) : '••••••'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                        BTC invested
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-xl flex items-center justify-center">
                      <Wallet className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Active Investments */}
            {actualActiveInvestments.length > 0 && (
              <Card className="border border-gray-200 dark:border-gray-700">
                <CardHeader className="border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-semibold">Active Investments</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setLocation('/investment')} className="text-orange-600 hover:text-orange-700">
                      View All <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {actualActiveInvestments.slice(0, 3).map((investment) => {
                      const plan = investmentPlans?.find(p => p.id === investment.planId);
                      return (
                        <div key={investment.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                              <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900 dark:text-white">
                                {plan?.name || 'Investment Plan'}
                              </h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {formatBitcoin(investment.amount)} BTC invested
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-green-600 dark:text-green-400">
                              +{formatBitcoin(investment.currentProfit)} BTC
                            </p>
                            <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                              Active
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Bitcoin Price */}
            <Card className="border border-gray-200 dark:border-gray-700">
              <CardHeader className="border-b border-gray-100 dark:border-gray-800">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-orange-500" />
                  Bitcoin Price
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <BitcoinPrice />
              </CardContent>
            </Card>

            {/* Account Balance Widget */}
            <Card className="border border-gray-200 dark:border-gray-700">
              <CardHeader className="border-b border-gray-100 dark:border-gray-800">
                <CardTitle className="text-lg font-semibold">Wallet Balance</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <WalletBalance />
              </CardContent>
            </Card>

            {/* Get Started (if no investments) */}
            {actualActiveInvestments.length === 0 && (
              <Card className="border border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
                <CardContent className="p-6">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto">
                      <Star className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        Start Investing Today
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Begin earning with automated Bitcoin investment strategies. Join thousands of investors already earning daily returns.
                      </p>
                      <Button 
                        size="lg"
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                        onClick={() => setLocation('/investment')}
                      >
                        <Plus className="w-5 h-5 mr-2" />
                        Start Investing
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
}
