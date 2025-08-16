import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import type { InvestmentPlan } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { formatBitcoin } from "@/lib/utils";
import { TrendingUp, Clock, Target, Shield, Star, Zap } from "lucide-react";

export function InvestmentPlans() {
  const { user } = useAuth();
  const { toast } = useToast();

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
    
    // Prompt user for investment amount
    const userAmount = prompt(
      `Enter your investment amount (BTC):\n\n` +
      `Minimum: ${formatBitcoin(plan.minAmount)} BTC\n` +
      `Your Balance: ${formatBitcoin(user.balance)} BTC\n\n` +
      `ROI: ${plan.roiPercentage}% in ${plan.durationDays} days\n` +
      `Example: If you invest 0.001 BTC, you'll receive ${(0.001 * (1 + plan.roiPercentage / 100)).toFixed(8)} BTC total`
    );
    
    if (!userAmount) return;
    
    const amount = parseFloat(userAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid positive number",
        variant: "destructive",
      });
      return;
    }
    
    if (amount < parseFloat(plan.minAmount)) {
      toast({
        title: "Amount Too Low",
        description: `Minimum investment is ${formatBitcoin(plan.minAmount)} BTC`,
        variant: "destructive",
      });
      return;
    }
    
    if (amount > parseFloat(user.balance)) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough BTC for this investment",
        variant: "destructive",
      });
      return;
    }
    
    // Show confirmation with exact calculations
    const profit = amount * plan.roiPercentage / 100;
    const totalReturn = amount + profit;
    
    const confirmed = confirm(
      `Confirm Investment:\n\n` +
      `Plan: ${plan.name}\n` +
      `Amount: ${amount.toFixed(8)} BTC\n` +
      `Duration: ${plan.durationDays} days\n\n` +
      `Expected Returns:\n` +
      `• Initial Investment: ${amount.toFixed(8)} BTC\n` +
      `• Profit (${plan.roiPercentage}%): +${profit.toFixed(8)} BTC\n` +
      `• Total Return: ${totalReturn.toFixed(8)} BTC\n\n` +
      `*Returns are in BTC and independent of price changes*\n\n` +
      `Proceed with investment?`
    );
    
    if (confirmed) {
      createInvestmentMutation.mutate({
        planId: plan.id,
        amount: amount.toFixed(8),
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
    switch (color) {
      case 'orange':
        return 'bg-gradient-to-r from-yellow-600 to-yellow-500';
      case 'gray':
        return 'bg-gradient-to-r from-gray-600 to-gray-500';
      case 'gold':
        return 'bg-gradient-to-r from-yellow-500 to-yellow-400';
      default:
        return 'bg-gradient-to-r from-gray-600 to-gray-500';
    }
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
          <Card key={plan.id} className={`${getGradientClass(plan.color)} rounded-xl p-4 relative overflow-hidden border-0`}>
            <div className="absolute top-0 right-0 w-16 h-16 bg-white opacity-10 rounded-full -translate-y-8 translate-x-8"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className={`font-semibold ${getTextColorClass(plan.color)}`}>
                    {plan.name}
                  </h4>
                  <p className={`text-sm opacity-80 ${getTextColorClass(plan.color)}`}>
                    Min: {formatBitcoin(plan.minAmount)} BTC
                  </p>
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
              
              {/* Investment Details Section */}
              <div className={`bg-white bg-opacity-15 rounded-lg p-3 mb-3 ${getTextColorClass(plan.color)}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs opacity-80">Investment Formula:</span>
                  <Target className="w-3 h-3 opacity-80" />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Minimum Investment:</span>
                    <span>{formatBitcoin(plan.minAmount)} BTC</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>ROI Rate:</span>
                    <span>{plan.roiPercentage}% in {plan.durationDays} days</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Daily Return Rate:</span>
                    <span>{(parseFloat(plan.dailyReturnRate) * 100).toFixed(3)}% per day</span>
                  </div>
                  <div className="border-t border-white border-opacity-20 pt-1 mt-2">
                    <div className="text-xs opacity-90">
                      <div className="font-semibold mb-1">Return Calculation:</div>
                      <div>Your Investment × {plan.roiPercentage}% = Total Profit</div>
                      <div className="text-xs opacity-75 mt-1">
                        *Returns calculated in BTC, independent of price changes
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => handleInvest(plan)}
                disabled={createInvestmentMutation.isPending}
                className={`w-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors rounded-lg py-2 text-sm font-medium border-0 ${getTextColorClass(plan.color)}`}
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
