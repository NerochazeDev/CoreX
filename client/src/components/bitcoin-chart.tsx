
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { useBitcoinPrice } from "@/hooks/use-bitcoin-price";
import { useCurrency } from "@/hooks/use-currency";
import { formatCurrency } from "@/lib/utils";
import { useEffect, useState } from "react";

interface PricePoint {
  time: string;
  price: number;
}

export function BitcoinChart() {
  const { data: bitcoinPrice, isLoading } = useBitcoinPrice();
  const { currency } = useCurrency();
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);

  useEffect(() => {
    if (bitcoinPrice) {
      const currentPriceData = currency === 'USD' ? bitcoinPrice.usd : currency === 'GBP' ? bitcoinPrice.gbp : bitcoinPrice.eur;
      const now = new Date();
      const timeString = now.toLocaleTimeString();
      
      setPriceHistory(prev => {
        const newHistory = [...prev, { time: timeString, price: currentPriceData.price }];
        // Keep only last 20 data points
        return newHistory.slice(-20);
      });
    }
  }, [bitcoinPrice, currency]);

  if (isLoading || !bitcoinPrice) {
    return (
      <Card className="plus500-professional p-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-plus500">
            <BarChart3 className="w-5 h-5" />
            Bitcoin Chart
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 bg-muted/20 rounded-lg animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  const currentPriceData = currency === 'USD' ? bitcoinPrice.usd : currency === 'GBP' ? bitcoinPrice.gbp : bitcoinPrice.eur;
  const isPositive = currentPriceData.change24h >= 0;

  // Simple line chart using CSS
  const maxPrice = Math.max(...priceHistory.map(p => p.price));
  const minPrice = Math.min(...priceHistory.map(p => p.price));
  const priceRange = maxPrice - minPrice || 1;

  return (
    <Card className="plus500-professional p-6 transition-all duration-300 hover:shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-plus500">
            <BarChart3 className="w-5 h-5" />
            Bitcoin Real-Time Chart
          </CardTitle>
          <Badge className="text-xs px-2 py-0 bg-plus500-success/10 text-plus500-success border-plus500-success/20">
            Live
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-plus500">
              {formatCurrency(currentPriceData.price, currency)}
            </p>
            <div className={`flex items-center gap-2 ${isPositive ? 'text-plus500-success' : 'text-plus500-danger'}`}>
              {isPositive ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span className="text-sm font-semibold">
                {isPositive ? '+' : ''}{currentPriceData.change24h.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        {/* Simple Line Chart */}
        <div className="relative h-32 bg-muted/10 rounded-lg p-4 overflow-hidden">
          {priceHistory.length > 1 && (
            <div className="relative h-full">
              <svg className="w-full h-full" viewBox={`0 0 ${priceHistory.length * 10} 100`}>
                <polyline
                  points={priceHistory.map((point, index) => {
                    const x = index * 10;
                    const y = 100 - ((point.price - minPrice) / priceRange) * 100;
                    return `${x},${y}`;
                  }).join(' ')}
                  fill="none"
                  stroke={isPositive ? "rgb(34, 197, 94)" : "rgb(239, 68, 68)"}
                  strokeWidth="2"
                  className="transition-all duration-300"
                />
              </svg>
            </div>
          )}
          {priceHistory.length <= 1 && (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Collecting price data...
            </div>
          )}
        </div>

        <div className="text-xs text-muted-foreground text-center">
          Real-time price updates every 30 seconds
        </div>
      </CardContent>
    </Card>
  );
}
