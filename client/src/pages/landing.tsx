import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BitVaultLogo } from "@/components/bitvault-logo";
import {
  Shield, TrendingUp, Lock, Zap, ArrowRight, CheckCircle, BarChart3,
  Wallet, Users, Clock, DollarSign, Star, Award, Target, Activity,
  AlertTriangle, Info, Calculator, ChevronDown, CheckCircle2, XCircle,
  Bitcoin, Flame, Crown, Gem
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

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: "easeOut", delay: i * 0.1 },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

function getPlanTier(usdAmount: number) {
  if (usdAmount <= 50)
    return { label: "Starter", color: "from-slate-400 to-slate-600", badge: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300", ring: "ring-slate-300 dark:ring-slate-700", icon: <Target className="w-5 h-5" /> };
  if (usdAmount <= 300)
    return { label: "Silver", color: "from-blue-400 to-blue-600", badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300", ring: "ring-blue-300 dark:ring-blue-700", icon: <TrendingUp className="w-5 h-5" /> };
  if (usdAmount <= 1000)
    return { label: "Gold", color: "from-orange-400 to-amber-500", badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300", ring: "ring-orange-400 dark:ring-orange-600", icon: <Star className="w-5 h-5" /> };
  if (usdAmount <= 3000)
    return { label: "Platinum", color: "from-purple-500 to-violet-600", badge: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300", ring: "ring-purple-400 dark:ring-purple-600", icon: <Gem className="w-5 h-5" /> };
  return { label: "VIP", color: "from-rose-500 to-orange-500", badge: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300", ring: "ring-rose-400 dark:ring-rose-600", icon: <Crown className="w-5 h-5" /> };
}

function getPlanUsdAmount(plan: InvestmentPlan): number {
  if (plan.usdMinAmount) return parseFloat(plan.usdMinAmount);
  return 0;
}

function calculateReturns(plan: InvestmentPlan, usdAmount: number) {
  const grossProfit = usdAmount * (plan.roiPercentage / 100);
  const performanceFee = plan.performanceFeePercentage
    ? grossProfit * (plan.performanceFeePercentage / 100)
    : 0;
  const netProfit = grossProfit - performanceFee;
  const totalReturn = usdAmount + netProfit;
  const dailyProfit = netProfit / plan.durationDays;
  const netRoi = (netProfit / usdAmount) * 100;
  return { grossProfit, performanceFee, netProfit, totalReturn, dailyProfit, netRoi };
}

export default function Landing() {
  const [selectedPlan, setSelectedPlan] = useState<InvestmentPlan | null>(null);
  const [investAmount, setInvestAmount] = useState<number>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: bitcoinPrice } = useBitcoinPrice();
  const btcUsdPrice = bitcoinPrice?.usd?.price || 77000;

  const { data: plans, isLoading } = useQuery<InvestmentPlan[]>({
    queryKey: ["/api/investment-plans"],
  });

  const activePlans = plans?.filter((p) => p.isActive) || [];

  useEffect(() => {
    if (activePlans.length > 0 && !selectedPlan) {
      const defaultPlan = activePlans.find(p => getPlanUsdAmount(p) === 100) || activePlans[3] || activePlans[0];
      setSelectedPlan(defaultPlan);
      setInvestAmount(getPlanUsdAmount(defaultPlan));
    }
  }, [activePlans.length]);

  const calcResult = selectedPlan && investAmount > 0
    ? calculateReturns(selectedPlan, investAmount)
    : null;

  const featuredPlanId = activePlans.find(p => getPlanUsdAmount(p) === 1000)?.id ||
    activePlans[activePlans.length > 6 ? 6 : 0]?.id;

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0f] text-slate-900 dark:text-white overflow-x-hidden">

      {/* Top ticker */}
      <div className="bg-gradient-to-r from-orange-600 via-amber-500 to-orange-600 text-white py-2 text-sm">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 font-semibold">
              <Bitcoin className="w-4 h-4" />
              BTC: ${btcUsdPrice.toLocaleString()}
            </span>
            <span className="hidden sm:flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              12,847+ Active Investors
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline font-medium">Regulated & Secure</span>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/90 dark:bg-[#0a0a0f]/90 border-b border-slate-200/80 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <BitVaultLogo size="md" showPro={true} />
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
            {[
              { label: "Investment Plans", href: "#plans" },
              { label: "How It Works", href: "#how-it-works" },
              { label: "Calculator", href: "#calculator" },
              { label: "Security", href: "#security" },
              { label: "FAQ", href: "#faq" },
            ].map((item) => (
              <a key={item.label} href={item.href}
                className="text-slate-600 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
                {item.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <a href="https://t.me/BitVault_PRO" target="_blank" rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              data-testid="link-telegram-community">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
              </svg>
              Community
            </a>
            <Link href="/login">
              <Button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/25 rounded-xl" data-testid="button-signin-header">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ═══════════════════ HERO ═══════════════════ */}
      <section className="relative pt-24 pb-32 overflow-hidden">
        {/* Background glows */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-orange-500/10 dark:bg-orange-500/5 blur-[120px]" />
          <div className="absolute top-20 right-0 w-[500px] h-[500px] rounded-full bg-amber-400/10 dark:bg-amber-500/5 blur-[100px]" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-orange-600/5 dark:bg-orange-600/5 blur-[120px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div className="text-center max-w-5xl mx-auto" variants={stagger} initial="hidden" animate="visible">

            <motion.div variants={fadeUp} custom={0}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-orange-200 dark:border-orange-800/50 bg-orange-50 dark:bg-orange-900/20 mb-8">
              <motion.span animate={{ rotate: [0, 360] }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }}>
                <Star className="w-3.5 h-3.5 text-orange-500" />
              </motion.span>
              <span className="text-xs font-semibold tracking-wide text-orange-700 dark:text-orange-300 uppercase">
                Licensed & Regulated Investment Platform
              </span>
            </motion.div>

            <motion.h1 variants={fadeUp} custom={1}
              className="text-5xl sm:text-6xl lg:text-[80px] font-black leading-[1.05] tracking-tight mb-6">
              <span className="bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500 bg-clip-text text-transparent">
                Professional Bitcoin
              </span>
              <br />
              <span className="text-slate-900 dark:text-white">Investment Solutions</span>
            </motion.h1>

            <motion.p variants={fadeUp} custom={2}
              className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-3xl mx-auto leading-relaxed">
              Institutional-grade cryptocurrency investment platform with{" "}
              <span className="text-orange-600 dark:text-orange-400 font-semibold">automated trading algorithms</span>,{" "}
              <span className="text-orange-600 dark:text-orange-400 font-semibold">bank-level security</span>, and{" "}
              <span className="text-orange-600 dark:text-orange-400 font-semibold">daily profit distribution</span>.
              Start with as low as $10.
            </motion.p>

            <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link href="/login">
                <Button size="lg" className="w-full sm:w-auto h-14 px-10 text-base font-semibold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-2xl shadow-orange-500/30 rounded-xl group"
                  data-testid="button-get-started-hero">
                  Start Investing Now
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <a href="#calculator">
                <Button size="lg" variant="outline"
                  className="w-full sm:w-auto h-14 px-10 text-base font-semibold border-2 border-slate-300 dark:border-white/10 hover:border-orange-400 dark:hover:border-orange-500/50 hover:bg-orange-50 dark:hover:bg-orange-500/5 rounded-xl"
                  data-testid="button-calculate-returns">
                  <Calculator className="mr-2 w-5 h-5" />
                  Calculate Returns
                </Button>
              </a>
            </motion.div>

            {/* Stat cards */}
            <motion.div variants={stagger} className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {[
                { value: "12,847+", label: "Active Investors", icon: <Users className="w-5 h-5" /> },
                { value: "847+ BTC", label: "Total Volume", icon: <BarChart3 className="w-5 h-5" /> },
                { value: "94.7%", label: "Avg. Returns", icon: <TrendingUp className="w-5 h-5" /> },
                { value: "24/7", label: "Live Support", icon: <Clock className="w-5 h-5" /> },
              ].map((stat, i) => (
                <motion.div key={i} variants={fadeUp} custom={i}
                  className="rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-white/[0.03] backdrop-blur p-5 text-center shadow-sm hover:shadow-orange-500/10 hover:border-orange-300 dark:hover:border-orange-500/30 transition-all">
                  <div className="flex justify-center mb-2 text-orange-500">{stat.icon}</div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════ INVESTMENT PLANS ═══════════════════ */}
      <section id="plans" className="py-24 bg-slate-50 dark:bg-[#080810]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center mb-16" variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <motion.div variants={fadeUp}>
              <Badge className="mb-4 bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 border-0 px-4 py-1 text-xs font-semibold uppercase tracking-widest">
                Investment Opportunities
              </Badge>
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-4xl sm:text-5xl font-black mb-4">
              Choose Your <span className="bg-gradient-to-r from-orange-500 to-amber-400 bg-clip-text text-transparent">Investment Plan</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
              Flexible tiers designed for every investor level — all with daily payouts, real-time analytics, and instant withdrawals.
            </motion.p>
          </motion.div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-72 rounded-2xl bg-slate-200 dark:bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
              variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              {activePlans.map((plan) => {
                const minUsd = getPlanUsdAmount(plan);
                const tier = getPlanTier(minUsd);
                const returns = calculateReturns(plan, minUsd);
                const isFeatured = plan.id === featuredPlanId;
                const netRoi = plan.roiPercentage * (1 - (plan.performanceFeePercentage || 0) / 100);

                return (
                  <motion.div key={plan.id} variants={fadeUp}
                    className={`relative rounded-2xl border-2 transition-all duration-300 overflow-hidden group
                      ${isFeatured
                        ? "border-orange-500 dark:border-orange-500 shadow-2xl shadow-orange-500/20"
                        : "border-slate-200 dark:border-white/8 hover:border-orange-400 dark:hover:border-orange-500/40"
                      } bg-white dark:bg-[#111118]`}
                    data-testid={`card-plan-${plan.id}`}>

                    {isFeatured && (
                      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500" />
                    )}

                    <div className={`absolute inset-x-0 bottom-0 h-32 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-t ${tier.color.replace("from-", "from-").replace("to-", "to-")}/5 to-transparent pointer-events-none`} />

                    {isFeatured && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                        <span className="bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg">
                          MOST POPULAR
                        </span>
                      </div>
                    )}

                    <div className="p-6">
                      {/* Tier badge + icon */}
                      <div className="flex items-center justify-between mb-5">
                        <div className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${tier.badge}`}>
                          {tier.icon}
                          {tier.label}
                        </div>
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tier.color} flex items-center justify-center text-white shadow-lg`}>
                          <DollarSign className="w-5 h-5" />
                        </div>
                      </div>

                      <div className="mb-1 text-sm font-medium text-slate-500 dark:text-slate-400">{plan.name}</div>
                      <div className="text-4xl font-black text-slate-900 dark:text-white mb-1">
                        ${minUsd.toLocaleString()}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-500 mb-5">
                        {plan.durationDays}-day investment period
                      </div>

                      <div className="space-y-2.5 mb-5">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500 dark:text-slate-400">Daily Rate</span>
                          <span className="font-bold text-green-600 dark:text-green-400">
                            {parseFloat(plan.dailyReturnRate).toFixed(4)}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500 dark:text-slate-400">Net ROI</span>
                          <span className="font-bold text-orange-600 dark:text-orange-400">
                            {netRoi.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500 dark:text-slate-400">Perf. Fee</span>
                          <span className="font-semibold">{plan.performanceFeePercentage}%</span>
                        </div>
                        <div className="h-px bg-slate-100 dark:bg-white/5" />
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500 dark:text-slate-400">Daily Profit</span>
                          <span className="font-bold text-green-600 dark:text-green-400">
                            +${returns.dailyProfit.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-semibold text-slate-700 dark:text-slate-200">Total Return</span>
                          <span className="font-black text-orange-600 dark:text-orange-400">
                            ${returns.totalReturn.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <Link href="/login">
                        <Button
                          className={`w-full rounded-xl text-sm font-semibold ${isFeatured
                            ? "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/25"
                            : "bg-slate-100 dark:bg-white/5 hover:bg-orange-50 dark:hover:bg-orange-500/10 text-slate-800 dark:text-white hover:text-orange-700 dark:hover:text-orange-400"
                            }`}
                          data-testid={`button-invest-plan-${plan.id}`}>
                          Get Started <ArrowRight className="ml-1.5 w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* Compact All-Plans Reference Table */}
          {!isLoading && activePlans.length > 0 && (
            <motion.div className="mt-16 rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-[#111118] overflow-hidden"
              initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
              <div className="px-6 py-5 border-b border-slate-100 dark:border-white/5">
                <h3 className="text-lg font-bold">All Plans at a Glance</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Complete comparison across all investment tiers</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-white/[0.02]">
                    <tr>
                      {["Plan", "Min. Investment", "Duration", "Daily Rate", "Net ROI", "Daily Profit", "Total Return", "Perf. Fee"].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {activePlans.map((plan, i) => {
                      const minUsd = getPlanUsdAmount(plan);
                      const tier = getPlanTier(minUsd);
                      const returns = calculateReturns(plan, minUsd);
                      const netRoi = plan.roiPercentage * (1 - (plan.performanceFeePercentage || 0) / 100);
                      return (
                        <tr key={plan.id} className={`border-t border-slate-100 dark:border-white/5 hover:bg-orange-50/50 dark:hover:bg-orange-500/5 transition-colors ${i % 2 === 0 ? "" : "bg-slate-50/50 dark:bg-white/[0.01]"}`}>
                          <td className="px-4 py-3 font-semibold whitespace-nowrap flex items-center gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${tier.badge} font-medium`}>{tier.label}</span>
                            {plan.name}
                          </td>
                          <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">${minUsd.toLocaleString()}</td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{plan.durationDays}d</td>
                          <td className="px-4 py-3 text-green-600 dark:text-green-400 font-semibold">{parseFloat(plan.dailyReturnRate).toFixed(4)}%</td>
                          <td className="px-4 py-3 text-orange-600 dark:text-orange-400 font-bold">{netRoi.toFixed(1)}%</td>
                          <td className="px-4 py-3 text-green-600 dark:text-green-400 font-semibold">+${returns.dailyProfit.toFixed(2)}</td>
                          <td className="px-4 py-3 text-orange-600 dark:text-orange-400 font-bold">${returns.totalReturn.toFixed(2)}</td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{plan.performanceFeePercentage}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* ═══════════════════ CALCULATOR ═══════════════════ */}
      <section id="calculator" className="py-24 bg-white dark:bg-[#0a0a0f]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center mb-12" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <Badge className="mb-4 bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 border-0 px-4 py-1 text-xs font-semibold uppercase tracking-widest">
              Returns Calculator
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-black mb-4">
              Calculate Your <span className="bg-gradient-to-r from-orange-500 to-amber-400 bg-clip-text text-transparent">Returns</span>
            </h2>
            <p className="text-lg text-slate-500 dark:text-slate-400">
              See exactly how much you can earn with any plan
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 gap-0 rounded-3xl border border-slate-200 dark:border-white/5 overflow-hidden shadow-2xl shadow-slate-200/80 dark:shadow-black/40"
            initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>

            {/* Left: Inputs */}
            <div className="bg-white dark:bg-[#111118] p-8 space-y-7">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                  Select Investment Plan
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
                  {activePlans.map((plan) => {
                    const minUsd = getPlanUsdAmount(plan);
                    const tier = getPlanTier(minUsd);
                    const isSelected = selectedPlan?.id === plan.id;
                    return (
                      <button
                        key={plan.id}
                        onClick={() => {
                          setSelectedPlan(plan);
                          setInvestAmount(minUsd);
                        }}
                        data-testid={`button-select-plan-${plan.id}`}
                        className={`text-xs font-semibold px-3 py-2.5 rounded-xl border-2 transition-all text-left ${isSelected
                          ? "border-orange-500 bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400"
                          : "border-slate-200 dark:border-white/8 hover:border-orange-300 dark:hover:border-orange-500/30 text-slate-700 dark:text-slate-300"
                          }`}>
                        <div className={`text-[10px] font-bold mb-0.5 ${isSelected ? "text-orange-500" : "text-slate-400"}`}>{tier.label}</div>
                        ${minUsd.toLocaleString()}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Investment Amount (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">$</span>
                  <input
                    type="number"
                    value={investAmount}
                    onChange={(e) => setInvestAmount(parseFloat(e.target.value) || 0)}
                    className="w-full pl-8 pr-4 py-3.5 border-2 border-slate-200 dark:border-white/8 rounded-xl bg-white dark:bg-white/[0.03] text-slate-900 dark:text-white focus:border-orange-500 dark:focus:border-orange-500 outline-none transition-all text-lg font-semibold"
                    min={10}
                    placeholder="Enter amount"
                    data-testid="input-investment-amount"
                  />
                </div>
                {selectedPlan && investAmount < getPlanUsdAmount(selectedPlan) && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5">
                    Minimum for this plan: ${getPlanUsdAmount(selectedPlan).toLocaleString()}
                  </p>
                )}
              </div>

              {selectedPlan && (
                <div className="rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Plan</span>
                    <span className="font-semibold">{selectedPlan.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Duration</span>
                    <span className="font-semibold">{selectedPlan.durationDays} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Daily Rate</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">{parseFloat(selectedPlan.dailyReturnRate).toFixed(4)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Gross ROI</span>
                    <span className="font-semibold text-orange-600 dark:text-orange-400">{selectedPlan.roiPercentage}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Performance Fee</span>
                    <span className="font-semibold">{selectedPlan.performanceFeePercentage}%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Results */}
            <div className="bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 p-8 flex flex-col justify-between">
              <div>
                <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Projected Returns
                </h3>

                {calcResult && investAmount > 0 ? (
                  <div className="space-y-4">
                    <div className="bg-white/10 backdrop-blur rounded-2xl p-4 text-white space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="opacity-80">Initial Investment</span>
                        <span className="font-bold">${investAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="opacity-80">Daily Profit</span>
                        <span className="font-bold text-white">+${calcResult.dailyProfit.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="opacity-80">Gross Profit</span>
                        <span className="font-bold">+${calcResult.grossProfit.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="opacity-80">Performance Fee ({selectedPlan?.performanceFeePercentage}%)</span>
                        <span className="font-bold text-white/60">−${calcResult.performanceFee.toFixed(2)}</span>
                      </div>
                      <div className="h-px bg-white/20" />
                      <div className="flex justify-between text-sm">
                        <span className="font-bold">Net Profit</span>
                        <span className="font-black text-white">+${calcResult.netProfit.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Big numbers */}
                    <div className="bg-white/15 backdrop-blur rounded-2xl p-5 text-white text-center">
                      <div className="text-xs font-semibold uppercase tracking-widest opacity-70 mb-1">Total Return After {selectedPlan?.durationDays} Days</div>
                      <div className="text-4xl font-black">${calcResult.totalReturn.toFixed(2)}</div>
                      <div className="mt-2 flex items-center justify-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-lg font-bold">+{calcResult.netRoi.toFixed(2)}% Net ROI</span>
                      </div>
                    </div>

                    {/* BTC equivalent */}
                    <div className="text-center text-white/70 text-xs">
                      ≈ {(investAmount / btcUsdPrice).toFixed(8)} BTC at current price (${btcUsdPrice.toLocaleString()}/BTC)
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-white/60 py-12">
                    <Calculator className="w-12 h-12 mx-auto mb-3 opacity-40" />
                    <p>Select a plan and enter an amount to see your projected returns</p>
                  </div>
                )}
              </div>

              <Link href="/login">
                <Button className="w-full mt-6 bg-white text-orange-600 hover:bg-orange-50 font-bold h-12 rounded-xl shadow-xl"
                  data-testid="button-start-investing-calculator">
                  Start Investing Now
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════ HOW IT WORKS ═══════════════════ */}
      <section id="how-it-works" className="py-24 bg-slate-50 dark:bg-[#080810]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center mb-16" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <Badge className="mb-4 bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-0 px-4 py-1 text-xs font-semibold uppercase tracking-widest">
              Simple Process
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-black mb-4">
              Start in <span className="bg-gradient-to-r from-orange-500 to-amber-400 bg-clip-text text-transparent">4 Easy Steps</span>
            </h2>
            <p className="text-lg text-slate-500 dark:text-slate-400">Get started in minutes and begin earning daily returns</p>
          </motion.div>

          <motion.div className="grid md:grid-cols-4 gap-6" variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            {[
              { step: "01", title: "Create Account", icon: <Users className="w-7 h-7" />, description: "Sign up with your email and complete verification in under 2 minutes" },
              { step: "02", title: "Choose Plan", icon: <Target className="w-7 h-7" />, description: "Select an investment plan that matches your goals and risk tolerance" },
              { step: "03", title: "Deposit Funds", icon: <Wallet className="w-7 h-7" />, description: "Securely deposit BTC or USDT to your investment wallet" },
              { step: "04", title: "Earn Daily", icon: <Award className="w-7 h-7" />, description: "Watch your portfolio grow with automated daily profit distribution" },
            ].map((item, i) => (
              <motion.div key={i} variants={fadeUp} custom={i}
                className="relative bg-white dark:bg-[#111118] rounded-2xl border border-slate-200 dark:border-white/5 p-6 text-center hover:border-orange-300 dark:hover:border-orange-500/30 transition-all hover:shadow-lg hover:shadow-orange-500/5">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-xs font-black bg-gradient-to-r from-orange-500 to-amber-500 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg">
                  {item.step.slice(1)}
                </div>
                <div className="w-16 h-16 mx-auto mb-4 mt-2 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                  {item.icon}
                </div>
                <h3 className="text-base font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{item.description}</p>
                {i < 3 && (
                  <div className="hidden md:block absolute top-10 -right-3 z-10">
                    <ArrowRight className="w-5 h-5 text-orange-400" />
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>

          <div className="text-center mt-10">
            <Link href="/login">
              <Button size="lg" className="h-14 px-10 font-semibold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-xl shadow-orange-500/20 rounded-xl"
                data-testid="button-get-started-process">
                Get Started Now <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════ TRC20 / USDT SECTION ═══════════════════ */}
      <section className="py-24 bg-white dark:bg-[#0a0a0f]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center mb-12" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <Badge className="mb-4 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border-0 px-4 py-1 text-xs font-semibold uppercase tracking-widest">
              Payment Technology
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-black mb-4">Why We Use <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">TRC20 USDT</span></h2>
            <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
              We've chosen TRC20 USDT on the TRON network for the fastest, most cost-effective transactions
            </p>
          </motion.div>

          <motion.div className="grid md:grid-cols-3 gap-5" variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            {[
              { icon: <Zap className="w-7 h-7 text-white" />, color: "from-emerald-500 to-teal-600", border: "border-emerald-200 dark:border-emerald-900/30", title: "Lightning-Fast Transactions", desc: "TRC20 transactions confirmed in just 3 seconds — instant deposits and withdrawals 24/7.", bullets: ["3-second confirmation", "24/7 instant processing", "No waiting periods"] },
              { icon: <DollarSign className="w-7 h-7 text-white" />, color: "from-blue-500 to-cyan-600", border: "border-blue-200 dark:border-blue-900/30", title: "Ultra-Low Network Fees", desc: "Network fees as low as $1 USDT compared to $10-50 on other networks.", bullets: ["~$1 per transaction", "No hidden charges", "More profit in your pocket"] },
              { icon: <Shield className="w-7 h-7 text-white" />, color: "from-purple-500 to-violet-600", border: "border-purple-200 dark:border-purple-900/30", title: "Secure & Reliable", desc: "TRON blockchain is battle-tested with billions in daily transaction volume.", bullets: ["Immutable blockchain", "Open-source transparency", "Battle-tested security"] },
            ].map((item, i) => (
              <motion.div key={i} variants={fadeUp} custom={i}
                className={`rounded-2xl border-2 ${item.border} bg-white dark:bg-[#111118] p-6 hover:shadow-lg transition-all`}>
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-5 shadow-lg`}>
                  {item.icon}
                </div>
                <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">{item.desc}</p>
                <ul className="space-y-1.5">
                  {item.bullets.map((b, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                      <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════ SECURITY ═══════════════════ */}
      <section id="security" className="py-24 bg-slate-50 dark:bg-[#080810]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center mb-16" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <Badge className="mb-4 bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-0 px-4 py-1 text-xs font-semibold uppercase tracking-widest">
              Security First
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-black mb-4">
              Bank-Level <span className="bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">Security</span>
            </h2>
            <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
              Military-grade encryption and multi-layer security protecting every investment
            </p>
          </motion.div>

          <motion.div className="grid md:grid-cols-3 gap-5 mb-8" variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            {[
              { icon: <Shield className="w-8 h-8" />, title: "256-bit SSL Encryption", description: "All data transmitted through our platform uses the same technology as major financial institutions" },
              { icon: <Lock className="w-8 h-8" />, title: "Cold Wallet Storage", description: "95% of assets stored in offline cold wallets, fully protected from online threats" },
              { icon: <Activity className="w-8 h-8" />, title: "24/7 Monitoring", description: "Real-time security monitoring and automated threat detection protecting your investments" },
            ].map((f, i) => (
              <motion.div key={i} variants={fadeUp} custom={i}
                className="rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-[#111118] p-6 text-center hover:border-green-400 dark:hover:border-green-500/40 transition-all">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{f.description}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div className="rounded-2xl border-2 border-green-200 dark:border-green-900/30 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/10 p-8"
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-bold mb-5">Regulated & Compliant</h3>
                <ul className="space-y-3">
                  {["Licensed cryptocurrency investment platform", "KYC/AML compliance procedures", "Regular third-party security audits", "Segregated client accounts", "Insurance coverage for digital assets"].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span className="text-slate-700 dark:text-slate-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex justify-center">
                <div className="bg-white dark:bg-[#111118] rounded-3xl p-8 shadow-xl text-center">
                  <Shield className="w-28 h-28 text-green-600 dark:text-green-400 mx-auto" />
                  <p className="mt-4 text-sm font-semibold text-slate-600 dark:text-slate-300">Trusted by 12,000+ Investors Worldwide</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════ RISK DISCLAIMER ═══════════════════ */}
      <section className="py-12 border-y-4 border-amber-400 bg-amber-50 dark:bg-amber-950/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-8 h-8 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-xl font-bold mb-3">Risk Disclosure & Investment Warning</h3>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
                <strong>Cryptocurrency investments carry significant risk.</strong> The value of Bitcoin and other cryptocurrencies can be extremely volatile. Past performance is not indicative of future results. You should only invest money that you can afford to lose.
              </p>
              <ul className="list-disc pl-5 text-sm text-slate-700 dark:text-slate-300 space-y-1">
                <li>Market volatility may result in loss of your entire investment principal</li>
                <li>Returns are not guaranteed and may vary based on market conditions</li>
                <li>Performance fees are deducted from gross profits as outlined in each plan</li>
                <li>Regulatory changes may impact service availability in your jurisdiction</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ FAQ ═══════════════════ */}
      <section id="faq" className="py-24 bg-white dark:bg-[#0a0a0f]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center mb-12" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <Badge className="mb-4 bg-slate-100 text-slate-700 dark:bg-white/5 dark:text-slate-300 border-0 px-4 py-1 text-xs font-semibold uppercase tracking-widest">
              FAQ
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-black mb-4">Common Questions</h2>
          </motion.div>
          <Accordion type="single" collapsible className="space-y-3">
            {[
              { q: "How do I get started?", a: "Create an account, choose an investment plan that fits your budget, deposit funds via BTC or USDT (TRC20), and start earning automated daily returns immediately." },
              { q: "When are profits paid out?", a: "Profits are distributed automatically every 5 minutes to your account balance. You can withdraw anytime during or after your investment period." },
              { q: "What is the minimum investment?", a: "The minimum investment starts at just $10 USD. We offer 10 different tiers to accommodate all investor levels, from beginner to high-volume VIP investors." },
              { q: "How are returns calculated?", a: "Returns are calculated based on each plan's ROI percentage over its duration. The system automatically credits your account based on the daily return rate, with a performance fee deducted only from profits." },
              { q: "Are returns guaranteed?", a: "While we employ advanced risk management strategies, cryptocurrency investments carry inherent market risks. Our algorithms are designed to adapt to market conditions, but extreme volatility may affect returns." },
              { q: "Are there hidden fees?", a: "No. The only fees are the clearly stated performance fees deducted from profits. There are no deposit fees, withdrawal fees, or hidden charges." },
            ].map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`}
                className="border-2 border-slate-200 dark:border-white/5 rounded-2xl px-5 bg-white dark:bg-[#111118] hover:border-orange-300 dark:hover:border-orange-500/30 transition-colors">
                <AccordionTrigger className="hover:no-underline">
                  <span className="text-left font-semibold text-slate-900 dark:text-white">{faq.q}</span>
                </AccordionTrigger>
                <AccordionContent className="text-slate-600 dark:text-slate-400 pb-4 leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ═══════════════════ CTA ═══════════════════ */}
      <section className="py-28 bg-gradient-to-br from-orange-600 via-amber-500 to-orange-700 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-black/10 rounded-full blur-[80px]" />
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white relative z-10">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur border border-white/20 text-xs font-semibold uppercase tracking-widest mb-6">
              <Flame className="w-3.5 h-3.5" />
              Join 12,847+ Investors Today
            </div>
            <h2 className="text-4xl sm:text-6xl font-black mb-6 leading-tight">
              Ready to Start Your<br />Investment Journey?
            </h2>
            <p className="text-xl opacity-90 mb-10 max-w-2xl mx-auto leading-relaxed">
              Earn daily returns with our secure, regulated platform. No hidden fees, instant withdrawals, fully transparent.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login">
                <Button size="lg" className="w-full sm:w-auto h-14 px-12 text-base font-bold bg-white text-orange-600 hover:bg-orange-50 shadow-2xl rounded-xl"
                  data-testid="button-create-account-cta">
                  Create Free Account <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <a href="https://t.me/BitVault_PRO" target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline"
                  className="w-full sm:w-auto h-14 px-12 text-base font-bold border-2 border-white text-white hover:bg-white/10 backdrop-blur rounded-xl"
                  data-testid="button-join-community-cta">
                  <svg className="mr-2 w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
                  </svg>
                  Join Our Community
                </Button>
              </a>
            </div>
            <p className="mt-6 text-sm opacity-70">
              <Info className="w-3.5 h-3.5 inline mr-1" />
              By signing up, you agree to our Terms of Service and Privacy Policy
            </p>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════ FOOTER ═══════════════════ */}
      <footer className="border-t border-slate-200 dark:border-white/5 bg-white dark:bg-[#0a0a0f]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-10">
            <div>
              <BitVaultLogo size="md" showPro={true} />
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-500 leading-relaxed">
                Professional Bitcoin investment platform with institutional-grade security and automated trading.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-sm">Platform</h4>
              <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-500">
                <li><a href="#plans" className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors">Investment Plans</a></li>
                <li><a href="#calculator" className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors">Returns Calculator</a></li>
                <li><a href="#security" className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors">Security</a></li>
                <li><a href="#faq" className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-sm">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-500">
                <li><Link href="/terms"><span className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors cursor-pointer">Terms of Service</span></Link></li>
                <li><Link href="/privacy"><span className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors cursor-pointer">Privacy Policy</span></Link></li>
                <li><Link href="/risk-disclosure"><span className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors cursor-pointer">Risk Disclosure</span></Link></li>
                <li><Link href="/compliance"><span className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors cursor-pointer">Compliance</span></Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-sm">Connect</h4>
              <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-500">
                <li>
                  <a href="https://t.me/BitVault_PRO" target="_blank" rel="noopener noreferrer"
                    className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors flex items-center gap-2">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
                    </svg>
                    Telegram Community
                  </a>
                </li>
                <li><a href="#" className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors">Support Center</a></li>
                <li><a href="#" className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors">Contact Us</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-200 dark:border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-500 dark:text-slate-500">
              © {new Date().getFullYear()} BitVault Pro. All rights reserved. Licensed cryptocurrency investment platform.
            </p>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="border-green-400 text-green-600 dark:text-green-400 text-xs">
                <Shield className="w-3 h-3 mr-1" /> SSL Secured
              </Badge>
              <Badge variant="outline" className="border-blue-400 text-blue-600 dark:text-blue-400 text-xs">
                <CheckCircle className="w-3 h-3 mr-1" /> Regulated
              </Badge>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
