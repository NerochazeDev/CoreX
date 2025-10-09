import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import type { InvestmentPlan } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { formatBitcoin, formatCurrency, calculateCurrencyValue } from "@/lib/utils";
import { TrendingUp, Clock, Target, Shield, Star, Zap } from "lucide-react";
import { useBitcoinPrice } from "@/hooks/use-bitcoin-price";
import { useCurrency } from "@/hooks/use-currency";

export function InvestmentPlans() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: bitcoinPrice } = useBitcoinPrice();
  const { currency } = useCurrency();

  const { data: plans, isLoading } = useQuery<InvestmentPlan[]>({
    queryKey: ['/api/investment-plans'],
  });

  const createInvestmentMutation = useMutation({
    mutationFn: async ({ planId, amount }: { planId: number; amount: string }) => {
      const response = await fetch('/api/invest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  const handleInvest = (plan: InvestmentPlan) => {
    if (!user) return;
    
    // For simplicity, invest the minimum amount since returns are clearly shown
    const confirmed = confirm(
      `Invest in ${plan.name}?\n\n` +
      `Investment: ${formatBitcoin(plan.minAmount)} BTC\n` +
      `Profit: +${formatBitcoin((parseFloat(plan.minAmount) * plan.roiPercentage / 100).toString())} BTC\n` +
      `Total Return: ${formatBitcoin((parseFloat(plan.minAmount) * (1 + plan.roiPercentage / 100)).toString())} BTC\n\n` +
      `Duration: ${plan.durationDays} days\n` +
      `Daily Rate: ${(parseFloat(plan.dailyReturnRate) * 100).toFixed(3)}% per day\n\n` +
      `Proceed with investment?`
    );
    
    if (confirmed) {
      createInvestmentMutation.mutate({
        planId: plan.id,
        amount: plan.minAmount,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="px-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-foreground">Investment Plans</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="neo-card rounded-xl p-4 animate-pulse">
              <div className="h-20 bg-muted rounded"></div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const getGradientClass = (color: string) => {
    // Map hex colors to Tailwind classes
    const colorMap: Record<string, string> = {
      '#8B5CF6': 'bg-gradient-to-r from-purple-500 to-purple-600',
      '#EC4899': 'bg-gradient-to-r from-pink-500 to-pink-600',
      '#14B8A6': 'bg-gradient-to-r from-teal-500 to-teal-600',
      '#3B82F6': 'bg-gradient-to-r from-blue-500 to-blue-600',
      '#10B981': 'bg-gradient-to-r from-emerald-500 to-emerald-600',
      '#F59E0B': 'bg-gradient-to-r from-amber-500 to-amber-600',
      'orange': 'bg-gradient-to-r from-yellow-600 to-yellow-500',
      'gray': 'bg-gradient-to-r from-gray-600 to-gray-500',
      'gold': 'bg-gradient-to-r from-yellow-500 to-yellow-400',
    };
    return colorMap[color] || 'bg-gradient-to-r from-gray-600 to-gray-500';
  };

  const getTextColorClass = (color: string) => {
    switch (color) {
      case 'gold':
        return 'text-yellow-900';
      default:
        return 'text-white';
    }
  };

  return (
    <div className="px-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-foreground">Investment Plans</h3>
      </div>
      
      <div className="space-y-3">
        {plans?.map((plan) => (
          <Card key={plan.id} className={`${getGradientClass(plan.color)} rounded-xl p-4 relative overflow-hidden border-0 bg-opacity-20 backdrop-blur-lg`}>
            <div className="absolute top-0 right-0 w-16 h-16 bg-white opacity-5 rounded-full -translate-y-8 translate-x-8"></div>
            <div className="absolute inset-0 bg-white/10 backdrop-blur-md"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className={`font-semibold ${getTextColorClass(plan.color)}`}>
                    {plan.name}
                  </h4>
                  <div className={`text-sm opacity-80 ${getTextColorClass(plan.color)}`}>
                    {plan.usdMinAmount ? (
                      <>
                        <p className="font-medium">Min: ${plan.usdMinAmount}</p>
                        <p className="text-xs">≈ {formatBitcoin(plan.minAmount)} BTC</p>
                      </>
                    ) : (
                      <>
                        <p>Min: {formatBitcoin(plan.minAmount)} BTC</p>
                        {bitcoinPrice && (
                          <p className="text-xs">
                            ≈ {formatCurrency(
                              calculateCurrencyValue(
                                plan.minAmount, 
                                currency === 'USD' ? bitcoinPrice.usd.price : 
                                currency === 'GBP' ? bitcoinPrice.gbp.price : 
                                bitcoinPrice.eur.price
                              ), 
                              currency
                            )}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${getTextColorClass(plan.color)}`}>
                    {plan.roiPercentage}%
                  </p>
                  <p className={`text-xs opacity-80 ${getTextColorClass(plan.color)}`}>
                    {plan.durationDays} days
                  </p>
                </div>
              </div>
              
              {/* Expected Returns Section */}
              <div className={`bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-3 mb-3 border border-white/20 ${getTextColorClass(plan.color)}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs opacity-80">Expected Returns:</span>
                  <Target className="w-3 h-3 opacity-80" />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Capital Investment:</span>
                    <div className="text-right">
                      {plan.usdMinAmount ? (
                        <>
                          <div className="font-medium">${plan.usdMinAmount}</div>
                          <div className="text-xs opacity-75">≈ {formatBitcoin(plan.minAmount)} BTC</div>
                        </>
                      ) : (
                        <>
                          <div>{formatBitcoin(plan.minAmount)} BTC</div>
                          {bitcoinPrice && (
                            <div className="text-xs opacity-75">
                              ≈ {formatCurrency(
                                calculateCurrencyValue(
                                  plan.minAmount, 
                                  currency === 'USD' ? bitcoinPrice.usd.price : 
                                  currency === 'GBP' ? bitcoinPrice.gbp.price : 
                                  bitcoinPrice.eur.price
                                ), 
                                currency
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Hold Period:</span>
                    <div className="text-right font-medium">{plan.durationDays} days</div>
                  </div>
                  <div className="flex justify-between text-xs border-t border-white/20 pt-1">
                    <span>Gross Profit ({plan.roiPercentage}%):</span>
                    <div className="text-right text-green-300">
                      {plan.usdMinAmount ? (
                        <>
                          <div className="font-medium">+${(parseFloat(plan.usdMinAmount) * plan.roiPercentage / 100).toFixed(2)}</div>
                          <div className="text-xs opacity-75">Before Fee</div>
                        </>
                      ) : (
                        <>
                          <div>+{formatBitcoin((parseFloat(plan.minAmount) * plan.roiPercentage / 100).toString())} BTC</div>
                          {bitcoinPrice && (
                            <div className="text-xs opacity-75">
                              ≈ +{formatCurrency(
                                calculateCurrencyValue(
                                  (parseFloat(plan.minAmount) * plan.roiPercentage / 100).toString(), 
                                  currency === 'USD' ? bitcoinPrice.usd.price : 
                                  currency === 'GBP' ? bitcoinPrice.gbp.price : 
                                  bitcoinPrice.eur.price
                                ), 
                                currency
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  {plan.usdMinAmount && plan.performanceFeePercentage && plan.performanceFeePercentage > 0 && (
                    <>
                      <div className="flex justify-between text-xs text-yellow-300">
                        <span>Performance Fee ({plan.performanceFeePercentage}%):</span>
                        <div className="text-right">
                          <div className="font-medium">-${(parseFloat(plan.usdMinAmount) * plan.roiPercentage / 100 * plan.performanceFeePercentage / 100).toFixed(2)}</div>
                          <div className="text-xs opacity-75">On Profit Only</div>
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-green-400 border-t border-white/20 pt-1">
                        <span className="font-semibold">Net Profit:</span>
                        <div className="text-right">
                          <div className="font-bold">+${(parseFloat(plan.usdMinAmount) * plan.roiPercentage / 100 * (1 - plan.performanceFeePercentage / 100)).toFixed(2)}</div>
                          <div className="text-xs opacity-75">After {plan.performanceFeePercentage}% Fee</div>
                        </div>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between text-sm font-semibold border-t border-white border-opacity-20 pt-1 mt-1">
                    <span>Total After Trade:</span>
                    <div className="text-right text-green-300">
                      {plan.usdMinAmount && plan.performanceFeePercentage ? (
                        <>
                          <div className="font-bold text-base">${(parseFloat(plan.usdMinAmount) + parseFloat(plan.usdMinAmount) * plan.roiPercentage / 100 * (1 - plan.performanceFeePercentage / 100)).toFixed(2)}</div>
                          <div className="text-xs opacity-75">Capital + Net Profit</div>
                        </>
                      ) : plan.usdMinAmount ? (
                        <>
                          <div className="font-medium">${(parseFloat(plan.usdMinAmount) * (1 + plan.roiPercentage / 100)).toFixed(2)}</div>
                          <div className="text-xs opacity-75">≈ {formatBitcoin((parseFloat(plan.minAmount) * (1 + plan.roiPercentage / 100)).toString())} BTC</div>
                        </>
                      ) : (
                        <>
                          <div>{formatBitcoin((parseFloat(plan.minAmount) * (1 + plan.roiPercentage / 100)).toString())} BTC</div>
                          {bitcoinPrice && (
                            <div className="text-xs opacity-75">
                              ≈ {formatCurrency(
                                calculateCurrencyValue(
                                  (parseFloat(plan.minAmount) * (1 + plan.roiPercentage / 100)).toString(), 
                                  currency === 'USD' ? bitcoinPrice.usd.price : 
                                  currency === 'GBP' ? bitcoinPrice.gbp.price : 
                                  bitcoinPrice.eur.price
                                ), 
                                currency
                              )}
                            </div>
                          )}
                        </>
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
                className={`w-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all duration-200 rounded-lg py-2 text-sm font-medium border border-white/30 ${getTextColorClass(plan.color)}`}
              >
                {createInvestmentMutation.isPending ? 'Processing...' : 'Invest Now'}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
