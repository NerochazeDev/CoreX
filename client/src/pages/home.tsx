import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  RefreshCw 
} from "lucide-react";
import { formatBitcoin, formatDate } from "@/lib/utils";

export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Redirect to login if not authenticated
  if (!user) {
    setLocation('/login');
    return null;
  }

  const { data: unreadCount } = useQuery<{ count: number }>({
    queryKey: ['/api/notifications', user.id, 'unread-count'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: activeInvestments } = useQuery<Investment[]>({
    queryKey: ['/api/investments/user', user.id],
    refetchInterval: 30000, // Refresh every 30 seconds for live updates
  });

  const { data: investmentPlans } = useQuery<InvestmentPlan[]>({
    queryKey: ['/api/investment-plans'],
  });

  // Calculate investment stats
  const totalInvestedAmount = activeInvestments?.reduce((sum, inv) => sum + parseFloat(inv.amount), 0) || 0;
  const totalProfit = activeInvestments?.reduce((sum, inv) => sum + parseFloat(inv.currentProfit), 0) || 0;
  const currentPlan = user.currentPlanId ? investmentPlans?.find(p => p.id === user.currentPlanId) : null;

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-orange-50/30 dark:from-slate-900 dark:to-slate-800">
      {/* Modern Responsive Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-orange-200/50 dark:border-orange-800/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <BitVaultLogo variant="light" size="lg" showPro={true} />
              <div className="hidden sm:block">
                <p className="text-xs text-muted-foreground">Welcome back</p>
                <p className="text-sm font-medium text-foreground truncate max-w-48">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <button 
                onClick={() => setLocation('/notifications')}
                className="relative p-2 sm:p-3 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-xl transition-all duration-200"
              >
                <Bell className="h-5 w-5 text-muted-foreground hover:text-orange-600" />
                {unreadCount && unreadCount.count > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                    {unreadCount.count}
                  </span>
                )}
              </button>
              <button 
                onClick={() => setLocation('/profile')}
                className="p-2 sm:p-3 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-xl transition-all duration-200"
              >
                <User className="h-5 w-5 text-muted-foreground hover:text-orange-600" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Responsive Grid Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          
          {/* Left Column - Portfolio & Quick Actions */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Portfolio Overview Card */}
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-orange-200/50 dark:border-orange-800/50 shadow-xl shadow-orange-500/5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-1">Portfolio Balance</h2>
                  <p className="text-sm text-muted-foreground">Your Bitcoin investment portfolio</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefreshBalance}
                  disabled={isRefreshing}
                  className="border-orange-200 hover:border-orange-300 hover:bg-orange-50 dark:border-orange-700 dark:hover:bg-orange-900/20 self-start sm:self-auto"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Sync
                </Button>
              </div>
              <WalletBalance />
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <Button 
                className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-orange-200/50 dark:border-orange-800/50 hover:bg-orange-50 dark:hover:bg-orange-900/20 p-4 sm:p-6 h-auto flex flex-col items-center gap-2 sm:gap-3 group transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
                variant="ghost"
                onClick={() => setLocation('/deposit')}
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center group-hover:bg-green-200 dark:group-hover:bg-green-800/40 transition-all">
                  <ArrowDownLeft className="w-6 h-6 sm:w-7 sm:h-7 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-center">
                  <span className="text-sm sm:text-base font-semibold text-foreground block">Deposit</span>
                  <span className="text-xs text-muted-foreground">Add Bitcoin</span>
                </div>
              </Button>

              <Button 
                className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-orange-200/50 dark:border-orange-800/50 hover:bg-orange-50 dark:hover:bg-orange-900/20 p-4 sm:p-6 h-auto flex flex-col items-center gap-2 sm:gap-3 group transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
                variant="ghost"
                onClick={() => setLocation('/withdraw')}
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center group-hover:bg-red-200 dark:group-hover:bg-red-800/40 transition-all">
                  <ArrowUpRight className="w-6 h-6 sm:w-7 sm:h-7 text-red-600 dark:text-red-400" />
                </div>
                <div className="text-center">
                  <span className="text-sm sm:text-base font-semibold text-foreground block">Withdraw</span>
                  <span className="text-xs text-muted-foreground">Send Bitcoin</span>
                </div>
              </Button>

              <Button 
                className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-orange-200/50 dark:border-orange-800/50 hover:bg-orange-50 dark:hover:bg-orange-900/20 p-4 sm:p-6 h-auto flex flex-col items-center gap-2 sm:gap-3 group transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
                variant="ghost"
                onClick={() => setLocation('/investment')}
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center group-hover:bg-orange-200 dark:group-hover:bg-orange-800/40 transition-all">
                  <TrendingUp className="w-6 h-6 sm:w-7 sm:h-7 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="text-center">
                  <span className="text-sm sm:text-base font-semibold text-foreground block">Invest</span>
                  <span className="text-xs text-muted-foreground">Start Plan</span>
                </div>
              </Button>

              <Button 
                className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-orange-200/50 dark:border-orange-800/50 hover:bg-orange-50 dark:hover:bg-orange-900/20 p-4 sm:p-6 h-auto flex flex-col items-center gap-2 sm:gap-3 group transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
                variant="ghost"
                onClick={() => setLocation('/transactions')}
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-800/40 transition-all">
                  <Activity className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-center">
                  <span className="text-sm sm:text-base font-semibold text-foreground block">History</span>
                  <span className="text-xs text-muted-foreground">View All</span>
                </div>
              </Button>
            </div>

            {/* Active Investments Section */}
            {activeInvestments && activeInvestments.length > 0 && (
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
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                      <span className="text-sm text-muted-foreground">Total Profit</span>
                    </div>
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">+{formatBitcoin(totalProfit.toString())} BTC</p>
                  </div>
                </div>

                {/* Investment Cards */}
                <div className="space-y-4">
                  {activeInvestments.map((investment) => {
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
                          </div>
                          <div>
                            <p className="text-muted-foreground">Profit</p>
                            <p className="font-semibold text-green-600 dark:text-green-400">+{formatBitcoin(investment.currentProfit)} BTC</p>
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

          {/* Right Column - Bitcoin Price & Investment Info */}
          <div className="lg:col-span-4 space-y-6">
            {/* Bitcoin Price Card */}
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 border border-orange-200/50 dark:border-orange-800/50 shadow-xl shadow-orange-500/5">
              <BitcoinPrice />
            </div>

            {/* Investment Plan Card */}
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 border border-orange-200/50 dark:border-orange-800/50 shadow-xl shadow-orange-500/5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">Investment Plan</h3>
                  <p className="text-sm text-muted-foreground">Your current plan</p>
                </div>
                <Badge className={`px-3 py-1 rounded-full text-xs font-medium ${
                  currentPlan 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                    : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                }`}>
                  {currentPlan ? 'Premium' : 'Free Plan'}
                </Badge>
              </div>
              
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  currentPlan 
                    ? 'bg-green-100 dark:bg-green-900/30' 
                    : 'bg-orange-100 dark:bg-orange-900/30'
                }`}>
                  <TrendingUp className={`w-6 h-6 ${
                    currentPlan ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'
                  }`} />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">
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
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-none shadow-lg hover:shadow-xl transition-all duration-200"
                  onClick={() => setLocation('/investment')}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Upgrade to Pro Plan
                </Button>
              )}
            </div>

            {/* Quick Start Card (when no active investments) */}
            {(!activeInvestments || activeInvestments.length === 0) && (
              <div className="bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/20 dark:to-orange-800/20 backdrop-blur-sm rounded-2xl p-6 border border-orange-200/50 dark:border-orange-800/50 shadow-xl shadow-orange-500/5 text-center">
                <div className="w-16 h-16 rounded-full bg-orange-200 dark:bg-orange-800/30 flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">Start Investing Today</h3>
                <p className="text-muted-foreground mb-4 text-sm">
                  Begin your investment journey with BitVault Pro and earn automated daily returns on your Bitcoin.
                </p>
                <Button 
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-none shadow-lg hover:shadow-xl transition-all duration-200"
                  onClick={() => setLocation('/investment')}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Explore Investment Plans
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
}