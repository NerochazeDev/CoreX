import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useBitcoinPrice } from "@/hooks/use-bitcoin-price";
import { useCurrency } from "@/hooks/use-currency";
import { formatBitcoin, formatCurrency, calculateCurrencyValue } from "@/lib/utils";
import { Eye, EyeOff, Shield, Zap, RefreshCw } from "lucide-react";
import { useState } from "react";

export function WalletBalance() {
  const { user, refreshUser } = useAuth();
  const { data: bitcoinPrice } = useBitcoinPrice();
  const { currency } = useCurrency();
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  if (!user) return null;

  const currentPriceData = bitcoinPrice ? (currency === 'USD' ? bitcoinPrice.usd : currency === 'GBP' ? bitcoinPrice.gbp : bitcoinPrice.eur) : null;
  const fiatValue = currentPriceData ? calculateCurrencyValue(user.balance, currentPriceData.price) : 0;

  const handleRefreshBalance = async () => {
    if (!user) return;

    setIsRefreshing(true);
    try {
      const response = await fetch(`/api/bitcoin/sync-balance/${user.id}`, {
        method: 'POST'
      });

      if (response.ok) {
        await refreshUser();
      } else {
        throw new Error('Failed to sync balance');
      }
    } catch (error) {
      console.error("Failed to sync balance with blockchain:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div>
      <Card className="bitvault-professional p-6 relative overflow-hidden shadow-lg">
        {/* Security indicators */}
        <div className="absolute top-3 right-3 flex gap-1.5">
          <div className="w-6 h-6 rounded-lg bg-primary-success/10 flex items-center justify-center border border-primary-success/20">
            <Shield className="w-3 h-3 text-primary-success" />
          </div>
          <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 animate-pulse">
            <Zap className="w-3 h-3 text-primary" />
          </div>
        </div>

        <div className="relative z-10 space-y-4">
          {/* Header */}
          <div>
            <p className="text-muted-foreground text-xs font-medium mb-2">Total Portfolio Balance</p>
            <div className="flex items-center gap-2 mb-3">
              {isBalanceVisible ? (
                <div className="space-y-1">
                  <h2 className="text-2xl sm:text-3xl font-bold text-primary tracking-tight">
                    {formatBitcoin(user.balance)} BTC
                  </h2>
                  <p className="text-lg font-semibold text-primary-success">
                    ≈ {formatCurrency(fiatValue, currency)}
                  </p>
                </div>
              ) : (
                <h2 className="text-2xl sm:text-3xl font-bold text-primary tracking-tight">
                  ••••••••
                </h2>
              )}
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-7 h-7 rounded-lg bg-muted hover:bg-muted/80 transition-all"
                  onClick={() => setIsBalanceVisible(!isBalanceVisible)}
                >
                  {isBalanceVisible ? (
                    <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />
                  ) : (
                    <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-7 h-7 rounded-lg bg-muted hover:bg-muted/80 transition-all"
                  onClick={handleRefreshBalance}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>

            {isBalanceVisible && currentPriceData && (
              <p className="text-xs text-muted-foreground mt-2">
                1 BTC = {formatCurrency(currentPriceData.price, currency)} • Live Market Price
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary-success animate-pulse"></div>
              <p className="text-muted-foreground text-xs font-medium">
                Secure Vault Protected
              </p>
            </div>
            <div className="text-right">
              <p className="text-muted-foreground text-xs">Live</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}