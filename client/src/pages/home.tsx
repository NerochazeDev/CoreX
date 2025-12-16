
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
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <BitVaultLogo variant="light" size="md" showPro={true} />
              <div className="hidden sm:block">
                <p className="text-sm text-muted-foreground">
                  Welcome back, {user.firstName || user.email?.split('@')[0]}
                </p>
              </div>
            </div>

            <nav className="flex items-center gap-2" aria-label="User navigation">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowBalances(!showBalances)}
                aria-label={showBalances ? "Hide balances" : "Show balances"}
                className="hidden sm:flex h-10 w-10"
                data-testid="button-toggle-balances"
              >
                {showBalances ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLocation('/notifications')}
                aria-label="View notifications"
                className="relative h-10 w-10"
                data-testid="button-notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount && unreadCount.count > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center font-bold">
                    {unreadCount.count}
                  </span>
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLocation('/profile')}
                aria-label="Open profile"
                className="h-10 w-10 p-1"
                data-testid="button-profile"
              >
                <Avatar className="w-8 h-8">
                  {user.avatar && !user.avatar.startsWith('gradient-') ? (
                    <AvatarImage src={user.avatar} className="object-cover" />
                  ) : user.avatar && user.avatar.startsWith('gradient-') ? (
                    <div className={`w-full h-full bg-gradient-to-br ${user.avatar.replace('gradient-', '')} flex items-center justify-center rounded-full`}>
                      <span className="text-sm font-bold text-white">
                        {(user.firstName || user.email || 'U').charAt(0).toUpperCase()}
                      </span>
                    </div>
                  ) : (
                    <AvatarFallback className="bg-primary text-primary-foreground font-bold text-sm">
                      {(user.firstName || user.email || 'U').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
              </Button>
            </nav>
          </div>
        </div>
      </header>

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
                      onClick={() => setLocation('/invest')}
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

        

        {/* Available Balance Card */}
        <Card className="mb-8 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Wallet Balance</p>
                <div>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {showBalances ? formatBitcoin(user?.balance || '0') : '••••••'} BTC
                  </p>
                  {bitcoinPrice && showBalances && (
                    <p className="text-sm text-muted-foreground mt-1">
                      ≈ ${(parseFloat(user?.balance || '0') * bitcoinPrice.usd.price).toFixed(2)} USD
                    </p>
                  )}
                </div>
              </div>
              <Wallet className="w-12 h-12 text-blue-500/40" />
            </div>
          </CardContent>
        </Card>

        {/* Advanced Stats Grid - 6 Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mt-8">
          <div className="relative">
            <div className="absolute top-2 left-2 w-full h-full bg-gradient-to-br from-orange-500/20 to-orange-600/30 rounded-2xl blur-sm"></div>
            <Card className="relative bg-gradient-to-br from-orange-500/10 via-orange-600/5 to-orange-700/10 dark:from-orange-600/20 dark:via-orange-700/15 dark:to-orange-800/20 backdrop-blur-xl border border-orange-400/30 dark:border-orange-500/30 rounded-2xl shadow-xl shadow-orange-600/20">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Activity className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    <Badge className="bg-green-500/20 text-green-600 border-green-500/30 text-xs">Live</Badge>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-orange-700 dark:text-orange-300">Active</p>
                    <p className="text-2xl font-bold text-orange-800 dark:text-orange-100">
                      {actualActiveInvestments.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="relative">
            <div className="absolute top-2 left-2 w-full h-full bg-gradient-to-br from-green-500/20 to-green-600/30 rounded-2xl blur-sm"></div>
            <Card className="relative bg-gradient-to-br from-green-500/10 via-green-600/5 to-green-700/10 dark:from-green-600/20 dark:via-green-700/15 dark:to-green-800/20 backdrop-blur-xl border border-green-400/30 dark:border-green-500/30 rounded-2xl shadow-xl shadow-green-600/20">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <Badge className="bg-green-500/20 text-green-600 border-green-500/30 text-xs">+{profitMargin.toFixed(1)}%</Badge>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-green-700 dark:text-green-300">Profit</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {showBalances ? `${formatBitcoin(totalProfit.toString())}` : '••••'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="relative">
            <div className="absolute top-2 left-2 w-full h-full bg-gradient-to-br from-blue-500/20 to-blue-600/30 rounded-2xl blur-sm"></div>
            <Card className="relative bg-gradient-to-br from-blue-500/10 via-blue-600/5 to-blue-700/10 dark:from-blue-600/20 dark:via-blue-700/15 dark:to-blue-800/20 backdrop-blur-xl border border-blue-400/30 dark:border-blue-500/30 rounded-2xl shadow-xl shadow-blue-600/20">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Wallet className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30 text-xs">Capital</Badge>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-blue-700 dark:text-blue-300">Invested</p>
                    <p className="text-2xl font-bold text-blue-800 dark:text-blue-100">
                      {showBalances ? formatBitcoin(totalInvestedAmount.toString()) : '••••'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="relative">
            <div className="absolute top-2 left-2 w-full h-full bg-gradient-to-br from-purple-500/20 to-purple-600/30 rounded-2xl blur-sm"></div>
            <Card className="relative bg-gradient-to-br from-purple-500/10 via-purple-600/5 to-purple-700/10 dark:from-purple-600/20 dark:via-purple-700/15 dark:to-purple-800/20 backdrop-blur-xl border border-purple-400/30 dark:border-purple-500/30 rounded-2xl shadow-xl shadow-purple-600/20">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <Badge className="bg-purple-500/20 text-purple-600 border-purple-500/30 text-xs">APY</Badge>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-purple-700 dark:text-purple-300">Est. Annual</p>
                    <p className="text-2xl font-bold text-purple-800 dark:text-purple-100">
                      {(profitMargin * 12).toFixed(0)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="relative">
            <div className="absolute top-2 left-2 w-full h-full bg-gradient-to-br from-yellow-500/20 to-yellow-600/30 rounded-2xl blur-sm"></div>
            <Card className="relative bg-gradient-to-br from-yellow-500/10 via-yellow-600/5 to-yellow-700/10 dark:from-yellow-600/20 dark:via-yellow-700/15 dark:to-yellow-800/20 backdrop-blur-xl border border-yellow-400/30 dark:border-yellow-500/30 rounded-2xl shadow-xl shadow-yellow-600/20">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30 text-xs">24h</Badge>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-yellow-700 dark:text-yellow-300">Daily Gain</p>
                    <p className="text-2xl font-bold text-yellow-800 dark:text-yellow-100">
                      {showBalances ? `${(totalProfit * 0.1).toFixed(6)}` : '••••'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="relative">
            <div className="absolute top-2 left-2 w-full h-full bg-gradient-to-br from-pink-500/20 to-pink-600/30 rounded-2xl blur-sm"></div>
            <Card className="relative bg-gradient-to-br from-pink-500/10 via-pink-600/5 to-pink-700/10 dark:from-pink-600/20 dark:via-pink-700/15 dark:to-pink-800/20 backdrop-blur-xl border border-pink-400/30 dark:border-pink-500/30 rounded-2xl shadow-xl shadow-pink-600/20">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <PieChart className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                    <Badge className="bg-pink-500/20 text-pink-600 border-pink-500/30 text-xs">USD</Badge>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-pink-700 dark:text-pink-300">Portfolio</p>
                    <p className="text-2xl font-bold text-pink-800 dark:text-pink-100">
                      {showBalances && bitcoinPrice ? formatCurrency(totalValue * bitcoinPrice.usd.price, 'USD').replace('$', '') : '••••'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Portfolio Performance Chart */}
        <div className="mt-8">
          <div className="relative">
            <div className="absolute top-2 left-2 w-full h-full bg-gradient-to-br from-orange-500/20 to-orange-600/30 rounded-2xl blur-sm"></div>
            <Card className="relative bg-gradient-to-br from-orange-500/10 via-orange-600/5 to-orange-700/10 dark:from-orange-600/20 dark:via-orange-700/15 dark:to-orange-800/20 backdrop-blur-xl border border-orange-400/30 dark:border-orange-500/30 rounded-2xl shadow-xl shadow-orange-600/20">
              <CardHeader className="border-b border-orange-400/20 dark:border-orange-500/30">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold text-orange-800 dark:text-orange-100">Portfolio Performance</CardTitle>
                  <div className="flex gap-2">
                    <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
                      Live Trading
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(156, 163, 175, 0.2)" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(0, 0, 0, 0.9)',
                          border: '1px solid rgba(249, 115, 22, 0.5)',
                          borderRadius: '8px',
                          color: 'white'
                        }}
                        formatter={(value: any) => [
                          showBalances ? `${parseFloat(value).toFixed(8)} BTC` : '••••••••',
                          'Value'
                        ]}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#f97316" 
                        fillOpacity={1} 
                        fill="url(#colorValue)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Advanced Analytics Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          {/* Market Insights */}
          <div className="relative">
            <div className="absolute top-2 left-2 w-full h-full bg-gradient-to-br from-blue-500/20 to-blue-600/30 rounded-2xl blur-sm"></div>
            <Card className="relative bg-gradient-to-br from-blue-500/10 via-blue-600/5 to-blue-700/10 dark:from-blue-600/20 dark:via-blue-700/15 dark:to-blue-800/20 backdrop-blur-xl border border-blue-400/30 dark:border-blue-500/30 rounded-2xl shadow-xl shadow-blue-600/20">
              <CardHeader className="border-b border-blue-400/20 dark:border-blue-500/30">
                <CardTitle className="text-lg font-bold text-blue-800 dark:text-blue-100">Market Insights</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg border border-blue-200/30 dark:border-blue-700/30">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Market Trend</p>
                        <p className="text-xs text-blue-600 dark:text-blue-400">Strong Bullish</p>
                      </div>
                    </div>
                    <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
                      +{bitcoinPrice?.usd.change24h.toFixed(2)}%
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg border border-blue-200/30 dark:border-blue-700/30">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                        <Activity className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Volume (24h)</p>
                        <p className="text-xs text-blue-600 dark:text-blue-400">High Activity</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-blue-800 dark:text-blue-200">
                      ${(Math.random() * 50 + 100).toFixed(1)}B
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg border border-blue-200/30 dark:border-blue-700/30">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Volatility</p>
                        <p className="text-xs text-blue-600 dark:text-blue-400">Moderate</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-blue-800 dark:text-blue-200">
                      {(Math.random() * 2 + 1).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics */}
          <div className="relative">
            <div className="absolute top-2 left-2 w-full h-full bg-gradient-to-br from-purple-500/20 to-purple-600/30 rounded-2xl blur-sm"></div>
            <Card className="relative bg-gradient-to-br from-purple-500/10 via-purple-600/5 to-purple-700/10 dark:from-purple-600/20 dark:via-purple-700/15 dark:to-purple-800/20 backdrop-blur-xl border border-purple-400/30 dark:border-purple-500/30 rounded-2xl shadow-xl shadow-purple-600/20">
              <CardHeader className="border-b border-purple-400/20 dark:border-purple-500/30">
                <CardTitle className="text-lg font-bold text-purple-800 dark:text-purple-100">Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-purple-700 dark:text-purple-300">ROI Performance</span>
                      <span className="text-sm font-bold text-green-600 dark:text-green-400">+{profitMargin.toFixed(2)}%</span>
                    </div>
                    <Progress value={Math.min(profitMargin * 2, 100)} className="h-2 bg-purple-200 dark:bg-purple-800" />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Portfolio Growth</span>
                      <span className="text-sm font-bold text-green-600 dark:text-green-400">
                        {((totalValue / Math.max(totalInvestedAmount, 1)) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={Math.min((totalValue / Math.max(totalInvestedAmount, 1)) * 100, 100)} className="h-2 bg-purple-200 dark:bg-purple-800" />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Risk Score</span>
                      <span className="text-sm font-bold text-yellow-600 dark:text-yellow-400">Low-Medium</span>
                    </div>
                    <Progress value={35} className="h-2 bg-purple-200 dark:bg-purple-800" />
                  </div>

                  <div className="pt-3 border-t border-purple-400/20 dark:border-purple-500/30">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Diversification</span>
                      <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
                        Optimal
                      </Badge>
                    </div>
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
