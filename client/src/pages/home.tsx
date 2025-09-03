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
  Crown,
  EyeOff,
  CalendarDays
} from "lucide-react";
import { formatBitcoin, formatBitcoinWithFiat, formatCurrency, calculateInvestmentProgress } from "@/lib/utils";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart as RechartsPieChart, Pie, Cell, BarChart, Bar } from "recharts";
import { useCurrency } from "@/hooks/use-currency";
import { useBitcoinPrice } from "@/hooks/use-bitcoin-price";
import { AdvancedInvestmentDashboard } from "@/components/advanced-investment-dashboard";

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
        window.history.replaceState({}, '/', window.location.pathname);
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
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('bitvault_auth_token') || ''}`,
      }
    }).then(res => {
      if (!res.ok) {
        if (res.status === 401) {
          // Silently handle auth errors to prevent unhandled rejections
          return [];
        }
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
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('bitvault_auth_token') || ''}`,
      }
    }).then(res => {
      if (!res.ok) {
        if (res.status === 401) {
          // Silently handle auth errors to prevent unhandled rejections
          return [];
        }
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

      {/* Advanced Investment Dashboard */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 lg:ml-64 space-y-6">
        <AdvancedInvestmentDashboard />
      </main>

      <BottomNavigation />
    </div>
  );
}