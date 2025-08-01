import { Card } from "@/components/ui/card";
import { useBitcoinPrice } from "@/hooks/use-bitcoin-price";
import { useCurrency } from "@/hooks/use-currency";
import { TrendingUp, TrendingDown, Activity, BarChart3 } from "lucide-react";
import { useState, useEffect } from "react";

interface PricePoint {
  time: string;
  price: number;
}

export function BitcoinChart() {
  const { data: bitcoinPrice } = useBitcoinPrice();
  const { currency } = useCurrency();
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [isPositive, setIsPositive] = useState(true);

  useEffect(() => {
    if (bitcoinPrice) {
      const currentPrice = currency === 'EUR' ? bitcoinPrice.eur : 
                          currency === 'USD' ? bitcoinPrice.usd : bitcoinPrice.gbp;
      
      const newPoint: PricePoint = {
        time: new Date().toLocaleTimeString('en-US', { 
          hour12: false, 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        price: currentPrice?.price || 0
      };

      setPriceHistory(prev => {
        const updated = [...prev, newPoint].slice(-20); // Keep last 20 points
        if (updated.length > 1) {
          const current = updated[updated.length - 1].price;
          const previous = updated[updated.length - 2].price;
          setIsPositive(current >= previous);
        }
        return updated;
      });
    }
  }, [bitcoinPrice, currency]);

  if (!bitcoinPrice) {
    return <div>Loading Bitcoin chart...</div>;
  }

  const currentPriceData = currency === 'EUR' ? bitcoinPrice.eur : 
                          currency === 'USD' ? bitcoinPrice.usd : bitcoinPrice.gbp;
  
  const price = currentPriceData?.price || 0;
  const change24h = currentPriceData?.change24h || 0;
  const changePercent = currentPriceData?.changePercent || 0;

  const formatCurrency = (amount: number) => {
    const currencySymbol = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : '£';
    return `${currencySymbol}${amount.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  };

  // Create simple SVG chart
  const chartWidth = 300;
  const chartHeight = 100;
  const maxPrice = Math.max(...priceHistory.map(p => p.price));
  const minPrice = Math.min(...priceHistory.map(p => p.price));
  const priceRange = maxPrice - minPrice || 1;

  const pathData = priceHistory.map((point, index) => {
    const x = (index / (priceHistory.length - 1)) * chartWidth;
    const y = chartHeight - ((point.price - minPrice) / priceRange) * chartHeight;
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  return (
    <Card className="plus500-professional p-6 relative overflow-hidden shadow-lg">
      {/* Header with trend indicators */}
      <div className="absolute top-3 right-3 flex gap-1.5">
        <div className={`w-6 h-6 rounded-lg flex items-center justify-center border ${
          isPositive 
            ? 'bg-plus500-success/10 border-plus500-success/20' 
            : 'bg-red-500/10 border-red-500/20'
        }`}>
          {isPositive ? (
            <TrendingUp className="w-3 h-3 text-plus500-success" />
          ) : (
            <TrendingDown className="w-3 h-3 text-red-500" />
          )}
        </div>
        <div className="w-6 h-6 rounded-lg bg-plus500/10 flex items-center justify-center border border-plus500/20 animate-pulse">
          <Activity className="w-3 h-3 text-plus500" />
        </div>
      </div>

      <div className="relative z-10 space-y-4">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-plus500" />
            <p className="text-muted-foreground text-xs font-medium">Bitcoin Live Chart</p>
          </div>
          
          <div className="mb-3">
            <h2 className="text-2xl sm:text-3xl font-bold text-plus500 tracking-tight">
              {formatCurrency(price)}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-sm font-semibold ${
                changePercent >= 0 ? 'text-plus500-success' : 'text-red-500'
              }`}>
                {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%
              </span>
              <span className={`text-xs ${
                change24h >= 0 ? 'text-plus500-success' : 'text-red-500'
              }`}>
                {change24h >= 0 ? '+' : ''}{formatCurrency(change24h)} (24h)
              </span>
            </div>
          </div>

          {/* Simple Chart */}
          {priceHistory.length > 1 && (
            <div className="relative bg-muted/30 rounded-lg p-3 mb-3">
              <svg 
                width="100%" 
                height="100" 
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="overflow-visible"
              >
                {/* Chart line */}
                <path
                  d={pathData}
                  fill="none"
                  stroke={isPositive ? "#22c55e" : "#ef4444"}
                  strokeWidth="2"
                  className="drop-shadow-sm"
                />
                {/* Chart area fill */}
                <path
                  d={`${pathData} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`}
                  fill={`url(#gradient-${isPositive ? 'positive' : 'negative'})`}
                  opacity="0.1"
                />
                
                {/* Gradient definitions */}
                <defs>
                  <linearGradient id="gradient-positive" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3"/>
                    <stop offset="100%" stopColor="#22c55e" stopOpacity="0"/>
                  </linearGradient>
                  <linearGradient id="gradient-negative" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3"/>
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0"/>
                  </linearGradient>
                </defs>
              </svg>
              
              {/* Time labels */}
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>{priceHistory[0]?.time || ''}</span>
                <span>Live Chart</span>
                <span>{priceHistory[priceHistory.length - 1]?.time || ''}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full animate-pulse ${
              isPositive ? 'bg-plus500-success' : 'bg-red-500'
            }`}></div>
            <p className="text-muted-foreground text-xs font-medium">
              Netherlands ({currency}) Market
            </p>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground text-xs">Real-time</p>
          </div>
        </div>
      </div>
    </Card>
  );
}