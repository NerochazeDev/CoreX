
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
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border-b border-gray-200/50 dark:border-gray-700/50 shadow-lg shadow-black/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <BitVaultLogo variant="light" size="md" showPro={true} />
              <div className="hidden sm:block">
                <p className="text-xs text-gray-500 dark:text-gray-400">Hello,</p>
                <p className="font-semibold text-gray-900 dark:text-white">{user.username}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowBalances(!showBalances)}
                className="hidden sm:flex text-gray-600 hover:text-orange-600 dark:text-gray-400 dark:hover:text-orange-400"
              >
                {showBalances ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLocation('/notifications')}
                className="relative text-gray-600 hover:text-orange-600 dark:text-gray-400 dark:hover:text-orange-400"
              >
                <Bell className="w-5 h-5" />
                {unreadCount && unreadCount.count > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                    {unreadCount.count}
                  </span>
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLocation('/profile')}
                className="text-gray-600 hover:text-orange-600 dark:text-gray-400 dark:hover:text-orange-400"
              >
                <User className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24 lg:pb-8">
        {/* Main Balance Card - Exodus Style */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            {/* 3D Shadow Base */}
            <div className="absolute top-2 left-2 w-full h-full bg-gradient-to-br from-orange-600/20 to-orange-800/20 rounded-3xl blur-sm"></div>
            
            {/* Main Card */}
            <Card className="relative bg-gradient-to-br from-white to-gray-50/80 dark:from-gray-800 dark:to-gray-900/80 border-0 rounded-3xl shadow-2xl shadow-orange-500/10 backdrop-blur-xl overflow-hidden">
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-orange-600/10 pointer-events-none"></div>
              
              <CardContent className="relative p-8 text-center">
                <div className="space-y-6">
                  {/* Balance Display */}
                  <div className="space-y-3">
                    <p className="text-lg font-medium text-gray-600 dark:text-gray-300">Total Portfolio</p>
                    <div className="space-y-2">
                      <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white tracking-tight">
                        {showBalances ? formatBitcoin(totalValue.toString()) : '••••••••'}
                      </h1>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-xl font-medium text-orange-600 dark:text-orange-400">BTC</span>
                        {bitcoinPrice && showBalances && (
                          <>
                            <span className="text-gray-400">≈</span>
                            <span className="text-xl font-semibold text-gray-700 dark:text-gray-300">
                              {formatCurrency(totalValue * bitcoinPrice.usd.price, 'USD')}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Profit Indicator */}
                  <div className="inline-flex items-center gap-2 bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-full border border-green-200 dark:border-green-800">
                    <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <span className="text-green-700 dark:text-green-300 font-semibold">
                      +{profitMargin.toFixed(2)}% return
                    </span>
                  </div>

                  {/* Quick Actions */}
                  <div className="grid grid-cols-4 gap-3 pt-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-16 flex flex-col gap-1 bg-gradient-to-br from-green-500/10 to-green-600/10 hover:from-green-500/20 hover:to-green-600/20 border border-green-200/50 dark:border-green-700/50 rounded-2xl shadow-lg shadow-green-500/5 text-green-700 dark:text-green-300"
                      onClick={() => setLocation('/deposit')}
                    >
                      <ArrowDownToLine className="w-6 h-6" />
                      <span className="text-xs font-medium">Receive</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-16 flex flex-col gap-1 bg-gradient-to-br from-blue-500/10 to-blue-600/10 hover:from-blue-500/20 hover:to-blue-600/20 border border-blue-200/50 dark:border-blue-700/50 rounded-2xl shadow-lg shadow-blue-500/5 text-blue-700 dark:text-blue-300"
                      onClick={() => setLocation('/withdraw')}
                    >
                      <ArrowUpFromLine className="w-6 h-6" />
                      <span className="text-xs font-medium">Send</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-16 flex flex-col gap-1 bg-gradient-to-br from-orange-500/10 to-orange-600/10 hover:from-orange-500/20 hover:to-orange-600/20 border border-orange-200/50 dark:border-orange-700/50 rounded-2xl shadow-lg shadow-orange-500/5 text-orange-700 dark:text-orange-300"
                      onClick={() => setLocation('/investment')}
                    >
                      <Zap className="w-6 h-6" />
                      <span className="text-xs font-medium">Invest</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-16 flex flex-col gap-1 bg-gradient-to-br from-purple-500/10 to-purple-600/10 hover:from-purple-500/20 hover:to-purple-600/20 border border-purple-200/50 dark:border-purple-700/50 rounded-2xl shadow-lg shadow-purple-500/5 text-purple-700 dark:text-purple-300"
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

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Portfolio Performance - Main Chart */}
          <div className="lg:col-span-2">
            <div className="relative">
              <div className="absolute top-2 left-2 w-full h-full bg-gradient-to-br from-gray-900/10 to-gray-600/10 rounded-2xl blur-sm"></div>
              <Card className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-0 rounded-2xl shadow-xl shadow-black/5">
                <CardHeader className="border-b border-gray-100 dark:border-gray-700/50">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">Portfolio Performance</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRefreshBalance}
                      disabled={isRefreshing}
                      className="flex items-center gap-2 text-gray-600 hover:text-orange-600 dark:text-gray-400 dark:hover:text-orange-400"
                    >
                      <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                      <span className="hidden sm:inline">Refresh</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#f97316" stopOpacity={0.05}/>
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
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Bitcoin Price Widget */}
            <div className="relative">
              <div className="absolute top-2 left-2 w-full h-full bg-gradient-to-br from-gray-900/10 to-gray-600/10 rounded-2xl blur-sm"></div>
              <Card className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-0 rounded-2xl shadow-xl shadow-black/5">
                <CardHeader className="border-b border-gray-100 dark:border-gray-700/50 pb-4">
                  <CardTitle className="text-lg font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">₿</span>
                    </div>
                    Bitcoin
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <BitcoinPrice />
                </CardContent>
              </Card>
            </div>

            {/* Wallet Balance */}
            <div className="relative">
              <div className="absolute top-2 left-2 w-full h-full bg-gradient-to-br from-gray-900/10 to-gray-600/10 rounded-2xl blur-sm"></div>
              <Card className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-0 rounded-2xl shadow-xl shadow-black/5">
                <CardHeader className="border-b border-gray-100 dark:border-gray-700/50 pb-4">
                  <CardTitle className="text-lg font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                    <Wallet className="w-5 h-5 text-orange-500" />
                    Wallet
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <WalletBalance />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="relative">
            <div className="absolute top-2 left-2 w-full h-full bg-gradient-to-br from-gray-900/10 to-gray-600/10 rounded-2xl blur-sm"></div>
            <Card className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-0 rounded-2xl shadow-xl shadow-black/5">
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
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="relative">
            <div className="absolute top-2 left-2 w-full h-full bg-gradient-to-br from-gray-900/10 to-gray-600/10 rounded-2xl blur-sm"></div>
            <Card className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-0 rounded-2xl shadow-xl shadow-black/5">
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
                  <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/20">
                    <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="relative">
            <div className="absolute top-2 left-2 w-full h-full bg-gradient-to-br from-gray-900/10 to-gray-600/10 rounded-2xl blur-sm"></div>
            <Card className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-0 rounded-2xl shadow-xl shadow-black/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Invested</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {showBalances ? formatBitcoin(totalInvestedAmount.toString()) : '••••••'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                      Total invested
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                    <Wallet className="w-6 h-6 text-orange-600 dark:text-orange-400" />
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
              <div className="absolute top-2 left-2 w-full h-full bg-gradient-to-br from-gray-900/10 to-gray-600/10 rounded-2xl blur-sm"></div>
              <Card className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-0 rounded-2xl shadow-xl shadow-black/5">
                <CardHeader className="border-b border-gray-100 dark:border-gray-700/50">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">Active Investments</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setLocation('/investment')} className="text-orange-600 hover:text-orange-700 font-medium">
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
                          <div className="absolute top-1 left-1 w-full h-full bg-gradient-to-br from-gray-900/5 to-gray-600/5 rounded-xl blur-sm group-hover:blur-md transition-all duration-200"></div>
                          <div className="relative flex items-center justify-between p-4 bg-gradient-to-br from-gray-50/80 to-white/80 dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl border border-gray-200/50 dark:border-gray-600/30 backdrop-blur-sm hover:shadow-lg transition-all duration-200">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                                <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                              </div>
                              <div>
                                <h4 className="font-bold text-gray-900 dark:text-white">
                                  {plan?.name || 'Investment Plan'}
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
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
              <div className="absolute top-2 left-2 w-full h-full bg-gradient-to-br from-orange-600/20 to-orange-800/20 rounded-2xl blur-sm"></div>
              <Card className="relative bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-900/20 dark:to-orange-800/20 border border-orange-200/50 dark:border-orange-700/50 rounded-2xl shadow-xl shadow-orange-500/10 backdrop-blur-xl">
                <CardContent className="p-8 text-center">
                  <div className="space-y-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-orange-500/25">
                      <Star className="w-8 h-8 text-white" />
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Start Investing
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
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
