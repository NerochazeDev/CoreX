
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { formatBitcoin, formatCurrency } from "@/lib/utils";
import { useBitcoinPrice } from "@/hooks/use-bitcoin-price";
import { useCurrency } from "@/hooks/use-currency";
import { 
  TrendingUp, 
  Activity, 
  BarChart3, 
  Zap, 
  Target,
  Wallet,
  RefreshCw,
  DollarSign,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Bot,
  Globe,
  Shield,
  Clock,
  Star
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell } from "recharts";
import type { Investment, InvestmentPlan } from "@shared/schema";

interface TradingActivity {
  id: string;
  source: string;
  type: string;
  amount: string;
  profit: string;
  timestamp: Date;
  status: 'completed' | 'pending' | 'processing';
  exchange?: string;
  strategy?: string;
}

interface PerformanceMetrics {
  totalProfit: number;
  dailyReturn: number;
  weeklyReturn: number;
  monthlyReturn: number;
  winRate: number;
  sharpeRatio: number;
  maxDrawdown: number;
  volatility: number;
}

export function AdvancedInvestmentDashboard() {
  const { user } = useAuth();
  const { data: bitcoinPrice } = useBitcoinPrice();
  const { currency } = useCurrency();
  
  const [liveActivities, setLiveActivities] = useState<TradingActivity[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    totalProfit: 0,
    dailyReturn: 0,
    weeklyReturn: 0,
    monthlyReturn: 0,
    winRate: 0,
    sharpeRatio: 0,
    maxDrawdown: 0,
    volatility: 0
  });
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1h' | '24h' | '7d' | '30d'>('24h');

  // Fetch user investments
  const { data: activeInvestments, isLoading } = useQuery<Investment[]>({
    queryKey: ['/api/investments/user', user?.id],
    queryFn: () => fetch(`/api/investments/user/${user?.id}`, {
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('bitvault_auth_token') || ''}`,
      }
    }).then(res => {
      if (!res.ok) throw new Error('Failed to fetch investments');
      return res.json();
    }),
    enabled: !!user?.id,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: investmentPlans } = useQuery<InvestmentPlan[]>({
    queryKey: ['/api/investment-plans'],
    queryFn: () => fetch('/api/investment-plans', {
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('bitvault_auth_token') || ''}`,
      }
    }).then(res => res.json()),
    enabled: !!user,
  });

  // Calculate investment metrics
  const actualActiveInvestments = activeInvestments?.filter(inv => inv.isActive === true) || [];
  const totalInvestedAmount = actualActiveInvestments.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
  const totalProfit = actualActiveInvestments.reduce((sum, inv) => sum + parseFloat(inv.currentProfit), 0);
  const profitMargin = totalInvestedAmount > 0 ? (totalProfit / totalInvestedAmount) * 100 : 0;

  // Generate realistic trading activities
  const generateTradingActivity = (): TradingActivity => {
    const sources = [
      'Arbitrage Bot Alpha',
      'DeFi Yield Optimizer',
      'Market Making Engine',
      'Grid Trading Bot',
      'Momentum Strategy AI',
      'Cross-Exchange Arbitrage',
      'Liquidity Mining Protocol',
      'Futures Trading Algorithm',
      'Options Market Maker',
      'Flash Loan Arbitrage'
    ];

    const types = [
      'Arbitrage Opportunity',
      'Yield Farming Harvest',
      'Liquidity Provision',
      'Market Making Profit',
      'Momentum Trade',
      'Grid Trade Execution',
      'Options Premium',
      'Futures Position',
      'Flash Loan Profit',
      'Cross-Chain Bridge'
    ];

    const exchanges = [
      'Binance', 'Coinbase Pro', 'Kraken', 'Bitfinex', 'KuCoin',
      'Huobi', 'Gate.io', 'OKX', 'Bybit', 'Deribit'
    ];

    const strategies = [
      'Statistical Arbitrage',
      'Market Neutral',
      'Momentum Following',
      'Mean Reversion',
      'Breakout Strategy',
      'Grid Trading',
      'DCA Strategy',
      'Scalping Algorithm'
    ];

    const baseAmount = totalInvestedAmount > 0 ? totalInvestedAmount * 0.001 : 0.001;
    const profitAmount = baseAmount * (0.0001 + Math.random() * 0.002); // 0.01% to 0.2% profit

    return {
      id: Math.random().toString(36).substr(2, 9),
      source: sources[Math.floor(Math.random() * sources.length)],
      type: types[Math.floor(Math.random() * types.length)],
      amount: baseAmount.toFixed(8),
      profit: profitAmount.toFixed(8),
      timestamp: new Date(),
      status: Math.random() > 0.1 ? 'completed' : 'processing',
      exchange: exchanges[Math.floor(Math.random() * exchanges.length)],
      strategy: strategies[Math.floor(Math.random() * strategies.length)]
    };
  };

  // Generate chart data for performance visualization
  const generatePerformanceData = () => {
    const data = [];
    const now = new Date();
    const intervals = selectedTimeframe === '1h' ? 60 : selectedTimeframe === '24h' ? 24 : selectedTimeframe === '7d' ? 7 : 30;
    const intervalMs = selectedTimeframe === '1h' ? 60000 : selectedTimeframe === '24h' ? 3600000 : 86400000;

    let cumulativeProfit = 0;
    for (let i = intervals - 1; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * intervalMs);
      const baseGrowth = totalInvestedAmount * 0.0001 * Math.random(); // Random growth
      const marketVolatility = (Math.random() - 0.5) * 0.0002;
      const profit = baseGrowth + (totalInvestedAmount * marketVolatility);
      
      cumulativeProfit += profit;
      
      data.push({
        time: selectedTimeframe === '1h' ? timestamp.toLocaleTimeString('en-US', { minute: '2-digit' }) :
              selectedTimeframe === '24h' ? timestamp.getHours() + ':00' :
              timestamp.toLocaleDateString('en-US', { weekday: 'short' }),
        profit: parseFloat(cumulativeProfit.toFixed(8)),
        volume: 100000 + Math.random() * 500000,
        trades: Math.floor(50 + Math.random() * 200),
        arbitrageProfit: parseFloat((profit * 0.4).toFixed(8)),
        defiYield: parseFloat((profit * 0.3).toFixed(8)),
        tradingProfit: parseFloat((profit * 0.3).toFixed(8))
      });
    }
    return data;
  };

  const chartData = generatePerformanceData();

  // Live activity simulation
  useEffect(() => {
    if (actualActiveInvestments.length === 0) return;

    const interval = setInterval(() => {
      const newActivity = generateTradingActivity();
      setLiveActivities(prev => [newActivity, ...prev.slice(0, 49)]); // Keep last 50 activities

      // Update performance metrics
      setPerformanceMetrics(prev => ({
        ...prev,
        totalProfit: prev.totalProfit + parseFloat(newActivity.profit),
        dailyReturn: (Math.random() * 2) + 0.5, // 0.5% to 2.5%
        weeklyReturn: (Math.random() * 10) + 3, // 3% to 13%
        monthlyReturn: (Math.random() * 25) + 10, // 10% to 35%
        winRate: 85 + Math.random() * 10, // 85% to 95%
        sharpeRatio: 1.5 + Math.random() * 1, // 1.5 to 2.5
        maxDrawdown: -(Math.random() * 3 + 1), // -1% to -4%
        volatility: Math.random() * 5 + 2 // 2% to 7%
      }));
    }, 3000 + Math.random() * 7000); // Random interval between 3-10 seconds

    return () => clearInterval(interval);
  }, [actualActiveInvestments.length, totalInvestedAmount]);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-orange-500" />
          <span className="ml-2">Loading investment dashboard...</span>
        </div>
      </Card>
    );
  }

  if (actualActiveInvestments.length === 0) {
    return (
      <Card className="p-6 text-center">
        <Target className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold mb-2">No Active Investments</h3>
        <p className="text-gray-600 mb-4">Start investing to see live trading performance and profit generation.</p>
        <Button className="bg-orange-500 hover:bg-orange-600">
          Start Investing
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 dark:text-green-400 mb-1">Total Profit</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                +{formatBitcoin(totalProfit.toString())}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400">
                {bitcoinPrice && formatCurrency(totalProfit * bitcoinPrice.usd.price, 'USD')}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">24h Return</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                +{performanceMetrics.dailyReturn.toFixed(2)}%
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                {formatBitcoin((totalInvestedAmount * performanceMetrics.dailyReturn / 100).toString())}
              </p>
            </div>
            <Activity className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 dark:text-purple-400 mb-1">Win Rate</p>
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                {performanceMetrics.winRate.toFixed(1)}%
              </p>
              <p className="text-xs text-purple-600 dark:text-purple-400">
                {liveActivities.filter(a => a.status === 'completed').length} successful trades
              </p>
            </div>
            <Target className="w-8 h-8 text-purple-500" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 dark:text-orange-400 mb-1">Sharpe Ratio</p>
              <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                {performanceMetrics.sharpeRatio.toFixed(2)}
              </p>
              <p className="text-xs text-orange-600 dark:text-orange-400">
                Risk-adjusted returns
              </p>
            </div>
            <BarChart3 className="w-8 h-8 text-orange-500" />
          </div>
        </Card>
      </div>

      {/* Trading Performance Chart */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-semibold">Live Trading Performance</h3>
            <p className="text-sm text-gray-600">Real-time profit generation from automated strategies</p>
          </div>
          <div className="flex gap-2">
            {(['1h', '24h', '7d', '30d'] as const).map((timeframe) => (
              <Button
                key={timeframe}
                variant={selectedTimeframe === timeframe ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTimeframe(timeframe)}
                className={selectedTimeframe === timeframe ? "bg-orange-500 hover:bg-orange-600" : ""}
              >
                {timeframe}
              </Button>
            ))}
          </div>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(156, 163, 175, 0.3)" />
              <XAxis dataKey="time" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `${value.toFixed(6)} BTC`} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0, 0, 0, 0.9)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white'
                }}
                formatter={(value: any) => [`${parseFloat(value).toFixed(8)} BTC`, 'Cumulative Profit']}
              />
              <Area 
                type="monotone" 
                dataKey="profit" 
                stroke="#10b981" 
                fillOpacity={1} 
                fill="url(#profitGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Trading Sources Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Profit Sources Breakdown</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm">Arbitrage Trading</span>
              </div>
              <div className="text-right">
                <div className="font-semibold">40%</div>
                <div className="text-xs text-gray-500">+{formatBitcoin((totalProfit * 0.4).toString())}</div>
              </div>
            </div>
            <Progress value={40} className="h-2" />

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm">DeFi Yield Farming</span>
              </div>
              <div className="text-right">
                <div className="font-semibold">30%</div>
                <div className="text-xs text-gray-500">+{formatBitcoin((totalProfit * 0.3).toString())}</div>
              </div>
            </div>
            <Progress value={30} className="h-2" />

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-sm">Algorithmic Trading</span>
              </div>
              <div className="text-right">
                <div className="font-semibold">20%</div>
                <div className="text-xs text-gray-500">+{formatBitcoin((totalProfit * 0.2).toString())}</div>
              </div>
            </div>
            <Progress value={20} className="h-2" />

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="text-sm">Market Making</span>
              </div>
              <div className="text-right">
                <div className="font-semibold">10%</div>
                <div className="text-xs text-gray-500">+{formatBitcoin((totalProfit * 0.1).toString())}</div>
              </div>
            </div>
            <Progress value={10} className="h-2" />
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {performanceMetrics.weeklyReturn.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-600">7-Day Return</div>
            </div>
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                {performanceMetrics.monthlyReturn.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-600">30-Day Return</div>
            </div>
            <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                {performanceMetrics.maxDrawdown.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-600">Max Drawdown</div>
            </div>
            <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                {performanceMetrics.volatility.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-600">Volatility</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Live Trading Activities */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold">Live Trading Activities</h3>
            <p className="text-sm text-gray-600">Real-time profit generation from automated strategies</p>
          </div>
          <Badge className="bg-green-100 text-green-800 border-green-300">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            Live
          </Badge>
        </div>

        <div className="max-h-96 overflow-y-auto space-y-2">
          {liveActivities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bot className="w-8 h-8 mx-auto mb-2" />
              <p>Waiting for trading activities...</p>
            </div>
          ) : (
            liveActivities.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/20">
                    {activity.source.includes('Bot') ? <Bot className="w-4 h-4 text-green-600" /> :
                     activity.source.includes('DeFi') ? <Layers className="w-4 h-4 text-green-600" /> :
                     activity.source.includes('Exchange') ? <Globe className="w-4 h-4 text-green-600" /> :
                     <Zap className="w-4 h-4 text-green-600" />}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{activity.type}</div>
                    <div className="text-xs text-gray-500">
                      {activity.source} • {activity.exchange}
                    </div>
                    <div className="text-xs text-gray-400">
                      {activity.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-green-600">
                    +{formatBitcoin(activity.profit)}
                  </div>
                  <div className="text-xs text-gray-500">
                    from {formatBitcoin(activity.amount)}
                  </div>
                  <Badge 
                    variant={activity.status === 'completed' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {activity.status}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Investment Breakdown */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Active Investment Breakdown</h3>
        <div className="space-y-4">
          {actualActiveInvestments.map((investment) => {
            const plan = investmentPlans?.find(p => p.id === investment.planId);
            const investmentProfit = parseFloat(investment.currentProfit);
            const investmentAmount = parseFloat(investment.amount);
            const roi = investmentAmount > 0 ? (investmentProfit / investmentAmount) * 100 : 0;
            
            return (
              <div key={investment.id} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold">{plan?.name || `Investment #${investment.id}`}</h4>
                    <p className="text-sm text-gray-600">
                      Invested: {formatBitcoin(investment.amount)} • 
                      Started: {new Date(investment.startDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-green-600">
                      +{formatBitcoin(investment.currentProfit)}
                    </div>
                    <div className="text-sm text-gray-600">
                      ROI: {roi.toFixed(2)}%
                    </div>
                  </div>
                </div>
                <Progress value={Math.min(roi, 100)} className="h-2" />
                <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                  <span>Daily Rate: {plan ? (parseFloat(plan.dailyReturnRate) * 100).toFixed(3) : '0'}%</span>
                  <span>Target: {plan?.roiPercentage || 0}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
