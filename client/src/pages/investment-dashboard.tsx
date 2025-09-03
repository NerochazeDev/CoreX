import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BitVaultLogo } from "@/components/bitvault-logo";
import { BottomNavigation } from "@/components/bottom-navigation";
import type { Investment, InvestmentPlan } from "@shared/schema";
import { 
  ArrowLeft,
  TrendingUp, 
  TrendingDown,
  Activity, 
  BarChart3,
  Zap,
  Target,
  Eye,
  EyeOff,
  RefreshCw,
  Maximize,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Settings,
  Download,
  Share,
  Wallet,
  DollarSign,
  PieChart,
  LineChart
} from "lucide-react";
import { formatBitcoin, formatCurrency } from "@/lib/utils";
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, ComposedChart, Bar, ScatterChart, Scatter } from "recharts";
import { useCurrency } from "@/hooks/use-currency";
import { useBitcoinPrice } from "@/hooks/use-bitcoin-price";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function InvestmentDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { currency } = useCurrency();
  const { data: bitcoinPrice } = useBitcoinPrice();
  
  // Dashboard states
  const [isLiveMode, setIsLiveMode] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showValues, setShowValues] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(5000); // 5 seconds
  const [chartType, setChartType] = useState<'line' | 'area' | 'candle' | 'volume'>('area');
  
  // Real-time data state
  const [liveData, setLiveData] = useState<any[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Redirect to login if not authenticated
  if (!user) {
    setLocation('/login');
    return null;
  }

  const { data: activeInvestments, isLoading: loadingInvestments } = useQuery<Investment[]>({
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
    refetchInterval: isLiveMode ? refreshInterval : false,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const { data: investmentPlans } = useQuery<InvestmentPlan[]>({
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
  });

  // Calculate investment metrics
  const actualActiveInvestments = activeInvestments?.filter(inv => inv.isActive === true) || [];
  const totalInvestedAmount = actualActiveInvestments.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
  const totalProfit = actualActiveInvestments.reduce((sum, inv) => sum + parseFloat(inv.currentProfit), 0);
  const totalValue = totalInvestedAmount + totalProfit;
  const profitMargin = totalInvestedAmount > 0 ? (totalProfit / totalInvestedAmount) * 100 : 0;
  const dailyGrowthRate = actualActiveInvestments.length > 0 
    ? actualActiveInvestments.reduce((sum, inv) => {
        const plan = investmentPlans?.find(p => p.id === inv.planId);
        return sum + (plan ? parseFloat(plan.dailyReturnRate) * 100 : 0);
      }, 0) / actualActiveInvestments.length 
    : 3.67;

  // Generate advanced trading-style chart data
  const generateAdvancedChartData = () => {
    const data = [];
    const baseAmount = Math.max(totalInvestedAmount || 0.1, 0.01);
    const now = new Date();
    const dataPoints = isLiveMode ? 100 : 30; // More data points for live mode

    for (let i = dataPoints - 1; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * (isLiveMode ? 30000 : 24 * 60 * 60 * 1000)); // 30 second intervals in live mode
      
      // Generate realistic trading data with volatility
      const baseVariation = (Math.random() - 0.5) * 0.025; // Higher volatility
      const trendGrowth = isLiveMode 
        ? (dataPoints - i) * (dailyGrowthRate / 100) * 0.001 // Smaller increments for real-time
        : (dataPoints - i) * (dailyGrowthRate / 100) * 0.1;
      const marketNoise = (Math.sin(i * 0.1) * Math.random() - 0.5) * 0.01; // Market noise
      
      const growthFactor = 1 + trendGrowth + baseVariation + marketNoise;
      const value = baseAmount * growthFactor;
      const profit = Math.max(value - baseAmount, 0);
      const volume = Math.random() * 1000000 + 500000; // Trading volume simulation
      
      // OHLC data for candlestick charts
      const open = value * (0.995 + Math.random() * 0.01);
      const high = Math.max(value, open) * (1 + Math.random() * 0.005);
      const low = Math.min(value, open) * (1 - Math.random() * 0.005);
      const close = value;

      data.push({
        timestamp: timestamp.getTime(),
        date: isLiveMode 
          ? timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          : timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: parseFloat(value.toFixed(8)),
        profit: parseFloat(profit.toFixed(8)),
        portfolio: parseFloat((baseAmount + profit).toFixed(8)),
        volume: Math.floor(volume),
        open: parseFloat(open.toFixed(8)),
        high: parseFloat(high.toFixed(8)),
        low: parseFloat(low.toFixed(8)),
        close: parseFloat(close.toFixed(8)),
        change: i > 0 ? parseFloat(((value - baseAmount * (1 + (dataPoints - i - 1) * (dailyGrowthRate / 100) * (isLiveMode ? 0.001 : 0.1))) / baseAmount * 100).toFixed(2)) : 0,
        changePercent: i > 0 ? parseFloat(((value / (baseAmount * (1 + (dataPoints - i - 1) * (dailyGrowthRate / 100) * (isLiveMode ? 0.001 : 0.1))) - 1) * 100).toFixed(2)) : 0,
        usdValue: bitcoinPrice ? parseFloat((value * (currency === 'USD' ? bitcoinPrice.usd.price : currency === 'GBP' ? bitcoinPrice.gbp.price : bitcoinPrice.eur.price)).toFixed(2)) : 0
      });
    }
    return data;
  };

  // Real-time data updates
  useEffect(() => {
    if (isLiveMode && isStreaming) {
      intervalRef.current = setInterval(() => {
        const newData = generateAdvancedChartData();
        setLiveData(newData);
        
        // Sound notification on significant changes
        if (soundEnabled && newData.length > 1) {
          const lastPoint = newData[newData.length - 1];
          const prevPoint = newData[newData.length - 2];
          if (Math.abs(lastPoint.changePercent) > 0.5) {
            if (audioRef.current) {
              audioRef.current.play().catch(() => {});
            }
          }
        }
      }, refreshInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isLiveMode, isStreaming, refreshInterval, soundEnabled, totalInvestedAmount, dailyGrowthRate]);

  const chartData = isLiveMode && liveData.length > 0 ? liveData : generateAdvancedChartData();
  const latestData = chartData[chartData.length - 1];
  const previousData = chartData[chartData.length - 2];
  const priceChange = latestData && previousData ? latestData.value - previousData.value : 0;
  const priceChangePercent = latestData && previousData ? ((latestData.value - previousData.value) / previousData.value * 100) : 0;

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    if (!isFullscreen && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else if (isFullscreen && document.exitFullscreen) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Export data function
  const exportData = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Date,Value (BTC),Profit (BTC),Change %,Volume,USD Value\n"
      + chartData.map(row => 
          `${row.date},${row.value},${row.profit},${row.changePercent},${row.volume},${row.usdValue}`
        ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "bitvault_investment_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Data Exported",
      description: "Investment data has been exported to CSV file",
    });
  };

  const renderChart = () => {
    const commonProps = {
      width: "100%",
      height: isFullscreen ? "70vh" : "400px"
    };

    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer {...commonProps}>
            <RechartsLineChart data={chartData}>
              <defs>
                <linearGradient id="colorLine" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="1 1" stroke="rgba(156, 163, 175, 0.3)" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11, fill: '#6B7280' }}
                stroke="#9CA3AF"
                interval="preserveStartEnd"
              />
              <YAxis 
                tick={{ fontSize: 11, fill: '#6B7280' }}
                stroke="#9CA3AF"
                tickFormatter={(value) => showValues ? `${value.toFixed(6)}` : '••••••'}
                domain={['dataMin - 0.0001', 'dataMax + 0.0001']}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0, 0, 0, 0.9)',
                  border: '1px solid #f97316',
                  borderRadius: '8px',
                  color: 'white'
                }}
                formatter={(value: any, name: string) => [
                  showValues ? `${parseFloat(value).toFixed(8)} BTC` : '••••••••',
                  name === 'value' ? 'Portfolio Value' : name
                ]}
                labelFormatter={(label) => `Time: ${label}`}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="url(#colorLine)" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, stroke: '#f97316', strokeWidth: 2, fill: 'white' }}
              />
            </RechartsLineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer {...commonProps}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.6}/>
                  <stop offset="50%" stopColor="#f97316" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="1 1" stroke="rgba(156, 163, 175, 0.2)" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11, fill: '#6B7280' }}
                stroke="#9CA3AF"
                interval="preserveStartEnd"
              />
              <YAxis 
                tick={{ fontSize: 11, fill: '#6B7280' }}
                stroke="#9CA3AF"
                tickFormatter={(value) => showValues ? `${value.toFixed(6)}` : '••••••'}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0, 0, 0, 0.95)',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
                  color: 'white'
                }}
                formatter={(value: any, name: string) => {
                  const btcAmount = showValues ? parseFloat(value).toFixed(8) : '••••••••';
                  const usdAmount = bitcoinPrice && showValues ? 
                    formatCurrency(parseFloat(value) * (currency === 'USD' ? bitcoinPrice.usd.price : currency === 'GBP' ? bitcoinPrice.gbp.price : bitcoinPrice.eur.price), currency) 
                    : '••••••';
                  return [
                    <>
                      <div className="font-semibold">{btcAmount} BTC</div>
                      {usdAmount && showValues && <div className="text-xs opacity-75">≈ {usdAmount}</div>}
                    </>,
                    name === 'value' ? 'Portfolio Value' : 'Profit Earned'
                  ];
                }}
                labelFormatter={(label) => `Time: ${label}`}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#f97316" 
                fillOpacity={1} 
                fill="url(#colorArea)"
                strokeWidth={3}
              />
              <Area 
                type="monotone" 
                dataKey="profit" 
                stroke="#10b981" 
                fillOpacity={1} 
                fill="url(#colorProfit)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'volume':
        return (
          <ResponsiveContainer {...commonProps}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="1 1" stroke="rgba(156, 163, 175, 0.2)" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11, fill: '#6B7280' }}
                stroke="#9CA3AF"
              />
              <YAxis 
                yAxisId="value"
                orientation="right"
                tick={{ fontSize: 11, fill: '#6B7280' }}
                stroke="#9CA3AF"
                tickFormatter={(value) => showValues ? `${value.toFixed(6)}` : '••••••'}
              />
              <YAxis 
                yAxisId="volume"
                orientation="left"
                tick={{ fontSize: 11, fill: '#6B7280' }}
                stroke="#9CA3AF"
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0, 0, 0, 0.9)',
                  border: '1px solid #f97316',
                  borderRadius: '8px',
                  color: 'white'
                }}
                formatter={(value: any, name: string) => {
                  if (name === 'volume') {
                    return [`${(parseFloat(value) / 1000).toFixed(0)}K`, 'Volume'];
                  }
                  return [showValues ? `${parseFloat(value).toFixed(8)} BTC` : '••••••••', 'Value'];
                }}
              />
              <Bar 
                yAxisId="volume"
                dataKey="volume" 
                fill="rgba(249, 115, 22, 0.3)"
                stroke="#f97316"
                strokeWidth={1}
              />
              <Line 
                yAxisId="value"
                type="monotone" 
                dataKey="value" 
                stroke="#10b981" 
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Advanced Trading Header */}
      <header className={`bg-black/50 backdrop-blur-xl border-b border-orange-500/30 sticky top-0 z-40 ${isFullscreen ? 'py-2' : 'py-4'} lg:ml-64`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              {!isFullscreen && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocation('/')}
                  className="text-gray-300 hover:text-white hover:bg-orange-500/20"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              )}
              <div className="flex items-center gap-3">
                <BitVaultLogo variant="dark" size={isFullscreen ? "md" : "lg"} showPro={true} />
                <div className="border-l border-orange-500/30 pl-3">
                  <h1 className={`${isFullscreen ? 'text-lg' : 'text-xl'} font-bold text-orange-400`}>Live Investment Dashboard</h1>
                  <p className="text-xs text-gray-400">Real-time portfolio tracking</p>
                </div>
              </div>
            </div>

            {/* Live Status & Controls */}
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-2 bg-green-500/10 px-3 py-1.5 rounded-full border border-green-500/30 ${isFullscreen ? 'text-xs' : ''}`}>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-400 font-medium">
                  {isLiveMode ? (isStreaming ? 'STREAMING' : 'LIVE') : 'PAUSED'}
                </span>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsStreaming(!isStreaming)}
                className="text-gray-300 hover:text-white hover:bg-green-500/20"
              >
                {isStreaming ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowValues(!showValues)}
                className="text-gray-300 hover:text-white hover:bg-blue-500/20"
              >
                {showValues ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
                className="text-gray-300 hover:text-white hover:bg-purple-500/20"
              >
                <Maximize className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Dashboard */}
      <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${isFullscreen ? 'py-2' : 'py-6'} lg:ml-64`}>
        
        {/* Key Metrics Row */}
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 ${isFullscreen ? 'mb-3' : 'mb-6'}`}>
          <Card className="bg-black/40 border-green-500/30 p-4 backdrop-blur-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-1">Portfolio Value</p>
                <p className="text-lg font-bold text-green-400">
                  {showValues ? `${formatBitcoin(totalValue.toString())} BTC` : '••••••••'}
                </p>
                {bitcoinPrice && showValues && (
                  <p className="text-xs text-gray-500">
                    ≈ {formatCurrency(totalValue * (currency === 'USD' ? bitcoinPrice.usd.price : currency === 'GBP' ? bitcoinPrice.gbp.price : bitcoinPrice.eur.price), currency)}
                  </p>
                )}
              </div>
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-green-400" />
              </div>
            </div>
          </Card>

          <Card className="bg-black/40 border-orange-500/30 p-4 backdrop-blur-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-1">Total Profit</p>
                <p className="text-lg font-bold text-orange-400">
                  {showValues ? `+${formatBitcoin(totalProfit.toString())} BTC` : '••••••••'}
                </p>
                <p className={`text-xs flex items-center gap-1 ${priceChangePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {priceChangePercent >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {showValues ? `${profitMargin.toFixed(2)}%` : '••••••'}
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-orange-400" />
              </div>
            </div>
          </Card>

          <Card className="bg-black/40 border-blue-500/30 p-4 backdrop-blur-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-1">24h Change</p>
                <p className={`text-lg font-bold ${priceChangePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {showValues ? `${priceChangePercent.toFixed(2)}%` : '••••••'}
                </p>
                <p className="text-xs text-gray-500">
                  {showValues ? `${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(8)} BTC` : '••••••••'}
                </p>
              </div>
              <div className={`w-8 h-8 rounded-full ${priceChangePercent >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'} flex items-center justify-center`}>
                {priceChangePercent >= 0 ? 
                  <TrendingUp className="w-4 h-4 text-green-400" /> : 
                  <TrendingDown className="w-4 h-4 text-red-400" />
                }
              </div>
            </div>
          </Card>

          <Card className="bg-black/40 border-purple-500/30 p-4 backdrop-blur-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-1">Active Positions</p>
                <p className="text-lg font-bold text-purple-400">
                  {actualActiveInvestments.length}
                </p>
                <p className="text-xs text-gray-500">
                  {showValues ? `${formatBitcoin(totalInvestedAmount.toString())} invested` : '•••••• invested'}
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Target className="w-4 h-4 text-purple-400" />
              </div>
            </div>
          </Card>
        </div>

        {/* Advanced Chart Section */}
        <Card className="bg-black/40 border-orange-500/30 backdrop-blur-lg">
          <div className="p-4 border-b border-orange-500/20">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-orange-400 mb-1">Live Portfolio Performance</h2>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span>Last Update: {new Date().toLocaleTimeString()}</span>
                  <Badge className={`${isStreaming ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                    {isStreaming ? 'Live Stream' : 'Paused'}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Chart Type Selector */}
                <div className="flex bg-gray-800/50 rounded-lg p-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setChartType('area')}
                    className={`px-3 py-1 text-xs ${chartType === 'area' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'}`}
                  >
                    <BarChart3 className="w-3 h-3 mr-1" />
                    Area
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setChartType('line')}
                    className={`px-3 py-1 text-xs ${chartType === 'line' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'}`}
                  >
                    <LineChart className="w-3 h-3 mr-1" />
                    Line
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setChartType('volume')}
                    className={`px-3 py-1 text-xs ${chartType === 'volume' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'}`}
                  >
                    <BarChart3 className="w-3 h-3 mr-1" />
                    Volume
                  </Button>
                </div>

                {/* Control Buttons */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="text-gray-400 hover:text-white"
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    queryClient.invalidateQueries({ queryKey: ['/api/investments/user', user.id] });
                    setLiveData([]);
                    toast({
                      title: "Data Refreshed",
                      description: "Portfolio data has been updated",
                    });
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={exportData}
                  className="text-gray-400 hover:text-white"
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className={`p-4 ${isFullscreen ? 'h-[70vh]' : 'h-[500px]'}`}>
            {loadingInvestments ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin text-orange-400" />
                  <p className="text-gray-400">Loading portfolio data...</p>
                </div>
              </div>
            ) : actualActiveInvestments.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <PieChart className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-400 mb-2">No active investments to track</p>
                  <Button
                    onClick={() => setLocation('/investment')}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    Start Investing
                  </Button>
                </div>
              </div>
            ) : (
              renderChart()
            )}
          </div>
        </Card>

        {/* Additional Dashboard Components */}
        {!isFullscreen && actualActiveInvestments.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Quick Stats */}
            <Card className="bg-black/40 border-orange-500/30 backdrop-blur-lg p-6">
              <h3 className="text-lg font-semibold text-orange-400 mb-4">Quick Statistics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-800/30 rounded-lg border border-gray-700/30">
                  <p className="text-xs text-gray-400 mb-1">Daily Growth</p>
                  <p className="text-lg font-bold text-green-400">+{dailyGrowthRate.toFixed(3)}%</p>
                </div>
                <div className="text-center p-3 bg-gray-800/30 rounded-lg border border-gray-700/30">
                  <p className="text-xs text-gray-400 mb-1">Best Performer</p>
                  <p className="text-lg font-bold text-blue-400">
                    {investmentPlans?.find(p => actualActiveInvestments.some(inv => inv.planId === p.id))?.name || 'N/A'}
                  </p>
                </div>
              </div>
            </Card>

            {/* Active Investments List */}
            <Card className="bg-black/40 border-orange-500/30 backdrop-blur-lg p-6">
              <h3 className="text-lg font-semibold text-orange-400 mb-4">Active Positions</h3>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {actualActiveInvestments.slice(0, 3).map((investment, index) => {
                  const plan = investmentPlans?.find(p => p.id === investment.planId);
                  return (
                    <div key={investment.id} className="flex justify-between items-center p-3 bg-gray-800/30 rounded-lg border border-gray-700/30">
                      <div>
                        <p className="font-medium text-white">{plan?.name || `Plan ${investment.planId}`}</p>
                        <p className="text-xs text-gray-400">
                          {showValues ? `${formatBitcoin(investment.amount)} BTC` : '••••••••'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-green-400 font-medium">
                          {showValues ? `+${formatBitcoin(investment.currentProfit)} BTC` : '••••••••'}
                        </p>
                        <p className="text-xs text-gray-400">Profit</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}

      </main>

      {/* Hidden audio element for notifications */}
      <audio ref={audioRef} preload="auto">
        <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEaBC2T2/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEaBC2T2/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEaBC2T2/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEaBC2T2/LMeSEaBC2T2/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEaBC2T2/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEaBC2T2/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEaBC2T2/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEaBC2T2/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEaBC2T2/LMeSwFJHfH8N2QQAo=" type="audio/wav" />
      </audio>

      {/* Bottom Navigation - Hidden in fullscreen */}
      {!isFullscreen && <BottomNavigation />}
    </div>
  );
}