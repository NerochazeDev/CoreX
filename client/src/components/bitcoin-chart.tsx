
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, BarChart3, ZoomIn, ZoomOut, RefreshCw } from "lucide-react";
import { useBitcoinPrice } from "@/hooks/use-bitcoin-price";
import { useCurrency } from "@/hooks/use-currency";
import { formatCurrency } from "@/lib/utils";
import { useEffect, useState } from "react";

interface PricePoint {
  time: string;
  price: number;
  volume?: number;
  timestamp: number;
}

interface CandlestickData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export function BitcoinChart() {
  const { data: bitcoinPrice, isLoading } = useBitcoinPrice();
  const { currency } = useCurrency();
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [candleData, setCandleData] = useState<CandlestickData[]>([]);
  const [timeframe, setTimeframe] = useState<'1m' | '5m' | '1h' | '1d'>('5m');
  const [chartType, setChartType] = useState<'line' | 'candle'>('line');

  useEffect(() => {
    if (bitcoinPrice) {
      const currentPriceData = currency === 'USD' ? bitcoinPrice.usd : currency === 'GBP' ? bitcoinPrice.gbp : bitcoinPrice.eur;
      const now = new Date();
      const timeString = now.toLocaleTimeString();
      const timestamp = now.getTime();
      
      setPriceHistory(prev => {
        const newHistory = [...prev, { 
          time: timeString, 
          price: currentPriceData.price,
          volume: Math.random() * 1000000 + 500000, // Simulated volume
          timestamp
        }];
        // Keep only last 50 data points for better resolution
        return newHistory.slice(-50);
      });

      // Generate candlestick data (simplified simulation)
      setCandleData(prev => {
        const lastCandle = prev[prev.length - 1];
        const price = currentPriceData.price;
        const newCandle: CandlestickData = {
          time: timeString,
          open: lastCandle ? lastCandle.close : price,
          high: price + (Math.random() - 0.5) * 1000,
          low: price - (Math.random() - 0.5) * 1000,
          close: price,
          volume: Math.random() * 1000000 + 500000
        };
        const newData = [...prev, newCandle];
        return newData.slice(-20);
      });
    }
  }, [bitcoinPrice, currency]);

  if (isLoading) {
    return (
      <Card className="bitvault-professional p-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <BarChart3 className="w-5 h-5" />
            Bitcoin Professional Chart
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-gradient-to-br from-plus500/5 to-plus500-gold/5 rounded-lg animate-pulse border border-primary/10" />
        </CardContent>
      </Card>
    );
  }

