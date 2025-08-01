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

  const currentPriceData = bitcoinPrice ? (currency === 'USD' ? bitcoinPrice.usd : bitcoinPrice.gbp) : null;
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
      <Card className="plus500-professional p-6 relative overflow-hidden shadow-lg">
        {/* Security indicators */}
        <div className="absolute top-3 right-3 flex gap-1.5">
          <div className="w-6 h-6 rounded-lg bg-green-100 flex items-center justify-center border border-green-200">
            <Shield className="w-3 h-3 text-green-600" />
          </div>
          <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center border border-blue-200 animate-pulse">
            <Zap className="w-3 h-3 text-plus500-blue" />
          </div>
        </div>

        <div className="relative z-10 space-y-4">
          {/* Header */}
          <div>
            <p className="text-gray-600 text-xs font-medium mb-2">Total Portfolio Balance</p>
            <div className="flex items-center gap-2 mb-3">
              {isBalanceVisible ? (
                <h2 className="text-2xl sm:text-3xl font-bold text-plus500-blue tracking-tight">
                  {formatBitcoin(user.balance)} BTC
                </h2>
              ) : (
                <h2 className="text-2xl sm:text-3xl font-bold text-plus500-blue tracking-tight">
                  ••••••••
                </h2>
              )}
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 transition-all"
                  onClick={() => setIsBalanceVisible(!isBalanceVisible)}
                >
                  {isBalanceVisible ? (
                    <EyeOff className="w-3.5 h-3.5 text-gray-600" />
                  ) : (
                    <Eye className="w-3.5 h-3.5 text-gray-600" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 transition-all"
                  onClick={handleRefreshBalance}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>

            {isBalanceVisible && (
              <p className="text-gray-600 text-lg font-semibold">
                ≈ {formatCurrency(fiatValue, currency)}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-black border-opacity-20">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald animate-pulse"></div>
              <p className="text-black text-opacity-70 text-xs font-medium">
                Secure Vault Protected
              </p>
            </div>
            <div className="text-right">
              <p className="text-black text-opacity-70 text-xs">Live</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}