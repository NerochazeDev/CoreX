import { useAuth } from "@/hooks/use-auth";
import { WalletBalance } from "@/components/wallet-balance";
import { BitcoinPrice } from "@/components/bitcoin-price";
import { BitcoinChart } from "@/components/bitcoin-chart";

import { BottomNavigation } from "@/components/bottom-navigation";
import { OfficialPlus500Logo } from "@/components/official-plus500-logo";
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
    <div className="max-w-sm mx-auto min-h-screen bg-background">
      {/* Plus500 VIP Header */}
      <header className="gradient-primary text-white px-6 py-4 shadow-xl">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <OfficialPlus500Logo variant="white" size="md" showVIP={true} />
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setLocation('/notifications')}
              className="relative p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <Bell className="h-5 w-5" />
              {unreadCount && unreadCount.count > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-plus500-gold text-plus500-dark text-xs">
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
        <div className="plus500-professional p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-plus500">Portfolio Balance</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefreshBalance}
              disabled={isRefreshing}
              className="plus500-btn h-8 w-8 p-0 rounded-lg"
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

      {/* Bitcoin Chart */}
      <div className="px-4 mb-6">
        <BitcoinChart />
      </div>

      

      {/* Quick Actions - Plus500 Professional */}
      <div className="px-4 mb-6">
        <h3 className="text-lg font-bold mb-4 text-plus500">Trading Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          <Button 
            className="plus500-professional p-4 text-center hover:shadow-lg transition-all duration-300 flex flex-col items-center gap-3 h-auto group"
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
            className="plus500-professional p-4 text-center hover:shadow-lg transition-all duration-300 flex flex-col items-center gap-3 h-auto group"
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
                <Card key={investment.id} className="plus500-professional p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-plus500-gold">Investment #{investment.id}</h4>
                      <p className="text-muted-foreground text-sm">
                        Started: {formatDate(new Date(investment.startDate))}
                      </p>
                    </div>
                    <span className="bg-plus500-success bg-opacity-20 text-plus500-success px-2 py-1 rounded-full text-xs">
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
                      <span className="text-plus500-success">+{formatBitcoin(investment.currentProfit)} BTC</span>
                    </div>
                  </div>
                  <Progress value={progress} className="w-full mb-2" />
                  <p className="text-xs text-muted-foreground">
                    {daysLeft > 0 ? `${daysLeft} days remaining` : 'Completed'}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <BottomNavigation />
    </div>
  );
}
