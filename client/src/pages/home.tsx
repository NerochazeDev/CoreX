import { useAuth } from "@/hooks/use-auth";
import { WalletBalance } from "@/components/wallet-balance";
import { BitcoinPrice } from "@/components/bitcoin-price";
import { BitcoinSync } from "@/components/bitcoin-sync";

import { BottomNavigation } from "@/components/bottom-navigation";
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

export default function Home() {
  const { user, logout, refreshUser } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: investments } = useQuery<Investment[]>({
    queryKey: ['/api/investments/user', user?.id],
    enabled: !!user?.id,
    refetchInterval: 30000, // Refresh every 30 seconds
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
  }, [user, setLocation]);

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
    <div className="max-w-sm mx-auto bg-background min-h-screen relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-background opacity-50"></div>
      <div className="absolute top-0 right-0 w-64 h-64 bg-plus500-blue opacity-5 rounded-full blur-3xl animate-pulse-slow"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-plus500-light-blue opacity-5 rounded-full blur-3xl animate-pulse-slow"></div>

      {/* Header */}
      <header className="relative px-6 py-4 flex justify-between items-center backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl plus500-gradient flex items-center justify-center glow-plus500 shadow-lg">
            <span className="text-white text-sm font-bold">500</span>
            <span className="text-white text-xs font-bold">+</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground bg-gradient-to-r from-plus500-blue to-plus500-light-blue bg-clip-text text-transparent">
              Plus500 VIP
            </h1>
            <p className="text-sm text-muted-foreground font-medium">{user.email}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-2xl relative glass-card hover:glow-plus500 transition-all duration-300" 
            onClick={() => setLocation('/notifications')}
          >
            <Bell className="w-5 h-5" />
            {unreadCount && unreadCount.count > 0 && (
              <Badge variant="destructive" className="absolute -top-2 -right-2 h-6 w-6 text-xs p-0 flex items-center justify-center animate-pulse glow-ruby">
                {unreadCount.count > 9 ? '9+' : unreadCount.count}
              </Badge>
            )}
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-2xl glass-card hover:glow-plus500 transition-all duration-300" 
            onClick={() => setLocation('/profile')}
          >
            <User className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Wallet Balance */}
      <div className="relative px-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-foreground">Wallet Balance</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefreshBalance}
              disabled={isRefreshing}
              className="rounded-2xl relative glass-card hover:glow-bitcoin transition-all duration-300 h-8 w-8"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <WalletBalance />
      </div>

      {/* Bitcoin Price */}
      <BitcoinPrice />

      {/* Bitcoin Sync */}
      <div className="px-4 mb-6">
        <BitcoinSync />
      </div>

      {/* Quick Actions */}
      <div className="relative px-4 mb-6">
        <h3 className="text-base font-semibold mb-3 text-foreground">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          <Button 
            className="neo-card rounded-2xl p-4 text-center hover:glow-ruby transition-all duration-300 transform hover:scale-105 flex flex-col items-center gap-2 h-auto group"
            onClick={() => setLocation('/withdraw')}
          >
            <div className="w-10 h-10 rounded-xl bg-ruby bg-opacity-20 flex items-center justify-center group-hover:bg-opacity-30 transition-all">
              <ArrowUpRight className="w-5 h-5 text-ruby" />
            </div>
            <span className="text-sm font-medium text-foreground">Withdraw</span>
            <span className="text-xs text-muted-foreground">Send Bitcoin</span>
          </Button>
          <Button 
            className="neo-card rounded-2xl p-4 text-center hover:glow-emerald transition-all duration-300 transform hover:scale-105 flex flex-col items-center gap-2 h-auto group"
            onClick={() => setLocation('/deposit')}
          >
            <div className="w-10 h-10 rounded-xl bg-emerald bg-opacity-20 flex items-center justify-center group-hover:bg-opacity-30 transition-all">
              <ArrowDownLeft className="w-5 h-5 text-emerald" />
            </div>
            <span className="text-sm font-medium text-foreground">Deposit</span>
            <span className="text-xs text-muted-foreground">Receive Bitcoin</span>
          </Button>
        </div>
      </div>

      {/* Current Investment Plan */}
      <div className="relative px-4 mb-6">
        <h3 className="text-base font-semibold mb-3 text-foreground">Investment Plan</h3>
        <Card className="neo-card rounded-2xl p-4 hover:glow-bitcoin transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                currentPlan 
                  ? 'bg-emerald bg-opacity-20' 
                  : 'bg-sapphire bg-opacity-20'
              }`}>
                <TrendingUp className={`w-5 h-5 ${
                  currentPlan ? 'text-emerald' : 'text-sapphire'
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
                ? 'bg-emerald bg-opacity-20 text-emerald border-emerald' 
                : 'bg-sapphire bg-opacity-20 text-sapphire border-sapphire'
            }`}>
              {currentPlan ? 'Premium' : 'Free'}
            </Badge>
          </div>
          {!currentPlan && (
            <Button 
              className="w-full gradient-primary text-black font-medium rounded-xl hover:scale-105 transition-all duration-300"
              onClick={() => setLocation('/investment')}
            >
              Upgrade Plan
            </Button>
          )}
        </Card>
      </div>

      {/* Portfolio Overview */}
      <div className="relative px-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-foreground">Portfolio Analytics</h3>
          <Badge className="bg-emerald bg-opacity-20 text-emerald border-emerald text-xs">
            24h Active
          </Badge>
        </div>

        {/* Main Portfolio Card */}
        <Card className="neo-card rounded-2xl p-4 mb-4 hover:glow-bitcoin transition-all duration-300 bg-gradient-to-br from-card to-card/80">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1 min-w-0">
              <h4 className="text-xs text-muted-foreground mb-1">Total Portfolio Value</h4>
              <p className="text-xl font-bold text-foreground">
                {formatBitcoin(totalInvestmentValue.toString())} BTC
              </p>
              <p className="text-xs text-bitcoin font-medium mt-1">
                ≈ ${(totalInvestmentValue * 103789).toLocaleString()} USD
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center animate-pulse-slow">
              <TrendingUp className="w-6 h-6 text-black" />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="text-center">
              <p className="text-lg font-bold text-emerald">+{((totalProfit / totalInvestedAmount) * 100 || 0).toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">Total Return</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{activeInvestments.length}</p>
              <p className="text-xs text-muted-foreground">Active ({completedInvestments.length} completed)</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-bitcoin">24/7</p>
              <p className="text-xs text-muted-foreground">Earning</p>
            </div>
          </div>

          <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden mb-2">
            <div className="h-full bg-gradient-to-r from-emerald to-bitcoin rounded-full" style={{ width: "67%" }}></div>
          </div>
          <p className="text-xs text-center text-muted-foreground">67% of target portfolio reached</p>
        </Card>

        {/* Portfolio Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Card className="neo-card rounded-2xl p-3 hover:glow-emerald transition-all duration-300 group">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald bg-opacity-20 flex items-center justify-center group-hover:bg-opacity-30 transition-all">
                <TrendingUp className="w-4 h-4 text-emerald" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs text-muted-foreground font-medium block">Total Invested</span>
                <span className="text-xs text-emerald">+12.3% this month</span>
              </div>
            </div>
            <p className="text-lg font-bold text-foreground">{formatBitcoin(totalInvestedAmount.toString())}</p>
            <p className="text-xs text-bitcoin font-medium">BTC</p>
          </Card>

          <Card className="neo-card rounded-2xl p-3 hover:glow-bitcoin transition-all duration-300 group">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-bitcoin bg-opacity-20 flex items-center justify-center group-hover:bg-opacity-30 transition-all">
                <Activity className="w-4 h-4 text-bitcoin" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs text-muted-foreground font-medium block">Total Profit</span>
                <span className="text-xs text-bitcoin">Generated today</span>
              </div>
            </div>
            <p className="text-lg font-bold text-emerald">+{formatBitcoin(totalProfit.toString())}</p>
            <p className="text-xs text-bitcoin font-medium">BTC</p>
          </Card>
        </div>

        {/* Performance Metrics */}
        <Card className="neo-card rounded-2xl p-3 hover:glow-sapphire transition-all duration-300">
          <h4 className="font-semibold mb-3 text-foreground flex items-center gap-2 text-sm">
            <Activity className="w-4 h-4 text-sapphire" />
            Performance Metrics
          </h4>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Daily Yield</span>
                <span className="text-emerald font-medium">3.67%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Monthly ROI</span>
                <span className="text-bitcoin font-medium">110.1%</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Risk Level</span>
                <span className="text-green-400 font-medium">Low</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Next Profit</span>
                <span className="text-sapphire font-medium">8 min</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Investment Plans */}
      {/* <InvestmentPlans /> */}

      {/* Active Investments */}
      {activeInvestments.length > 0 && (
        <div className="px-4 mb-20">
          <h3 className="text-lg font-semibold mb-4 text-foreground">Active Investments</h3>
          <div className="space-y-3">
            {activeInvestments.map((investment) => {
              const progress = calculateInvestmentProgress(
                new Date(investment.startDate),
                new Date(investment.endDate)
              );
              const daysLeft = Math.ceil(
                (new Date(investment.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
              );

              return (
                <Card key={investment.id} className="dark-card rounded-xl p-4 dark-border">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-gold">Investment #{investment.id}</h4>
                      <p className="text-muted-foreground text-sm">
                        Started: {formatDate(new Date(investment.startDate))}
                      </p>
                    </div>
                    <span className="bg-green-500 bg-opacity-20 text-green-400 px-2 py-1 rounded-full text-xs">
                      Active
                    </span>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Invested</span>
                      <span className="text-foreground">{formatBitcoin(investment.amount)} BTC</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Current Profit</span>
                      <span className="text-green-400">+{formatBitcoin(investment.currentProfit)} BTC</span>
                    </div>
                  </div>
                  <Progress value={progress} className="w-full mb-2" />
                  <p className="text-xs text-muted-foreground text-center">
                    {daysLeft > 0 ? `${daysLeft} days remaining` : 'Completed'}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom spacing for navigation */}
      <div className="h-20"></div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}