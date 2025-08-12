import { useAuth } from "@/hooks/use-auth";
import { WalletBalance } from "@/components/wallet-balance";
import { BitcoinPrice } from "@/components/bitcoin-price";

import { BottomNavigation } from "@/components/bottom-navigation";
import { BitVaultLogo } from "@/components/bitvault-logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Bell, User, ArrowUpRight, ArrowDownLeft, TrendingUp, Activity } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Investment, InvestmentPlan } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { formatBitcoin, calculateInvestmentProgress, formatDate } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function Home() {
  const { user, logout, refreshUser } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: investments } = useQuery<Investment[]>({
    queryKey: ['/api/investments/user', user?.id],
    queryFn: () => fetch(`/api/investments/user/${user?.id}`, {
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
  });

  const { data: investmentPlans } = useQuery<InvestmentPlan[]>({
    queryKey: ['/api/investment-plans'],
    enabled: !!user,
  });

  const { data: unreadCount } = useQuery<{ count: number }>({
    queryKey: ['/api/notifications', user?.id, 'unread-count'],
    queryFn: () => fetch(`/api/notifications/${user?.id}/unread-count`).then(res => res.json()),
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (!user) {
      setLocation('/login');
      return;
    }

    // Redirect to wallet setup if user doesn't have a wallet
    if (!user.hasWallet) {
      setLocation('/wallet-setup');
    }

    // Set up WebSocket for real-time investment updates
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/ws`;
    
    try {
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('WebSocket connected for investment updates');
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'investment_update' && data.userId === user.id) {
            // Invalidate and refetch investment data immediately
            queryClient.invalidateQueries({ queryKey: ['/api/investments/user', user.id] });
            queryClient.invalidateQueries({ queryKey: ['/api/me'] });
            
            // Show real-time notification
            toast({
              title: "💰 Investment Profit",
              description: `+${data.profit} BTC earned from ${data.planName}`,
            });
          } else if (data.type === 'investment_status_change' && data.userId === user.id) {
            // Handle investment pause/resume notifications
            queryClient.invalidateQueries({ queryKey: ['/api/investments/user', user.id] });
            queryClient.invalidateQueries({ queryKey: ['/api/notifications', user.id] });
            
            // Show immediate status change notification
            toast({
              title: data.notification.title,
              description: data.notification.message,
              variant: data.notification.type === 'warning' ? 'destructive' : 'default',
            });
          }
        } catch (error) {
          console.error('WebSocket message parse error:', error);
        }
      };
      
      ws.onclose = () => {
        console.log('WebSocket disconnected');
      };
      
      return () => {
        ws.close();
      };
    } catch (error) {
      console.error('WebSocket connection failed:', error);
    }
  }, [user, setLocation, queryClient, toast]);

  if (!user) {
    return <div>Redirecting to login...</div>;
  }

  const activeInvestments = investments?.filter(inv => inv.isActive === true) || [];
  const completedInvestments = investments?.filter(inv => inv.isActive === false) || [];

  const totalInvestedAmount = investments?.reduce((total, inv) => 
    total + parseFloat(inv.amount), 0
  ) || 0;

  const totalProfit = investments?.reduce((total, inv) => 
    total + parseFloat(inv.currentProfit), 0
  ) || 0;

  const totalInvestmentValue = totalInvestedAmount + totalProfit;

  const currentPlan = user?.currentPlanId 
    ? investmentPlans?.find(plan => plan.id === user.currentPlanId)
    : null;

  const handleRefreshBalance = async () => {
    if (!user) return;

    setIsRefreshing(true);
    try {
      // Sync balance with blockchain
      const response = await fetch(`/api/bitcoin/sync-balance/${user.id}`, {
        method: 'POST'
      });

      if (response.ok) {
        await refreshUser();
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
          </div>

          {/* Right Column - Bitcoin Price & Investment Info */}
          <div className="lg:col-span-4 space-y-6">
            {/* Bitcoin Price Card */}
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 border border-orange-200/50 dark:border-orange-800/50 shadow-xl shadow-orange-500/5">
              <BitcoinPrice />
            </div>

      {/* Current Investment Plan - BitVault Professional */}
      <div className="px-4 mb-6">
        <h3 className="text-lg font-bold mb-4 text-primary">Investment Plan</h3>
        <Card className="bitvault-professional p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                currentPlan 
                  ? 'bg-green-500 bg-opacity-20' 
                  : 'bg-primary bg-opacity-20'
              }`}>
                <TrendingUp className={`w-5 h-5 ${
                  currentPlan ? 'text-primary-success' : 'text-primary'
                }`} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-base text-foreground truncate">
                  {currentPlan ? currentPlan.name : "Free Plan"}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {currentPlan 
                    ? `${(parseFloat(currentPlan.dailyReturnRate) * 100).toFixed(2)}% daily return`
                    : "3.67% every 10 minutes"
                  }
                </p>
              </div>
            </div>
            <Badge className={`px-2 py-1 rounded-lg text-xs font-medium ${
              currentPlan 
                ? 'bg-green-500 bg-opacity-20 text-primary-success border-green-500' 
                : 'bg-primary bg-opacity-20 text-primary border-primary'
            }`}>
              {currentPlan ? 'Premium' : 'Free'}
            </Badge>
          </div>
          {!currentPlan && (
            <Button 
              className="w-full bitvault-btn mt-4"
              onClick={() => setLocation('/investment')}
            >
              Upgrade to Pro Plan
            </Button>
          )}
        </Card>
      </div>

      {/* Advanced Investment Dashboard */}
      {activeInvestments.length > 0 && (
        <div className="px-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-foreground">Active Investments</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                // Force refresh investments
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

          {/* Investment Overview Cards */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Card className="bitvault-professional p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-xs text-muted-foreground">Total Invested</span>
              </div>
              <p className="text-lg font-bold text-foreground">{formatBitcoin(totalInvestedAmount.toString())} BTC</p>
            </Card>
            <Card className="bitvault-professional p-3">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-4 h-4 text-primary-success" />
                <span className="text-xs text-muted-foreground">Total Profit</span>
              </div>
              <p className="text-lg font-bold text-primary-success">+{formatBitcoin(totalProfit.toString())} BTC</p>
            </Card>
          </div>

          {/* Active Investment Cards */}
          <div className="space-y-3">
            {activeInvestments.map((investment) => {
              const progress = calculateInvestmentProgress(
                new Date(investment.startDate),
                new Date(investment.endDate)
              );
              const daysLeft = Math.ceil(
                (new Date(investment.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
              );
              const plan = investmentPlans?.find(p => p.id === investment.planId);
              const profitPercentage = totalInvestedAmount > 0 ? ((parseFloat(investment.currentProfit) / parseFloat(investment.amount)) * 100) : 0;

              return (
                <Card key={investment.id} className="bitvault-professional p-4 border border-green-500/20">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-primary-gold flex items-center gap-2">
                        {plan ? plan.name : `Investment #${investment.id}`}
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      </h4>
                      <p className="text-muted-foreground text-sm">
                        Started: {formatDate(new Date(investment.startDate))}
                      </p>
                      {plan && (
                        <p className="text-xs text-primary">
                          Daily Rate: {(parseFloat(plan.dailyReturnRate) * 100).toFixed(3)}%
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="bg-green-500 bg-opacity-20 text-primary-success px-2 py-1 rounded-full text-xs">
                        Earning
                      </span>
                      <p className="text-xs text-muted-foreground mt-1">
                        +{profitPercentage.toFixed(2)}% ROI
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <span className="text-xs text-muted-foreground">Principal</span>
                      <div className="font-semibold text-foreground">{formatBitcoin(investment.amount)} BTC</div>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Current Profit</span>
                      <div className="font-semibold text-primary-success">+{formatBitcoin(investment.currentProfit)} BTC</div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="text-foreground">{progress.toFixed(1)}%</span>
                    </div>
                    <Progress value={progress} className="w-full h-2" />
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">
                      {daysLeft > 0 ? `${daysLeft} days remaining` : 'Completed'}
                    </span>
                    <span className="text-primary-gold">
                      Total Value: {formatBitcoin((parseFloat(investment.amount) + parseFloat(investment.currentProfit)).toString())} BTC
                    </span>
                  </div>

                  {/* Real-time update indicator */}
                  <div className="mt-2 p-2 bg-green-500/10 rounded text-xs text-green-400 flex items-center gap-1">
                    <div className="w-1 h-1 bg-green-400 rounded-full animate-ping"></div>
                    Live updates every 5 minutes
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Quick Actions for Investments */}
          <div className="mt-4">
            <Button 
              className="w-full bitvault-btn"
              onClick={() => setLocation('/investment')}
            >
              View Full Investment Dashboard
            </Button>
          </div>
        </div>
      )}

      {/* Investment Quick Start (when no active investments) */}
      {activeInvestments.length === 0 && (
        <div className="px-4 mb-6">
          <Card className="bitvault-professional p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-foreground">Start Investing Today</h3>
            <p className="text-muted-foreground mb-4 text-sm">
              Begin your investment journey with BitVault Pro and earn automated daily returns on your Bitcoin.
            </p>
            <Button 
              className="bitvault-btn"
              onClick={() => setLocation('/investment')}
            >
              Explore Investment Plans
            </Button>
          </Card>
        </div>
      )}

      <BottomNavigation />
    </div>
  );
}
