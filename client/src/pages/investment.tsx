import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BottomNavigation } from "@/components/bottom-navigation";
import type { Investment, InvestmentPlan, Transaction } from "@shared/schema";
import { formatBitcoin, formatBitcoinWithFiat, formatCurrency, calculateInvestmentProgress, formatDate, calculateCurrencyValue } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { useLocation } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCurrency } from "@/hooks/use-currency";
import { TrendingUp, Target, Clock, Award, ArrowLeft, BarChart3, PieChart, Calendar, DollarSign, Zap, Activity, Wallet, Shield, Star, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { useBitcoinPrice } from "@/hooks/use-bitcoin-price";
import { BitVaultLogo } from "@/components/bitvault-logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Investment() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { currency } = useCurrency();
  const { data: bitcoinPrice } = useBitcoinPrice();
  const { toast } = useToast();
  const [showBalances, setShowBalances] = useState(true);

  if (!user) {
    setLocation('/login');
    return null;
  }

  const { data: investments } = useQuery<Investment[]>({
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

  const { data: plans } = useQuery<InvestmentPlan[]>({
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

  const { data: transactions } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions'],
    queryFn: () => fetch('/api/transactions', {
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('bitvault_auth_token') || ''}`,
      }
    }).then(res => {
      if (!res.ok) {
        if (res.status === 401) return [];
        throw new Error('Failed to fetch transactions');
      }
      return res.json();
    }),
    enabled: !!user,
    refetchInterval: 30000,
  });

  const createInvestmentMutation = useMutation({
    mutationFn: async ({ planId, amount }: { planId: number; amount: string }) => {
      const response = await fetch('/api/invest', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('bitvault_auth_token') || ''}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          planId,
          amount,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Investment failed');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/investments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/investments/user', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      toast({
        title: "Investment Submitted",
        description: "Your investment has been submitted and is pending confirmation.",
      });
    },
    onError: (error) => {
      toast({
        title: "Investment Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleInvestPlan = (plan: InvestmentPlan) => {
    if (!user) return;
    const planUsdAmount = parseFloat(plan.usdMinAmount);
    const currentPrice = bitcoinPrice?.usd.price || 121000;
    const btcAmount = (planUsdAmount / currentPrice).toFixed(8);

    const confirmed = confirm(
      `Invest in ${plan.name}?\n\n` +
      `Amount: $${planUsdAmount.toFixed(2)} (${btcAmount} BTC)\n` +
      `Duration: ${plan.durationDays} days\n` +
      `Total ROI: ${plan.roiPercentage}%\n` +
      `Daily Return: ${(parseFloat(plan.dailyReturnRate) * 100).toFixed(4)}%\n` +
      `Performance Fee: ${plan.performanceFeePercentage || 0}%\n\n` +
      `Proceed?`
    );

    if (confirmed) {
      createInvestmentMutation.mutate({
        planId: plan.id,
        amount: planUsdAmount.toFixed(2),
      });
    }
  };

  const getPlanName = (planId: number) => {
    return plans?.find(plan => plan.id === planId)?.name || `Plan ${planId}`;
  };

  const activeInvestments = investments?.filter(inv => inv.isActive === true) || [];
  const completedInvestments = investments?.filter(inv => inv.isActive === false) || [];
  const pendingInvestments = transactions?.filter(tx => tx.type === 'investment' && tx.status === 'pending') || [];
  const rejectedInvestments = transactions?.filter(tx => tx.type === 'investment' && tx.status === 'rejected') || [];

  // Calculate portfolio statistics
  const totalInvested = investments?.reduce((sum, inv) => sum + parseFloat(inv.amount), 0) || 0;
  // currentProfit now contains NET profit (after fees) for all investments
  const totalProfit = investments?.reduce((sum, inv) => sum + parseFloat(inv.currentProfit), 0) || 0;
  const totalValue = totalInvested + totalProfit;
  const portfolioReturn = totalInvested > 0 ? ((totalProfit / totalInvested) * 100) : 0;

  // Calculate average daily return
  const avgDailyReturn = activeInvestments.length > 0 
    ? activeInvestments.reduce((sum, inv) => {
        const plan = plans?.find(p => p.id === inv.planId);
        return sum + (plan ? parseFloat(plan.dailyReturnRate) * 100 : 0);
      }, 0) / activeInvestments.length 
    : 0;

  const currencyPrice = currency === 'USD' ? bitcoinPrice?.usd.price : bitcoinPrice?.gbp.price;

  const sortedPlans = [...(plans || [])].sort(
    (a, b) => parseFloat(a.usdMinAmount) - parseFloat(b.usdMinAmount)
  );

  const getGradientClass = (color: string) => {
    switch (color) {
      case 'orange':
        return 'bg-gradient-to-br from-orange-500/10 via-orange-600/5 to-orange-700/10 dark:from-orange-600/20 dark:via-orange-700/15 dark:to-orange-800/20 border-orange-400/30 dark:border-orange-500/30';
      case 'gray':
        return 'bg-gradient-to-br from-gray-500/10 via-gray-600/5 to-gray-700/10 dark:from-gray-600/20 dark:via-gray-700/15 dark:to-gray-800/20 border-gray-400/30 dark:border-gray-500/30';
      case 'gold':
        return 'bg-gradient-to-br from-yellow-500/10 via-yellow-600/5 to-yellow-700/10 dark:from-yellow-600/20 dark:via-yellow-700/15 dark:to-yellow-800/20 border-yellow-400/30 dark:border-yellow-500/30';
      default:
        return 'bg-gradient-to-br from-orange-500/10 via-orange-600/5 to-orange-700/10 dark:from-orange-600/20 dark:via-orange-700/15 dark:to-orange-800/20 border-orange-400/30 dark:border-orange-500/30';
    }
  };

  const getTextColorClass = (color: string) => {
    switch (color) {
      case 'orange':
        return 'text-orange-700 dark:text-orange-300';
      case 'gray':
        return 'text-gray-700 dark:text-gray-300';
      case 'gold':
        return 'text-yellow-700 dark:text-yellow-300';
      default:
        return 'text-orange-700 dark:text-orange-300';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/20 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Link href="/home">
                <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 dark:hover:from-orange-800/40 dark:hover:to-orange-700/40 text-orange-700 hover:text-orange-800 dark:text-orange-300 dark:hover:text-orange-200 border border-orange-200/50 dark:border-orange-700/50 shadow-md transition-all duration-200" data-testid="button-back">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">
                  Investment Center
                </h1>
                <p className="text-sm text-orange-600/80 dark:text-orange-400/80 font-medium">
                  Portfolio Analytics & Growth
                </p>
              </div>
            </div>

            <nav className="flex items-center gap-2" aria-label="User navigation">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowBalances(!showBalances)}
                aria-label={showBalances ? "Hide balances" : "Show balances"}
                className="h-10 w-10"
                data-testid="button-toggle-balances"
              >
                {showBalances ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24 space-y-6">
        {/* Stats Overview - Orange Theme Design */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="relative">
            <div className="absolute top-2 left-2 w-full h-full bg-gradient-to-br from-orange-500/20 to-orange-600/30 rounded-2xl blur-sm"></div>
            <Card className="relative bg-gradient-to-br from-orange-500/10 via-orange-600/5 to-orange-700/10 dark:from-orange-600/20 dark:via-orange-700/15 dark:to-orange-800/20 backdrop-blur-xl border border-orange-400/30 dark:border-orange-500/30 rounded-2xl shadow-xl shadow-orange-600/20">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-700 dark:text-orange-300 mb-1">Total Invested</p>
                    <p className="text-lg sm:text-xl font-bold text-orange-800 dark:text-orange-100">
                      {showBalances ? (currencyPrice ? formatBitcoinWithFiat(totalInvested.toString(), currencyPrice, currency, { compact: true }) : `${formatBitcoin(totalInvested.toString())} BTC`) : '••••••'}
                    </p>
                  </div>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-400/30 to-orange-500/40 dark:from-orange-500/30 dark:to-orange-600/40 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30">
                    <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-orange-700 dark:text-orange-300" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="relative">
            <div className="absolute top-2 left-2 w-full h-full bg-gradient-to-br from-orange-500/20 to-orange-600/30 rounded-2xl blur-sm"></div>
            <Card className="relative bg-gradient-to-br from-orange-500/10 via-orange-600/5 to-orange-700/10 dark:from-orange-600/20 dark:via-orange-700/15 dark:to-orange-800/20 backdrop-blur-xl border border-orange-400/30 dark:border-orange-500/30 rounded-2xl shadow-xl shadow-orange-600/20">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-700 dark:text-orange-300 mb-1">Total Profit</p>
                    <p className="text-lg sm:text-xl font-bold text-green-600 dark:text-green-400">
                      {showBalances ? `+${currencyPrice ? formatBitcoinWithFiat(totalProfit.toString(), currencyPrice, currency, { compact: true }) : `${formatBitcoin(totalProfit.toString())} BTC`}` : '••••••'}
                    </p>
                  </div>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-400/30 to-orange-500/40 dark:from-orange-500/30 dark:to-orange-600/40 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30">
                    <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-orange-700 dark:text-orange-300" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="relative">
            <div className="absolute top-2 left-2 w-full h-full bg-gradient-to-br from-orange-500/20 to-orange-600/30 rounded-2xl blur-sm"></div>
            <Card className="relative bg-gradient-to-br from-orange-500/10 via-orange-600/5 to-orange-700/10 dark:from-orange-600/20 dark:via-orange-700/15 dark:to-orange-800/20 backdrop-blur-xl border border-orange-400/30 dark:border-orange-500/30 rounded-2xl shadow-xl shadow-orange-600/20">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-700 dark:text-orange-300 mb-1">Portfolio Value</p>
                    <p className="text-lg sm:text-xl font-bold text-orange-800 dark:text-orange-100">
                      {showBalances ? (currencyPrice ? formatBitcoinWithFiat(totalValue.toString(), currencyPrice, currency, { compact: true }) : `${formatBitcoin(totalValue.toString())} BTC`) : '••••••'}
                    </p>
                  </div>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-400/30 to-orange-500/40 dark:from-orange-500/30 dark:to-orange-600/40 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30">
                    <PieChart className="w-5 h-5 sm:w-6 sm:h-6 text-orange-700 dark:text-orange-300" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="relative">
            <div className="absolute top-2 left-2 w-full h-full bg-gradient-to-br from-orange-500/20 to-orange-600/30 rounded-2xl blur-sm"></div>
            <Card className="relative bg-gradient-to-br from-orange-500/10 via-orange-600/5 to-orange-700/10 dark:from-orange-600/20 dark:via-orange-700/15 dark:to-orange-800/20 backdrop-blur-xl border border-orange-400/30 dark:border-orange-500/30 rounded-2xl shadow-xl shadow-orange-600/20">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-700 dark:text-orange-300 mb-1">ROI</p>
                    <p className={`text-lg sm:text-xl font-bold ${portfolioReturn >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                      {portfolioReturn >= 0 ? '+' : ''}{portfolioReturn.toFixed(2)}%
                    </p>
                    <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                      Avg Daily: {avgDailyReturn.toFixed(3)}%
                    </p>
                  </div>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-400/30 to-orange-500/40 dark:from-orange-500/30 dark:to-orange-600/40 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30">
                    <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-orange-700 dark:text-orange-300" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Investment Plans Section */}
        <div className="relative">
          <div className="absolute top-2 left-2 w-full h-full bg-gradient-to-br from-orange-500/20 to-orange-600/30 rounded-2xl blur-sm"></div>
          <Card className="relative bg-gradient-to-br from-orange-500/10 via-orange-600/5 to-orange-700/10 dark:from-orange-600/20 dark:via-orange-700/15 dark:to-orange-800/20 backdrop-blur-xl border border-orange-400/30 dark:border-orange-500/30 rounded-2xl shadow-xl shadow-orange-600/20">
            <CardHeader className="border-b border-orange-400/20 dark:border-orange-500/30">
              <CardTitle className="text-xl font-bold text-orange-800 dark:text-orange-100 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-400/30 to-orange-500/40 dark:from-orange-500/30 dark:to-orange-600/40 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30">
                  <DollarSign className="w-5 h-5 text-orange-700 dark:text-orange-300" />
                </div>
                Choose an Investment Plan
              </CardTitle>
              <p className="text-sm text-orange-700/70 dark:text-orange-200/70 mt-2">
                Select one of our USD-based plans below. Returns are paid into your balance automatically every 5 minutes.
              </p>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {sortedPlans.length === 0 ? (
                <div className="text-center py-12 text-orange-700/70 dark:text-orange-200/70" data-testid="text-no-plans">
                  Loading investment plans…
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {sortedPlans.map((plan) => {
                    const planUsd = parseFloat(plan.usdMinAmount);
                    const dailyRatePct = parseFloat(plan.dailyReturnRate) * 100;
                    const grossDailyUsd = planUsd * (dailyRatePct / 100);
                    const feePct = plan.performanceFeePercentage || 0;
                    const netDailyUsd = grossDailyUsd * (1 - feePct / 100);
                    const totalNetUsd = netDailyUsd * plan.durationDays;
                    const isSubmittingThis =
                      createInvestmentMutation.isPending &&
                      createInvestmentMutation.variables?.planId === plan.id;

                    return (
                      <div
                        key={plan.id}
                        className="relative group"
                        data-testid={`card-plan-${plan.id}`}
                      >
                        <div className="absolute top-1.5 left-1.5 w-full h-full bg-gradient-to-br from-orange-500/15 to-orange-600/20 rounded-2xl blur-sm group-hover:opacity-80 opacity-60 transition-opacity"></div>
                        <Card className="relative h-full flex flex-col bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border border-orange-300/40 dark:border-orange-500/30 rounded-2xl shadow-lg shadow-orange-600/10 transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-orange-600/20">
                          <CardContent className="p-5 flex flex-col flex-1 gap-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="text-xs uppercase tracking-wider font-semibold text-orange-600/80 dark:text-orange-300/70">
                                  {plan.name}
                                </p>
                                <p
                                  className="text-2xl font-extrabold text-orange-800 dark:text-orange-100 mt-1"
                                  data-testid={`text-plan-amount-${plan.id}`}
                                >
                                  ${planUsd.toLocaleString()}
                                </p>
                              </div>
                              <Badge
                                variant="secondary"
                                className="bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-200 border border-orange-200/60 dark:border-orange-700/40 font-semibold"
                                data-testid={`badge-plan-roi-${plan.id}`}
                              >
                                {plan.roiPercentage}% ROI
                              </Badge>
                            </div>

                            <div className="space-y-2 text-sm">
                              <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                                  <Calendar className="w-3.5 h-3.5" />
                                  Duration
                                </span>
                                <span className="font-semibold text-gray-800 dark:text-gray-100" data-testid={`text-plan-duration-${plan.id}`}>
                                  {plan.durationDays} days
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                                  <Activity className="w-3.5 h-3.5" />
                                  Daily Rate
                                </span>
                                <span className="font-semibold text-gray-800 dark:text-gray-100">
                                  {dailyRatePct.toFixed(4)}%
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                                  <TrendingUp className="w-3.5 h-3.5" />
                                  Daily Net
                                </span>
                                <span className="font-bold text-green-600 dark:text-green-400" data-testid={`text-plan-daily-net-${plan.id}`}>
                                  ${netDailyUsd.toFixed(netDailyUsd < 1 ? 3 : 2)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                                  <Award className="w-3.5 h-3.5" />
                                  Total Net
                                </span>
                                <span className="font-bold text-green-700 dark:text-green-300" data-testid={`text-plan-total-net-${plan.id}`}>
                                  ${totalNetUsd.toFixed(2)}
                                </span>
                              </div>
                              {feePct > 0 && (
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-500 dark:text-gray-500 text-xs">
                                    Performance fee
                                  </span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {feePct}%
                                  </span>
                                </div>
                              )}
                            </div>

                            <Button
                              onClick={() => handleInvestPlan(plan)}
                              disabled={createInvestmentMutation.isPending}
                              className="mt-auto w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white shadow-md shadow-orange-600/20 rounded-xl h-11 font-bold transition-all duration-200"
                              data-testid={`button-invest-plan-${plan.id}`}
                            >
                              {isSubmittingThis ? "Processing…" : `Invest $${planUsd.toLocaleString()}`}
                            </Button>
                          </CardContent>
                        </Card>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="p-4 bg-orange-50/50 dark:bg-orange-950/30 border border-orange-200/50 dark:border-orange-800/30 rounded-lg" data-testid="disclaimer-performance">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-orange-900 dark:text-orange-200">
                Performance Disclosure
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
