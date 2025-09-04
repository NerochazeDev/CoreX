import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { InvestmentPlans } from "@/components/investment-plans";
import { BottomNavigation } from "@/components/bottom-navigation";
import type { Investment, InvestmentPlan, Transaction } from "@shared/schema";
import { formatBitcoin, formatBitcoinWithFiat, formatCurrency, calculateInvestmentProgress, formatDate } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { useLocation } from "wouter";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useCurrency } from "@/hooks/use-currency";
// Remove unused import
import { TrendingUp, Target, Clock, Award, ArrowLeft, BarChart3, PieChart, Calendar, DollarSign, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { useBitcoinPrice } from "@/hooks/use-bitcoin-price";
import { BitVaultLogo } from "@/components/bitvault-logo";

export default function Investment() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { currency } = useCurrency();
  const { data: bitcoinPrice } = useBitcoinPrice();

  if (!user) {
    setLocation('/login');
    return null;
  }

  const { data: investments } = useQuery<Investment[]>({
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
    refetchInterval: 5000, // Refresh every 5 seconds for instant updates
    staleTime: 0, // Always consider data stale
    refetchOnWindowFocus: true, // Refetch when window gains focus
  });

  const { data: plans } = useQuery<InvestmentPlan[]>({
    queryKey: ['/api/investment-plans'],
    refetchInterval: 60000, // Refresh every minute
  });

  const { data: transactions } = useQuery<any[]>({
    queryKey: ['/api/transactions'],
    refetchInterval: 5000, // Refresh every 5 seconds
    staleTime: 0, // Always consider data stale
    refetchOnWindowFocus: true, // Refetch when window gains focus
  });

  const getPlanName = (planId: number) => {
    return plans?.find(plan => plan.id === planId)?.name || `Plan ${planId}`;
  };

  const activeInvestments = investments?.filter(inv => inv.isActive === true) || [];
  const completedInvestments = investments?.filter(inv => inv.isActive === false) || [];
  const pendingInvestments = transactions?.filter ? transactions.filter(tx => tx.type === 'investment' && tx.status === 'pending') : [];
  const rejectedInvestments = transactions?.filter ? transactions.filter(tx => tx.type === 'investment' && tx.status === 'rejected') : [];

  // Calculate portfolio statistics
  const totalInvested = investments?.reduce((sum, inv) => sum + parseFloat(inv.amount), 0) || 0;
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/20 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header with Orange Theme */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-gradient-to-r from-white/95 via-orange-50/80 to-white/95 dark:from-gray-900/95 dark:via-orange-900/20 dark:to-gray-900/95 border-b border-orange-200/60 dark:border-orange-700/40 shadow-xl shadow-orange-500/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <div className="flex items-center gap-3 sm:gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 dark:hover:from-orange-800/40 dark:hover:to-orange-700/40 text-orange-700 hover:text-orange-800 dark:text-orange-300 dark:hover:text-orange-200 border border-orange-200/50 dark:border-orange-700/50 shadow-md transition-all duration-200">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent truncate">
                  Investment Center
                </h1>
                <p className="text-xs sm:text-sm text-orange-600/80 dark:text-orange-400/80 font-medium truncate">
                  Portfolio Analytics & Growth
                </p>
              </div>
            </div>
          </div>
        </div>
      </nav>

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
                      {currencyPrice ? formatBitcoinWithFiat(totalInvested.toString(), currencyPrice, currency, { compact: true }) : `${formatBitcoin(totalInvested.toString())} BTC`}
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
                      +{currencyPrice ? formatBitcoinWithFiat(totalProfit.toString(), currencyPrice, currency, { compact: true }) : `${formatBitcoin(totalProfit.toString())} BTC`}
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
                      {currencyPrice ? formatBitcoinWithFiat(totalValue.toString(), currencyPrice, currency, { compact: true }) : `${formatBitcoin(totalValue.toString())} BTC`}
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
                  <div className="w-10 h-10 sm:w-12 h-12 bg-gradient-to-br from-orange-400/30 to-orange-500/40 dark:from-orange-500/30 dark:to-orange-600/40 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30">
                    <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-orange-700 dark:text-orange-300" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Modern Performance Insights */}
        {activeInvestments.length > 0 && (
          <Card className="bg-card/50 backdrop-blur-lg border border-border shadow-lg rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-foreground">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-primary" />
                </div>
                Performance Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center p-4 sm:p-6 bg-green-500/10 rounded-xl border border-green-500/20">
                  <div className="text-2xl sm:text-3xl font-bold text-green-500">{activeInvestments.length}</div>
                  <div className="text-sm text-muted-foreground mt-1">Active Investments</div>
                </div>
                <div className="text-center p-4 sm:p-6 bg-blue-500/10 rounded-xl border border-blue-500/20">
                  <div className="text-2xl sm:text-3xl font-bold text-blue-500">{completedInvestments.length}</div>
                  <div className="text-sm text-muted-foreground mt-1">Completed</div>
                </div>
                <div className="text-center p-4 sm:p-6 bg-orange-500/10 rounded-xl border border-orange-500/20">
                  <div className="text-2xl sm:text-3xl font-bold text-orange-500">{pendingInvestments.length}</div>
                  <div className="text-sm text-muted-foreground mt-1">Pending Review</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Investment Plans */}
        <InvestmentPlans />

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