  if (!bitcoinPrice) {
    return (
      <Card className="bitvault-professional p-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <BarChart3 className="w-5 h-5" />
            Bitcoin Professional Chart - Network Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-gradient-to-br from-plus500/5 to-plus500-gold/5 rounded-lg flex items-center justify-center border border-primary/10">
            <p className="text-muted-foreground">Unable to load price data</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentPriceData = currency === 'USD' ? bitcoinPrice.usd : currency === 'GBP' ? bitcoinPrice.gbp : bitcoinPrice.eur;
  const isPositive = currentPriceData.change24h >= 0;

  // Calculate price range with padding
  const prices = priceHistory.map(p => p.price);
  const maxPrice = Math.max(...prices);
  const minPrice = Math.min(...prices);
  const priceRange = maxPrice - minPrice || 1;
  const padding = priceRange * 0.1;
  const chartMax = maxPrice + padding;
  const chartMin = minPrice - padding;
  const chartRange = chartMax - chartMin;

  // Professional grid lines
  const gridLines = 6;
  const priceStep = chartRange / gridLines;

  return (
    <Card className="bitvault-professional p-6 transition-all duration-300 hover:shadow-xl border border-primary/20">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-primary">
            <BarChart3 className="w-5 h-5" />
            Bitcoin Professional Chart
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className="text-xs px-2 py-0 bg-primary-success/10 text-primary-success border-primary-success/20">
              Live Market Data
            </Badge>
            <Button variant="outline" size="sm" className="h-7 px-2">
              <RefreshCw className="w-3 h-3" />
            </Button>
          </div>
        </div>
        
        {/* Chart Controls */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex gap-1">
            {(['1m', '5m', '1h', '1d'] as const).map((tf) => (
              <Button
                key={tf}
                variant={timeframe === tf ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeframe(tf)}
                className={`h-7 px-3 text-xs ${timeframe === tf ? 'bg-primary text-white' : 'text-primary border-primary/30'}`}
              >
                {tf}
              </Button>
            ))}
          </div>
          <div className="flex gap-1">
            <Button
              variant={chartType === 'line' ? "default" : "outline"}
              size="sm"
              onClick={() => setChartType('line')}
              className={`h-7 px-3 text-xs ${chartType === 'line' ? 'bg-primary text-white' : 'text-primary border-primary/30'}`}
            >
              Line
            </Button>
            <Button
              variant={chartType === 'candle' ? "default" : "outline"}
              size="sm"
              onClick={() => setChartType('candle')}
              className={`h-7 px-3 text-xs ${chartType === 'candle' ? 'bg-primary text-white' : 'text-primary border-primary/30'}`}
            >
              Candles
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold text-primary font-mono">
              {formatCurrency(currentPriceData.price, currency)}
            </p>
            <div className={`flex items-center gap-2 ${isPositive ? 'text-primary-success' : 'text-primary-danger'}`}>
              {isPositive ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span className="text-sm font-semibold font-mono">
                {isPositive ? '+' : ''}{currentPriceData.change24h.toFixed(2)}%
              </span>
              <span className="text-xs text-muted-foreground">(24h)</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Volume (24h)</p>
            <p className="text-sm font-semibold text-primary">
              {currency === 'USD' ? '$2.1B' : currency === 'GBP' ? '£1.6B' : '€1.9B'}
            </p>
          </div>
        </div>

        {/* Professional Trading Chart */}
        <div className="relative h-80 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950 rounded-lg border border-primary/20 overflow-hidden">
          {priceHistory.length > 1 && (
            <div className="relative h-full p-4">
              <svg className="w-full h-full" viewBox="0 0 800 300">
                {/* Grid Lines */}
                <defs>
                  <pattern id="grid" width="40" height="30" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 30" fill="none" stroke="rgba(59, 130, 246, 0.1)" strokeWidth="0.5"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
                
                {/* Horizontal Price Lines */}
                {Array.from({ length: gridLines + 1 }, (_, i) => {
                  const price = chartMin + (priceStep * i);
                  const y = 280 - ((price - chartMin) / chartRange) * 260;
                  return (
                    <g key={i}>
                      <line
                        x1="60"
                        y1={y}
                        x2="780"
                        y2={y}
                        stroke="rgba(59, 130, 246, 0.2)"
                        strokeWidth="1"
                        strokeDasharray="2,2"
                      />
                      <text
                        x="55"
                        y={y + 4}
                        textAnchor="end"
                        fontSize="10"
                        fill="rgba(100, 116, 139, 0.8)"
                        fontFamily="monospace"
                      >
                        {formatCurrency(price, currency, { compact: true })}
                      </text>
                    </g>
                  );
                })}

                {/* Chart Type Rendering */}
                {chartType === 'line' ? (
                  <>
                    {/* Area Fill */}
                    <path
                      d={`M 60 ${280 - ((priceHistory[0].price - chartMin) / chartRange) * 260} ${priceHistory.map((point, index) => {
                        const x = 60 + (index * (720 / (priceHistory.length - 1)));
                        const y = 280 - ((point.price - chartMin) / chartRange) * 260;
                        return `L ${x} ${y}`;
                      }).join(' ')} L 780 280 L 60 280 Z`}
                      fill={isPositive ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)"}
                    />
                    {/* Main Line */}
                    <polyline
                      points={priceHistory.map((point, index) => {
                        const x = 60 + (index * (720 / (priceHistory.length - 1)));
                        const y = 280 - ((point.price - chartMin) / chartRange) * 260;
                        return `${x},${y}`;
                      }).join(' ')}
                      fill="none"
                      stroke={isPositive ? "rgb(34, 197, 94)" : "rgb(239, 68, 68)"}
                      strokeWidth="2.5"
                      className="transition-all duration-300"
                    />
                    {/* Data Points */}
                    {priceHistory.map((point, index) => {
                      const x = 60 + (index * (720 / (priceHistory.length - 1)));
                      const y = 280 - ((point.price - chartMin) / chartRange) * 260;
                      return (
                        <circle
                          key={index}
                          cx={x}
                          cy={y}
                          r="2"
                          fill={isPositive ? "rgb(34, 197, 94)" : "rgb(239, 68, 68)"}
                          className="opacity-60 hover:opacity-100 transition-opacity"
                        />
                      );
                    })}
                  </>
                ) : (
                  // Candlestick Chart
                  candleData.map((candle, index) => {
                    const x = 60 + (index * (720 / Math.max(candleData.length - 1, 1)));
                    const openY = 280 - ((candle.open - chartMin) / chartRange) * 260;
                    const closeY = 280 - ((candle.close - chartMin) / chartRange) * 260;
                    const highY = 280 - ((candle.high - chartMin) / chartRange) * 260;
                    const lowY = 280 - ((candle.low - chartMin) / chartRange) * 260;
                    const isGreen = candle.close >= candle.open;
                    
                    return (
                      <g key={index}>
                        {/* Wick */}
                        <line
                          x1={x}
                          y1={highY}
                          x2={x}
                          y2={lowY}
                          stroke={isGreen ? "rgb(34, 197, 94)" : "rgb(239, 68, 68)"}
                          strokeWidth="1"
                        />
                        {/* Body */}
                        <rect
                          x={x - 6}
                          y={Math.min(openY, closeY)}
                          width="12"
                          height={Math.abs(closeY - openY) || 1}
                          fill={isGreen ? "rgb(34, 197, 94)" : "rgb(239, 68, 68)"}
                          stroke={isGreen ? "rgb(34, 197, 94)" : "rgb(239, 68, 68)"}
                          strokeWidth="1"
                        />
                      </g>
                    );
                  })
                )}

                {/* Current Price Line */}
                <line
                  x1="60"
                  y1={280 - ((currentPriceData.price - chartMin) / chartRange) * 260}
                  x2="780"
                  y2={280 - ((currentPriceData.price - chartMin) / chartRange) * 260}
                  stroke="rgba(59, 130, 246, 0.8)"
                  strokeWidth="1.5"
                  strokeDasharray="5,5"
                />
              </svg>
            </div>
          )}
          {priceHistory.length <= 1 && (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-3 text-primary/50" />
                <p className="text-sm">Initializing professional chart...</p>
                <p className="text-xs text-muted-foreground mt-1">Collecting market data</p>
              </div>
            </div>
          )}
        </div>

        {/* Chart Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-primary/10">
          <div className="flex items-center gap-4">
            <span>Real-time updates every 30 seconds</span>
            <span className="text-primary">•</span>
            <span>Professional Trading View</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-primary-success">●</span>
            <span>Market Open</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
