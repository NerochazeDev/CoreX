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
    <div className="max-w-sm mx-auto min-h-screen bg-background">
      {/* BitVault Pro Header */}
      <header className="bg-gradient-to-br from-orange-500 to-orange-700 text-white px-6 py-4 shadow-xl">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <BitVaultLogo variant="white" size="md" showPro={true} />
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setLocation('/notifications')}
              className="relative p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <Bell className="h-5 w-5" />
              {unreadCount && unreadCount.count > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-orange-500 text-white text-xs">
                  {unreadCount.count}
                </Badge>
              )}
            </button>
            <button 
              onClick={() => setLocation('/profile')}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <User className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="mt-2">
          <p className="text-sm text-white/80 font-medium">{user.email}</p>
        </div>
      </header>

      {/* Wallet Balance - Plus500 Professional Style */}
      <div className="px-4 py-6">
        <div className="bitvault-professional p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-primary">Portfolio Balance</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefreshBalance}
              disabled={isRefreshing}
              className="bitvault-btn h-8 w-8 p-0 rounded-lg"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <WalletBalance />
        </div>
      </div>

      {/* Bitcoin Price */}
      <div className="px-4 mb-6">
        <BitcoinPrice />
      </div>

      

      {/* Quick Actions - Plus500 Professional */}
      <div className="px-4 mb-6">
        <h3 className="text-lg font-bold mb-4 text-primary">Trading Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          <Button 
            className="bitvault-professional p-4 text-center hover:shadow-lg transition-all duration-300 flex flex-col items-center gap-3 h-auto group"
            onClick={() => setLocation('/withdraw')}
          >
            <div className="w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-all border border-red-200">
              <ArrowUpRight className="w-6 h-6 text-red-600" />
            </div>
            <div className="text-center">
              <span className="text-sm font-bold text-foreground block">Withdraw</span>
              <span className="text-xs text-muted-foreground">Send Bitcoin</span>
            </div>
          </Button>
          <Button 
            className="bitvault-professional p-4 text-center hover:shadow-lg transition-all duration-300 flex flex-col items-center gap-3 h-auto group"
            onClick={() => setLocation('/deposit')}
          >
            <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center group-hover:bg-green-100 transition-all border border-green-200">
              <ArrowDownLeft className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-center">
              <span className="text-sm font-bold text-foreground block">Deposit</span>
              <span className="text-xs text-muted-foreground">Receive Bitcoin</span>
            </div>
          </Button>
        </div>
      </div>

      {/* Current Investment Plan - Plus500 Professional */}
      <div className="px-4 mb-6">
        <h3 className="text-lg font-bold mb-4 text-plus500">Investment Plan</h3>
        <Card className="plus500-professional p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                currentPlan 
                  ? 'bg-plus500-success bg-opacity-20' 
                  : 'bg-plus500 bg-opacity-20'
              }`}>
                <TrendingUp className={`w-5 h-5 ${
                  currentPlan ? 'text-plus500-success' : 'text-plus500'
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
                ? 'bg-plus500-success bg-opacity-20 text-plus500-success border-plus500-success' 
                : 'bg-plus500 bg-opacity-20 text-plus500 border-plus500'
            }`}>
              {currentPlan ? 'Premium' : 'Free'}
            </Badge>
          </div>
          {!currentPlan && (
            <Button 
              className="w-full plus500-btn mt-4"
              onClick={() => setLocation('/investment')}
            >
              Upgrade to VIP Plan
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
            <Card className="plus500-professional p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-xs text-muted-foreground">Total Invested</span>
              </div>
              <p className="text-lg font-bold text-foreground">{formatBitcoin(totalInvestedAmount.toString())} BTC</p>
            </Card>
            <Card className="plus500-professional p-3">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-4 h-4 text-plus500-success" />
                <span className="text-xs text-muted-foreground">Total Profit</span>
              </div>
              <p className="text-lg font-bold text-plus500-success">+{formatBitcoin(totalProfit.toString())} BTC</p>
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
                <Card key={investment.id} className="plus500-professional p-4 border border-green-500/20">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-plus500-gold flex items-center gap-2">
                        {plan ? plan.name : `Investment #${investment.id}`}
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      </h4>
                      <p className="text-muted-foreground text-sm">
                        Started: {formatDate(new Date(investment.startDate))}
                      </p>
                      {plan && (
                        <p className="text-xs text-plus500">
                          Daily Rate: {(parseFloat(plan.dailyReturnRate) * 100).toFixed(3)}%
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="bg-plus500-success bg-opacity-20 text-plus500-success px-2 py-1 rounded-full text-xs">
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
                      <div className="font-semibold text-plus500-success">+{formatBitcoin(investment.currentProfit)} BTC</div>
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
                    <span className="text-plus500-gold">
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
              className="w-full plus500-btn"
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
          <Card className="plus500-professional p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-plus500/20 flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-plus500" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-foreground">Start Investing Today</h3>
            <p className="text-muted-foreground mb-4 text-sm">
              Begin your investment journey with Plus500 VIP and earn automated daily returns on your Bitcoin.
            </p>
            <Button 
              className="plus500-btn"
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
