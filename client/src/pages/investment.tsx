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

  const [investmentAmount, setInvestmentAmount] = useState<string>("10");

  const handleInvest = () => {
    if (!user) return;
    
    const amount = parseFloat(investmentAmount);
    if (isNaN(amount) || amount < 10 || amount > 12000) {
      toast({
        title: "Invalid Amount",
        description: "Please enter an amount between $10 and $12,000",
        variant: "destructive",
      });
      return;
    }

    const currentPrice = bitcoinPrice?.usd.price || 121000;
    const btcAmount = (amount / currentPrice).toFixed(8);
    
    const confirmed = confirm(`Invest $${amount.toFixed(2)} (${btcAmount} BTC)?\n\nDaily Growth: 2.57% (Adjustable by Admin)\nMin: $10 | Max: $12,000\n\nProceed?`);
    
    if (confirmed) {
      createInvestmentMutation.mutate({
        planId: 1, // Using a default plan ID since it's now amount-based
        amount: investmentAmount,
      });
    }
  };

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

        {/* Investment Input Section */}
        <div className="relative">
          <div className="absolute top-2 left-2 w-full h-full bg-gradient-to-br from-orange-500/20 to-orange-600/30 rounded-2xl blur-sm"></div>
          <Card className="relative bg-gradient-to-br from-orange-500/10 via-orange-600/5 to-orange-700/10 dark:from-orange-600/20 dark:via-orange-700/15 dark:to-orange-800/20 backdrop-blur-xl border border-orange-400/30 dark:border-orange-500/30 rounded-2xl shadow-xl shadow-orange-600/20">
            <CardHeader className="border-b border-orange-400/20 dark:border-orange-500/30">
              <CardTitle className="text-xl font-bold text-orange-800 dark:text-orange-100 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-400/30 to-orange-500/40 dark:from-orange-500/30 dark:to-orange-600/40 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30">
                  <DollarSign className="w-5 h-5 text-orange-700 dark:text-orange-300" />
                </div>
                Start Investing
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-orange-900/70 dark:text-orange-100/70 font-medium">Investment Amount (USD)</Label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-orange-600 font-bold">$</span>
                  </div>
                  <Input 
                    type="number"
                    value={investmentAmount} 
                    onChange={(e) => setInvestmentAmount(e.target.value)} 
                    placeholder="Enter amount (10 - 12,000)"
                    min="10"
                    max="12000"
                    className="pl-8 bg-white/50 dark:bg-gray-900/50 border-orange-100 dark:border-orange-900/30 focus:ring-orange-500 rounded-xl h-12 text-lg font-medium"
                  />
                </div>
                <div className="flex justify-between text-xs font-medium italic">
                  <span className="text-orange-600/70">Min: $10</span>
                  <span className="text-orange-600/70">Max: $12,000</span>
                </div>
              </div>

              <div className="p-4 bg-orange-50/50 dark:bg-orange-950/30 border border-orange-200/50 dark:border-orange-800/30 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-orange-900/60 dark:text-orange-100/60">Estimated Daily Growth</span>
                  <span className="text-orange-900 dark:text-orange-100 font-bold">2.57%</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-orange-900/60 dark:text-orange-100/60">Daily Return (Est.)</span>
                  <span className="text-green-600 dark:text-green-400 font-bold">
                    ${((parseFloat(investmentAmount) || 0) * 0.0257).toFixed(2)}
                  </span>
                </div>
              </div>

              <Button 
                onClick={handleInvest}
                disabled={createInvestmentMutation.isPending}
                className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white shadow-lg shadow-orange-600/20 rounded-xl h-14 text-lg font-bold transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {createInvestmentMutation.isPending ? "Processing..." : "Secure Investment Now"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Performance Insights Section Removed if no investments */}
                            <div className="flex justify-between items-center mb-3">
                              <span className="text-sm opacity-80">Expected Returns:</span>
                              <Target className="w-4 h-4 opacity-80" />
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Plan Capital:</span>
                                <div className="text-right">
                                  <div className="font-medium">${plan.usdMinAmount || '0'}</div>
                                </div>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span>Hold Days:</span>
                                <div className="text-right font-medium">{plan.durationDays} days</div>
                              </div>
                              <div className="flex justify-between text-sm border-t border-white/20 pt-2">
                                <span>Profit (Before Fee):</span>
                                <div className="text-right text-green-300">
                                  <div className="font-medium">+${(parseFloat(plan.usdMinAmount || '0') * plan.roiPercentage / 100).toFixed(2)}</div>
                                  <div className="text-xs opacity-75">{plan.roiPercentage}% ROI</div>
                                </div>
                              </div>
                              {plan.performanceFeePercentage && plan.performanceFeePercentage > 0 && (
                                <>
                                  <div className="flex justify-between text-sm text-yellow-300">
                                    <span>Fee %:</span>
                                    <div className="text-right font-medium">{plan.performanceFeePercentage}%</div>
                                  </div>
                                  <div className="flex justify-between text-sm text-yellow-300">
                                    <span>Fee (on Profit):</span>
                                    <div className="text-right">
                                      <div className="font-medium">-${(parseFloat(plan.usdMinAmount || '0') * plan.roiPercentage / 100 * plan.performanceFeePercentage / 100).toFixed(2)}</div>
                                      <div className="text-xs opacity-75">On Profit Only</div>
                                    </div>
                                  </div>
                                  <div className="flex justify-between text-sm text-green-400 border-t border-white/20 pt-2">
                                    <span className="font-semibold">Net Profit:</span>
                                    <div className="text-right">
                                      <div className="font-bold">+${(parseFloat(plan.usdMinAmount || '0') * plan.roiPercentage / 100 * (1 - plan.performanceFeePercentage / 100)).toFixed(2)}</div>
                                      <div className="text-xs opacity-75">After {plan.performanceFeePercentage}% Fee</div>
                                    </div>
                                  </div>
                                </>
                              )}
                              <div className="flex justify-between text-base font-semibold border-t border-white/20 pt-2">
                                <span>Total After Trade:</span>
                                <div className="text-right text-green-300">
                                  {plan.performanceFeePercentage && plan.performanceFeePercentage > 0 ? (
                                    <div className="font-bold text-lg">${(parseFloat(plan.usdMinAmount || '0') + parseFloat(plan.usdMinAmount || '0') * plan.roiPercentage / 100 * (1 - plan.performanceFeePercentage / 100)).toFixed(2)}</div>
                                  ) : (
                                    <div className="font-bold text-lg">${(parseFloat(plan.usdMinAmount || '0') * (1 + plan.roiPercentage / 100)).toFixed(2)}</div>
                                  )}
                                </div>
                              </div>
                              <div className="text-xs opacity-75 mt-2 text-center">
                                {plan.performanceFeePercentage && plan.performanceFeePercentage > 0 
                                  ? `Daily Rate: ${(parseFloat(plan.dailyReturnRate) * 100).toFixed(3)}% | Fee applies to profits only`
                                  : `Daily Rate: ${(parseFloat(plan.dailyReturnRate) * 100).toFixed(3)}% | ${plan.durationDays} days hold`
                                }
                              </div>
                            </div>
                          </div>

                          <Button
                            onClick={() => handleInvest(plan)}
                            disabled={createInvestmentMutation.isPending}
                            className={`w-full bg-white/20 hover:bg-white/30 transition-colors rounded-lg py-3 text-base font-medium border-0 ${getTextColorClass(plan.color)} backdrop-blur-sm`}
                          >
                            {createInvestmentMutation.isPending ? 'Processing...' : 'Invest Now'}
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-orange-600 dark:text-orange-400">Loading investment plans...</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Pending Investments */}
        {pendingInvestments.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-orange-800 dark:text-orange-200 mb-4 flex items-center gap-2">
              <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-500" />
              Pending Investments
            </h2>

            <div className="grid gap-4">
              {pendingInvestments.map((transaction) => (
                <Card key={transaction.id} className="bg-gradient-to-br from-yellow-500/10 via-yellow-600/5 to-yellow-700/10 dark:from-yellow-600/20 dark:via-yellow-700/15 dark:to-yellow-800/20 border border-yellow-400/30 dark:border-yellow-500/30 rounded-2xl shadow-xl shadow-yellow-600/20 backdrop-blur-xl">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />
                        <div>
                          <p className="font-medium text-orange-800 dark:text-orange-200">{formatBitcoin(transaction.amount)} BTC</p>
                          <p className="text-sm text-orange-600 dark:text-orange-400">
                            {formatDate(new Date(transaction.createdAt))}
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-500/30 border-yellow-400/30">
                        Under Review
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-orange-600 dark:text-orange-400">Amount</span>
                        <span className="text-orange-800 dark:text-orange-200 font-medium">{formatBitcoin(transaction.amount)} BTC</span>
                        {currencyPrice && (
                          <div className="text-xs text-orange-500">
                            ≈ {formatCurrency(parseFloat(transaction.amount) * currencyPrice, currency)}
                          </div>
                        )}
                      </div>
                      {transaction.transactionHash && (
                        <div className="flex justify-between text-sm">
                          <span className="text-orange-600 dark:text-orange-400">TX Hash</span>
                          <span className="text-xs text-orange-500 font-mono">
                            {transaction.transactionHash.substring(0, 8)}...{transaction.transactionHash.substring(-8)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 p-2 bg-yellow-500/10 rounded text-xs text-yellow-700 dark:text-yellow-400">
                      💡 Your investment is being verified by our team. This usually takes 1-24 hours.
                    </div>
                  </CardContent>
                </Card>
                ))}
            </div>
          </div>
        )}

        {/* Active Investments */}
        {activeInvestments.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-orange-800 dark:text-orange-200 mb-4 flex items-center gap-2">
              <Zap className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              Active Investments
            </h2>

            <div className="grid gap-4">
              {activeInvestments.map((investment) => {
                const progress = calculateInvestmentProgress(
                  new Date(investment.startDate),
                  new Date(investment.endDate)
                );
                const daysLeft = Math.ceil(
                  (new Date(investment.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                );
                const plan = plans?.find(p => p.id === investment.planId);
                const currentValue = parseFloat(investment.amount) + parseFloat(investment.currentProfit);
                const profitPercentage = ((parseFloat(investment.currentProfit) / parseFloat(investment.amount)) * 100);

                return (
                  <Card key={investment.id} className="bg-gradient-to-br from-orange-500/10 via-orange-600/5 to-orange-700/10 dark:from-orange-600/20 dark:via-orange-700/15 dark:to-orange-800/20 border border-orange-400/30 dark:border-orange-500/30 rounded-2xl shadow-xl shadow-orange-600/20 backdrop-blur-xl">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                          <Badge variant="outline" className="border-orange-400/60 text-orange-700 dark:text-orange-300 bg-orange-100/50 dark:bg-orange-900/30">
                            {plan?.name || 'Investment Plan'}
                          </Badge>
                        </div>
                        <Badge className="bg-green-500/20 text-green-600 dark:text-green-400 hover:bg-green-500/30 border-green-400/30">
                          Active
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-orange-600 dark:text-orange-400 mb-1">Investment Amount</p>
                          <p className="text-sm font-bold text-orange-800 dark:text-orange-200">{formatBitcoin(investment.amount)} BTC</p>
                        </div>
                        <div>
                          <p className="text-xs text-orange-600 dark:text-orange-400 mb-1">Current Profit</p>
                          <p className="text-sm font-bold text-green-700 dark:text-green-400">+{formatBitcoin(investment.currentProfit)} BTC</p>
                        </div>
                        <div>
                          <p className="text-xs text-orange-600 dark:text-orange-400 mb-1">ROI</p>
                          <p className="text-sm font-bold text-orange-700 dark:text-orange-300">{plan?.roiPercentage || 0}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-orange-600 dark:text-orange-400 mb-1">Duration</p>
                          <p className="text-sm font-bold text-orange-800 dark:text-orange-200">{plan?.durationDays || 0} days</p>
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-orange-600 dark:text-orange-400 mb-1">
                          <span>Progress</span>
                          <span>{Math.min(((new Date().getTime() - new Date(investment.startDate).getTime()) / (24 * 60 * 60 * 1000) / (plan?.durationDays || 1)) * 100, 100).toFixed(1)}%</span>
                        </div>
                        <Progress 
                          value={Math.min(((new Date().getTime() - new Date(investment.startDate).getTime()) / (24 * 60 * 60 * 1000) / (plan?.durationDays || 1)) * 100, 100)} 
                          className="h-2"
                        />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Completed Investments */}
        {completedInvestments.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-400" />
              Completed Investments
            </h3>
            <div className="space-y-3">
              {completedInvestments.map((investment) => {
                const finalReturn = ((parseFloat(investment.currentProfit) / parseFloat(investment.amount)) * 100);

                return (
                  <Card key={investment.id} className="dark-card rounded-xl p-4 dark-border opacity-75">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-muted-foreground">{getPlanName(investment.planId)}</h4>
                        <p className="text-muted-foreground text-sm">
                          Completed: {formatDate(new Date(investment.endDate))}
                        </p>
                      </div>
                      <Badge variant="secondary">Completed</Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground block">Invested</span>
                        <span className="text-foreground font-medium">{formatBitcoin(investment.amount)} BTC</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Final Profit</span>
                        <span className="text-green-400 font-medium">+{formatBitcoin(investment.currentProfit)} BTC</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Total Return</span>
                        <span className="text-blue-400 font-medium">+{finalReturn.toFixed(2)}%</span>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Rejected Investments */}
        {rejectedInvestments.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <span className="w-5 h-5 text-red-400">⚠️</span>
              Rejected Investments
            </h3>
            <div className="space-y-3">
              {rejectedInvestments.map((transaction) => (
                <Card key={transaction.id} className="dark-card rounded-xl p-4 dark-border border-red-500/20 opacity-75">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-red-400">{getPlanName(transaction.planId || 1)}</h4>
                      <p className="text-muted-foreground text-sm">
                        Rejected: {transaction.confirmedAt ? formatDate(new Date(transaction.confirmedAt)) : 'Recently'}
                      </p>
                    </div>
                    <Badge variant="destructive">Rejected</Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Amount</span>
                      <span className="text-foreground">{formatBitcoin(transaction.amount)} BTC</span>
                      {currencyPrice && (
                        <div className="text-xs text-muted-foreground">
                          ≈ {formatCurrency(parseFloat(transaction.amount) * currencyPrice, currency)}
                        </div>
                      )}
                    </div>
                    {transaction.notes && (
                      <div className="bg-red-500/10 p-3 rounded border border-red-500/20">
                        <span className="text-red-400 font-medium text-sm">Reason: </span>
                        <span className="text-muted-foreground text-sm">{transaction.notes}</span>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {(!investments || investments.length === 0) && pendingInvestments.length === 0 && (
          <div className="text-center py-12">
            <div className="w-20 h-20 rounded-full bg-bitcoin/10 flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-10 h-10 text-bitcoin" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-white">Start Your Investment Journey</h3>
            <p className="text-gray-300 mb-6 max-w-md mx-auto">
              Choose from our carefully crafted investment plans designed to maximize your Bitcoin returns with automated profit generation.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Badge variant="outline" className="border-bitcoin text-bitcoin">
                ⚡ 10-minute profit updates
              </Badge>
              <Badge variant="outline" className="border-green-500 text-green-400">
                🔒 Secure & automated
              </Badge>
              <Badge variant="outline" className="border-blue-500 text-blue-400">
                📈 Real-time tracking
              </Badge>
            </div>
          </div>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
}