import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  Activity, 
  Bell, 
  User, 
  RefreshCw,
  DollarSign,
  PieChart,
  BarChart3,
  Wallet,
  Target,
  Zap,
  Star,
  Award,
  Clock,
  Calendar,
  TrendingDown,
  Eye,
  Settings,
  Shield,
  Crown
} from "lucide-react";
import { formatBitcoin, formatBitcoinWithFiat, formatDate, formatCurrency } from "@/lib/utils";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart as RechartsPieChart, Cell, BarChart, Bar } from "recharts";
import { useCurrency } from "@/hooks/use-currency";
import { useBitcoinPrice } from "@/hooks/use-bitcoin-price";

export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { currency } = useCurrency();
  const { data: bitcoinPrice } = useBitcoinPrice();

  // Handle regular login success messages
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.get('login') === 'success' && user) {
      setTimeout(() => {
        toast({
          title: "🎉 Welcome Back!",
          description: "You've successfully signed in to BitVault Pro!",
          variant: "default",
        });
        // Clean up URL parameter
        window.history.replaceState({}, '', '/');
      }, 100);
    }
  }, [user, toast]); // Regular login success handling

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
    refetchInterval: 5000, // Refresh every 5 seconds for instant updates
    staleTime: 0, // Always consider data stale for real-time updates
    refetchOnWindowFocus: true, // Refetch when window gains focus
    refetchOnMount: true, // Always refetch on component mount
  });

  const { data: activeInvestments } = useQuery<Investment[]>({
    queryKey: ['/api/investments/user', user.id],
    queryFn: () => fetch(`/api/investments/user/${user.id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`,
      }
    }).then(res => {
      if (!res.ok) {
        throw new Error('Failed to fetch investments');
      }
      return res.json();
    }),
    enabled: !!user?.id,
    refetchInterval: 5000, // Refresh every 5 seconds for instant updates
    staleTime: 0, // Always consider data stale
    refetchOnWindowFocus: true, // Refetch when window gains focus
  });

  const { data: investmentPlans } = useQuery<InvestmentPlan[]>({
    queryKey: ['/api/investment-plans'],
    queryFn: () => fetch('/api/investment-plans', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`,
      }
    }).then(res => {
      if (!res.ok) {
        throw new Error('Failed to fetch investment plans');
      }
      return res.json();
    }),
    enabled: !!user,
    refetchInterval: 60000, // Refresh every minute
  });

  // Calculate complex investment analytics
  const actualActiveInvestments = activeInvestments?.filter(inv => inv.isActive === true) || [];
  const totalInvestedAmount = actualActiveInvestments.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
  const totalProfit = actualActiveInvestments.reduce((sum, inv) => sum + parseFloat(inv.currentProfit), 0);
  const totalValue = totalInvestedAmount + totalProfit;
  const profitMargin = totalInvestedAmount > 0 ? (totalProfit / totalInvestedAmount) * 100 : 0;
  const currentPlan = user.currentPlanId ? investmentPlans?.find(p => p.id === user.currentPlanId) : null;

  // Performance metrics - Calculate this first before using in generateChartData
  const dailyGrowthRate = actualActiveInvestments.length > 0 
    ? actualActiveInvestments.reduce((sum, inv) => {
        const plan = investmentPlans?.find(p => p.id === inv.planId);
        return sum + (plan ? parseFloat(plan.dailyReturnRate) * 100 : 0);
      }, 0) / actualActiveInvestments.length 
    : (currentPlan ? parseFloat(currentPlan.dailyReturnRate) * 100 : 3.67);

  // Generate mock chart data for realistic investment visualization
  const generateChartData = () => {
    const data = [];
    const baseAmount = Math.max(totalInvestedAmount || 0.1, 0.01);
    const now = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const randomVariation = (Math.random() - 0.5) * 0.015;
      const trendGrowth = (29 - i) * (dailyGrowthRate / 100) * 0.1;
      const growthFactor = 1 + trendGrowth + randomVariation;
      const value = baseAmount * growthFactor;
      const profit = Math.max(value - baseAmount, 0);
      const portfolio = baseAmount + profit;

      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: parseFloat(value.toFixed(8)),
        profit: parseFloat(profit.toFixed(8)),
        portfolio: parseFloat(portfolio.toFixed(8)),
        usdValue: bitcoinPrice ? parseFloat((value * (currency === 'USD' ? bitcoinPrice.usd.price : currency === 'GBP' ? bitcoinPrice.gbp.price : bitcoinPrice.eur.price)).toFixed(2)) : 0
      });
    }
    return data;
  };

  const chartData = generateChartData();

  // Investment distribution data
  const investmentDistribution = activeInvestments?.filter(inv => inv.isActive === true).map((inv, index) => ({
    name: investmentPlans?.find(p => p.id === inv.planId)?.name || `Plan ${inv.planId}`,
    value: parseFloat(inv.amount),
    profit: parseFloat(inv.currentProfit),
    color: `hsl(${index * 45}, 70%, 50%)`
  })) || [];
  const monthlyProjection = totalValue * (1 + dailyGrowthRate / 100) ** 30;
  const weeklyGrowth = totalValue * (1 + dailyGrowthRate / 100) ** 7;

  // Calculate progress percentage for an investment
  const calculateInvestmentProgress = (startDate: Date, endDate: Date) => {
    const now = new Date().getTime();
    const start = startDate.getTime();
    const end = endDate.getTime();
    const total = end - start;
    const elapsed = now - start;
    return Math.min(Math.max((elapsed / total) * 100, 0), 100);
  };

  const handleRefreshBalance = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/sync-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      if (response.ok) {
        // Invalidate balance queries to trigger refresh
        queryClient.invalidateQueries({ queryKey: ['/api/me'] });
        toast({
          title: "Balance Updated",
          description: "Your balance has been synced with the blockchain",
        });
      } else {
        throw new Error('Failed to sync balance');
      }
    } catch (error) {
      console.error('Balance refresh error:', error);
      toast({
        title: "Sync Failed", 
        description: "Could not sync balance. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/20 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      {/* Advanced Professional Header */}
      <header className="bg-gradient-to-r from-white/90 to-orange-50/90 dark:from-slate-900/90 dark:to-slate-800/90 backdrop-blur-xl border-b border-orange-200/50 dark:border-orange-800/50 sticky top-0 z-50 shadow-sm lg:ml-64">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <BitVaultLogo variant="light" size="lg" showPro={true} />
                <div className="hidden sm:block border-l border-orange-200 dark:border-orange-800 pl-4">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Crown className="w-3 h-3 text-orange-500" />
                    Premium Dashboard
                  </p>
                  <p className="text-sm font-semibold text-foreground truncate max-w-48">{user.email}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-3">
              {/* Live Status Indicator */}
              <div className="hidden sm:flex items-center gap-2 bg-green-50 dark:bg-green-900/30 px-3 py-1.5 rounded-full border border-green-200 dark:border-green-800">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-green-700 dark:text-green-400">Live</span>
              </div>

              {/* Quick Stats */}
              <div className="hidden lg:flex items-center gap-4 bg-white/80 dark:bg-slate-800/80 px-4 py-2 rounded-xl border border-orange-200/50 dark:border-orange-800/50">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Total Value</p>
                  <p className="text-sm font-bold text-green-600 dark:text-green-400">{formatBitcoin(totalValue.toString())} BTC</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">24h Growth</p>
                  <p className="text-sm font-bold text-orange-600">+{dailyGrowthRate.toFixed(2)}%</p>
                </div>
              </div>

              <button 
                onClick={() => setLocation('/notifications')}
                className="relative p-2 sm:p-2.5 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-xl transition-all duration-200 border border-transparent hover:border-orange-200 dark:hover:border-orange-800"
              >
                <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground hover:text-orange-600" />
                {unreadCount && unreadCount.count > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-lg">
                    {unreadCount.count}
                  </span>
                )}
              </button>

              <button 
                onClick={() => setLocation('/profile')}
                className="p-2 sm:p-2.5 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-xl transition-all duration-200 border border-transparent hover:border-orange-200 dark:hover:border-orange-800"
              >
                <User className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground hover:text-orange-600" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Advanced Professional Dashboard */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:ml-64">

        {/* Top Performance Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200/50 dark:border-green-800/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-1">Total Portfolio</p>
                <p className="text-lg font-bold text-green-800 dark:text-green-300">
                  {formatBitcoin(totalValue.toString())} BTC
                </p>
                {bitcoinPrice && (
                  <p className="text-sm text-green-600 dark:text-green-400">
                    ≈ {formatCurrency(totalValue * (currency === 'USD' ? bitcoinPrice.usd.price : currency === 'GBP' ? bitcoinPrice.gbp.price : bitcoinPrice.eur.price), currency)}
                  </p>
                )}
              </div>
              <div className="w-10 h-10 rounded-full bg-green-200 dark:bg-green-800/40 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200/50 dark:border-orange-800/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-orange-700 dark:text-orange-400 mb-1">Active Profit</p>
                <p className="text-lg font-bold text-orange-800 dark:text-orange-300">
                  +{formatBitcoin(totalProfit.toString())} BTC
                </p>
                {bitcoinPrice && (
                  <p className="text-sm text-orange-600 dark:text-orange-400">
                    ≈ +{formatCurrency(totalProfit * (currency === 'USD' ? bitcoinPrice.usd.price : currency === 'GBP' ? bitcoinPrice.gbp.price : bitcoinPrice.eur.price), currency)} ({profitMargin.toFixed(2)}%)
                  </p>
                )}
              </div>
              <div className="w-10 h-10 rounded-full bg-orange-200 dark:bg-orange-800/40 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200/50 dark:border-blue-800/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">Daily Growth</p>
                <p className="text-lg font-bold text-blue-800 dark:text-blue-300">+{dailyGrowthRate.toFixed(2)}%</p>
                <p className="text-xs text-blue-600 dark:text-blue-400">per day</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-200 dark:bg-blue-800/40 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200/50 dark:border-purple-800/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-purple-700 dark:text-purple-400 mb-1">Monthly Est.</p>
                <p className="text-lg font-bold text-purple-800 dark:text-purple-300">
                  {formatBitcoin(monthlyProjection.toString())} BTC
                </p>
                {bitcoinPrice && (
                  <p className="text-sm text-purple-600 dark:text-purple-400">
                    ≈ {formatCurrency(monthlyProjection * (currency === 'USD' ? bitcoinPrice.usd.price : currency === 'GBP' ? bitcoinPrice.gbp.price : bitcoinPrice.eur.price), currency)}
                  </p>
                )}
              </div>
              <div className="w-10 h-10 rounded-full bg-purple-200 dark:bg-purple-800/40 flex items-center justify-center">
                <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

          {/* Left Column - Balance Card & Analytics */}
          <div className="xl:col-span-8 space-y-6">

            {/* Primary Balance Card */}
            <div className="bg-gradient-to-br from-orange-50/50 via-white to-orange-50/30 dark:from-slate-900/50 dark:via-slate-800 dark:to-slate-900/30 backdrop-blur-lg rounded-2xl p-6 border border-orange-200/50 dark:border-orange-800/50 shadow-2xl shadow-orange-500/10">
              <WalletBalance />
            </div>

            {/* Advanced Portfolio Analytics */}
            <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg border border-orange-200/50 dark:border-orange-800/50 shadow-2xl shadow-orange-500/10">
              <div className="p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
                      <PieChart className="w-6 h-6 text-orange-600" />
                      Investment Analytics
                    </h2>
                    <p className="text-muted-foreground">Live portfolio performance tracking</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRefreshBalance}
                      disabled={isRefreshing}
                      className="border-orange-200 hover:border-orange-300 hover:bg-orange-50 dark:border-orange-700 dark:hover:bg-orange-900/20"
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                      Sync
                    </Button>
                    <Badge className="bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                      Live Data
                    </Badge>
                  </div>
                </div>

                <Tabs defaultValue="chart" className="space-y-6">
                  <TabsList className="grid w-full grid-cols-3 bg-orange-50 dark:bg-orange-900/20">
                    <TabsTrigger value="chart" className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      Performance
                    </TabsTrigger>
                    <TabsTrigger value="distribution" className="flex items-center gap-2">
                      <PieChart className="w-4 h-4" />
                      Distribution
                    </TabsTrigger>
                    <TabsTrigger value="analysis" className="flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      Analysis
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="chart" className="space-y-4">
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 12 }}
                            stroke="#6b7280"
                          />
                          <YAxis 
                            tick={{ fontSize: 12 }}
                            stroke="#6b7280"
                            tickFormatter={(value) => `${value.toFixed(4)} BTC`}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#fff',
                              border: '1px solid #f97316',
                              borderRadius: '12px',
                              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                            }}
                            formatter={(value: any, name: string, props: any) => {
                              const btcAmount = parseFloat(value).toFixed(6);
                              const usdAmount = bitcoinPrice ? formatCurrency(parseFloat(value) * (currency === 'USD' ? bitcoinPrice.usd.price : currency === 'GBP' ? bitcoinPrice.gbp.price : bitcoinPrice.eur.price), currency) : '';
                              return [
                                <>
                                  <div>{btcAmount} BTC</div>
                                  {usdAmount && <div className="text-xs text-gray-500">≈ {usdAmount}</div>}
                                </>,
                                name === 'value' ? 'Portfolio Value' : 'Profit Earned'
                              ];
                            }}
                            labelFormatter={(label) => `Date: ${label}`}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="value" 
                            stroke="#f97316" 
                            fillOpacity={1} 
                            fill="url(#colorValue)"
                            strokeWidth={3}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="profit" 
                            stroke="#10b981" 
                            fillOpacity={1} 
                            fill="url(#colorProfit)"
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </TabsContent>

                  <TabsContent value="distribution" className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="h-64">
                        {investmentDistribution.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <RechartsPieChart 
                              data={investmentDistribution}
                              cx="50%" 
                              cy="50%" 
                              outerRadius={80}
                              dataKey="value"
                            >
                              <Tooltip 
                                formatter={(value: any) => [`${parseFloat(value).toFixed(6)} BTC`, 'Investment']}
                              />
                              {investmentDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </RechartsPieChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full flex items-center justify-center text-muted-foreground">
                            <div className="text-center">
                              <PieChart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                              <p>No active investments to display</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-semibold text-foreground">Investment Breakdown</h4>
                        {investmentDistribution.length > 0 ? (
                          <div className="space-y-3">
                            {investmentDistribution.map((item, index) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-transparent dark:from-orange-900/20 dark:to-transparent rounded-lg border border-orange-200/30 dark:border-orange-800/30">
                                <div className="flex items-center gap-3">
                                  <div 
                                    className="w-4 h-4 rounded-full"
                                    style={{ backgroundColor: `hsl(${index * 45}, 70%, 50%)` }}
                                  ></div>
                                  <span className="font-medium text-foreground">{item.name}</span>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold text-foreground">{formatBitcoin(item.value.toString())} BTC</p>
                                  {bitcoinPrice && (
                                    <p className="text-xs text-muted-foreground">≈ {formatCurrency(item.value * (currency === 'USD' ? bitcoinPrice.usd.price : currency === 'GBP' ? bitcoinPrice.gbp.price : bitcoinPrice.eur.price), currency)}</p>
                                  )}
                                  <p className="text-xs text-green-600 dark:text-green-400">+{formatBitcoin(item.profit.toString())} BTC profit</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-6 text-center text-muted-foreground bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-dashed border-slate-300 dark:border-slate-700">
                            <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="font-medium mb-1">No Active Investments</p>
                            <p className="text-sm">Start investing to see your portfolio distribution</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="analysis" className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200/50">
                        <div className="flex items-center gap-3 mb-3">
                          <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          <h4 className="font-semibold text-blue-800 dark:text-blue-300">Weekly Projection</h4>
                        </div>
                        <p className="text-2xl font-bold text-blue-900 dark:text-blue-200">{formatBitcoin(weeklyGrowth.toString())}</p>
                        <p className="text-sm text-blue-600 dark:text-blue-400">BTC in 7 days</p>
                        {bitcoinPrice && (
                          <p className="text-xs text-blue-500 dark:text-blue-400">
                            ≈ {formatCurrency(weeklyGrowth * (currency === 'USD' ? bitcoinPrice.usd.price : currency === 'GBP' ? bitcoinPrice.gbp.price : bitcoinPrice.eur.price), currency)}
                          </p>
                        )}
                      </Card>

                      <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200/50">
                        <div className="flex items-center gap-3 mb-3">
                          <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                          <h4 className="font-semibold text-green-800 dark:text-green-300">Growth Rate</h4>
                        </div>
                        <p className="text-2xl font-bold text-green-900 dark:text-green-200">{dailyGrowthRate.toFixed(3)}%</p>
                        <p className="text-sm text-green-600 dark:text-green-400">Daily compound</p>
                      </Card>

                      <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200/50">
                        <div className="flex items-center gap-3 mb-3">
                          <Award className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                          <h4 className="font-semibold text-purple-800 dark:text-purple-300">Performance</h4>
                        </div>
                        <p className="text-2xl font-bold text-purple-900 dark:text-purple-200">Excellent</p>
                        <p className="text-sm text-purple-600 dark:text-purple-400">Above market avg</p>
                      </Card>
                    </div>

                    {totalInvestedAmount > 0 && (
                      <Card className="p-6 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200/50">
                        <div className="flex items-center gap-3 mb-4">
                          <Activity className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                          <h4 className="text-lg font-semibold text-orange-800 dark:text-orange-300">Investment Health Score</h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                          <div>
                            <p className="text-sm text-muted-foreground mb-2">Diversification</p>
                            <Progress value={activeInvestments ? Math.min(activeInvestments.length * 25, 100) : 0} className="h-3" />
                            <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                              {activeInvestments ? activeInvestments.length : 0} active investments
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground mb-2">Profit Consistency</p>
                            <Progress value={profitMargin > 0 ? Math.min(profitMargin * 10, 100) : 0} className="h-3" />
                            <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                              {profitMargin.toFixed(1)}% return rate
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground mb-2">Risk Management</p>
                            <Progress value={85} className="h-3" />
                            <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                              Low risk profile
                            </p>
                          </div>
                        </div>
                      </Card>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </Card>

            {/* Enhanced Quick Actions */}
            <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg border border-orange-200/50 dark:border-orange-800/50 shadow-xl shadow-orange-500/10 p-6">
              <h3 className="text-xl font-bold mb-4 text-foreground flex items-center gap-2">
                <Zap className="w-5 h-5 text-orange-600" />
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Button 
                  className="h-auto p-6 flex flex-col items-center gap-3 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border-green-200/50 dark:border-green-800/50 hover:from-green-100 hover:to-green-200 dark:hover:from-green-800/40 dark:hover:to-green-700/40 group transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-green-500/25"
                  variant="ghost"
                  onClick={() => setLocation('/deposit')}
                >
                  <div className="w-14 h-14 rounded-2xl bg-green-200 dark:bg-green-800/50 flex items-center justify-center group-hover:bg-green-300 dark:group-hover:bg-green-700/60 transition-all group-hover:rotate-3">
                    <ArrowDownLeft className="w-7 h-7 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="text-center">
                    <span className="text-base font-bold text-foreground block">Deposit</span>
                    <span className="text-xs text-muted-foreground">Add Bitcoin</span>
                  </div>
                </Button>

                <Button 
                  className="h-auto p-6 flex flex-col items-center gap-3 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 border-red-200/50 dark:border-red-800/50 hover:from-red-100 hover:to-red-200 dark:hover:from-red-800/40 dark:hover:to-red-700/40 group transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-red-500/25"
                  variant="ghost"
                  onClick={() => setLocation('/withdraw')}
                >
                  <div className="w-14 h-14 rounded-2xl bg-red-200 dark:bg-red-800/50 flex items-center justify-center group-hover:bg-red-300 dark:group-hover:bg-red-700/60 transition-all group-hover:rotate-3">
                    <ArrowUpRight className="w-7 h-7 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="text-center">
                    <span className="text-base font-bold text-foreground block">Withdraw</span>
                    <span className="text-xs text-muted-foreground">Send Bitcoin</span>
                  </div>
                </Button>

                <Button 
                  className="h-auto p-6 flex flex-col items-center gap-3 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 border-orange-200/50 dark:border-orange-800/50 hover:from-orange-100 hover:to-orange-200 dark:hover:from-orange-800/40 dark:hover:to-orange-700/40 group transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-orange-500/25"
                  variant="ghost"
                  onClick={() => setLocation('/investment')}
                >
                  <div className="w-14 h-14 rounded-2xl bg-orange-200 dark:bg-orange-800/50 flex items-center justify-center group-hover:bg-orange-300 dark:group-hover:bg-orange-700/60 transition-all group-hover:rotate-3">
                    <TrendingUp className="w-7 h-7 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="text-center">
                    <span className="text-base font-bold text-foreground block">Invest</span>
                    <span className="text-xs text-muted-foreground">Start Plan</span>
                  </div>
                </Button>

                <Button 
                  className="h-auto p-6 flex flex-col items-center gap-3 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-blue-200/50 dark:border-blue-800/50 hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-800/40 dark:hover:to-blue-700/40 group transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25"
                  variant="ghost"
                  onClick={() => setLocation('/transactions')}
                >
                  <div className="w-14 h-14 rounded-2xl bg-blue-200 dark:bg-blue-800/50 flex items-center justify-center group-hover:bg-blue-300 dark:group-hover:bg-blue-700/60 transition-all group-hover:rotate-3">
                    <Activity className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-center">
                    <span className="text-base font-bold text-foreground block">History</span>
                    <span className="text-xs text-muted-foreground">View All</span>
                  </div>
                </Button>
              </div>
            </Card>

            {/* Active Investments Section */}
            {activeInvestments && activeInvestments.filter(inv => inv.isActive === true).length > 0 && (
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 border border-orange-200/50 dark:border-orange-800/50 shadow-xl shadow-orange-500/5">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">Active Investments</h3>
                    <p className="text-sm text-muted-foreground">Your earning investments</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      queryClient.invalidateQueries({ queryKey: ['/api/investments/user', user?.id] });
                      toast({
                        title: "Investments Refreshed",
                        description: "Your investment data has been updated",
                      });
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>

                {/* Investment Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <span className="text-sm text-muted-foreground">Total Invested</span>
                    </div>
                    <p className="text-xl font-bold text-foreground">{formatBitcoin(totalInvestedAmount.toString())} BTC</p>
                    {bitcoinPrice && (
                      <p className="text-sm text-green-600 dark:text-green-400">
                        ≈ {formatCurrency(totalInvestedAmount * (currency === 'USD' ? bitcoinPrice.usd.price : currency === 'GBP' ? bitcoinPrice.gbp.price : bitcoinPrice.eur.price), currency)}
                      </p>
                    )}
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                      <span className="text-sm text-muted-foreground">Total Profit</span>
                    </div>
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">+{formatBitcoin(totalProfit.toString())} BTC</p>
                    {bitcoinPrice && (
                      <p className="text-sm text-green-600 dark:text-green-400">
                        ≈ +{formatCurrency(totalProfit * (currency === 'USD' ? bitcoinPrice.usd.price : currency === 'GBP' ? bitcoinPrice.gbp.price : bitcoinPrice.eur.price), currency)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Investment Cards */}
                <div className="space-y-4">
                  {activeInvestments.filter(inv => inv.isActive === true).map((investment) => {
                    const progress = calculateInvestmentProgress(
                      new Date(investment.startDate),
                      new Date(investment.endDate)
                    );
                    const daysLeft = Math.ceil(
                      (new Date(investment.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                    );
                    const plan = investmentPlans?.find(p => p.id === investment.planId);
                    const profitPercentage = parseFloat(investment.amount) > 0 ? ((parseFloat(investment.currentProfit) / parseFloat(investment.amount)) * 100) : 0;

                    return (
                      <div key={investment.id} className="bg-gradient-to-r from-green-50 to-orange-50 dark:from-green-900/10 dark:to-orange-900/10 rounded-xl p-4 border border-green-200/50 dark:border-green-800/50">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold text-foreground flex items-center gap-2">
                              {plan ? plan.name : `Investment #${investment.id}`}
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              Started: {formatDate(new Date(investment.startDate))}
                            </p>
                          </div>
                          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            Earning
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Amount</p>
                            <p className="font-semibold text-foreground">{formatBitcoin(investment.amount)} BTC</p>
                            {bitcoinPrice && (
                              <p className="text-xs text-muted-foreground">
                                ≈ {formatCurrency(parseFloat(investment.amount) * (currency === 'USD' ? bitcoinPrice.usd.price : currency === 'GBP' ? bitcoinPrice.gbp.price : bitcoinPrice.eur.price), currency)}
                              </p>
                            )}
                          </div>
                          <div>
                            <p className="text-muted-foreground">Profit</p>
                            <p className="font-semibold text-green-600 dark:text-green-400">+{formatBitcoin(investment.currentProfit)} BTC</p>
                            {bitcoinPrice && (
                              <p className="text-xs text-green-600 dark:text-green-400">
                                ≈ +{formatCurrency(parseFloat(investment.currentProfit) * (currency === 'USD' ? bitcoinPrice.usd.price : currency === 'GBP' ? bitcoinPrice.gbp.price : bitcoinPrice.eur.price), currency)}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="mt-3 p-2 bg-green-100/50 dark:bg-green-900/20 rounded-lg text-xs text-green-700 dark:text-green-400 flex items-center gap-1">
                          <div className="w-1 h-1 bg-green-500 rounded-full animate-ping"></div>
                          Live updates every 5 minutes • +{profitPercentage.toFixed(2)}% ROI
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Market Data & Investment Tools */}
          <div className="xl:col-span-4 space-y-6">
            {/* Bitcoin Price Card */}
            <Card className="bg-gradient-to-br from-blue-50/50 via-white to-blue-50/30 dark:from-blue-900/10 dark:via-slate-800 dark:to-blue-900/10 backdrop-blur-lg border border-blue-200/50 dark:border-blue-800/50 shadow-xl shadow-blue-500/10">
              <div className="p-6">
                <BitcoinPrice />
              </div>
            </Card>

            {/* Investment Plan Card */}
            <Card className="bg-gradient-to-br from-green-50/50 via-white to-green-50/30 dark:from-green-900/10 dark:via-slate-800 dark:to-green-900/10 backdrop-blur-lg border border-green-200/50 dark:border-green-800/50 shadow-xl shadow-green-500/10">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-1 flex items-center gap-2">
                      <Star className="w-5 h-5 text-orange-500" />
                      Investment Plan
                    </h3>
                    <p className="text-sm text-muted-foreground">Your current plan status</p>
                  </div>
                  <Badge className={`px-3 py-1 rounded-full text-xs font-medium ${
                    currentPlan 
                      ? 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700' 
                      : 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-700'
                  }`}>
                    {currentPlan ? 'Premium Active' : 'Free Tier'}
                  </Badge>
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                    currentPlan 
                      ? 'bg-green-100 dark:bg-green-900/30 border-2 border-green-200 dark:border-green-800' 
                      : 'bg-orange-100 dark:bg-orange-900/30 border-2 border-orange-200 dark:border-orange-800'
                  }`}>
                    {currentPlan ? (
                      <Crown className="w-7 h-7 text-green-600 dark:text-green-400" />
                    ) : (
                      <TrendingUp className="w-7 h-7 text-orange-600 dark:text-orange-400" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground text-lg">
                      {currentPlan ? currentPlan.name : "Free Plan"}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {currentPlan 
                        ? `${(parseFloat(currentPlan.dailyReturnRate) * 100).toFixed(2)}% daily return`
                        : "3.67% every 10 minutes"
                      }
                    </p>
                  </div>
                </div>

                {!currentPlan && (
                  <Button 
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-none shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                    onClick={() => setLocation('/investment')}
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Upgrade to Premium
                  </Button>
                )}
              </div>
            </Card>

            {/* Quick Start Card (when no active investments) */}
            {(!actualActiveInvestments || actualActiveInvestments.length === 0) && (
              <Card className="bg-gradient-to-br from-purple-50/50 via-white to-purple-50/30 dark:from-purple-900/10 dark:via-slate-800 dark:to-purple-900/10 backdrop-blur-lg border border-purple-200/50 dark:border-purple-800/50 shadow-xl shadow-purple-500/10">
                <div className="p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-foreground">Start Investing Today</h3>
                  <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
                    Begin your investment journey with BitVault Pro and earn automated daily returns on your Bitcoin.
                  </p>
                  <Button 
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-none shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                    onClick={() => setLocation('/investment')}
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Explore Investment Plans
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
}