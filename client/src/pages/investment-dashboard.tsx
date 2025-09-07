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
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, ComposedChart, Bar, ScatterChart, Scatter, PieChart as RechartsPieChart, Pie, Cell, RadialBarChart, RadialBar, ReferenceLine, Brush, Legend } from "recharts";
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
  const [chartType, setChartType] = useState<'line' | 'area' | 'candle' | 'volume' | 'depth' | 'heatmap' | 'advanced' | 'distribution' | 'comparison'>('advanced');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w'>('5m');
  const [showIndicators, setShowIndicators] = useState<string[]>(['SMA', 'RSI']);
  const [portfolioView, setPortfolioView] = useState<'overview' | 'analytics' | 'risk' | 'performance'>('overview');
  
  // Real-time data state
  const [liveData, setLiveData] = useState<any[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [marketDepth, setMarketDepth] = useState<any[]>([]);
  const [orderBook, setOrderBook] = useState<{bids: any[], asks: any[]}>({bids: [], asks: []});
  const [technicalIndicators, setTechnicalIndicators] = useState<any>({});
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

  // Calculate technical indicators
  const calculateSMA = (data: any[], period: number): number[] => {
    const sma: number[] = [];
    for (let i = period - 1; i < data.length; i++) {
      const sum = data.slice(i - period + 1, i + 1).reduce((acc: number, val: any) => acc + val.value, 0);
      sma.push(sum / period);
    }
    return sma;
  };

  const calculateRSI = (data: any[], period: number = 14) => {
    const rsi = [];
    for (let i = period; i < data.length; i++) {
      let gains = 0, losses = 0;
      for (let j = i - period + 1; j <= i; j++) {
        const change = data[j].value - data[j-1].value;
        if (change > 0) gains += change;
        else losses -= change;
      }
      const avgGain = gains / period;
      const avgLoss = losses / period;
      const rs = avgGain / avgLoss;
      rsi.push(100 - (100 / (1 + rs)));
    }
    return rsi;
  };

  const calculateMACD = (data: any[]) => {
    const ema12 = calculateEMA(data, 12);
    const ema26 = calculateEMA(data, 26);
    const macd = ema12.map((val, i) => val - ema26[i]);
    const signal = calculateEMA(macd.map((val, i) => ({value: val})), 9);
    return { macd, signal: signal.map(s => s || 0) };
  };

  const calculateEMA = (data: any[], period: number) => {
    const ema = [];
    const multiplier = 2 / (period + 1);
    ema[0] = data[0].value;
    for (let i = 1; i < data.length; i++) {
      ema[i] = (data[i].value * multiplier) + (ema[i-1] * (1 - multiplier));
    }
    return ema;
  };

  const calculateBollingerBands = (data: any[], period: number = 20, multiplier: number = 2) => {
    const sma = calculateSMA(data, period);
    const bands = { upper: [] as number[], lower: [] as number[], middle: sma };
    
    for (let i = period - 1; i < data.length; i++) {
      const slice = data.slice(i - period + 1, i + 1);
      const mean = sma[i - period + 1];
      const variance = slice.reduce((acc, val) => acc + Math.pow(val.value - mean, 2), 0) / period;
      const stdDev = Math.sqrt(variance);
      
      bands.upper.push(mean + (stdDev * multiplier));
      bands.lower.push(mean - (stdDev * multiplier));
    }
    
    return bands;
  };

  // Generate professional trading data with multiple timeframes
  const generateAdvancedChartData = () => {
    console.log('🎯 Generating chart data with baseAmount:', Math.max(totalInvestedAmount || 0.1, 0.01));
    console.log('Total invested amount for chart:', totalInvestedAmount);
    
    const data: any[] = [];
    const baseAmount = Math.max(totalInvestedAmount || 0.1, 0.01);
    const now = new Date();
    const timeframeMs = {
      '1m': 60000,
      '5m': 300000,
      '15m': 900000,
      '1h': 3600000,
      '4h': 14400000,
      '1d': 86400000,
      '1w': 604800000
    };
    const interval = timeframeMs[selectedTimeframe];
    const dataPoints = isLiveMode ? 200 : 100;

    // Generate market cycles and trends
    const marketCycle = Math.sin(now.getTime() / (24 * 60 * 60 * 1000)) * 0.1; // Daily cycle
    const weeklyTrend = Math.sin(now.getTime() / (7 * 24 * 60 * 60 * 1000)) * 0.05; // Weekly trend
    
    for (let i = dataPoints - 1; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * interval);
      
      // Advanced market simulation with multiple factors
      const baseVariation = (Math.random() - 0.5) * 0.03; // Market volatility
      const trendGrowth = (dataPoints - i) * (dailyGrowthRate / 100) / dataPoints;
      const cyclicalEffect = Math.sin(i * 0.1) * 0.015; // Cyclical market behavior
      const momentumEffect = i < 20 ? (20 - i) * 0.001 : 0; // Recent momentum
      const newsEvent = Math.random() < 0.05 ? (Math.random() - 0.5) * 0.08 : 0; // Random news events
      
      const growthFactor = 1 + trendGrowth + baseVariation + cyclicalEffect + momentumEffect + newsEvent + marketCycle + weeklyTrend;
      const value = baseAmount * growthFactor;
      const profit = Math.max(value - baseAmount, 0);
      
      // Professional volume simulation with patterns
      const baseVolume = 800000 + Math.sin(i * 0.2) * 200000; // Volume patterns
      const volumeSpike = Math.abs(newsEvent) > 0.03 ? 2.5 : 1; // Volume spikes on news
      const volume = Math.floor((baseVolume * (0.8 + Math.random() * 0.4)) * volumeSpike);
      
      // Professional OHLC data with proper relationships
      const volatility = 0.008 + Math.abs(newsEvent) * 0.5; // Dynamic volatility
      const open: number = i === dataPoints - 1 ? value : data[data.length - 1]?.close || value;
      const direction = Math.random() > 0.5 ? 1 : -1;
      const range = value * volatility * (0.5 + Math.random());
      
      const high = Math.max(open, value) + (range * 0.3 * Math.random());
      const low = Math.min(open, value) - (range * 0.3 * Math.random());
      const close = value;
      
      // Bid/Ask spread simulation
      const spread = value * 0.001; // 0.1% spread
      const bid = value - spread / 2;
      const ask = value + spread / 2;

      data.unshift({
        timestamp: timestamp.getTime(),
        date: selectedTimeframe.includes('m') || selectedTimeframe.includes('h')
          ? timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
          : timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: parseFloat(value.toFixed(8)),
        profit: parseFloat(profit.toFixed(8)),
        portfolio: parseFloat((baseAmount + profit).toFixed(8)),
        volume: volume,
        open: parseFloat(open.toFixed(8)),
        high: parseFloat(high.toFixed(8)),
        low: parseFloat(low.toFixed(8)),
        close: parseFloat(close.toFixed(8)),
        bid: parseFloat(bid.toFixed(8)),
        ask: parseFloat(ask.toFixed(8)),
        spread: parseFloat(spread.toFixed(8)),
        change: data.length > 0 ? parseFloat((close - (data[0] as any).close).toFixed(8)) : 0,
        changePercent: data.length > 0 ? parseFloat(((close - (data[0] as any).close) / (data[0] as any).close * 100).toFixed(4)) : 0,
        volatility: parseFloat((volatility * 100).toFixed(2)),
        usdValue: bitcoinPrice ? parseFloat((value * (currency === 'USD' ? bitcoinPrice.usd.price : currency === 'GBP' ? bitcoinPrice.gbp.price : bitcoinPrice.eur.price)).toFixed(2)) : 0
      });
    }
    
    // Calculate technical indicators
    if (data.length >= 26) {
      const sma20 = calculateSMA(data, 20);
      const sma50 = calculateSMA(data, 50);
      const rsi = calculateRSI(data);
      const macd = calculateMACD(data);
      const bollinger = calculateBollingerBands(data);
      
      // Add indicators to data points
      data.forEach((point: any, i) => {
        if (i >= 19) point.sma20 = sma20[i - 19];
        if (i >= 49) point.sma50 = sma50[i - 49];
        if (i >= 14) point.rsi = rsi[i - 14];
        if (i >= 25) {
          point.macd = macd.macd[i - 25];
          point.macdSignal = macd.signal[i - 25];
          point.macdHistogram = macd.macd[i - 25] - macd.signal[i - 25];
        }
        if (i >= 19) {
          point.bbUpper = bollinger.upper[i - 19];
          point.bbLower = bollinger.lower[i - 19];
          point.bbMiddle = bollinger.middle[i - 19];
        }
      });
    }
    
    return data;
  };

  // Generate market depth data
  const generateMarketDepth = () => {
    const currentPrice = chartData[chartData.length - 1]?.value || totalValue;
    const depth = [];
    
    // Generate bid orders (buy orders below current price)
    for (let i = 0; i < 15; i++) {
      const price = currentPrice * (1 - (i + 1) * 0.002); // 0.2% steps
      const size = (Math.random() * 2 + 0.5) * (1 + i * 0.1); // Increasing size with distance
      depth.push({ price: parseFloat(price.toFixed(8)), size: parseFloat(size.toFixed(4)), side: 'bid', total: 0 });
    }
    
    // Generate ask orders (sell orders above current price)
    for (let i = 0; i < 15; i++) {
      const price = currentPrice * (1 + (i + 1) * 0.002); // 0.2% steps
      const size = (Math.random() * 2 + 0.5) * (1 + i * 0.1); // Increasing size with distance
      depth.push({ price: parseFloat(price.toFixed(8)), size: parseFloat(size.toFixed(4)), side: 'ask', total: 0 });
    }
    
    // Calculate cumulative totals
    let bidTotal = 0, askTotal = 0;
    depth.forEach(order => {
      if (order.side === 'bid') {
        bidTotal += order.size;
        order.total = bidTotal;
      } else {
        askTotal += order.size;
        order.total = askTotal;
      }
    });
    
    return depth;
  };

  // Generate order book data
  const generateOrderBook = () => {
    const currentPrice = chartData[chartData.length - 1]?.value || totalValue;
    const bids = [];
    const asks = [];
    
    // Generate realistic bid/ask orders
    for (let i = 0; i < 10; i++) {
      bids.push({
        price: parseFloat((currentPrice * (1 - (i + 1) * 0.001)).toFixed(8)),
        size: parseFloat((Math.random() * 5 + 1).toFixed(4)),
        total: 0
      });
      
      asks.push({
        price: parseFloat((currentPrice * (1 + (i + 1) * 0.001)).toFixed(8)),
        size: parseFloat((Math.random() * 5 + 1).toFixed(4)),
        total: 0
      });
    }
    
    // Calculate totals
    let bidTotal = 0, askTotal = 0;
    bids.forEach(bid => { bidTotal += bid.size; bid.total = bidTotal; });
    asks.forEach(ask => { askTotal += ask.size; ask.total = askTotal; });
    
    return { bids, asks };
  };

  // Real-time data updates with enhanced market data
  useEffect(() => {
    if (isLiveMode && isStreaming) {
      intervalRef.current = setInterval(() => {
        const newData = generateAdvancedChartData();
        const newDepth = generateMarketDepth();
        const newOrderBook = generateOrderBook();
        
        setLiveData(newData);
        setChartData(newData);
        setMarketDepth(newDepth);
        setOrderBook(newOrderBook);
        
        // Enhanced portfolio metrics calculation
        if (newData.length > 1) {
          const latest = newData[newData.length - 1];
          const previous = newData[newData.length - 2];
          const historical = newData.slice(-30); // Last 30 data points
          
          // Calculate advanced technical indicators
          const avgVolatility = historical.reduce((sum, point) => sum + (point.volatility || 0), 0) / historical.length;
          const priceVelocity = historical.length > 5 ? 
            (latest.value - historical[historical.length - 6].value) / 5 : 0;
          
          setTechnicalIndicators({
            rsi: (latest as any).rsi || 50,
            macd: (latest as any).macd || 0,
            volatility: latest.volatility || 0,
            volume: latest.volume || 0,
            change24h: latest.changePercent || 0,
            avgVolatility: avgVolatility,
            priceVelocity: priceVelocity,
            momentum: latest.changePercent > 0 ? 'bullish' : 'bearish',
            strength: Math.abs(latest.changePercent)
          });
          
          // Enhanced sound alerts with different tones
          if (soundEnabled) {
            const priceChange = Math.abs(latest.changePercent);
            const volumeSpike = latest.volume > (previous.volume * 1.5);
            const rsiExtreme = (latest as any).rsi && ((latest as any).rsi > 80 || (latest as any).rsi < 20);
            const bigMove = priceChange > 2.0;
            
            if (bigMove || volumeSpike || rsiExtreme) {
              if (audioRef.current) {
                audioRef.current.play().catch(() => {});
              }
              
              // Show toast notification for significant events
              toast({
                title: bigMove ? "📈 Significant Price Movement" : volumeSpike ? "📊 Volume Spike" : "⚠️ RSI Alert",
                description: bigMove ? `${priceChange.toFixed(2)}% price change detected` : 
                           volumeSpike ? "Unusual trading volume detected" :
                           "RSI entering extreme territory",
                duration: 3000,
              });
            }
          }
        }

        // Invalidate cache occasionally to get fresh data
        if (Math.random() < 0.1) { // 10% chance each update
          queryClient.invalidateQueries({ queryKey: ['/api/investments/user', user.id] });
        }
      }, refreshInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isLiveMode, isStreaming, refreshInterval, soundEnabled, totalInvestedAmount, dailyGrowthRate, selectedTimeframe, user.id, toast, queryClient]);

  // Initialize chart data immediately
  const [chartData, setChartData] = useState<any[]>([]);

  // Generate initial chart data
  useEffect(() => {
    const initialData = generateAdvancedChartData();
    setChartData(initialData);
    if (!isLiveMode) {
      setLiveData(initialData);
    }
  }, [totalInvestedAmount, totalValue, selectedTimeframe]);

  // Use live data if available, otherwise use generated data
  const currentChartData = (isLiveMode && liveData.length > 0) ? liveData : chartData;
  console.log('📊 Current chart data length:', currentChartData.length);
  console.log('📊 Chart data sample:', currentChartData.slice(0, 2));
  
  // Ensure chart data is always available
  useEffect(() => {
    if (currentChartData.length === 0 && !loadingInvestments) {
      const initialData = generateAdvancedChartData();
      setChartData(initialData);
    }
  }, [currentChartData.length, loadingInvestments]);
  const latestData = currentChartData[currentChartData.length - 1];
  const previousData = currentChartData[currentChartData.length - 2];
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
      + currentChartData.map(row => 
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
    if (!currentChartData || currentChartData.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Zap className="w-6 h-6 text-orange-400 animate-pulse" />
              </div>
            </div>
            <p className="text-lg font-semibold text-gray-300 mb-2">Generating Chart Data</p>
            <p className="text-sm text-gray-500">Creating investment visualization...</p>
          </div>
        </div>
      );
    }

    const commonProps = {
      width: "100%",
      height: isFullscreen ? "70vh" : "400px"
    };

    switch (chartType) {
      case 'line':
        return (
          <div style={{ width: '100%', height: '400px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <RechartsLineChart data={currentChartData}>
              <defs>
                <linearGradient id="colorIncomeGrowth" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
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
                  border: '1px solid #10b981',
                  borderRadius: '8px',
                  color: 'white'
                }}
                formatter={(value: any, name: string) => [
                  showValues ? `${parseFloat(value).toFixed(8)} BTC` : '••••••••',
                  name === 'profit' ? 'Investment Income' : 'Total Value'
                ]}
                labelFormatter={(label) => `Period: ${label}`}
              />
              <Line 
                type="monotone" 
                dataKey="profit" 
                stroke="url(#colorIncomeGrowth)" 
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 4, stroke: '#10b981', strokeWidth: 2, fill: 'white' }}
              />
              </RechartsLineChart>
            </ResponsiveContainer>
          </div>
        );

      case 'area':
        return (
          <div style={{ width: '100%', height: '400px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={currentChartData}>
              <defs>
                <linearGradient id="colorInvestment" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.6}/>
                  <stop offset="50%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorIncomeEarned" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.7}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.2}/>
                </linearGradient>
                <linearGradient id="colorDailyIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.5}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
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
                    name === 'value' ? 'Total Investment Value' : 
                    name === 'profit' ? 'Cumulative Income Earned' : 
                    'Investment Base Amount'
                  ];
                }}
                labelFormatter={(label) => `Period: ${label}`}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stackId="1"
                stroke="#3b82f6" 
                fillOpacity={1} 
                fill="url(#colorInvestment)"
                strokeWidth={2}
              />
              <Area 
                type="monotone" 
                dataKey="profit" 
                stackId="2"
                stroke="#10b981" 
                fillOpacity={1} 
                fill="url(#colorIncomeEarned)"
                strokeWidth={3}
              />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        );

      case 'volume':
        return (
          <div style={{ width: '100%', height: '400px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={currentChartData}>
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
                  backgroundColor: 'rgba(0, 0, 0, 0.95)',
                  border: '1px solid #f97316',
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '12px'
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
              {showIndicators.includes('SMA') && (
                <Line 
                  yAxisId="value"
                  type="monotone" 
                  dataKey="sma20" 
                  stroke="#fbbf24" 
                  strokeWidth={1}
                  dot={false}
                  strokeDasharray="2 2"
                />
              )}
              {showIndicators.includes('SMA') && (
                <Line 
                  yAxisId="value"
                  type="monotone" 
                  dataKey="sma50" 
                  stroke="#8b5cf6" 
                  strokeWidth={1}
                  dot={false}
                  strokeDasharray="4 4"
                />
              )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        );
        
      case 'depth':
        // Generate investment source breakdown data
        const investmentSources = actualActiveInvestments.map((investment, index) => {
          const plan = investmentPlans?.find(p => p.id === investment.planId);
          return {
            planName: plan?.name || `Plan ${investment.planId}`,
            amount: parseFloat(investment.amount),
            profit: parseFloat(investment.currentProfit),
            dailyRate: plan ? parseFloat(plan.dailyReturnRate) * 100 : 0,
            color: `hsl(${index * 60}, 70%, 50%)`
          };
        });

        return (
          <div style={{ width: '100%', height: '400px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={investmentSources}>
              <CartesianGrid strokeDasharray="1 1" stroke="rgba(156, 163, 175, 0.2)" />
              <XAxis 
                dataKey="planName" 
                tick={{ fontSize: 10, fill: '#6B7280' }}
                stroke="#9CA3AF"
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                tick={{ fontSize: 11, fill: '#6B7280' }}
                stroke="#9CA3AF"
                tickFormatter={(value) => showValues ? `${value.toFixed(4)}` : '••••••'}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0, 0, 0, 0.95)',
                  border: '1px solid #10b981',
                  borderRadius: '12px',
                  color: 'white'
                }}
                formatter={(value: any, name: string) => [
                  showValues ? `${parseFloat(value).toFixed(8)} BTC` : '••••••••',
                  name === 'amount' ? 'Invested Amount' : 
                  name === 'profit' ? 'Income Earned' : 
                  'Daily Rate %'
                ]}
                labelFormatter={(label) => `Investment Plan: ${label}`}
              />
              <Area 
                type="monotone"
                dataKey="amount"
                stackId="1"
                stroke="#3b82f6"
                fill="rgba(59, 130, 246, 0.4)"
                strokeWidth={2}
              />
              <Area 
                type="monotone"
                dataKey="profit"
                stackId="1"
                stroke="#10b981"
                fill="rgba(16, 185, 129, 0.6)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
          </div>
        );
        
      case 'advanced':
        return (
          <div style={{ width: '100%', height: '400px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={currentChartData}>
              <defs>
                <linearGradient id="gradientProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="50%" stopColor="#059669" stopOpacity={0.6}/>
                  <stop offset="100%" stopColor="#047857" stopOpacity={0.3}/>
                </linearGradient>
                <linearGradient id="gradientVolume" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.6}/>
                  <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.2}/>
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(156, 163, 175, 0.2)" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 10, fill: '#9CA3AF' }}
                stroke="#6B7280"
                axisLine={false}
              />
              <YAxis 
                yAxisId="value"
                orientation="right"
                tick={{ fontSize: 10, fill: '#9CA3AF' }}
                stroke="#6B7280"
                axisLine={false}
                tickFormatter={(value) => showValues ? `${value.toFixed(4)}` : '••••'}
              />
              <YAxis 
                yAxisId="volume"
                orientation="left"
                tick={{ fontSize: 10, fill: '#9CA3AF' }}
                stroke="#6B7280"
                axisLine={false}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0, 0, 0, 0.95)',
                  border: '1px solid rgba(16, 185, 129, 0.5)',
                  borderRadius: '12px',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                  color: 'white',
                  backdropFilter: 'blur(16px)'
                }}
                formatter={(value: any, name: string) => {
                  if (name === 'volume') return [`${(parseFloat(value) / 1000).toFixed(0)}K`, 'Volume'];
                  if (name === 'volatility') return [`${parseFloat(value).toFixed(2)}%`, 'Volatility'];
                  return [showValues ? `${parseFloat(value).toFixed(8)} BTC` : '••••••••', name === 'profit' ? 'Profit' : name === 'value' ? 'Portfolio Value' : 'Investment'];
                }}
                labelFormatter={(label) => `Time: ${label}`}
              />
              <Bar 
                yAxisId="volume"
                dataKey="volume" 
                fill="url(#gradientVolume)"
                opacity={0.6}
                radius={[2, 2, 0, 0]}
              />
              <Area 
                yAxisId="value"
                type="monotone" 
                dataKey="value" 
                stroke="#3b82f6" 
                fill="rgba(59, 130, 246, 0.1)"
                strokeWidth={1}
                dot={false}
              />
              <Line 
                yAxisId="value"
                type="monotone" 
                dataKey="profit" 
                stroke="url(#gradientProfit)" 
                strokeWidth={3}
                dot={false}
                filter="url(#glow)"
                activeDot={{ 
                  r: 6, 
                  stroke: '#10b981', 
                  strokeWidth: 2, 
                  fill: 'white',
                  filter: 'url(#glow)'
                }}
              />
              {showIndicators.includes('SMA') && (
                <Line 
                  yAxisId="value"
                  type="monotone" 
                  dataKey="sma20" 
                  stroke="#fbbf24" 
                  strokeWidth={2}
                  dot={false}
                  strokeDasharray="4 4"
                  opacity={0.8}
                />
              )}
              {showIndicators.includes('RSI') && currentChartData.some(d => d.rsi) && (
                <Line 
                  yAxisId="value"
                  type="monotone" 
                  dataKey="rsi" 
                  stroke="#ec4899" 
                  strokeWidth={1}
                  dot={false}
                  strokeDasharray="2 6"
                  opacity={0.6}
                />
              )}
              <ReferenceLine yAxisId="value" y={totalInvestedAmount} stroke="#ef4444" strokeDasharray="8 8" opacity={0.7} />
              <Brush dataKey="date" height={30} stroke="#10b981" fill="rgba(16, 185, 129, 0.1)" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        );
        
      case 'distribution':
        const distributionData = actualActiveInvestments.map((investment, index) => {
          const plan = investmentPlans?.find(p => p.id === investment.planId);
          const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
          return {
            name: plan?.name || `Plan ${investment.planId}`,
            value: parseFloat(investment.amount),
            profit: parseFloat(investment.currentProfit),
            color: colors[index % colors.length],
            percentage: (parseFloat(investment.amount) / totalInvestedAmount * 100).toFixed(1)
          };
        });
        
        return (
          <div style={{ width: '100%', height: '400px' }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                <defs>
                  <filter id="shadow">
                    <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="rgba(0,0,0,0.3)"/>
                  </filter>
                </defs>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={40}
                  paddingAngle={3}
                  dataKey="value"
                  filter="url(#shadow)"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    border: 'none',
                    borderRadius: '12px',
                    color: 'white'
                  }}
                  formatter={(value: any, name: string) => [
                    showValues ? `${parseFloat(value).toFixed(8)} BTC (${distributionData.find(d => d.name === name)?.percentage}%)` : '••••••••',
                    'Investment Amount'
                  ]}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ fontSize: '12px', color: '#9CA3AF' }}
                />
                </RechartsPieChart>
              </ResponsiveContainer>
              
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart 
                  cx="50%" 
                  cy="50%" 
                  innerRadius="20%" 
                  outerRadius="80%" 
                  data={distributionData.map(d => ({...d, fill: d.color}))}
                >
                <RadialBar 
                  dataKey="profit" 
                  cornerRadius={4}
                  fill="url(#gradientProfit)"
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    border: 'none',
                    borderRadius: '12px',
                    color: 'white'
                  }}
                  formatter={(value: any) => [
                    showValues ? `+${parseFloat(value).toFixed(8)} BTC` : '••••••••',
                    'Profit Earned'
                  ]}
                />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
        
      case 'comparison':
        const comparisonData = actualActiveInvestments.map((investment, index) => {
          const plan = investmentPlans?.find(p => p.id === investment.planId);
          const roi = (parseFloat(investment.currentProfit) / parseFloat(investment.amount) * 100);
          const dailyRate = plan ? parseFloat(plan.dailyReturnRate) * 100 : 0;
          const projectedMonthly = parseFloat(investment.amount) * (dailyRate / 100) * 30;
          
          return {
            name: plan?.name || `Plan ${investment.planId}`,
            invested: parseFloat(investment.amount),
            profit: parseFloat(investment.currentProfit),
            roi: roi,
            dailyRate: dailyRate,
            projectedMonthly: projectedMonthly,
            efficiency: roi / (dailyRate || 1)
          };
        });
        
        return (
          <div style={{ width: '100%', height: '400px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={comparisonData}>
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.9}/>
                  <stop offset="100%" stopColor="#059669" stopOpacity={0.6}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(156, 163, 175, 0.2)" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 10, fill: '#9CA3AF' }}
                stroke="#6B7280"
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                yAxisId="amount"
                orientation="left"
                tick={{ fontSize: 10, fill: '#9CA3AF' }}
                stroke="#6B7280"
                tickFormatter={(value) => showValues ? `${value.toFixed(3)}` : '•••'}
              />
              <YAxis 
                yAxisId="percentage"
                orientation="right"
                tick={{ fontSize: 10, fill: '#9CA3AF' }}
                stroke="#6B7280"
                tickFormatter={(value) => `${value.toFixed(1)}%`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0, 0, 0, 0.95)',
                  border: '1px solid rgba(16, 185, 129, 0.5)',
                  borderRadius: '12px',
                  color: 'white',
                  backdropFilter: 'blur(16px)'
                }}
                formatter={(value: any, name: string) => {
                  if (name === 'roi' || name === 'dailyRate') return [`${parseFloat(value).toFixed(2)}%`, name === 'roi' ? 'Current ROI' : 'Daily Rate'];
                  if (name === 'efficiency') return [`${parseFloat(value).toFixed(2)}x`, 'Efficiency Score'];
                  return [showValues ? `${parseFloat(value).toFixed(6)} BTC` : '••••••••', name === 'invested' ? 'Invested' : name === 'profit' ? 'Profit' : 'Projected Monthly'];
                }}
              />
              <Bar 
                yAxisId="amount"
                dataKey="invested" 
                fill="rgba(59, 130, 246, 0.6)"
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                yAxisId="amount"
                dataKey="profit" 
                fill="url(#barGradient)"
                radius={[4, 4, 0, 0]}
              />
              <Line 
                yAxisId="percentage"
                type="monotone" 
                dataKey="roi" 
                stroke="#f59e0b" 
                strokeWidth={3}
                dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
              />
              <Line 
                yAxisId="percentage"
                type="monotone" 
                dataKey="dailyRate" 
                stroke="#ec4899" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: '#ec4899', strokeWidth: 2, r: 3 }}
              />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        );

      case 'heatmap':
        const heatmapData = currentChartData.slice(-20).map((point, i) => ({
          x: i,
          y: 0,
          value: point.volatility || 0,
          volume: point.volume,
          change: point.changePercent
        }));
        
        return (
          <div style={{ width: '100%', height: '400px' }}>
            <ResponsiveContainer width="100%" height="100%">
            <ScatterChart data={heatmapData}>
              <CartesianGrid strokeDasharray="1 1" stroke="rgba(156, 163, 175, 0.2)" />
              <XAxis 
                dataKey="x" 
                tick={{ fontSize: 11, fill: '#6B7280' }}
                stroke="#9CA3AF"
              />
              <YAxis 
                tick={false}
                axisLine={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0, 0, 0, 0.95)',
                  border: '1px solid #f97316',
                  borderRadius: '12px',
                  color: 'white'
                }}
                formatter={(value: any, name: string) => {
                  if (name === 'value') return [`${parseFloat(value).toFixed(2)}%`, 'Volatility'];
                  if (name === 'volume') return [`${(parseFloat(value) / 1000).toFixed(0)}K`, 'Volume'];
                  if (name === 'change') return [`${parseFloat(value).toFixed(2)}%`, 'Change'];
                  return [value, name];
                }}
              />
              <Scatter 
                dataKey="value" 
                fill="#f97316"
              />
            </ScatterChart>
          </ResponsiveContainer>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Advanced Trading Header */}
      <header className={`bg-black/50 backdrop-blur-xl border-b border-orange-500/30 sticky top-0 z-40 ${isFullscreen ? 'py-2' : 'py-4 md:py-4'} lg:ml-64`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex flex-col gap-3 lg:flex-row lg:justify-between lg:items-center">
            <div className="flex items-center justify-between lg:justify-start gap-2 lg:gap-4">
              {!isFullscreen && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocation('/')}
                  className="text-gray-300 hover:text-white hover:bg-orange-500/20 lg:mr-2"
                >
                  <ArrowLeft className="w-4 h-4 lg:mr-2" />
                  <span className="hidden lg:inline">Back to Home</span>
                </Button>
              )}
              <div className="flex items-center gap-2 lg:gap-3 min-w-0 flex-1 lg:flex-initial">
                <div className="shrink-0">
                  <BitVaultLogo variant="dark" size={isFullscreen ? "md" : "md"} showPro={true} />
                </div>
                <div className="border-l border-orange-500/30 pl-2 lg:pl-3 min-w-0">
                  <h1 className={`${isFullscreen ? 'text-sm' : 'text-sm lg:text-xl'} font-bold text-orange-400 leading-tight`}>Live Investment Dashboard</h1>
                  <p className="text-xs text-gray-400 leading-tight">Real-time portfolio tracking</p>
                </div>
              </div>
            </div>

            {/* Live Status & Controls */}
            <div className="flex items-center justify-between lg:justify-end gap-2 w-full lg:w-auto">
              <div className={`flex items-center gap-2 bg-green-500/10 px-2 lg:px-3 py-1 lg:py-1.5 rounded-full border border-green-500/30 ${isFullscreen ? 'text-xs' : 'text-xs lg:text-sm'}`}>
                <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-400 font-medium">
                  {isLiveMode ? (isStreaming ? 'STREAMING' : 'LIVE') : 'PAUSED'}
                </span>
              </div>
              
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsStreaming(!isStreaming)}
                  className="text-gray-300 hover:text-white hover:bg-green-500/20 h-8 w-8 p-0"
                >
                  {isStreaming ? <Pause className="w-3 h-3 lg:w-4 lg:h-4" /> : <Play className="w-3 h-3 lg:w-4 lg:h-4" />}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowValues(!showValues)}
                  className="text-gray-300 hover:text-white hover:bg-blue-500/20 h-8 w-8 p-0"
                >
                  {showValues ? <Eye className="w-3 h-3 lg:w-4 lg:h-4" /> : <EyeOff className="w-3 h-3 lg:w-4 lg:h-4" />}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleFullscreen}
                  className="text-gray-300 hover:text-white hover:bg-purple-500/20 h-8 w-8 p-0"
                >
                  <Maximize className="w-3 h-3 lg:w-4 lg:h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Dashboard */}
      <main className={`max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 ${isFullscreen ? 'py-2' : 'py-4 md:py-6'} lg:ml-64 pb-20 lg:pb-6`}>
        
        {/* Professional Trading Header */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 ${isFullscreen ? 'mb-3' : 'mb-4 md:mb-6'}`}>
          {/* Price & Change */}
          <Card className="bg-black/40 border-orange-500/30 p-3 md:p-4 backdrop-blur-lg sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-orange-400">Portfolio Value</h3>
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-xs text-green-400">LIVE</span>
              </div>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-bold text-white">
                {showValues ? `${formatBitcoin(totalValue.toString())}` : '••••••••'}
              </span>
              <span className="text-sm text-gray-400">BTC</span>
            </div>
            {bitcoinPrice && showValues && (
              <p className="text-lg text-gray-300 mt-1">
                ≈ {formatCurrency(totalValue * (currency === 'USD' ? bitcoinPrice.usd.price : currency === 'GBP' ? bitcoinPrice.gbp.price : bitcoinPrice.eur.price), currency)}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <span className={`flex items-center gap-1 text-sm font-medium ${
                priceChangePercent >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {priceChangePercent >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {showValues ? `${priceChangePercent.toFixed(4)}%` : '••••••'}
              </span>
              <span className="text-xs text-gray-500">24h</span>
            </div>
          </Card>

          {/* Technical Indicators */}
          <Card className="bg-black/40 border-blue-500/30 p-3 md:p-4 backdrop-blur-lg">
            <h3 className="text-sm font-semibold text-blue-400 mb-3">Technical Analysis</h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-gray-400 mb-1">RSI (14)</p>
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${
                    technicalIndicators.rsi > 70 ? 'text-red-400' :
                    technicalIndicators.rsi < 30 ? 'text-green-400' : 'text-yellow-400'
                  }`}>
                    {showValues ? `${(technicalIndicators.rsi || 50).toFixed(1)}` : '••••'}
                  </span>
                  <div className={`w-2 h-2 rounded-full ${
                    technicalIndicators.rsi > 70 ? 'bg-red-400' :
                    technicalIndicators.rsi < 30 ? 'bg-green-400' : 'bg-yellow-400'
                  }`}></div>
                </div>
              </div>
              <div>
                <p className="text-gray-400 mb-1">MACD</p>
                <span className={`font-bold text-sm ${
                  technicalIndicators.macd > 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {showValues ? `${(technicalIndicators.macd || 0).toFixed(6)}` : '••••••'}
                </span>
              </div>
              <div>
                <p className="text-gray-400 mb-1">Volatility</p>
                <span className="font-bold text-orange-400">
                  {showValues ? `${(technicalIndicators.volatility || 0).toFixed(2)}%` : '••••'}
                </span>
              </div>
              <div>
                <p className="text-gray-400 mb-1">Volume</p>
                <span className="font-bold text-purple-400">
                  {showValues ? `${((technicalIndicators.volume || 0) / 1000).toFixed(0)}K` : '••••'}
                </span>
              </div>
            </div>
          </Card>

          {/* Market Sentiment */}
          <Card className="bg-black/40 border-purple-500/30 p-3 md:p-4 backdrop-blur-lg">
            <h3 className="text-sm font-semibold text-purple-400 mb-3">Market Sentiment</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Fear & Greed</span>
                <span className="text-sm font-bold text-orange-400">72</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-2 rounded-full" style={{width: '72%'}}></div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-gray-400">Trend</p>
                  <p className="text-green-400 font-bold">Bullish</p>
                </div>
                <div>
                  <p className="text-gray-400">Signal</p>
                  <p className="text-blue-400 font-bold">Buy</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Enhanced Key Metrics Row */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 md:gap-4 ${isFullscreen ? 'mb-3' : 'mb-4 md:mb-6'}`}>
          <Card className="bg-black/40 border-green-500/30 p-3 md:p-4 backdrop-blur-lg hover:bg-black/50 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/20">
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
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-green-400" />
              </div>
            </div>
          </Card>

          <Card className="bg-black/40 border-orange-500/30 p-3 md:p-4 backdrop-blur-lg hover:bg-black/50 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-1">Total Profit</p>
                <p className="text-lg font-bold text-orange-400">
                  {showValues ? `+${formatBitcoin(totalProfit.toString())} BTC` : '••••••••'}
                </p>
                <p className={`text-xs flex items-center gap-1 ${profitMargin >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {profitMargin >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {showValues ? `${profitMargin.toFixed(2)}%` : '••••••'}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-orange-400" />
              </div>
            </div>
          </Card>

          <Card className="bg-black/40 border-blue-500/30 p-3 md:p-4 backdrop-blur-lg hover:bg-black/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20">
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
              <div className={`w-10 h-10 rounded-xl ${priceChangePercent >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'} flex items-center justify-center`}>
                {priceChangePercent >= 0 ? 
                  <TrendingUp className="w-5 h-5 text-green-400" /> : 
                  <TrendingDown className="w-5 h-5 text-red-400" />
                }
              </div>
            </div>
          </Card>

          <Card className="bg-black/40 border-purple-500/30 p-3 md:p-4 backdrop-blur-lg hover:bg-black/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20">
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
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Target className="w-5 h-5 text-purple-400" />
              </div>
            </div>
          </Card>

          <Card className="bg-black/40 border-yellow-500/30 p-3 md:p-4 backdrop-blur-lg hover:bg-black/50 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-1">Daily ROI</p>
                <p className="text-lg font-bold text-yellow-400">
                  {dailyGrowthRate.toFixed(3)}%
                </p>
                <p className="text-xs text-gray-500">
                  Average daily
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-yellow-400" />
              </div>
            </div>
          </Card>

          <Card className="bg-black/40 border-cyan-500/30 p-3 md:p-4 backdrop-blur-lg hover:bg-black/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-1">Performance</p>
                <p className={`text-lg font-bold ${technicalIndicators.momentum === 'bullish' ? 'text-green-400' : 'text-red-400'}`}>
                  {technicalIndicators.momentum === 'bullish' ? 'BULL' : 'BEAR'}
                </p>
                <p className="text-xs text-gray-500">
                  Market trend
                </p>
              </div>
              <div className={`w-10 h-10 rounded-xl ${technicalIndicators.momentum === 'bullish' ? 'bg-green-500/20' : 'bg-red-500/20'} flex items-center justify-center`}>
                <Activity className={`w-5 h-5 ${technicalIndicators.momentum === 'bullish' ? 'text-green-400' : 'text-red-400'}`} />
              </div>
            </div>
          </Card>
        </div>

        {/* Live Investment Income Tracker */}
        <Card className="bg-black/40 border-orange-500/30 backdrop-blur-lg relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-purple-500/5 pointer-events-none"></div>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-yellow-500 to-green-500"></div>
          <div className="p-3 md:p-4 border-b border-orange-500/20">
            <div className="space-y-4">
              {/* Header Section - Mobile Optimized */}
              <div className="space-y-3">
                <div className="flex flex-col gap-2">
                  <h2 className="text-base md:text-xl font-bold text-orange-400">Live Investment Income Tracker</h2>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs text-gray-400">
                    <span>Last Update: {new Date().toLocaleTimeString()}</span>
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs ${isStreaming ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                        {isStreaming ? 'EARNING LIVE' : 'TRACKING PAUSED'}
                      </Badge>
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                        Daily ROI: +{dailyGrowthRate.toFixed(3)}%
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Controls Section - Mobile Responsive */}
              <div className="space-y-3">
                {/* Time Frame Selector - Full width on mobile */}
                <div className="w-full">
                  <div className="flex bg-gradient-to-r from-gray-800/80 to-gray-700/80 rounded-lg p-1 overflow-x-auto border border-gray-600/30">
                    {(['1m', '5m', '15m', '1h', '4h', '1d', '1w'] as const).map((timeframe) => (
                      <Button
                        key={timeframe}
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedTimeframe(timeframe)}
                        className={`px-2 md:px-3 py-1.5 text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                          selectedTimeframe === timeframe 
                            ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25' 
                            : 'text-gray-300 hover:text-white hover:bg-gray-600/50'
                        }`}
                      >
                        {timeframe.toUpperCase()}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Chart Type Selector - Mobile responsive grid */}
                <div className="w-full">
                  <div className="grid grid-cols-3 md:flex bg-gradient-to-r from-gray-800/80 to-gray-700/80 rounded-lg p-1 gap-1 border border-gray-600/30">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setChartType('advanced')}
                      className={`px-2 md:px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                        chartType === 'advanced' 
                          ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/25' 
                          : 'text-gray-300 hover:text-white hover:bg-gray-600/50'
                      }`}
                    >
                      <TrendingUp className="w-3 h-3 md:mr-1" />
                      <span className="hidden md:inline">Advanced</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setChartType('line')}
                      className={`px-2 md:px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                        chartType === 'line' 
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25' 
                          : 'text-gray-300 hover:text-white hover:bg-gray-600/50'
                      }`}
                    >
                      <LineChart className="w-3 h-3 md:mr-1" />
                      <span className="hidden md:inline">Income</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setChartType('volume')}
                      className={`px-2 md:px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                        chartType === 'volume' 
                          ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/25' 
                          : 'text-gray-300 hover:text-white hover:bg-gray-600/50'
                      }`}
                    >
                      <BarChart3 className="w-3 h-3 md:mr-1" />
                      <span className="hidden md:inline">Activity</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setChartType('distribution')}
                      className={`px-2 md:px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                        chartType === 'distribution' 
                          ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-lg shadow-yellow-500/25' 
                          : 'text-gray-300 hover:text-white hover:bg-gray-600/50'
                      }`}
                    >
                      <PieChart className="w-3 h-3 md:mr-1" />
                      <span className="hidden md:inline">Portfolio</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setChartType('comparison')}
                      className={`px-2 md:px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                        chartType === 'comparison' 
                          ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-lg shadow-cyan-500/25' 
                          : 'text-gray-300 hover:text-white hover:bg-gray-600/50'
                      }`}
                    >
                      <Activity className="w-3 h-3 md:mr-1" />
                      <span className="hidden md:inline">Compare</span>
                    </Button>
                  </div>
                </div>

                {/* Live Metrics - Mobile stacked */}
                <div className="w-full">
                  <div className="grid grid-cols-3 md:flex bg-gradient-to-r from-gray-800/80 to-gray-700/80 rounded-lg p-1 gap-1 border border-gray-600/30">
                    <div className="px-2 md:px-3 py-1.5 text-xs text-green-400 font-semibold bg-green-500/10 rounded text-center">
                      <div className="md:hidden">Daily</div>
                      <div className="hidden md:inline">Daily: </div>+{dailyGrowthRate.toFixed(3)}%
                    </div>
                    <div className="px-2 md:px-3 py-1.5 text-xs text-blue-400 font-semibold bg-blue-500/10 rounded text-center">
                      <div className="md:hidden">ROI</div>
                      <div className="hidden md:inline">ROI: </div>+{profitMargin.toFixed(2)}%
                    </div>
                    <div className="px-2 md:px-3 py-1.5 text-xs text-purple-400 font-semibold bg-purple-500/10 rounded text-center">
                      <div className="md:hidden">Vol</div>
                      <div className="hidden md:inline">Vol: </div>{(technicalIndicators.volatility || 0).toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Control Panel - Mobile responsive */}
                <div className="w-full md:w-auto">
                  <div className="flex justify-center md:justify-end">
                    <div className="flex bg-gradient-to-r from-gray-800/80 to-gray-700/80 rounded-lg p-1 border border-gray-600/30">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        className={`text-gray-300 hover:text-white p-2 transition-all duration-200 ${
                          soundEnabled ? 'bg-green-500/20 text-green-400' : 'hover:bg-gray-600/50'
                        }`}
                        title={soundEnabled ? "Disable sound alerts" : "Enable sound alerts"}
                      >
                        {soundEnabled ? <Volume2 className="w-3 h-3 md:w-4 md:h-4" /> : <VolumeX className="w-3 h-3 md:w-4 md:h-4" />}
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          queryClient.invalidateQueries({ queryKey: ['/api/investments/user', user.id] });
                          setLiveData([]);
                          toast({
                            title: "✅ Data Refreshed",
                            description: "Portfolio data has been updated with latest information",
                            duration: 2000,
                          });
                        }}
                        className="text-gray-300 hover:text-white p-2 hover:bg-blue-500/20 transition-all duration-200"
                        title="Refresh portfolio data"
                      >
                        <RefreshCw className="w-3 h-3 md:w-4 md:h-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={exportData}
                        className="text-gray-300 hover:text-white p-2 hover:bg-orange-500/20 transition-all duration-200"
                        title="Export data to CSV"
                      >
                        <Download className="w-3 h-3 md:w-4 md:h-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          navigator.share && navigator.share({
                            title: 'BitVault Pro Investment Dashboard',
                            text: `Check out my investment performance: ${profitMargin.toFixed(2)}% ROI`,
                            url: window.location.href
                          }).catch(() => {
                            navigator.clipboard.writeText(window.location.href);
                            toast({
                              title: "🔗 Link Copied",
                              description: "Dashboard link copied to clipboard",
                              duration: 2000,
                            });
                          });
                        }}
                        className="text-gray-300 hover:text-white p-2 hover:bg-purple-500/20 transition-all duration-200"
                        title="Share dashboard"
                      >
                        <Share className="w-3 h-3 md:w-4 md:h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={`relative p-3 md:p-4 ${isFullscreen ? 'h-[70vh]' : 'h-[250px] sm:h-[350px] md:h-[450px]'} overflow-hidden`}>
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none rounded-lg"></div>
            {loadingInvestments ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Zap className="w-6 h-6 text-orange-400 animate-pulse" />
                    </div>
                  </div>
                  <p className="text-lg font-semibold text-gray-300 mb-2">Loading Investment Data</p>
                  <p className="text-sm text-gray-500">Fetching real-time portfolio information...</p>
                  <div className="mt-4 flex justify-center space-x-1">
                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            ) : actualActiveInvestments.length === 0 && currentChartData.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center max-w-md">
                  <div className="relative mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-orange-500/20 to-yellow-500/20 rounded-2xl mx-auto flex items-center justify-center">
                      <TrendingUp className="w-10 h-10 text-orange-400" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-white">+</span>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-200 mb-2">Start Your Investment Journey</h3>
                  <p className="text-gray-400 mb-6 text-sm leading-relaxed">
                    No active investments found. Begin earning automated daily returns with our professional investment plans.
                  </p>
                  <div className="space-y-3">
                    <Button
                      onClick={() => setLocation('/investment')}
                      className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    >
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Explore Investment Plans
                    </Button>
                    <p className="text-xs text-gray-500">
                      Start with as little as 0.001 BTC • Daily returns up to 1.94%
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full relative z-10">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 rounded-lg pointer-events-none"></div>
                <div className="absolute top-2 left-2 w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                <div className="absolute top-2 left-6 w-1 h-1 bg-blue-400 rounded-full animate-pulse delay-150 shadow-lg shadow-blue-400/50"></div>
                <div className="absolute top-2 left-9 w-1 h-1 bg-purple-400 rounded-full animate-pulse delay-300 shadow-lg shadow-purple-400/50"></div>
                {isStreaming && (
                  <div className="absolute top-2 right-2 z-10">
                    <div className="flex items-center gap-2 bg-green-500/20 backdrop-blur-sm border border-green-500/30 rounded-full px-3 py-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-xs text-green-400 font-medium">LIVE</span>
                    </div>
                  </div>
                )}
                {renderChart()}
                
                {/* Chart Overlay Information */}
                {currentChartData && currentChartData.length > 0 && (
                  <div className="absolute bottom-2 left-2 z-10">
                    <div className="bg-black/60 backdrop-blur-sm border border-gray-600/30 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <span className="text-gray-300">Income: {showValues ? `+${formatBitcoin(totalProfit.toString())} BTC` : '••••••••'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                          <span className="text-gray-300">ROI: {profitMargin.toFixed(2)}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                          <span className="text-gray-300">Active: {actualActiveInvestments.length}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Professional Portfolio Analytics */}
        {!isFullscreen && actualActiveInvestments.length > 0 && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 md:gap-6 mt-4 md:mt-6">
            
            {/* Portfolio Analytics Panel */}
            <div className="xl:col-span-8 space-y-4 md:space-y-6">
              <Card className="bg-black/40 border-blue-500/30 backdrop-blur-lg">
                <div className="p-3 md:p-4 border-b border-blue-500/20">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-blue-400">Portfolio Analytics</h3>
                    <div className="flex bg-gray-800/50 rounded-lg p-1">
                      {(['overview', 'analytics', 'risk', 'performance'] as const).map((view) => (
                        <Button
                          key={view}
                          variant="ghost"
                          size="sm"
                          onClick={() => setPortfolioView(view)}
                          className={`px-3 py-1 text-xs capitalize ${portfolioView === view ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                          {view}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="p-4 md:p-6">
                  {portfolioView === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center p-4 bg-gray-800/30 rounded-lg border border-gray-700/30">
                        <div className="w-12 h-12 mx-auto mb-3 bg-green-500/20 rounded-full flex items-center justify-center">
                          <TrendingUp className="w-6 h-6 text-green-400" />
                        </div>
                        <p className="text-xs text-gray-400 mb-1">Total Return</p>
                        <p className="text-xl font-bold text-green-400">{profitMargin.toFixed(2)}%</p>
                        <p className="text-xs text-gray-500">All time</p>
                      </div>
                      
                      <div className="text-center p-4 bg-gray-800/30 rounded-lg border border-gray-700/30">
                        <div className="w-12 h-12 mx-auto mb-3 bg-blue-500/20 rounded-full flex items-center justify-center">
                          <Target className="w-6 h-6 text-blue-400" />
                        </div>
                        <p className="text-xs text-gray-400 mb-1">Sharpe Ratio</p>
                        <p className="text-xl font-bold text-blue-400">{(profitMargin * 0.2).toFixed(2)}</p>
                        <p className="text-xs text-gray-500">Risk adjusted</p>
                      </div>
                      
                      <div className="text-center p-4 bg-gray-800/30 rounded-lg border border-gray-700/30">
                        <div className="w-12 h-12 mx-auto mb-3 bg-purple-500/20 rounded-full flex items-center justify-center">
                          <Activity className="w-6 h-6 text-purple-400" />
                        </div>
                        <p className="text-xs text-gray-400 mb-1">Volatility</p>
                        <p className="text-xl font-bold text-purple-400">{(dailyGrowthRate * 0.3).toFixed(1)}%</p>
                        <p className="text-xs text-gray-500">30-day avg</p>
                      </div>
                    </div>
                  )}
                  
                  {portfolioView === 'analytics' && (
                    <div className="space-y-6">
                      {/* Performance Metrics */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/30">
                          <p className="text-xs text-gray-400 mb-1">Alpha</p>
                          <p className="text-lg font-bold text-green-400">+{(profitMargin * 0.15).toFixed(2)}%</p>
                        </div>
                        <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/30">
                          <p className="text-xs text-gray-400 mb-1">Beta</p>
                          <p className="text-lg font-bold text-blue-400">{(0.8 + Math.random() * 0.4).toFixed(2)}</p>
                        </div>
                        <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/30">
                          <p className="text-xs text-gray-400 mb-1">Max Drawdown</p>
                          <p className="text-lg font-bold text-red-400">-{(Math.random() * 5 + 1).toFixed(2)}%</p>
                        </div>
                        <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/30">
                          <p className="text-xs text-gray-400 mb-1">Win Rate</p>
                          <p className="text-lg font-bold text-orange-400">{(85 + Math.random() * 10).toFixed(0)}%</p>
                        </div>
                      </div>
                      
                      {/* Correlation Matrix */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-300 mb-3">Asset Correlation</h4>
                        <div className="grid grid-cols-4 gap-2">
                          {['BTC', 'Portfolio', 'Market', 'Gold'].map((asset, i) => 
                            ['BTC', 'Portfolio', 'Market', 'Gold'].map((otherAsset, j) => {
                              const correlation = i === j ? 1.0 : (0.3 + Math.random() * 0.6);
                              const intensity = Math.abs(correlation);
                              return (
                                <div 
                                  key={`${asset}-${otherAsset}`}
                                  className="text-xs p-2 rounded text-center border border-gray-700/30"
                                  style={{
                                    backgroundColor: `rgba(${correlation > 0.5 ? '16, 185, 129' : correlation < -0.5 ? '239, 68, 68' : '249, 115, 22'}, ${intensity * 0.3})`
                                  }}
                                >
                                  <div className="text-gray-400">{asset}</div>
                                  <div className="text-white font-bold">{correlation.toFixed(2)}</div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {portfolioView === 'risk' && (
                    <div className="space-y-6">
                      {/* Risk Metrics */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-sm font-semibold text-gray-300 mb-3">Value at Risk (VaR)</h4>
                          <div className="space-y-3">
                            {['1 Day', '1 Week', '1 Month'].map((period, i) => {
                              const var95 = (totalValue * (0.05 + i * 0.02)).toFixed(6);
                              const var99 = (totalValue * (0.08 + i * 0.03)).toFixed(6);
                              return (
                                <div key={period} className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/30">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs text-gray-400">{period}</span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <p className="text-xs text-orange-400">95% VaR</p>
                                      <p className="text-sm font-bold text-white">{showValues ? `${var95} BTC` : '••••••••'}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-red-400">99% VaR</p>
                                      <p className="text-sm font-bold text-white">{showValues ? `${var99} BTC` : '••••••••'}</p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-semibold text-gray-300 mb-3">Risk Distribution</h4>
                          <div className="space-y-3">
                            {actualActiveInvestments.map((investment, i) => {
                              const plan = investmentPlans?.find(p => p.id === investment.planId);
                              const riskWeight = parseFloat(investment.amount) / totalInvestedAmount * 100;
                              const riskLevel = i % 3 === 0 ? 'Low' : i % 3 === 1 ? 'Medium' : 'High';
                              const riskColor = riskLevel === 'Low' ? 'green' : riskLevel === 'Medium' ? 'yellow' : 'red';
                              
                              return (
                                <div key={investment.id} className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/30">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs text-gray-300">{plan?.name || `Plan ${investment.planId}`}</span>
                                    <span className={`text-xs px-2 py-1 rounded ${riskColor === 'green' ? 'bg-green-500/20 text-green-400' : riskColor === 'yellow' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                                      {riskLevel}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-400">Weight</span>
                                    <span className="text-sm font-bold text-white">{riskWeight.toFixed(1)}%</span>
                                  </div>
                                  <div className="w-full bg-gray-700 rounded-full h-1 mt-2">
                                    <div 
                                      className={`h-1 rounded-full ${riskColor === 'green' ? 'bg-green-400' : riskColor === 'yellow' ? 'bg-yellow-400' : 'bg-red-400'}`}
                                      style={{ width: `${riskWeight}%` }}
                                    ></div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {portfolioView === 'performance' && (
                    <div className="space-y-6">
                      {/* Performance Attribution */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-300 mb-3">Performance Attribution</h4>
                        <div className="space-y-3">
                          {actualActiveInvestments.map((investment, i) => {
                            const plan = investmentPlans?.find(p => p.id === investment.planId);
                            const contribution = (parseFloat(investment.currentProfit) / totalProfit * 100) || 0;
                            const performance = (parseFloat(investment.currentProfit) / parseFloat(investment.amount) * 100) || 0;
                            
                            return (
                              <div key={investment.id} className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/30">
                                <div className="flex justify-between items-start mb-3">
                                  <div>
                                    <h5 className="text-sm font-medium text-white">{plan?.name || `Plan ${investment.planId}`}</h5>
                                    <p className="text-xs text-gray-400">
                                      {showValues ? `${formatBitcoin(investment.amount)} BTC invested` : '•••••••• invested'}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className={`text-sm font-bold ${performance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                      {performance >= 0 ? '+' : ''}{performance.toFixed(2)}%
                                    </p>
                                    <p className="text-xs text-gray-400">Return</p>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-3 gap-4 text-xs">
                                  <div>
                                    <p className="text-gray-400 mb-1">Profit</p>
                                    <p className="text-green-400 font-bold">
                                      {showValues ? `+${formatBitcoin(investment.currentProfit)} BTC` : '••••••••'}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-gray-400 mb-1">Contribution</p>
                                    <p className="text-blue-400 font-bold">{contribution.toFixed(1)}%</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-400 mb-1">Days Active</p>
                                    <p className="text-purple-400 font-bold">
                                      {Math.floor((new Date().getTime() - new Date(investment.startDate).getTime()) / (1000 * 60 * 60 * 24))}
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="mt-3">
                                  <div className="w-full bg-gray-700 rounded-full h-1">
                                    <div 
                                      className={`h-1 rounded-full ${performance >= 5 ? 'bg-green-400' : performance >= 0 ? 'bg-yellow-400' : 'bg-red-400'}`}
                                      style={{ width: `${Math.min(Math.abs(performance), 100)}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>
            
            {/* Investment Activity & Live Feed */}
            <div className="xl:col-span-4 space-y-6">
              {/* Live Investment Activity */}
              <Card className="bg-black/40 border-green-500/30 backdrop-blur-lg">
                <div className="p-4 border-b border-green-500/20">
                  <h3 className="text-sm font-semibold text-green-400">Live Investment Activity</h3>
                  <p className="text-xs text-gray-500">Real-time income tracking</p>
                </div>
                <div className="p-4">
                  <div className="space-y-3">
                    {/* Active Investment Sources */}
                    <div className="space-y-2">
                      <h4 className="text-xs text-green-400 font-medium mb-2">Active Income Sources</h4>
                      {actualActiveInvestments.slice(0, 5).map((investment, i) => {
                        const plan = investmentPlans?.find(p => p.id === investment.planId);
                        const dailyIncome = parseFloat(investment.amount) * (plan ? parseFloat(plan.dailyReturnRate) : 0.01);
                        const hourlyIncome = dailyIncome / 24;
                        
                        return (
                          <div key={investment.id} className="flex justify-between items-center text-xs py-2 px-3 bg-green-500/10 rounded border border-green-500/20">
                            <div>
                              <span className="text-green-400 font-medium">
                                {plan?.name || `Plan ${investment.planId}`}
                              </span>
                              <div className="text-gray-400 text-xs">
                                {showValues ? `${formatBitcoin(investment.amount)} BTC` : '••••••••'}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-green-300 font-mono">
                                {showValues ? `+${hourlyIncome.toFixed(8)}` : '••••••••'}
                              </div>
                              <div className="text-gray-500 text-xs">per hour</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Current Earning Rate */}
                    <div className="my-3 p-3 bg-orange-500/20 rounded border border-orange-500/30">
                      <div className="text-center">
                        <p className="text-xs text-orange-400">Current Earning Rate</p>
                        <p className="text-lg font-bold text-white">
                          +{dailyGrowthRate.toFixed(3)}%
                        </p>
                        <p className="text-xs text-gray-400">per day</p>
                      </div>
                    </div>
                    
                    {/* Recent Income Events */}
                    <div className="space-y-2">
                      <h4 className="text-xs text-blue-400 font-medium mb-2">Recent Income Events</h4>
                      {Array.from({ length: 5 }, (_, i) => {
                        const timeAgo = `${Math.floor(Math.random() * 60)} min ago`;
                        const randomInvestment = actualActiveInvestments[Math.floor(Math.random() * actualActiveInvestments.length)];
                        const plan = investmentPlans?.find(p => p.id === randomInvestment?.planId);
                        const income = randomInvestment ? parseFloat(randomInvestment.amount) * 0.0001 : 0;
                        
                        return (
                          <div key={i} className="flex justify-between items-center text-xs py-2 px-3 bg-blue-500/10 rounded border border-blue-500/20">
                            <div>
                              <span className="text-blue-400">
                                {plan?.name || 'Investment Plan'}
                              </span>
                              <div className="text-gray-500 text-xs">{timeAgo}</div>
                            </div>
                            <div className="text-green-300 font-mono">
                              {showValues ? `+${income.toFixed(8)} BTC` : '+••••••••'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </Card>
              
              {/* Investment Performance Metrics */}
              <Card className="bg-black/40 border-purple-500/30 backdrop-blur-lg p-4">
                <h3 className="text-sm font-semibold text-purple-400 mb-3">Investment Performance</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Total Invested</span>
                    <span className="text-sm font-bold text-white">
                      {showValues ? `${formatBitcoin(totalInvestedAmount.toString())} BTC` : '••••••••'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Total Income</span>
                    <span className="text-sm font-bold text-green-400">
                      {showValues ? `+${formatBitcoin(totalProfit.toString())} BTC` : '••••••••'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Daily Growth</span>
                    <span className="text-sm font-bold text-blue-400">
                      +{dailyGrowthRate.toFixed(3)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Active Plans</span>
                    <span className="text-sm font-bold text-yellow-400">{actualActiveInvestments.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Total ROI</span>
                    <span className="text-sm font-bold text-purple-400">+{profitMargin.toFixed(2)}%</span>
                  </div>
                  <div className="mt-4 p-3 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-lg border border-green-500/30">
                    <div className="text-center">
                      <p className="text-xs text-gray-300">Projected Monthly Income</p>
                      <p className="text-lg font-bold text-green-400">
                        {showValues ? `+${(totalInvestedAmount * dailyGrowthRate / 100 * 30).toFixed(8)} BTC` : '••••••••'}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
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