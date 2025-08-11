import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { InvestmentPlans } from "@/components/investment-plans";
import { BottomNavigation } from "@/components/bottom-navigation";
import type { Investment, InvestmentPlan, Transaction } from "@shared/schema";
import { formatBitcoin, calculateInvestmentProgress, formatDate } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
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

export default function Investment() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { currency } = useCurrency();
  const { data: bitcoinPrice } = useBitcoinPrice();
  const { invalidateQueries } = useQueryClient();


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

  // Auto-refresh investments every 30 seconds
  useEffect(() => {
    if (user?.id) {
      const interval = setInterval(() => {
        invalidateQueries({ queryKey: ['investments', user.id] });
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [user?.id]);

  return (
    <div className="min-h-screen dark-bg">
      {/* Navigation Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b dark-border">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold dark-text">Investment Center</h1>
              <p className="text-muted-foreground text-sm">Portfolio Analytics & Growth</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6 pb-20">
        {/* Portfolio Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-bitcoin" />
              <span className="text-xs text-gray-300">Total Invested</span>
            </div>
            <div className="space-y-1">
              <p className="text-lg font-bold text-white">{formatBitcoin(totalInvested.toString())} BTC</p>
              {currencyPrice && (
                <p className="text-xs text-gray-400">
                  ≈ {currency === 'USD' ? '$' : '£'}{(totalInvested * currencyPrice).toLocaleString()}
                </p>
              )}
            </div>
          </Card>

          <Card className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-xs text-gray-300">Total Profit</span>
            </div>
            <div className="space-y-1">
              <p className="text-lg font-bold text-green-400">+{formatBitcoin(totalProfit.toString())} BTC</p>
              {currencyPrice && (
                <p className="text-xs text-gray-400">
                  ≈ {currency === 'USD' ? '$' : '£'}{(totalProfit * currencyPrice).toLocaleString()}
                </p>
              )}
            </div>
          </Card>

          <Card className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <PieChart className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-gray-300">Portfolio Value</span>
            </div>
            <div className="space-y-1">
              <p className="text-lg font-bold text-white">{formatBitcoin(totalValue.toString())} BTC</p>
              {currencyPrice && (
                <p className="text-xs text-gray-400">
                  ≈ {currency === 'USD' ? '$' : '£'}{(totalValue * currencyPrice).toLocaleString()}
                </p>
              )}
            </div>
          </Card>

          <Card className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-orange-400" />
              <span className="text-xs text-gray-300">ROI</span>
            </div>
            <div className="space-y-1">
              <p className={`text-lg font-bold ${portfolioReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {portfolioReturn >= 0 ? '+' : ''}{portfolioReturn.toFixed(2)}%
              </p>
              <p className="text-xs text-gray-400">
                Avg Daily: {avgDailyReturn.toFixed(3)}%
              </p>
            </div>
          </Card>
        </div>

        {/* Performance Insights */}
        {activeInvestments.length > 0 && (
          <Card className="bg-gray-900/50 backdrop-blur-sm border border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <BarChart3 className="w-5 h-5 text-bitcoin" />
                Performance Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-500/20 rounded-lg border border-green-500/30">
                  <div className="text-2xl font-bold text-green-400">{activeInvestments.length}</div>
                  <div className="text-sm text-gray-300">Active Investments</div>
                </div>
                <div className="text-center p-4 bg-blue-500/20 rounded-lg border border-blue-500/30">
                  <div className="text-2xl font-bold text-blue-400">{completedInvestments.length}</div>
                  <div className="text-sm text-gray-300">Completed</div>
                </div>
                <div className="text-center p-4 bg-orange-500/20 rounded-lg border border-orange-500/30">
                  <div className="text-2xl font-bold text-orange-400">{pendingInvestments.length}</div>
                  <div className="text-sm text-gray-300">Pending Review</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Investment Plans */}
        <InvestmentPlans />

        {/* Pending Investments */}
        {pendingInvestments.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-400" />
              Pending Investments
            </h3>
            <div className="space-y-3">
              {pendingInvestments.map((transaction) => (
                <Card key={transaction.id} className="dark-card rounded-xl p-4 dark-border border-orange-500/20">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-orange-400">{getPlanName(transaction.planId || 1)}</h4>
                      <p className="text-muted-foreground text-sm">
                        Submitted: {formatDate(new Date(transaction.createdAt))}
                      </p>
                    </div>
                    <Badge variant="outline" className="border-orange-500 text-orange-400">
                      Under Review
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Amount</span>
                      <span className="text-foreground font-medium">{formatBitcoin(transaction.amount)} BTC</span>
                    </div>
                    {transaction.transactionHash && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">TX Hash</span>
                        <span className="text-xs text-muted-foreground font-mono">
                          {transaction.transactionHash.substring(0, 8)}...{transaction.transactionHash.substring(-8)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 p-2 bg-orange-500/10 rounded text-xs text-orange-400">
                    💡 Your investment is being verified by our team. This usually takes 1-24 hours.
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Active Investments */}
        {activeInvestments.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              Active Investments
            </h3>
            <div className="space-y-3">
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
                  <Card key={investment.id} className="bg-gray-900/60 backdrop-blur-sm border border-green-500/30 rounded-xl p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-yellow-400 flex items-center gap-2">
                          {getPlanName(investment.planId)}
                          <Award className="w-4 h-4" />
                        </h4>
                        <p className="text-gray-400 text-sm">
                          Started: {formatDate(new Date(investment.startDate))}
                        </p>
                      </div>
                      <Badge className="bg-green-500/30 text-green-300 hover:bg-green-500/40 border-green-500/50">
                        Earning
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <span className="text-xs text-gray-400">Principal</span>
                        <div className="font-semibold text-white">{formatBitcoin(investment.amount)} BTC</div>
                        {currencyPrice && (
                          <div className="text-xs text-gray-500">
                            ≈ {currency === 'USD' ? '$' : '£'}{(parseFloat(investment.amount) * currencyPrice).toLocaleString()}
                          </div>
                        )}
                      </div>
                      <div>
                        <span className="text-xs text-gray-400">Current Profit</span>
                        <div className="font-semibold text-green-400">+{formatBitcoin(investment.currentProfit)} BTC</div>
                        <div className="text-xs text-green-400">+{profitPercentage.toFixed(2)}%</div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-400">Progress</span>
                        <span className="text-white">{progress.toFixed(1)}%</span>
                      </div>
                      <Progress value={progress} className="w-full h-2" />
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400">
                        {daysLeft > 0 ? `${daysLeft} days remaining` : 'Completed'}
                      </span>
                      {plan && (
                        <span className="text-bitcoin">
                          Daily: {(parseFloat(plan.dailyReturnRate) * 100).toFixed(2)}%
                        </span>
                      )}
                    </div>
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
      </div>

      <BottomNavigation />
    </div>
  );
}