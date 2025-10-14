import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BitVaultLogo } from "@/components/bitvault-logo";
import { 
  Shield, TrendingUp, Lock, Zap, ArrowRight, CheckCircle, BarChart3, 
  Wallet, Users, Clock, DollarSign, Star, Award, Target, Activity,
  AlertTriangle, Info, TrendingDown, Calculator, Globe, Smartphone,
  ChevronDown, ExternalLink, Play, Pause, CheckCircle2, XCircle
} from "lucide-react";
import { Link } from "wouter";
import { useBitcoinPrice } from "@/hooks/use-bitcoin-price";
import type { InvestmentPlan } from "@shared/schema";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function Landing() {
  const [selectedPlan, setSelectedPlan] = useState<InvestmentPlan | null>(null);
  const [investAmount, setInvestAmount] = useState<number>(100);
  
  // Fetch Bitcoin price
  const { data: bitcoinPrice } = useBitcoinPrice();
  const btcUsdPrice = bitcoinPrice?.usd?.price || 111100;

  // Fetch investment plans
  const { data: plans, isLoading } = useQuery<InvestmentPlan[]>({
    queryKey: ['/api/investment-plans'],
  });

  const activePlans = plans?.filter(p => p.isActive) || [];

  // Get plan amount in USD
  const getPlanUsdAmount = (plan: InvestmentPlan): number => {
    if (plan.usdMinAmount) {
      return parseFloat(plan.usdMinAmount);
    }
    // Fallback: convert BTC to USD
    return parseFloat(plan.minAmount) * btcUsdPrice;
  };

  // Calculate potential returns based on plan - matches backend logic exactly
  const calculateReturns = (plan: InvestmentPlan, usdAmount: number) => {
    // Use the plan's ROI percentage directly (this is the total return over the duration)
    const grossProfit = usdAmount * (plan.roiPercentage / 100);
    const performanceFee = plan.performanceFeePercentage ? 
      (grossProfit * (plan.performanceFeePercentage / 100)) : 0;
    const netProfit = grossProfit - performanceFee;
    const totalReturn = usdAmount + netProfit;
    
    // Calculate daily profit based on net profit spread over duration
    const dailyProfit = netProfit / plan.durationDays;
    
    return {
      dailyProfit,
      totalProfit: grossProfit,
      performanceFee,
      netProfit,
      totalReturn,
      roi: ((netProfit / usdAmount) * 100).toFixed(2)
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Advanced Header with Ticker */}
      <div className="bg-gradient-to-r from-orange-600 to-amber-600 text-white py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                BTC: ${btcUsdPrice.toLocaleString()}
              </span>
              <span className="hidden sm:flex items-center gap-2">
                <Users className="w-4 h-4" />
                12,847+ Active Investors
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Regulated & Secure</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <BitVaultLogo size="md" showPro={true} />
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
              <a href="#plans" className="text-slate-600 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
                Investment Plans
              </a>
              <a href="#how-it-works" className="text-slate-600 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
                How It Works
              </a>
              <a href="#security" className="text-slate-600 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
                Security
              </a>
              <a href="#faq" className="text-slate-600 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
                FAQ
              </a>
            </nav>
            <div className="flex items-center gap-3">
              <a 
                href="https://t.me/BitVault_PRO" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                data-testid="link-telegram-community"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                </svg>
                <span>Community</span>
              </a>
              <Link href="/login">
                <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg" data-testid="button-signin-header">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - Enhanced */}
      <section className="relative py-20 sm:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-amber-500/10"></div>
        <div className="absolute inset-0 bg-grid-slate-200/50 dark:bg-grid-slate-800/50 [mask-image:linear-gradient(0deg,transparent,black)]"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-5xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 border border-orange-200 dark:border-orange-800 mb-8">
              <Star className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              <span className="text-sm font-semibold bg-gradient-to-r from-orange-700 to-amber-700 dark:from-orange-300 dark:to-amber-300 bg-clip-text text-transparent">
                Licensed & Regulated Investment Platform
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 bg-clip-text text-transparent animate-gradient">
                Professional Bitcoin
              </span>
              <br />
              <span className="text-slate-900 dark:text-white">Investment Solutions</span>
            </h1>

            <p className="text-xl sm:text-2xl text-slate-600 dark:text-slate-300 mb-10 leading-relaxed max-w-4xl mx-auto">
              Institutional-grade cryptocurrency investment platform with <span className="font-semibold text-orange-600">automated trading algorithms</span>, 
              <span className="font-semibold text-orange-600"> bank-level security</span>, and <span className="font-semibold text-orange-600">daily profit distribution</span>. 
              Start with as low as $10.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link href="/login">
                <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white h-16 px-10 text-lg shadow-2xl shadow-orange-500/30 group" data-testid="button-get-started-hero">
                  <span>Start Investing Now</span>
                  <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <a href="#calculator">
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-16 px-10 text-lg border-2 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800" data-testid="button-calculate-returns">
                  <Calculator className="mr-2 w-6 h-6" />
                  <span>Calculate Returns</span>
                </Button>
              </a>
            </div>

            {/* Live Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {[
                { value: "12,847+", label: "Active Investors", icon: <Users className="w-5 h-5" /> },
                { value: "847+ BTC", label: "Total Volume", icon: <BarChart3 className="w-5 h-5" /> },
                { value: "94.7%", label: "Avg. Returns", icon: <TrendingUp className="w-5 h-5" /> },
                { value: "24/7", label: "Support", icon: <Clock className="w-5 h-5" /> }
              ].map((stat, idx) => (
                <Card key={idx} className="border-2 border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur">
                  <CardContent className="pt-6 text-center">
                    <div className="flex justify-center mb-2 text-orange-600 dark:text-orange-400">
                      {stat.icon}
                    </div>
                    <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{stat.value}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">{stat.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Investment Plans - Comprehensive */}
      <section id="plans" className="py-20 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">Investment Opportunities</Badge>
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white mb-6">
              Choose Your Investment Plan
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
              Flexible plans designed for every investor level. All plans include daily profit distribution, real-time analytics, and instant withdrawals.
            </p>
          </div>

          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="pt-6 h-96 bg-slate-100 dark:bg-slate-800"></CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {activePlans.map((plan) => {
                const isPopular = plan.name.includes("$1,000") || plan.name.includes("$500");
                const minUsd = getPlanUsdAmount(plan);
                const returns = calculateReturns(plan, minUsd);
                
                // Ensure ROI matches the plan's actual ROI percentage
                const actualRoi = plan.roiPercentage;
                const netRoi = plan.performanceFeePercentage ? 
                  actualRoi * (1 - plan.performanceFeePercentage / 100) : actualRoi;
                
                return (
                  <Card 
                    key={plan.id} 
                    className={`relative border-2 transition-all hover:scale-105 ${
                      isPopular 
                        ? 'border-orange-500 shadow-2xl shadow-orange-500/25 dark:shadow-orange-500/10' 
                        : 'border-slate-200 dark:border-slate-800 hover:border-orange-400 dark:hover:border-orange-600'
                    }`}
                    data-testid={`card-plan-${plan.id}`}
                  >
                    {isPopular && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                        <Badge className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-1 text-sm font-bold shadow-lg">
                          MOST POPULAR
                        </Badge>
                      </div>
                    )}
                    
                    <CardHeader className="pb-4">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${plan.color || 'bg-gradient-to-br from-orange-500 to-amber-600'} text-white`}>
                        <DollarSign className="w-8 h-8" />
                      </div>
                      <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                      <div className="text-4xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                        ${minUsd.toLocaleString()}
                      </div>
                      <CardDescription className="text-base">
                        {plan.durationDays} Days Investment Period
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Key Metrics */}
                      <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600 dark:text-slate-400">Daily Return Rate</span>
                          <span className="text-lg font-bold text-green-600 dark:text-green-400">
                            {parseFloat(plan.dailyReturnRate).toFixed(4)}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600 dark:text-slate-400">Total ROI</span>
                          <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                            {netRoi.toFixed(2)}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600 dark:text-slate-400">Performance Fee</span>
                          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                            {plan.performanceFeePercentage}%
                          </span>
                        </div>
                      </div>

                      {/* Earnings Preview */}
                      <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                        <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">Estimated Earnings</div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">Daily Profit:</span>
                            <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                              ${returns.dailyProfit.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Total Profit:</span>
                            <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                              ${returns.netProfit.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm font-bold">Total Return:</span>
                            <span className="text-base font-bold text-orange-600 dark:text-orange-400">
                              ${returns.totalReturn.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Features */}
                      <ul className="space-y-2 border-t border-slate-200 dark:border-slate-700 pt-4">
                        {[
                          "Daily automated payouts",
                          "Instant withdrawals",
                          "Real-time analytics",
                          "24/7 customer support"
                        ].map((feature, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <Link href="/login">
                        <Button 
                          className={`w-full mt-4 ${
                            isPopular 
                              ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg' 
                              : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                          data-testid={`button-invest-plan-${plan.id}`}
                        >
                          Start Investing
                          <ArrowRight className="ml-2 w-4 h-4" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Plan Comparison Table */}
          <div className="mt-16">
            <Card className="border-2 border-slate-200 dark:border-slate-800">
              <CardHeader>
                <CardTitle className="text-2xl">Investment Plans Comparison</CardTitle>
                <CardDescription>Compare features across all investment tiers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900 dark:text-white">Feature</th>
                        <th className="text-center py-3 px-4 text-sm font-semibold text-slate-900 dark:text-white">Starter</th>
                        <th className="text-center py-3 px-4 text-sm font-semibold text-slate-900 dark:text-white">Professional</th>
                        <th className="text-center py-3 px-4 text-sm font-semibold text-slate-900 dark:text-white">VIP</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <td className="py-3 px-4 text-sm text-slate-700 dark:text-slate-300">Min. Investment</td>
                        <td className="text-center py-3 px-4 text-sm">$10 - $100</td>
                        <td className="text-center py-3 px-4 text-sm">$300 - $1,000</td>
                        <td className="text-center py-3 px-4 text-sm">$3,000+</td>
                      </tr>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <td className="py-3 px-4 text-sm text-slate-700 dark:text-slate-300">Performance Fee</td>
                        <td className="text-center py-3 px-4 text-sm">10%</td>
                        <td className="text-center py-3 px-4 text-sm">10-20%</td>
                        <td className="text-center py-3 px-4 text-sm">20%</td>
                      </tr>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <td className="py-3 px-4 text-sm text-slate-700 dark:text-slate-300">Daily Payouts</td>
                        <td className="text-center py-3 px-4"><CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" /></td>
                        <td className="text-center py-3 px-4"><CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" /></td>
                        <td className="text-center py-3 px-4"><CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" /></td>
                      </tr>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <td className="py-3 px-4 text-sm text-slate-700 dark:text-slate-300">Instant Withdrawal</td>
                        <td className="text-center py-3 px-4"><CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" /></td>
                        <td className="text-center py-3 px-4"><CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" /></td>
                        <td className="text-center py-3 px-4"><CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" /></td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 text-sm text-slate-700 dark:text-slate-300">Priority Support</td>
                        <td className="text-center py-3 px-4"><XCircle className="w-5 h-5 text-slate-300 dark:text-slate-600 mx-auto" /></td>
                        <td className="text-center py-3 px-4"><CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" /></td>
                        <td className="text-center py-3 px-4"><CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" /></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Returns Calculator */}
      <section id="calculator" className="py-20 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">Investment Calculator</Badge>
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Calculate Your Returns
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              See exactly how much you can earn with our investment plans
            </p>
          </div>

          <Card className="border-2 border-orange-500">
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Select Investment Plan
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {activePlans.slice(0, 6).map((plan) => (
                      <Button
                        key={plan.id}
                        variant={selectedPlan?.id === plan.id ? "default" : "outline"}
                        className={selectedPlan?.id === plan.id ? "bg-orange-600 hover:bg-orange-700" : ""}
                        onClick={() => setSelectedPlan(plan)}
                        data-testid={`button-select-plan-${plan.id}`}
                      >
                        {plan.name}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Investment Amount (USD)
                  </label>
                  <input
                    type="number"
                    value={investAmount}
                    onChange={(e) => setInvestAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                    min={10}
                    placeholder="Enter amount"
                    data-testid="input-investment-amount"
                  />
                </div>

                {selectedPlan && investAmount > 0 && (
                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-lg p-6 border-2 border-orange-200 dark:border-orange-800">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Projected Returns</h3>
                    {(() => {
                      const calc = calculateReturns(selectedPlan, investAmount);
                      return (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center pb-3 border-b border-orange-200 dark:border-orange-800">
                            <span className="text-slate-700 dark:text-slate-300">Initial Investment:</span>
                            <span className="text-xl font-bold text-slate-900 dark:text-white">
                              ${investAmount.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-700 dark:text-slate-300">Daily Profit:</span>
                            <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                              +${calc.dailyProfit.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-700 dark:text-slate-300">Investment Period:</span>
                            <span className="text-lg font-semibold">{selectedPlan.durationDays} days</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-700 dark:text-slate-300">Gross Profit:</span>
                            <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                              +${calc.totalProfit.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-700 dark:text-slate-300">Performance Fee ({selectedPlan.performanceFeePercentage}%):</span>
                            <span className="text-lg font-semibold text-red-600 dark:text-red-400">
                              -${calc.performanceFee.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center pt-3 border-t-2 border-orange-300 dark:border-orange-700">
                            <span className="text-lg font-bold text-slate-900 dark:text-white">Total Return:</span>
                            <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                              ${calc.totalReturn.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-lg font-bold text-slate-900 dark:text-white">Net ROI:</span>
                            <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                              +{((calc.netProfit / investAmount) * 100).toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                    
                    <Link href="/login">
                      <Button className="w-full mt-6 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white h-12" data-testid="button-start-investing-calculator">
                        Start Investing Now
                        <ArrowRight className="ml-2 w-5 h-5" />
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Risk Disclaimer */}
      <section className="py-16 bg-amber-50 dark:bg-amber-950/20 border-y-4 border-amber-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-8 h-8 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Risk Disclosure & Investment Warning</h3>
              <div className="prose prose-amber dark:prose-invert max-w-none text-slate-700 dark:text-slate-300">
                <p className="mb-3">
                  <strong>Cryptocurrency investments carry significant risk.</strong> The value of Bitcoin and other cryptocurrencies can be extremely volatile. 
                  Past performance is not indicative of future results. You should only invest money that you can afford to lose.
                </p>
                <ul className="list-disc pl-6 space-y-2 mb-3">
                  <li>Market volatility may result in the loss of your entire investment principal</li>
                  <li>Returns are not guaranteed and may vary based on market conditions</li>
                  <li>Performance fees are deducted from gross profits as outlined in each plan</li>
                  <li>Early withdrawal may incur penalties as per terms and conditions</li>
                  <li>Regulatory changes may impact the availability of services in your jurisdiction</li>
                </ul>
                <p className="mb-3">
                  <strong>Regulatory Compliance:</strong> BitVault Pro operates in compliance with applicable financial regulations. 
                  By using this platform, you acknowledge that you have read, understood, and agree to our Terms of Service and Risk Disclosure Statement.
                </p>
                <p className="text-sm italic">
                  This platform is intended for informational and educational purposes. Always consult with a qualified financial advisor before making investment decisions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Trust */}
      <section id="security" className="py-20 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">Security First</Badge>
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Bank-Level Security & Protection
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
              Your assets are protected with military-grade encryption and multi-layer security protocols
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {[
              {
                icon: <Shield className="w-10 h-10" />,
                title: "256-bit SSL Encryption",
                description: "All data transmitted through our platform is encrypted with the same technology used by major financial institutions"
              },
              {
                icon: <Lock className="w-10 h-10" />,
                title: "Cold Wallet Storage",
                description: "95% of assets stored in offline cold wallets, protected from online threats and hacking attempts"
              },
              {
                icon: <Activity className="w-10 h-10" />,
                title: "24/7 Monitoring",
                description: "Real-time security monitoring and automated threat detection systems protecting your investments"
              }
            ].map((feature, idx) => (
              <Card key={idx} className="border-2 border-slate-200 dark:border-slate-800 hover:border-green-500 dark:hover:border-green-500 transition-all">
                <CardContent className="pt-6 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-4 mx-auto text-white">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-slate-900 dark:text-white">{feature.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-2 border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Regulated & Compliant</h3>
                  <ul className="space-y-3">
                    {[
                      "Licensed cryptocurrency investment platform",
                      "KYC/AML compliance procedures",
                      "Regular third-party security audits",
                      "Segregated client accounts",
                      "Insurance coverage for digital assets"
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <span className="text-slate-700 dark:text-slate-300">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex justify-center">
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl">
                    <Shield className="w-32 h-32 text-green-600 dark:text-green-400 mx-auto" />
                    <p className="text-center mt-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Trusted by 12,000+ Investors Worldwide
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">Simple Process</Badge>
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Start Investing in 4 Easy Steps
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Get started in minutes and begin earning daily returns
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { 
                step: "1", 
                title: "Create Account", 
                icon: <Users className="w-8 h-8" />,
                description: "Sign up with your email and complete verification in under 2 minutes"
              },
              { 
                step: "2", 
                title: "Choose Plan", 
                icon: <Target className="w-8 h-8" />,
                description: "Select an investment plan that matches your goals and risk tolerance"
              },
              { 
                step: "3", 
                title: "Deposit Funds", 
                icon: <Wallet className="w-8 h-8" />,
                description: "Securely deposit Bitcoin to your investment wallet using our automated system"
              },
              { 
                step: "4", 
                title: "Earn Daily", 
                icon: <Award className="w-8 h-8" />,
                description: "Watch your portfolio grow with automated daily profit distribution"
              }
            ].map((item, idx) => (
              <div key={idx} className="relative">
                <div className="text-center">
                  <div className="relative inline-block mb-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center text-white shadow-xl mx-auto">
                      {item.icon}
                    </div>
                    <div className="absolute -top-2 -right-2 w-10 h-10 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                      {item.step}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">{item.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400">{item.description}</p>
                </div>
                {idx < 3 && (
                  <div className="hidden md:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-orange-500 to-transparent -translate-x-1/2"></div>
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/login">
              <Button size="lg" className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white h-14 px-10 text-lg shadow-xl" data-testid="button-get-started-process">
                Get Started Now
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-white dark:bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">FAQ</Badge>
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Everything you need to know about investing with BitVault Pro
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {[
              {
                question: "How does BitVault Pro generate returns?",
                answer: "BitVault Pro utilizes advanced algorithmic trading strategies, market arbitrage opportunities, and strategic partnerships to generate consistent returns. Our proprietary trading algorithms operate 24/7 across multiple cryptocurrency exchanges, capitalizing on market inefficiencies and price differentials."
              },
              {
                question: "What is the minimum investment amount?",
                answer: "You can start investing with as little as $10. We offer flexible investment plans ranging from $10 to $12,000+, allowing both beginners and experienced investors to participate according to their financial goals and risk tolerance."
              },
              {
                question: "How are profits distributed?",
                answer: "Profits are automatically calculated and distributed daily based on your chosen investment plan's return rate. The earnings are credited directly to your wallet balance and can be withdrawn at any time or reinvested to compound your returns."
              },
              {
                question: "What are performance fees?",
                answer: "Performance fees are charged only on the profits generated, not on your principal investment. Starter plans have a 10% performance fee, while Professional and VIP plans have 10-20% fees. These fees are automatically deducted from your gross profits before distribution."
              },
              {
                question: "Can I withdraw my investment anytime?",
                answer: "Yes, you can withdraw your principal and profits at any time after the minimum investment period. Withdrawals are processed instantly to your Bitcoin wallet. Early withdrawals before the plan duration may incur penalties as outlined in our terms of service."
              },
              {
                question: "Is my investment secure?",
                answer: "Security is our top priority. We employ bank-level 256-bit SSL encryption, store 95% of assets in offline cold wallets, implement multi-signature authorization, and conduct regular third-party security audits. Your investments are protected by multiple layers of security protocols."
              },
              {
                question: "What happens if the market crashes?",
                answer: "While we employ advanced risk management strategies and diversification techniques, cryptocurrency investments carry inherent market risks. Our algorithms are designed to adapt to market conditions, but extreme market volatility may affect returns. We recommend investing only what you can afford to lose."
              },
              {
                question: "Are there any hidden fees?",
                answer: "No, we believe in complete transparency. The only fees are the clearly stated performance fees deducted from your profits. There are no deposit fees, withdrawal fees, or hidden charges. All costs are disclosed upfront in your investment plan details."
              }
            ].map((faq, idx) => (
              <AccordionItem key={idx} value={`item-${idx}`} className="border-2 border-slate-200 dark:border-slate-800 rounded-lg px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  <span className="text-lg font-semibold text-slate-900 dark:text-white">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-slate-600 dark:text-slate-400 pt-2 pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            Ready to Start Your Investment Journey?
          </h2>
          <p className="text-xl sm:text-2xl mb-10 opacity-95 max-w-3xl mx-auto">
            Join thousands of successful investors earning daily returns. Get started in minutes with our secure, 
            regulated platform. No hidden fees, transparent processes, instant withdrawals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/login">
              <Button size="lg" className="w-full sm:w-auto bg-white text-orange-600 hover:bg-slate-100 h-16 px-12 text-lg shadow-2xl font-bold" data-testid="button-create-account-cta">
                Create Free Account
                <ArrowRight className="ml-2 w-6 h-6" />
              </Button>
            </Link>
            <a href="https://t.me/BitVault_PRO" target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-16 px-12 text-lg border-2 border-white text-white hover:bg-white/20 backdrop-blur" data-testid="button-join-community-cta">
                <svg className="mr-2 w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                </svg>
                Join Our Community
              </Button>
            </a>
          </div>
          <p className="mt-8 text-sm opacity-80">
            <Info className="w-4 h-4 inline mr-1" />
            By signing up, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <BitVaultLogo size="md" showPro={true} />
              <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
                Professional Bitcoin investment platform with institutional-grade security and automated trading.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li><a href="#plans" className="hover:text-orange-600 dark:hover:text-orange-400">Investment Plans</a></li>
                <li><a href="#calculator" className="hover:text-orange-600 dark:hover:text-orange-400">Returns Calculator</a></li>
                <li><a href="#security" className="hover:text-orange-600 dark:hover:text-orange-400">Security</a></li>
                <li><a href="#faq" className="hover:text-orange-600 dark:hover:text-orange-400">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li><a href="#" className="hover:text-orange-600 dark:hover:text-orange-400">Terms of Service</a></li>
                <li><a href="#" className="hover:text-orange-600 dark:hover:text-orange-400">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-orange-600 dark:hover:text-orange-400">Risk Disclosure</a></li>
                <li><a href="#" className="hover:text-orange-600 dark:hover:text-orange-400">Compliance</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Connect</h4>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li>
                  <a href="https://t.me/BitVault_PRO" target="_blank" rel="noopener noreferrer" className="hover:text-orange-600 dark:hover:text-orange-400 flex items-center gap-2">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                    </svg>
                    Telegram Community
                  </a>
                </li>
                <li><a href="#" className="hover:text-orange-600 dark:hover:text-orange-400">Support Center</a></li>
                <li><a href="#" className="hover:text-orange-600 dark:hover:text-orange-400">Contact Us</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-200 dark:border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              © 2025 BitVault Pro. All rights reserved. Licensed cryptocurrency investment platform.
            </p>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="border-green-500 text-green-600 dark:text-green-400">
                <Shield className="w-3 h-3 mr-1" />
                SSL Secured
              </Badge>
              <Badge variant="outline" className="border-blue-500 text-blue-600 dark:text-blue-400">
                <CheckCircle className="w-3 h-3 mr-1" />
                Regulated
              </Badge>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
