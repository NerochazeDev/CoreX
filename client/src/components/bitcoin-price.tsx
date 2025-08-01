import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, RefreshCw, BarChart3 } from "lucide-react";
import { useBitcoinPrice } from "@/hooks/use-bitcoin-price";
import { useCurrency } from "@/hooks/use-currency";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export function BitcoinPrice() {
  const { data: bitcoinPrice, isLoading } = useBitcoinPrice();
  const { currency, toggleCurrency } = useCurrency();

  if (isLoading) {
    return (
      <div className="mb-4">
        <Card className="plus500-professional p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-12 h-12 rounded-xl" />
              <div>
                <Skeleton className="w-20 h-5 mb-2" />
                <Skeleton className="w-12 h-3" />
              </div>
            </div>
            <Skeleton className="w-16 h-6 rounded-xl" />
          </div>
          <div className="flex items-end justify-between">
            <div>
              <Skeleton className="w-32 h-10 mb-2" />
              <Skeleton className="w-24 h-4" />
            </div>
            <Skeleton className="w-20 h-10 rounded-xl" />
          </div>
        </Card>
      </div>
    );
  }

  if (!bitcoinPrice) {
    return (
      <div className="mb-4">
        <Card className="plus500-professional p-6">
          <div className="text-center text-muted-foreground">
            Failed to load Bitcoin price data
          </div>
        </Card>
      </div>
    );
  }

  const currentPriceData = currency === 'USD' ? bitcoinPrice.usd : bitcoinPrice.gbp;
  const isPositive = currentPriceData.change24h >= 0;

  return (
    <div className="mb-4">
      <Card className="plus500-professional p-6 transition-all duration-300 hover:shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center border border-orange-200">
              <span className="text-lg font-bold text-orange-600">₿</span>
            </div>
            <div>
              <h3 className="font-bold text-lg text-plus500-blue">Bitcoin Price</h3>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-sm">BTC</span>
                <Badge variant="secondary" className="text-xs px-2 py-0 bg-green-100 text-green-700">
                  Live
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleCurrency}
              className="h-8 px-3 text-sm border-plus500-blue text-plus500-blue hover:bg-plus500-blue hover:text-white transition-all duration-300 rounded-lg"
            >
              {currency}
            </Button>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-bold text-plus500-blue mb-1">
                {formatCurrency(currentPriceData.price, currency)}
              </p>
              <div className={`flex items-center gap-2 ${isPositive ? 'text-emerald' : 'text-ruby'}`}>
                {isPositive ? (
                  <TrendingUp className="w-5 h-5" />
                ) : (
                  <TrendingDown className="w-5 h-5" />
                )}
                <span className="text-lg font-semibold">
                  {isPositive ? '+' : ''}{currentPriceData.change24h.toFixed(2)}%
                </span>
                <span className="text-sm text-muted-foreground">(24h)</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className={`w-20 h-12 rounded-xl flex items-center justify-center ${isPositive ? 'bg-emerald bg-opacity-20' : 'bg-ruby bg-opacity-20'}`}>
                <BarChart3 className={`w-6 h-6 ${isPositive ? 'text-emerald' : 'text-ruby'}`} />
              </div>
            </div>
          </div>
          
          <div className="pt-4 border-t border-border">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">24h Change</span>
              <span className={`font-medium ${isPositive ? 'text-emerald' : 'text-ruby'}`}>
                {isPositive ? '+' : ''}{formatCurrency(currentPriceData.price * currentPriceData.change24h / 100, currency)}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
